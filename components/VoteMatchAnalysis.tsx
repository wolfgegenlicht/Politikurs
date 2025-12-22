'use client';

import { useState, useEffect } from 'react';
import { getPartyColor } from '@/lib/partyUtils';
import { Check, X, ThumbsUp, ThumbsDown, UserCheck } from 'lucide-react';

interface VoteResult {
    fraction_id: number;
    fraction_label: string;
    votes_yes: number;
    votes_no: number;
    votes_abstain: number;
    votes_no_show: number;
}

interface VoteMatchAnalysisProps {
    pollId: number;
    results: VoteResult[];
    voteFlip?: boolean;
    userVote?: 'yes' | 'no' | null; // Optional prop to override internal state/localStorage
}

export function VoteMatchAnalysis({ pollId, results, voteFlip = false, userVote: propUserVote }: VoteMatchAnalysisProps) {
    const [userVote, setUserVote] = useState<'yes' | 'no' | null>(propUserVote || null);

    // Sync prop changes to state
    useEffect(() => {
        if (propUserVote !== undefined) {
            setUserVote(propUserVote);
        }
    }, [propUserVote]);

    // Read vote from localStorage ONLY if no prop provided
    useEffect(() => {
        if (propUserVote === undefined && typeof window !== 'undefined') {
            const votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
            if (votes[pollId]) {
                setUserVote(votes[pollId]);
            }
        }
    }, [pollId, propUserVote]);

    if (!userVote || !results || results.length === 0) return null;

    // Logic to determine what the user actually supported in terms of Parliament logic
    // If NOT flipped: User YES == Parliament YES. User NO == Parliament NO.
    // If FLIPPED: User YES (e.g. "Weapons?") == Parliament NO (Antrag "No Weapons").
    //             User NO (e.g. "No Weapons") == Parliament YES (Antrag "No Weapons").

    // So target parliament vote is:
    // (userVote == 'yes') XOR voteFlip ? 'yes' : 'no'
    // JS XOR: (a !== b)
    // Wait: 
    // Yes(True) != Flip(False) -> True (P-Yes). Correct.
    // Yes(True) != Flip(True) -> False (P-No). Correct.
    // No(False) != Flip(False) -> False (P-No). Correct.
    // No(False) != Flip(True) -> True (P-Yes). Correct.

    // Wait, 'userVote' is string 'yes'/'no'.
    const isUserYes = userVote === 'yes';
    const targetsParliamentYes = (isUserYes !== voteFlip);

    // Find matching parties
    const matchingParties = results.filter(r => {
        const total = r.votes_yes + r.votes_no + r.votes_abstain + r.votes_no_show;
        if (total === 0) return false;

        // Majority determination
        // Strict majority? Or just plural? Let's say plural.
        // Compare Yes vs No. Ignore abstain for match logic?
        // Or > 50%? Usually > 50% is clearer.
        // Let's use simple max(yes, no).
        const majorityVote = r.votes_yes > r.votes_no ? 'yes' : 'no';

        // If it's a tie or abstain is winner, we don't match? 
        // Let's stick to strict Yes vs No majority.
        if (r.votes_yes === r.votes_no) return false; // Tie

        return targetsParliamentYes ? (majorityVote === 'yes') : (majorityVote === 'no');
    }).sort((a, b) => b.votes_yes + b.votes_no - (a.votes_yes + a.votes_no)); // Sort by size roughly

    // UI Text
    const userVoteLabel = isUserYes ? "Dafür" : "Dagegen";
    const userIcon = isUserYes ? <ThumbsUp className="text-green-600" size={24} /> : <ThumbsDown className="text-red-600" size={24} />;
    const matchLabel = targetsParliamentYes ? "haben dem Original-Antrag zugestimmt" : "haben den Original-Antrag abgelehnt";

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-3xl p-8  mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                <UserCheck size={18} />
                Dein Match
            </h3>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* User Choice */}
                <div className="flex-shrink-0 bg-white p-6 rounded-2xl  border border-slate-200 flex flex-col items-center justify-center min-w-[140px]">
                    <span className="text-xs text-slate-400 font-bold uppercase mb-2">Du hast gestimmt</span>
                    <div className="p-3 rounded-full bg-slate-50 mb-2">
                        {userIcon}
                    </div>
                    <span className={`text-xl font-black ${isUserYes ? 'text-green-600' : 'text-red-600'}`}>
                        {userVoteLabel}
                    </span>
                </div>

                {/* Arrow / Connector (Hidden on mobile) */}
                <div className="hidden md:flex flex-col justify-center h-full pt-10 text-slate-300">
                    →
                </div>

                {/* Matches */}
                <div className="flex-1">
                    <p className="text-slate-600 font-medium mb-4">
                        Folgende Parteien haben <span className="font-bold text-slate-900">genauso abgestimmt</span> wie du:
                    </p>

                    {matchingParties.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {matchingParties.map(party => (
                                <div
                                    key={party.fraction_id}
                                    className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200  transition-transform hover:-translate-y-1"
                                >
                                    <div
                                        className="w-[14px] h-[14px] rounded-full shrink-0"
                                        style={{ backgroundColor: getPartyColor(party.fraction_label) }}
                                    />
                                    <span className="font-bold text-slate-700 text-sm">
                                        {party.fraction_label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-100 rounded-xl p-4 text-slate-500 text-sm italic">
                            Keine Fraktion hat mehrheitlich so abgestimmt wie du. Du bist ein Rebell! 🦁
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
