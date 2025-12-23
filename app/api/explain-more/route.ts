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

1. SATZBAU:
- Schreibe nur kurze Sätze. Ein Satz hat maximal 8 bis 10 Wörter.
- Schreibe pro Zeile nur EINEN Satz. Benutze harte Zeilen-Umbrüche.
- Benutze KEINE Nebensätze. Trenne Sätze immer mit einem Punkt.
- Benutze die aktive Form (Aktiv). Vermeide das Passiv.
- Benutze nur die Zeitformen Gegenwart (Präsens) und einfache Vergangenheit (Perfekt).
- Benutze KEINE Anführungszeichen.

2. WORTWAHL:
- Benutze einfache und bekannte Wörter aus dem Alltag.
- Benutze KEINE Fachbegriffe oder Fremdwörter.
- Wenn ein Wort schwierig ist: Erkläre es sofort im nächsten Satz mit einer einfachen Umschreibung.
- Benutze KEINE Pronomen (er, sie, es, dessen). Wiederhole stattdessen immer das Hauptwort.
  Beispiel: "Der Kanzler sagt... Der Kanzler möchte..." statt "Er möchte...".
- Benutze Zahlen als Ziffern (z.B. 5 statt fünf).

3. INHALT:
- Benutze NUR Informationen aus dem Text. Erfinde NICHTS dazu.
- Ignoriere Sätze im Quelltext, die über das Wahlergebnis informieren.
- Ignoriere Sätze darüber, ob ein Antrag angenommen oder abgelehnt wurde.
- Erkläre NUR den Vorschlag (das Thema).
- Erkläre:
  - Wer hat den Vorschlag gemacht? (Nur wenn es im Text steht)
  - Was soll genau gemacht werden?
  - Warum ist das wichtig für die Menschen?
- Erwähne NIEMALS das Ergebnis der Abstimmung.
- Erwähne NIEMALS Partei- oder Gruppen-Namen (z.B. CDU, SPD, AfD, Grüne, FDP, Linke).
- Erwähne NIEMALS welche Partei oder Gruppe dafür oder dagegen ist.
- Schreibe NICHT: Der Bundes-Tag hat entschieden.
- Schreibe NICHT: Der Antrag wurde abgelehnt.
- Schreibe NICHT: Der Antrag wurde angenommen.
- Schreibe stattdessen: Der Bundestag möchte entscheiden. Oder: In dem Vorschlag steht...

4. FORMAT:
- Benutze KEINE Aufzählungszeichen (Bullets) oder Listen.
- Benutze Fettdruck (**) nur für das Wort "nicht" oder "kein".
- Gib nur den reinen Text zurück. Keine Einleitung, kein "Hier ist die Erklärung".
- SCHREIBE KEINEN HINWEIS ZUR FINALEN ABSTIMMUNG BZW. ABSTIMMUNGSERGEBNISSEN AM ENDE.
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
