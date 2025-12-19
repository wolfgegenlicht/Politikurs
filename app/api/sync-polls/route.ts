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
                    topics: topicLabels
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
                await supabase.from('polls').update({ topics: topicLabels }).eq('id', poll.id);
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
    // 1. Check ob bereits vollständig generiert (inkl. Titel und Erklärung)
    const { data: existing } = await supabase
        .from('poll_questions')
        .select('question, simplified_title, explanation')
        .eq('poll_id', pollId)
        .single();

    // Wenn alles da ist, fertig
    if (existing?.question && existing?.simplified_title && existing?.explanation) {
        return existing;
    }

    // 2. HTML-Tags aus Beschreibung entfernen
    const rawDescription = poll.description || poll.field_intro || '';
    const cleanDescription = rawDescription
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000); // Mehr Kontext für bessere Erklärung

    // 3. System Prompt mit den 10 Regeln
    const systemPrompt = `
Du bist ein politischer Redakteur für eine App, die komplexe Gesetze für normale Bürger verständlich macht.
Deine Aufgabe: Analysiere den Gesetzesentwurf und erstelle 3 Dinge:
3. Eine ultra-kurze Erklärung ("Was bedeutet das?").

PRIORITÄT: Die "question" muss logisch exakt zum Originaltitel ("label") passen.
- Wenn der Titel heißt: "Waffenlieferungen stoppen"
- Dann MUSS die Frage heißen: "Sollen Waffenlieferungen gestoppt werden?" (Ja = Stoppen)
- FALSCH wäre: "Sollen Waffen geliefert werden?" (Ja = Liefern -> WIDERSPRUCH zum Titel)

Versuche die Frage so zu formulieren, dass "Ja" im Titel auch "Ja" in der Frage bedeutet.
Vermeide "vote_flip" wenn möglich!
Nutze "vote_flip" NUR, wenn der Originaltitel eine doppelte Verneinung enthält oder extrem verwirrend ist (z.B. "Ablehnung des Antrags auf Keine Waffen").

SPECIAL LOGIC - PARLIAMENTARY RECOMMENDATIONS (Beschlussempfehlung):
Oft lautet der Text: "Beschlussempfehlung... Ablehnung des Antrags X" oder "X nicht unterbinden".
In diesem Fall:
1. Ignoriere die "Ablehnung". Konzentriere dich auf den Kern-Antrag "X".
2. Schreibe den Titel/Frage so, als ginge es um die Annahme von "X".
3. Setze "vote_flip": true.

BEISPIEL:
Text: "Atomgeschäfte nicht unterbinden (Beschlussempfehlung)"
-> Analyse: Es gibt einen Antrag "Atomgeschäfte verbieten". Die Empfehlung will ihn ablehnen ("nicht unterbinden").
-> Simplified Title: "Atomgeschäfte mit Russland verbieten" (Kern-Thema).
-> Question: "Sollen Atomgeschäfte verboten werden?"
-> Vote Flip: true (Weil JA zur Empfehlung = NEIN zum Verbot).

WICHTIG: Befolge strikt diese 10 Regeln für "Klare Sprache":
1. Vermeide doppelte Verneinungen (z.B. "nicht ablehnen"). ABER: Wörter wie "Stoppen", "Verbieten", "Beenden" sind ERLAUBT und SOLLEN genutzt werden, wenn sie im Titel vorkommen! Mache aus "Stoppen" NIEMALS "Weiter erlauben".
2. Löse Substantivierungen auf (Verben statt Wörter auf -ung, -heit, -keit).
3. Nutze Aktiv statt Passiv (Wer handelt?).
4. Sei konkret (Klartext statt vage Begriffe).
5. Kurze Sätze (Max 20 Wörter, ein Gedanke pro Satz).
6. Erkläre oder ersetze Fachwörter durch Alltagssprache.
7. Streiche alle Füllwörter (im Hinblick auf, bezüglich, etc.).
8. Nutze klare Zeitangaben.
9. Nutze eindeutige Modalverben (Muss = Pflicht, Soll = Empfehlung).
10. Mach es so einfach wie möglich (Tinder-Style, sofort verständlich).

ERKLÄRUNG (explanation):
- Erkläre, was der Antragsteller WOLLTE.
- Wenn es eine "Ablehnung" ist: Erkläre NICHT, dass es abgelehnt wurde, sondern WAS abgelehnt wurde (Das Ziel des ursprünglichen Antrags).
- Beispiel Falsch: "Der Ausschuss empfiehlt, den Antrag abzulehnen, da er unbegründet ist."
- Beispiel Richtig: "Die Fraktion wollte erreichen, dass die Stimmen neu ausgezählt werden, da sie Fehler vermutete."

SPECIAL LOGIC - VOTE FLIP DETECTION:
Manche Anträge sind negativ formuliert.
NUR wenn du die Frage inhaltlich umdrehen MUSST (um doppelte Verneinung zu vermeiden), setze "vote_flip": true.
Sonst "vote_flip": false.

FORMAT: Antworte NUR als valides JSON Objekt:
{
  "simplified_title": "Kurzer, knackiger Titel (max 10 Wörter)",
  "question": "Neutrale Ja/Nein Frage (max 15 Wörter)",
  "explanation": "Einfache Erklärung, worum es in dem Gesetz/Antrag geht. Maximal 280 Zeichen. WICHTIG: Erwähne NICHT das Ergebnis (abgelehnt/angenommen), sondern nur den Inhalt!",
  "vote_flip": boolean (true wenn die vereinfachte Frage die Logik umdreht, sonst false)
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
            // Devstral usually follows instructions well without JSON mode enforced via API param,
            // but we keep strict system prompt. Some free models don't support response_format.
        })
    });

    if (!response.ok) {
        console.error(`OpenRouter API failed for poll ${pollId}: ${response.status}`);
        return null;
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content?.trim();

    // JSON parsen (Clean up markdown code blocks if present)
    let result;
    try {
        const jsonBlock = content.replace(/^```json\s*|\s*```$/g, '');
        result = JSON.parse(jsonBlock);
    } catch (e) {
        console.error(`Failed to parse AI JSON for poll ${pollId}:`, content);
        // Fallback or retry logic could go here
        return null;
    }

    if (result) {
        // 5. In DB speichern (Upsert um fehlende Felder zu ergänzen)
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
