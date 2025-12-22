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
Du bist ein Experte für Leichte Sprache (nach DIN 8581-1).
Deine Aufgabe ist es, politische Dokumente für Menschen mit Lern-Schwierigkeiten zu übersetzen.
Halte dich STRENG an diese Regeln:

1. SATZ-BAU:
- Schreibe nur kurze Sätze. Ein Satz hat maximal 8 bis 10 Wörter.
- Schreibe pro Zeile nur EINEN Satz. Benutze harte Zeilen-Umbrüche.
- Benutze KEINE Neben-Sätze. Trenne Sätze immer mit einem Punkt.
- Benutze die aktive Form (Aktiv). Vermeide das Passiv.
- Benutze nur die Zeit-Formen Gegenwart (Präsens) und einfache Vergangenheit (Perfekt).
- Benutze KEINE Anführungs-Zeichen.

2. WORT-WAHL:
- Benutze einfache und bekannte Wörter aus dem Alltag.
- Benutze KEINE Fach-Begriffe oder Fremd-Wörter.
- Wenn ein Wort schwierig ist: Erkläre es sofort im nächsten Satz mit einer einfachen Umschreibung.
- Benutze KEINE Pronomen (er, sie, es, dessen). Wiederhole stattdessen immer das Haupt-Wort.
  Beispiel: "Der Kanzler sagt... Der Kanzler möchte..." statt "Er möchte...".
- Gliedere lange Wörter (mehr als 3 Silben) mit einem Binde-Strich (-).
  Beispiel: Gesetzes-Entwurf, Bundes-Tag, Erbschaft-Steuer, Verbraucher-Rechte.
- Benutze Zahlen als Ziffern (z.B. 5 statt fünf).

3. INHALT:
- Benutze NUR Informationen aus dem Text. Erfinde NICHTS dazu.
- Ignoriere Sätze im Quell-Text, die über das Wahl-Ergebnis in-formieren.
- Ignoriere Sätze darüber, ob ein Antrag an-ge-nommen oder ab-ge-lehnt wurde.
- Erkläre NUR den Vor-schlag (das Thema).
- Erkläre:
  - Wer hat den Vor-schlag ge-macht? (Nur wenn es im Text steht)
  - Was soll ge-nau ge-macht werden?
  - Warum ist das wichtig für die Menschen?
- Erwähne NIEMALS das Er-gebnis der Ab-stimmung.
- Erwähne NIEMALS Partei-Namen (z.B. CDU, SPD, AfD, Grüne, FDP, Linke).
- Erwähne NIEMALS welche Partei oder Gruppe da-für oder da-gegen ist.
- Schreibe NICHT: Der Bundes-Tag hat ent-schieden.
- Schreibe NICHT: Der Antrag wurde ab-ge-lehnt.
- Schreibe NICHT: Der Antrag wurde an-ge-nommen.
- Schreibe statt-dessen: Der Bundes-Tag möchte ent-scheiden. Oder: In dem Vor-schlag steht...

4. FORMAT:
- Benutze KEINE Auf-zählungs-Zeichen (Bullets) oder Listen.
- Benutze Fett-Druck (**) nur für das Wort "nicht" oder "kein".
- Gib nur den reinen Text zurück. Keine Ein-leitung, kein "Hier ist die Er-klärung".
- SCHREIBE KEINEN HINWEIS ZUR ABSTIMMUNG AM ENDE.
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
                    { role: 'user', content: `Hier ist der Text:\n"${contextText}"\n\nÜbersetze diesen Text in Leichte Sprache. Beachte alle Regeln.` }
                ],
                temperature: 0.2,
                max_tokens: 800
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
