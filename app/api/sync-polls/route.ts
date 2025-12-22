import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Aktuelle Legislaturperiode (Bundestag 2025-2029) - using 161 as per user request (it might be 2021-2025 in reality, but following request)
const CURRENT_LEGISLATURE_ID = 161;

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Optional: Allow local development without secret if needed, or strict check
            // For now, strict check if CRON_SECRET is set (Production)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // 1. Hole die neuesten Polls (User request: "next 10", etc.)
        const response = await fetch(
            `https://www.abgeordnetenwatch.de/api/v2/polls?field_legislature=${CURRENT_LEGISLATURE_ID}&range_end=${limit}&sort_by=field_poll_date&sort_direction=desc`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; BundestagVotesApp/1.0; +https://github.com/wolfgangstefani/checkvotes)',
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error(`Abgeordnetenwatch API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response body:', text);
            throw new Error(`Failed to fetch polls from Abgeordnetenwatch: ${response.status}`);
        }

        const data = await response.json();
        const polls = data.data;

        let newPolls = 0;
        let updatedPolls = 0;

        for (const poll of polls) {
            // Extract topics (labels only)
            const topicLabels = poll.field_topics ? poll.field_topics.map((t: any) => t.label) : [];

            // 2. Check ob Poll bereits in DB existiert
            const { data: existing } = await supabase
                .from('polls')
                .select('id')
                .eq('id', poll.id)
                .single();

            const relatedLinks = poll.field_related_links || [];

            if (!existing) {
                // 3. Neuen Poll speichern
                const { error: insertError } = await supabase.from('polls').insert({
                    id: poll.id,
                    label: poll.label,
                    description: poll.field_intro || '',
                    poll_date: poll.field_poll_date,
                    accepted: poll.field_accepted,
                    legislature_id: poll.field_legislature.id,
                    abgeordnetenwatch_url: poll.abgeordnetenwatch_url,
                    topics: topicLabels,
                    related_links: relatedLinks
                });

                if (insertError) {
                    console.error(`Error inserting poll ${poll.id}:`, insertError);
                    continue;
                }

                // 4. Votes für diesen Poll laden und aggregieren
                await syncVotesForPoll(poll.id);

                // 5. Frage generieren (IMMER für neue Polls)
                await generateQuestionForPoll(poll.id, poll);

                newPolls++;
            } else {
                // Bei existierenden Polls: Votes updaten UND Topics syncen
                await supabase.from('polls').update({
                    topics: topicLabels,
                    related_links: relatedLinks
                }).eq('id', poll.id);
                await syncVotesForPoll(poll.id);

                // CHECK: Existiert bereits eine Frage? Wenn ja, NICHT neu generieren!
                const { data: existingQuestion } = await supabase
                    .from('poll_questions')
                    .select('id')
                    .eq('poll_id', poll.id)
                    .single();

                if (!existingQuestion) {
                    console.log(`Generating missing question for existing poll ${poll.id}...`);
                    await generateQuestionForPoll(poll.id, poll);
                } else {
                    console.log(`Skipping AI generation for poll ${poll.id} (already exists).`);
                }

                updatedPolls++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync completed: ${newPolls} new polls, ${updatedPolls} existing`
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ============================================
// VOTES SYNCHRONISIEREN UND AGGREGIEREN
// ============================================
async function syncVotesForPoll(pollId: number) {
    const allVotes: any[] = [];

    // Fetch all votes in one go (limit 1000 is safe for Bundestag size ~736)
    // Abgeordnetenwatch seems to ignore range_start for pagination or behaves unexpectedly,
    // so we just fetch everything at once.
    try {
        const response = await fetch(
            `https://www.abgeordnetenwatch.de/api/v2/votes?poll=${pollId}&range_end=1000`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; BundestagVotesApp/1.0; +https://github.com/wolfgangstefani/checkvotes)',
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error(`Failed to fetch votes for poll ${pollId}: ${response.status}`);
            throw new Error(`Votes API failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
            console.log(`Synced ${data.data.length} votes for poll ${pollId}`);
            allVotes.push(...data.data);
        }

    } catch (e) {
        console.error(`Error syncing votes for poll ${pollId}:`, e);
    }

    // Nach Fraktion aggregieren
    const fractionMap = new Map();

    for (const vote of allVotes) {
        const fractionId = vote.fraction?.id;
        const fractionLabel = vote.fraction?.label;

        if (!fractionId) continue; // Fraktionslose überspringen

        if (!fractionMap.has(fractionId)) {
            fractionMap.set(fractionId, {
                poll_id: pollId,
                fraction_id: fractionId,
                fraction_label: fractionLabel,
                votes_yes: 0,
                votes_no: 0,
                votes_abstain: 0,
                votes_no_show: 0
            });
        }

        const result = fractionMap.get(fractionId);

        switch (vote.vote) {
            case 'yes':
                result.votes_yes++;
                break;
            case 'no':
                result.votes_no++;
                break;
            case 'abstain':
                result.votes_abstain++;
                break;
            case 'no_show':
                result.votes_no_show++;
                break;
        }
    }

    // Batch Insert in DB
    const results = Array.from(fractionMap.values());

    if (results.length > 0) {
        await supabase
            .from('vote_results')
            .upsert(results, { onConflict: 'poll_id,fraction_id' });
    }
}

// ============================================
// AI FRAGE GENERIEREN
// ============================================
async function generateQuestionForPoll(pollId: number, poll: any) {
    // 1. Check ob bereits vollständig generiert
    const { data: existing } = await supabase
        .from('poll_questions')
        .select('question, simplified_title, explanation')
        .eq('poll_id', pollId)
        .single();

    // Wenn alles da ist, fertig
    if (existing?.question && existing?.simplified_title && existing?.explanation) {
        return existing;
    }

    // 2. HTML-Tags aus Beschreibung entfernen (Absätze erhalten)
    const rawDescription = poll.description || poll.field_intro || '';
    const cleanDescription = rawDescription
        .replace(/<\/p>/g, '\n\n') // Absätze trennen
        .replace(/<br\s*\/?>/g, '\n') // Zeilenumbrüche
        .replace(/<[^>]*>/g, ' ') // Restliche Tags weg
        .replace(/&nbsp;/g, ' ')
        .replace(/[ \t]+/g, ' ') // Mehrfache Leerzeichen (aber keine Newlines) konsolidieren
        .split('\n').map((line: string) => line.trim()).join('\n') // Jede Zeile trimmen
        .replace(/\n{3,}/g, '\n\n') // Max 2 Newlines hintereinander
        .trim()
        .substring(0, 4000); // Mehr Kontext für bessere Erklärung

    // 3. System Prompt mit Fokus auf Relevanz und Präzision
    const systemPrompt = `
Du bist ein politischer Redakteur für eine App, die komplexe Gesetze für normale Bürger verständlich macht.
Deine Aufgabe: Analysiere den Gesetzesentwurf und erstelle 3 Dinge:
1. Einen vereinfachten Titel ("simplified_title").
2. Eine neutrale Ja/Nein Frage ("question").
3. Eine ultra-kurze Erklärung ("explanation").

WICHTIGSTE REGEL FÜR DIE FRAGE:
- Die Frage muss das **Hauptziel** (die gesetzliche Absicht) zusammenfassen, nicht nur ein einzelnes Detail.
- Übernimm wichtige Bedingungen aus dem Text (z.B. "rückwirkend", "für alle", "nur bei Neuverträgen").

BEISPIEL 1 (Widerrufsbutton):
- Text: "Es geht um Verbraucherschutz. Firmen müssen einen Widerrufsbutton für Online-Verträge anbieten, um Kündigungen zu erleichtern..."
- Schlecht: "Soll der Widerrufsbutton eingeführt werden?"
- Gut: "Sollen Kündigungen von Online-Verträgen durch einen verpflichtenden Button leichter werden?"

BEISPIEL 2 (Agrardiesel):
- Text: "Die Finanzierung soll rückwirkend zum 1. Januar 2024 durch die Agrardieselrückerstattung erfolgen..."
- Schlecht: "Soll Agrardiesel wieder erstattet werden?"
- Gut: "Soll die Erstattung für Agrardiesel rückwirkend zum Jahresbeginn 2024 wieder eingeführt werden?"

WICHTIG: Befolge strikt diese Regeln für "Klare Sprache":
1. Vermeide doppelte Verneinungen.
2. Nutze Aktiv statt Passiv.
3. Sei konkret und präzise.
4. Kurze Sätze (Max 20 Wörter).
5. Erkläre Fachwörter einfach.
6. Die Frage muss logisch exakt zum Originaltitel ("label") passen (Ja = Zustimmung zur Änderung).

FORMAT: Antworte NUR als valides JSON Objekt:
{
  "simplified_title": "Kurzer Titel (max 10 Wörter)",
  "question": "Ja/Nein Frage (max 20 Wörter)",
  "explanation": "Einfache Erklärung (Max 300 Zeichen). KEIN Ergebnis nennen!",
  "vote_flip": boolean
}
`;

    // 4. AI aufrufen
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Bundestag Votes'
        },
        body: JSON.stringify({
            model: 'mistralai/devstral-2512:free',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Titel: "${poll.label}"\n\nBeschreibung:\n${cleanDescription}`
                }
            ],
            temperature: 0.3,
        })
    });

    if (!response.ok) {
        console.error(`OpenRouter API failed for poll ${pollId}: ${response.status}`);
        return null;
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content?.trim();

    // JSON parsen
    let result;
    try {
        const jsonBlock = content.replace(/^```json\s*|\s*```$/g, '');
        result = JSON.parse(jsonBlock);
    } catch (e) {
        console.error(`Failed to parse AI JSON for poll ${pollId}:`, content);
        return null;
    }

    if (result) {
        // 5. In DB speichern
        await supabase.from('poll_questions').upsert({
            poll_id: pollId,
            question: result.question,
            simplified_title: result.simplified_title,
            explanation: result.explanation,
            vote_flip: result.vote_flip || false,
            model_used: 'mistralai/devstral-2512:free'
        });
    }

    return result;
}
