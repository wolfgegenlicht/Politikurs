'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, ThumbsDown, Check, X, Loader2 } from 'lucide-react';

interface VotingInterfaceProps {
    pollId: number;
    initialVote?: 'yes' | 'no' | null;
    onVoteChange?: (vote: 'yes' | 'no') => void;
}

export function VotingInterface({ pollId, initialVote, onVoteChange }: VotingInterfaceProps) {
    const [currentVote, setCurrentVote] = useState<'yes' | 'no' | null>(initialVote || null);
    const [voting, setVoting] = useState(false);
    const router = useRouter();

    // Check localStorage on mount if no initialVote provided
    useState(() => {
        if (typeof window !== 'undefined' && !initialVote) {
            const votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
            if (votes[pollId]) {
                setCurrentVote(votes[pollId]);
            }
        }
    });

    async function handleVote(vote: 'yes' | 'no') {
        const finalVote = currentVote === vote ? null : vote;
        setVoting(true);

        // Optimistic UI update
        setCurrentVote(finalVote);

        // Save to LocalStorage (so Overview knows about it)
        if (typeof window !== 'undefined') {
            const votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
            if (finalVote === null) {
                delete votes[pollId];
            } else {
                votes[pollId] = finalVote;
            }
            localStorage.setItem('user_votes', JSON.stringify(votes));
        }

        // Notify parent (can be yes | no | null now internally)
        if (onVoteChange) {
            onVoteChange(finalVote as any);
        }

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollId, vote: finalVote })
            });

            if (!response.ok) {
                throw new Error('Vote failed');
            }

            // Seite neu laden um Ergebnis zu zeigen
            router.refresh();
            setVoting(false);

        } catch (error) {
            console.error('Voting error:', error);
            alert('Fehler beim Abstimmen. Bitte versuche es erneut.');
            setVoting(false);
            setCurrentVote(initialVote || null); // Revert on error
        }
    }

    return (
        <div className="mt-10">
            <h3 className="text-center text-xl font-bold text-slate-900 mb-8 tracking-tight">
                Deine Entscheidung?
            </h3>

            <div className="grid grid-cols-2 gap-6 sm:gap-8">
                <button
                    onClick={() => handleVote('no')}
                    disabled={voting}
                    className={`
                        group relative flex flex-col items-center justify-center p-8 rounded-[2rem] transition-all duration-300
                        border-2  hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        ${currentVote === 'no'
                            ? 'bg-red-50 border-red-500 ring-4 ring-red-100'
                            : 'bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/50'}
                    `}
                >
                    <div className={`
                        p-4 rounded-full mb-4 transition-colors duration-300
                        ${currentVote === 'no' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-red-500 group-hover:text-white'}
                    `}>
                        <ThumbsDown size={24} strokeWidth={2.5} />
                    </div>
                    <span className={`
                        text-lg font-bold uppercase tracking-widest
                        ${currentVote === 'no' ? 'text-red-700' : 'text-slate-400 group-hover:text-red-700'}
                    `}>
                        Dagegen
                    </span>
                    {currentVote === 'no' && <div className="absolute top-4 right-4 text-red-500"><Check size={20} /></div>}
                </button>

                <button
                    onClick={() => handleVote('yes')}
                    disabled={voting}
                    className={`
                        group relative flex flex-col items-center justify-center p-8 rounded-[2rem] transition-all duration-300
                        border-2  hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        ${currentVote === 'yes'
                            ? 'bg-green-50 border-green-500 ring-4 ring-green-100'
                            : 'bg-white border-slate-200 hover:border-green-200 hover:bg-green-50/50'}
                    `}
                >
                    <div className={`
                        p-4 rounded-full mb-4 transition-colors duration-300
                        ${currentVote === 'yes' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-green-500 group-hover:text-white'}
                    `}>
                        <ThumbsUp size={24} strokeWidth={2.5} />
                    </div>
                    <span className={`
                        text-lg font-bold uppercase tracking-widest
                        ${currentVote === 'yes' ? 'text-green-700' : 'text-slate-400 group-hover:text-green-700'}
                    `}>
                        Dafür
                    </span>
                    {currentVote === 'yes' && <div className="absolute top-4 right-4 text-green-500"><Check size={20} /></div>}
                </button>

            </div>

            {voting && (
                <div className="flex items-center justify-center gap-2 mt-6 text-slate-400 animate-pulse">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-medium">Stimme wird übertragen...</span>
                </div>
            )}
        </div>
    );
}
