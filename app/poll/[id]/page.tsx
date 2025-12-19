import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { PollInteraction } from '@/components/PollInteraction';
import { BackButton } from '@/components/BackButton';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PollDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const pollId = parseInt(id);

    // 1. Poll mit Frage und Ergebnissen laden
    const { data: poll, error } = await supabase
        .from('polls')
        .select(`
      *,
      poll_questions (
        question,
        simplified_title,
        explanation,
        vote_flip
      ),
      vote_results (
        fraction_id,
        fraction_label,
        votes_yes,
        votes_no,
        votes_abstain,
        votes_no_show
      ),
      user_vote_stats (
        total_yes,
        total_no
      )
    `)
        .eq('id', pollId)
        .single();

    if (error || !poll) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">← Zurück</Link>
                <p className="text-red-500">Abstimmung nicht gefunden.</p>
            </div>
        );
    }

    // 2. Check ob User bereits abgestimmt hat (Cookie-basiert)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || 'anonymous';

    const { data: userVote } = await supabase
        .from('user_votes')
        .select('user_vote')
        .eq('poll_id', pollId)
        .eq('session_id', sessionId)
        .single();

    // Frage und Details extrahieren
    const rawQuestions = poll.poll_questions;
    // Handle both single object (1:1) and array (1:N) returns from Supabase
    const questionData = Array.isArray(rawQuestions) ? rawQuestions[0] : rawQuestions;

    // Fallback falls Array leer oder null
    const question = questionData?.question || poll.label;
    const simplifiedTitle = questionData?.simplified_title;
    const explanation = questionData?.explanation;
    // HTML-Tags aus Beschreibung entfernen für Background
    const cleanDescription = (poll.description || '').replace(/<[^>]*>/g, ' ');

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <BackButton currentPollId={pollId} />

                <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden mb-8 border border-slate-100">
                    <div className="p-4 sm:p-12">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full">
                                Bundestag Abstimmung
                            </span>
                            <span className="text-slate-400 font-bold text-sm">
                                {new Date(poll.poll_date).toLocaleDateString('de-DE')}
                            </span>
                        </div>

                        {/* Simplified Title (H1) */}
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-8 tracking-tight">
                            {simplifiedTitle || poll.label}
                        </h1>

                        {/* Question Badge */}
                        <div className="mb-6 inline-block">
                            <h2 className="text-xl sm:text-2xl font-bold text-indigo-600 flex items-center gap-3">
                                {question}
                            </h2>
                        </div>

                        {/* Original Title (Moved Up) */}
                        {simplifiedTitle && (
                            <div className="mb-10 pt-6 border-t border-slate-100">
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-2 tracking-wider">Offizieller Titel</p>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                                    "{poll.label}"
                                </p>
                            </div>
                        )}

                        {/* Interactive Poll Section */}
                        <PollInteraction
                            pollId={pollId}
                            initialVote={userVote?.user_vote || null}
                            explanation={explanation}
                            results={poll.vote_results || []}
                            voteFlip={questionData?.vote_flip || false}
                        />
                    </div>
                </div>

                {/* Background Info (Refined) */}
                {
                    cleanDescription && (
                        <div className="bg-white shadow-sm rounded-3xl p-8 sm:p-12 border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Hintergrund</h3>
                            <div className="prose prose-lg prose-slate text-slate-600 leading-relaxed">
                                {cleanDescription.split('. ').map((sentence: string, i: number) => (
                                    <p key={i} className="mb-4">{sentence}.</p>
                                ))}
                            </div>
                            <a
                                href={poll.abgeordnetenwatch_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-8 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider"
                            >
                                Details auf Abgeordnetenwatch.de →
                            </a>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
