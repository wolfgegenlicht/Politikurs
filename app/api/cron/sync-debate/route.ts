import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        // 1. Security Check
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Find a poll that needs processing
        // Strategy: Find poll with NO entry in poll_analysis

        // Fetch recent polls with their simplified questions
        const { data: polls, error: pollError } = await supabase
            .from('polls')
            .select('id, label, description, poll_questions(question)')
            .order('poll_date', { ascending: false })
            .limit(20);

        if (pollError || !polls) throw new Error(`Database error: ${pollError?.message}`);

        let targetPoll = null;

        for (const poll of polls) {
            const { count } = await supabase
                .from('poll_analysis')
                .select('*', { count: 'exact', head: true })
                .eq('poll_id', poll.id);

            if (count === 0) {
                targetPoll = poll;
                break;
            }
        }

        if (!targetPoll) {
            return NextResponse.json({ message: 'All recent polls have analysis.' });
        }

        // Determine the text to analyze: Prefer the simplified question!
        let textToAnalyze = targetPoll.label;
        const questions = targetPoll.poll_questions;

        if (questions) {
            if (Array.isArray(questions) && questions.length > 0) {
                textToAnalyze = questions[0].question;
            } else if (!Array.isArray(questions) && (questions as any).question) {
                textToAnalyze = (questions as any).question;
            }
        }

        console.log(`Analyzing debate for poll ${targetPoll.id} based on: "${textToAnalyze}"`);

        // 3. Call AI for Analysis (Retry Logic)
        const prompt = `Analysiere die politische Abstimmungsfrage: "${textToAnalyze}".
        
        Aufgabe:
        1. "description": Fasse in 2 neutralen Sätze zusammen, worum es im Kern bei dieser Frage geht.
        2. "pro": Nenne die 3 stärksten Argumente für ein "JA" (Zustimmung zur Frage).
        3. "contra": Nenne die 3 stärksten Argumente für ein "NEIN" (Ablehnung der Frage).
        4. "sources": Liste die URLs der verwendeten Quellen auf.
        
        WICHTIG: Die Argumente müssen sich direkt auf die Beantwortung der Frage mit "Ja" (Pro) oder "Nein" (Contra) beziehen.
        
        Verwende KEINE Zitations-Marker wie [1] in den Texten.
        
        Gib NUR ein valides JSON Objekt zurück. Format:
        {
          "description": "string",
          "pro": ["string", "string", "string"],
          "contra": ["string", "string", "string"],
          "sources": ["url", "url"]
        }`;

        let parsed = null;
        let lastError = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                        'X-Title': 'BundesCheck Debate Analysis'
                    },
                    body: JSON.stringify({
                        model: 'perplexity/sonar',
                        messages: [
                            {
                                role: 'system',
                                content: 'Du bist ein neutraler Analyst. Deine EINZIGE Aufgabe ist es, valides JSON zurückzugeben. Antworte NICHT mit Einleitungssätzen oder Erklärungen. Antworte ausschliesslich mit dem JSON-Objekt.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 1000
                    })
                });

                if (response.status === 402 || response.status === 429) {
                    throw new Error(`API Limit Exceeded or Payment Required: ${response.status}`);
                }

                if (!response.ok) {
                    console.warn(`Attempt ${attempt} failed: Status ${response.status}`);
                    continue;
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                console.log(`AI RAW RESPONSE (Attempt ${attempt}):`, content);

                if (!content) throw new Error('No content from AI');

                // Robust JSON extraction
                const firstBrace = content.indexOf('{');
                const lastBrace = content.lastIndexOf('}');

                if (firstBrace === -1 || lastBrace === -1) {
                    console.error('Invalid AI Response format:', content);
                    throw new Error('No JSON structure found in response');
                }

                const rawJson = content.substring(firstBrace, lastBrace + 1);
                parsed = JSON.parse(rawJson);

                // If we get here, success!
                break;

            } catch (error: any) {
                console.error(`Attempt ${attempt} Error:`, error.message);
                lastError = error;
                // Wait 1s before retry
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        if (!parsed) {
            throw new Error(`Failed after 3 attempts. Last error: ${lastError?.message}`);
        }

        // 4. Save to DB
        const { error: insertError } = await supabase
            .from('poll_analysis')
            .insert({
                poll_id: targetPoll.id,
                description: parsed.description,
                pro_arguments: parsed.pro,
                contra_arguments: parsed.contra,
                sources: parsed.sources
            });

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            pollId: targetPoll.id,
            analysis: parsed
        });

    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
