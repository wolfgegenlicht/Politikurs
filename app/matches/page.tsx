'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { calculatePartyMatches, PartyMatchResult } from '@/lib/matchUtils';
import { getPartyColor, splitPartyLabel } from '@/lib/partyUtils';
import { Target, Info, ChevronRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MatchesPage() {
    const [matches, setMatches] = useState<PartyMatchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [voteCount, setVoteCount] = useState(0);

    useEffect(() => {
        async function loadMatches() {
            const storedVotes = JSON.parse(localStorage.getItem('user_votes') || '{}');
            const pollIds = Object.keys(storedVotes).map(Number);

            if (pollIds.length === 0) {
                setLoading(false);
                return;
            }

            setVoteCount(pollIds.length);

            // Fetch polls the user voted on
            const { data: polls, error } = await supabase
                .from('polls')
                .select('id, poll_questions(vote_flip), vote_results(*)')
                .in('id', pollIds);

            if (error) {
                console.error('Error fetching polls:', error);
            } else if (polls) {
                const results = calculatePartyMatches(polls, storedVotes);
                setMatches(results);
            }
            setLoading(false);
        }

        loadMatches();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Berechne deine Matches...</p>
            </div>
        );
    }

    if (voteCount === 0) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-lg mx-auto text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl">
                        🧐
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4">Noch keine Daten</h1>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Du hast noch nicht abgestimmt. Stimme über einige Themen ab, um zu sehen, mit welcher Partei du am meisten übereinstimmst!
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        Jetzt abstimmen
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 pb-32">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-100">
                        <TrendingUp size={14} />
                        Deine Auswertung
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Dein PolitiKurs</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Basierend auf deinen <span className="text-slate-900 font-bold">{voteCount} Abstimmungen</span>.
                    </p>
                </div>

                {/* Stats Card */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                        <Target size={20} className="text-indigo-600" />
                        Parteien Leaderboard
                    </h2>

                    <div className="space-y-4">
                        {matches.map((match, index) => (
                            <div
                                key={match.fraction_id}
                                className="group relative bg-slate-50 rounded-2xl p-5 border border-slate-100 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5"
                            >
                                <div className="flex items-center justify-between mb-3 gap-2">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-[14px] h-[14px] rounded-full shrink-0"
                                            style={{ backgroundColor: getPartyColor(match.fraction_label) }}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 tracking-tight leading-tight">
                                                {splitPartyLabel(match.fraction_label).name}
                                            </span>
                                            {splitPartyLabel(match.fraction_label).period && (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {splitPartyLabel(match.fraction_label).period}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-indigo-600">
                                            {match.percentage}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${match.percentage}%` }}
                                    />
                                </div>

                                <div className="mt-3 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>{match.match_count} Übereinstimmungen</span>
                                    <span>{match.total_votes} Abstimmungen</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Disclaimer / Info */}
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex gap-4">
                    <Info className="shrink-0 text-indigo-400" size={20} />
                    <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                        Diese Auswertung zeigt nur Übereinstimmungen bei Themen, zu denen du abgestimmt hast. Je mehr Abstimmungen du bearbeitest, desto genauer wird dein Match.
                    </p>
                </div>
            </div>
        </div>
    );
}
