'use client';

import { useState } from 'react';
import { Info, ThumbsUp, ThumbsDown, Check, X } from 'lucide-react';

interface PollCardProps {
    id: number;               // Poll ID for persistence
    question: string;         // "Bist du dafür...?"
    label: string;            // Original Titel
    simplifiedTitle?: string; // AI Titel
    explanation?: string;     // AI Erklärung
    date: string;
    accepted: boolean;
    onVote?: (vote: 'yes' | 'no') => void; // Optional für Homepage Voting
}

export function PollCard({ id, question, label, simplifiedTitle, explanation, date, accepted, onVote }: PollCardProps) {
    const [showExplanation, setShowExplanation] = useState(false);
    const [userVote, setUserVote] = useState<'yes' | 'no' | null>(null);
    const [isDetailsMode, setIsDetailsMode] = useState(false);

    // Load vote from localStorage on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            const votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
            if (votes[id]) {
                setUserVote(votes[id]);
                setIsDetailsMode(true);
            }
        }
    });

    const formattedDate = new Date(date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });

    const displayTitle = simplifiedTitle || label;

    const handleVote = (vote: 'yes' | 'no') => {
        // Save to LocalStorage
        const votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
        votes[id] = vote;
        localStorage.setItem('user_votes', JSON.stringify(votes));

        setUserVote(vote);
        setIsDetailsMode(true);

        // Propagate event (likely redirect)
        if (onVote) {
            onVote(vote);
        }
    };

    return (
        <div className="group relative w-full h-full bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">

            {/* Card Content Container */}
            <div className="p-8 flex-1 flex flex-col">

                {/* Header: Date & Badge */}
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {formattedDate}
                    </span>
                    {explanation && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setShowExplanation(!showExplanation);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors uppercase tracking-wider"
                        >
                            <Info size={14} strokeWidth={3} />
                            Was bedeutet das?
                        </button>
                    )}
                </div>

                {/* Main Title (Simplified) */}
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-4 tracking-tight">
                    {displayTitle}
                </h2>

                {/* Question Label */}
                <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                    {question}
                </p>

                {/* Original Title (Collapsed/Subtle) */}
                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-2 tracking-wider">Originaltitel</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {label}
                    </p>
                </div>
            </div>

            {/* Explanation Overlay (Glassmorphism) */}
            {showExplanation && explanation && (
                <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold">
                            <Info size={20} />
                            <span className="text-sm uppercase tracking-wider">Erklärung</span>
                        </div>
                        <button
                            onClick={(e) => { e.preventDefault(); setShowExplanation(false); }}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-900 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {explanation}
                    </p>
                    <button
                        onClick={(e) => { e.preventDefault(); setShowExplanation(false); }}
                        className="mt-auto w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-2xl transition-colors"
                    >
                        Verstanden
                    </button>
                </div>
            )}

            {/* Action Buttons (Homepage only) */}
            {onVote && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <button
                            onClick={(e) => { e.preventDefault(); handleVote('no'); }}
                            className={`
                                group flex flex-col items-center justify-center border rounded-2xl py-4 transition-all active:scale-95 shadow-sm hover:shadow-md
                                ${userVote === 'no'
                                    ? 'bg-red-500 text-white border-red-600 ring-2 ring-red-200'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500'}
                            `}
                        >
                            <X size={28} className={`mb-1 transition-transform ${userVote === 'no' ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={3} />
                            <span className="font-bold uppercase tracking-wider text-[10px]">Dagegen</span>
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); handleVote('yes'); }}
                            className={`
                                group flex flex-col items-center justify-center border rounded-2xl py-4 transition-all active:scale-95 shadow-sm hover:shadow-md
                                ${userVote === 'yes'
                                    ? 'bg-green-500 text-white border-green-600 ring-2 ring-green-200'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-900/10 text-slate-400 hover:text-green-500'}
                            `}
                        >
                            <Check size={28} className={`mb-1 transition-transform ${userVote === 'yes' ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={3} />
                            <span className="font-bold uppercase tracking-wider text-[10px]">Dafür</span>
                        </button>
                    </div>

                    {/* Details Link if voted */}
                    {isDetailsMode && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                if (onVote) onVote(userVote!); // Re-trigger navigation
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors font-bold uppercase tracking-wider text-xs animate-in fade-in slide-in-from-top-2"
                        >
                            Details anzeigen
                        </button>
                    )}
                </div>
            )}

            {/* Footer Status Strip (for list view without voting) */}
            {!onVote && (
                <div className={`h-1.5 w-full ${accepted ? 'bg-green-500' : 'bg-red-500'}`} />
            )}
        </div>
    );
}
