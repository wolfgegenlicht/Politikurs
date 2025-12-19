import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { pollId } = await req.json();

        if (!pollId) {
            return NextResponse.json({ error: 'Missing pollId' }, { status: 400 });
        }

        // 1. Check if explanation already exists in DB
        const { data: existingQA, error: qaError } = await supabase
            .from('poll_questions')
            .select('deep_explanation')
            .eq('poll_id', pollId)
            .single();

        if (existingQA?.deep_explanation) {
            return NextResponse.json({ explanation: existingQA.deep_explanation, cached: true });
        }

        // 2. Fetch full poll text for context
        const { data: poll, error } = await supabase
            .from('polls')
            .select('description, label')
            .eq('id', pollId)
            .single();

        if (error || !poll) {
            return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
        }

        const contextText = poll.description || poll.label;

        // 3. Call OpenRouter AI
        const systemPrompt = `
Du bist ein cooler, verständnisvoller Lehrer.
Erkläre diesen politischen Sachverhalt einem 15-jährigen Schüler.
Nutze eine passende Analogie aus dem Alltag (Schule, Gaming, Sport, Familie, Freundeskreis).
Vermeide "Cringe"-Jugendsprache. Sprich einfach normal, locker und respektvoll.
Fasse dich kurz (max 3-4 Sätze).

WICHTIG: Erkläre den Inhalt neutral.
`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'BundesCheck Deep Explain'
            },
            body: JSON.stringify({
                model: 'mistralai/devstral-2512:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Erkläre diesen Gesetzesentwurf:\n"${contextText}"` }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        const data = await response.json();
        const explanation = data.choices[0]?.message?.content || "Konnte keine einfachere Erklärung generieren.";

        // 4. Save to Database
        if (explanation) {
            await supabase
                .from('poll_questions')
                .update({ deep_explanation: explanation })
                .eq('poll_id', pollId);
        }

        return NextResponse.json({ explanation, cached: false });

    } catch (error) {
        console.error('Explanation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
