import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60; // 5 minutes (Pro) or 10 seconds (Hobby). Set to 60 for safety.
export const dynamic = 'force-dynamic';

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
            // For now, strict check if CRON_SECRET is set (Production) test again
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '5');

        // 1. Hole die neuesten Polls (User request: "next 10", etc.)
        const response = await fetch(
            `https://www.abgeordnetenwatch.de/api/v2/polls?field_legislature=${CURRENT_LEGISLATURE_ID}&range_end=${limit}&sort_by=field_poll_date&sort_direction=desc`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; PolitiKurs/1.0; +https://github.com/wolfgegenlicht/Politikurs)',
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

            // Collect all potential links
            const rawLinks = (poll.field_related_links || []).map((link: any) => {
                let url = link.url || link.uri || '';
                if (url.startsWith('entity:node/')) {
                    const nodeId = url.replace('entity:node/', '');
                    url = `https://www.abgeordnetenwatch.de/node/${nodeId}`;
                }
                return {
                    label: link.title || link.label || 'Link',
                    url: url
                };
            });

            // Extract links from field_intro (e.g. PDFs, Drucksachen)
            if (poll.field_intro) {
                const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
                let match;
                while ((match = linkRegex.exec(poll.field_intro)) !== null) {
                    const url = match[1];
                    const label = match[2].replace(/<[^>]+>/g, '').trim() || 'Dokument';
                    rawLinks.push({ label, url });
                }
            }

            // FILTER: Keep only strictly relevant documents
            // 1. Must be a PDF OR
            // 2. Must be from official bundestag.de domain
            // 3. Exclude Profiles and Committees
            const filteredLinks = rawLinks.filter((l: any) => {
                const lowerUrl = l.url.toLowerCase();
                const isPdf = lowerUrl.endsWith('.pdf');
                const isBundestag = lowerUrl.includes('bundestag.de');

                // Exclude specific junk even if it matches above (unlikely for bundestag.de, but safe)
                const isProfile = lowerUrl.includes('/profile/') || lowerUrl.includes('/abgeordnete/');
                const isCommittee = lowerUrl.includes('/ausschuesse/');

                return (isPdf || isBundestag) && !isProfile && !isCommittee;
            });

            // Remove duplicates
            const uniqueLinks = Array.from(new Map(filteredLinks.map((item: any) => [item.url, item])).values());

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
                    related_links: uniqueLinks
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
                    related_links: uniqueLinks
                }).eq('id', poll.id);
                await syncVotesForPoll(poll.id);

                // CHECK: Existiert bereits eine Frage? Wenn ja, NICHT neu generieren!
                const { data: existingQuestion } = await supabase
                    .from('poll_questions')
                    .select('id, originator')
                    .eq('poll_id', poll.id)
                    .single();

                if (!existingQuestion || !existingQuestion.originator) {
                    console.log(`Generating missing question or originator for existing poll ${poll.id}...`);
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
        .select('question, simplified_title, explanation, originator')
        .eq('poll_id', pollId)
        .single();

    // Wenn alles da ist, fertig
    if (existing?.question && existing?.simplified_title && existing?.explanation && existing?.originator) {
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
Du bist ein politischer Redakteur für eine App, die komplexe Gesetze für normale Bürger möglichst einfach verständlich macht.
Deine Aufgabe: Analysiere den oft sehr langen und komplexen Gesetzesentwurf ("description") und erstelle 3 Dinge in einem JSON-Objekt. Deine wichtigste Leistung ist es, aus dem umfangreichen Fachtext die EINE zentrale politische Frage zu destillieren.

WICHTIGSTE REGELN FÜR DIE FRAGE ("question"):
1. Formuliere den Text zu einer einzigen, einfachen Entscheidungsfrage um.
2. Die Frage muss mit "Sollen ..." oder "Soll ..." beginnen.
3. Die Frage muss ausschließlich mit "dafür" oder "dagegen" beantwortbar sein.
4. Die Frage muss neutral und wertfrei formuliert sein.
5. Die Frage muss kurz und leicht verständlich sein.
6. WICHTIG: Wenn es um eine Änderung (Abschaffung, Einführung) geht, frage nach der Änderung ("Soll X abgeschafft werden?"), NICHT nach dem Status Quo ("Soll X bleiben?").
7. Die Frage muss ohne Fachbegriffe oder Paragrafen auskommen.
8. Die Frage muss möglichst kurz und prägnant formuliert sein (Ziel: unter 15 Wörtern).
9. Die Frage muss doppelte Verneinungen vermeiden.

REGLEN FÜR DIE LOGIK ("vote_flip"):
- Standardwert ist "false".
- Setze "vote_flip" auf "true", wenn die Frage das Gegenteil des Titels bedeutet.
- BEISPIEL FLIP: Titel="Antrag ablehnen" (Nein), Frage="Soll angenommen werden?" (Ja) -> FLIP=TRUE.
- BEISPIEL KEIN FLIP: Titel="Keine Abschaffung" (Erhalten), Frage="Soll bestehen bleiben?" (Erhalten) -> FLIP=FALSE.
- BEISPIEL FLIP SONDERFALL: Titel="Keine Abschaffung" (Erhalten), Frage="Soll abgeschafft werden?" (Abschaffen) -> FLIP=TRUE.
- WICHTIG: Prüfe am Ende: Bedeutet ein "Ja" zur Frage das Gleiche wie ein "Ja" zum Titel?
  - Wenn JA -> vote_flip = false
  - Wenn NEIN -> vote_flip = true

WICHTIGSTE REGELN FÜR DEN URHEBER ("originator"):
1. Extrahiere, wer den Antrag eingebracht hat (z.B. "CDU/CSU", "Bundesregierung", "AfD", "SPD", "Grüne", "FDP", "Die Linke", "BSW").
2. Wenn es die Bundesregierung ist, schreibe "Bundesregierung".
3. Wenn es mehrere Fraktionen sind, trenne sie mit Komma (z.B. "SPD, Grüne, FDP").
4. Wenn es nicht klar erkennbar ist, setze null.

FORMAT: Antworte NUR als valides JSON Objekt:
{
  "simplified_title": "Kurzer Titel (max 10 Wörter)",
  "question": "Ja/Nein Frage (beginnend mit 'Sollen...', max 20 Wörter)",
  "explanation": "Neutrale, einfache Erklärung (Max 300 Zeichen). KEIN Ergebnis, KEINE Parteien!",
  "vote_flip": boolean,
  "originator": "Name der Fraktion(en) oder 'Bundesregierung' oder null"
}
`;

    // 4. AI aufrufen (mit Retries)
    let result = null;
    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries < MAX_RETRIES) {
        try {
            console.log(`AI Generation Attempt ${retries + 1}/${MAX_RETRIES} for poll ${pollId}...`);
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                    'X-Title': 'Bundestag Votes'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
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
                const errorText = await response.text();
                console.error(`OpenRouter API failed for poll ${pollId}: ${response.status} - ${errorText}`);
                retries++;
                continue;
            }

            const aiResponse = await response.json();
            const content = aiResponse.choices?.[0]?.message?.content?.trim();

            if (!content) throw new Error("Empty AI response");

            // JSON parsen
            const jsonBlock = content.replace(/^```json\s*|\s*```$/g, '');
            result = JSON.parse(jsonBlock);

            console.log(`Success generating question for poll ${pollId}`);
            break; // Success!

        } catch (e) {
            console.error(`Attempt ${retries + 1} failed for poll ${pollId}:`, e);
            retries++;
            // Wait briefly? 
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    if (result) {
        // 5. In DB speichern
        await supabase.from('poll_questions').upsert({
            poll_id: pollId,
            question: result.question,
            simplified_title: result.simplified_title,
            explanation: result.explanation,
            vote_flip: result.vote_flip || false,
            originator: result.originator,
            model_used: 'openai/gpt-oss-120b'
        });
    }

    return result;
}
