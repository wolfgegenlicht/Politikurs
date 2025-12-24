import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60; // Allow 60 seconds for execution (Serverless limit)
export const dynamic = 'force-dynamic';

import { ALLOWED_PARTIES } from '@/lib/partyUtils';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parties to check
const PARTIES = ALLOWED_PARTIES;

export async function GET(request: Request) {
    try {
        // 1. Security Check
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Find a poll that needs processing
        // Strategy: Find poll with NO entries in party_stances yet
        // We first get a batch of recent polls, then check which one is missing stances.
        // Doing this efficiently in one query is tricky without a "has_stances" flag, 
        // so we'll fetch polls and check existence.

        const { data: polls, error: pollError } = await supabase
            .from('polls')
            .select('id, label, description')
            .order('poll_date', { ascending: false })
            .limit(20); // Check last 20 polls

        if (pollError || !polls) {
            throw new Error(`Database error: ${pollError?.message}`);
        }

        let targetPoll = null;

        for (const poll of polls) {
            const { count } = await supabase
                .from('party_stances')
                .select('*', { count: 'exact', head: true })
                .eq('poll_id', poll.id);

            if (count === 0) {
                targetPoll = poll;
                break;
            }
        }

        if (!targetPoll) {
            return NextResponse.json({ message: 'All recent polls have party stances.' });
        }

        console.log(`Processing party stances for poll ${targetPoll.id}: ${targetPoll.label}`);

        const results = [];

        // 3. Process each party
        for (const party of PARTIES) {
            try {
                // Check if we have credits / hit rate limit from previous loop?
                // Hard to know exact credits, but we check specific error codes below.

                const prompt = `Suche nach der offiziellen Haltung der Partei ${party} zum Thema "${targetPoll.label}". 
                Fasse sie in 2 einfachen Sätzen auf Deutsch zusammen. 
                Gib NUR ein JSON Objekt zurück mit den Feldern "summary" (String) und "source_url" (String, URL zur Quelle).
                Verwende KEINE Zitations-Marker wie [1] im Text.
                Wenn keine klare Haltung zu finden ist, gib "summary": null zurück.`;

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                        'X-Title': 'BundesCheck Party Stances'
                    },
                    body: JSON.stringify({
                        model: 'perplexity/sonar',
                        messages: [
                            {
                                role: 'system',
                                content: 'Du bist ein neutraler politischer Analyst. Antworte immer nur mit validem JSON.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 500
                    })
                });

                if (response.status === 402) {
                    throw new Error('Payment Required: Out of credits');
                }
                if (response.status === 429) {
                    throw new Error('Rate Limit Exceeded');
                }

                if (!response.ok) {
                    console.error(`AI Error for ${party}: ${response.status}`);
                    continue; // Skip party, try next
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;

                if (!content) continue;

                // Parse JSON (handle potential markdown standard)
                const cleanJson = content.replace(/^```json\s*|\s*```$/g, '');
                let parsed;
                try {
                    parsed = JSON.parse(cleanJson);
                } catch (e) {
                    console.error(`JSON Parse Error for ${party}:`, content);
                    continue;
                }

                if (parsed && parsed.summary) {
                    // Double check: Strip [1] citations if the AI ignored instructions
                    const cleanSummary = parsed.summary.replace(/\[\d+\]/g, '').trim();

                    results.push({
                        poll_id: targetPoll.id,
                        party_name: party,
                        stance: cleanSummary,
                        source_url: parsed.source_url
                    });
                }

                // Small delay to be nice to APIs
                await new Promise(r => setTimeout(r, 1000));

            } catch (error: any) {
                console.error(`Error processing ${party}:`, error);
                if (error.message.includes('Payment') || error.message.includes('Rate Limit')) {
                    // Stop entirely if we are out of money or spamming
                    throw error;
                }
            }
        }

        // 4. Save results
        if (results.length > 0) {
            const { error: insertError } = await supabase
                .from('party_stances')
                .insert(results);

            if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
            }
        }

        return NextResponse.json({
            success: true,
            pollId: targetPoll.id,
            processedParties: results.length
        });

    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
