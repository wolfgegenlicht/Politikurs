import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { pollId, vote } = await request.json();

        // Validierung
        if (!pollId || (vote !== null && !['yes', 'no'].includes(vote))) {
            return NextResponse.json(
                { error: 'Invalid vote data' },
                { status: 400 }
            );
        }

        // Session ID aus Cookie holen oder neu erstellen
        const cookieStore = await cookies();
        let sessionId = cookieStore.get('session_id')?.value;

        if (!sessionId) {
            sessionId = uuidv4();
            cookieStore.set('session_id', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365 // 1 Jahr
            });
        }

        let dbError;
        if (vote === null) {
            // Unvote: Delete the record
            const { error } = await supabase
                .from('user_votes')
                .delete()
                .eq('poll_id', pollId)
                .eq('session_id', sessionId);
            dbError = error;
        } else {
            // Vote speichern (upsert verhindert Duplikate)
            const { error } = await supabase
                .from('user_votes')
                .upsert({
                    poll_id: pollId,
                    user_vote: vote,
                    session_id: sessionId
                }, {
                    onConflict: 'poll_id,session_id'
                });
            dbError = error;
        }

        if (dbError) {
            throw dbError;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json(
            { error: 'Failed to save vote' },
            { status: 500 }
        );
    }
}
