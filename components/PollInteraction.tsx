'use client';

import { useState, useEffect } from 'react';
import { VotingInterface } from './VotingInterface';
import { VoteMatchAnalysis } from './VoteMatchAnalysis';
import { ResultsChart } from './ResultsChart';

interface PollInteractionProps {
    pollId: number;
    initialVote?: 'yes' | 'no' | null;
    explanation?: string;
    results: any[];
    voteFlip: boolean;
}

export function PollInteraction({ pollId, initialVote, explanation, results, voteFlip }: PollInteractionProps) {
    const [currentVote, setCurrentVote] = useState<'yes' | 'no' | null>(initialVote || null);

    // Initial check of local storage to sync state if no initialVote
    useEffect(() => {
        if (!initialVote && typeof window !== 'undefined') {
            const votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
            if (votes[pollId]) {
                setCurrentVote(votes[pollId]);
            }
        }
    }, [pollId, initialVote]);

    return (
        <>
            {/* Voting Interface */}
            <div className="mb-16">
                <VotingInterface
                    pollId={pollId}
                    initialVote={initialVote}
                    onVoteChange={(vote) => setCurrentVote(vote)}
                />
            </div>

            {/* AI Explanation "Was bedeutet das?" */}
            {explanation && (
                <div className="mb-12 bg-indigo-50/50 p-8 rounded-3xl border border-indigo-50">
                    <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center uppercase tracking-widest">
                        💡 Kurz erklärt
                    </h3>
                    <p className="text-lg text-slate-700 leading-relaxed font-medium">
                        {explanation}
                    </p>
                </div>
            )}

            {/* Results & Analysis */}
            <div className="pt-10 border-t border-slate-100">

                {/* Vote Match Section - Reactive to currentVote */}
                <VoteMatchAnalysis
                    pollId={pollId}
                    results={results}
                    voteFlip={voteFlip}
                    userVote={currentVote}
                />

                <ResultsChart
                    results={results}
                    voteFlip={voteFlip}
                />
            </div>
        </>
    );
}
