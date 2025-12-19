'use client';

import { useState } from 'react';
import { Info, ThumbsUp, ThumbsDown, Check, X, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PollCardProps {
    id: number;               // Poll ID for persistence
    question: string;         // "Bist du dafür...?"
    label: string;            // Original Titel
    simplifiedTitle?: string; // AI Titel
    explanation?: string;     // AI Erklärung
    date: string;
    accepted: boolean;
    onVote?: (vote: 'yes' | 'no' | 'skip') => void; // Optional für Homepage Voting
}

export function PollCard({ id, question, label, simplifiedTitle, explanation, date, accepted, onVote }: PollCardProps) {
    // Explanation State: 0 = closed, 1 = short, 2 = deep
    const [explanationMode, setExplanationMode] = useState<0 | 1 | 2>(0);
    const [deepExplanation, setDeepExplanation] = useState<string | null>(null);
    const [loadingDeep, setLoadingDeep] = useState(false);

    const [userVote, setUserVote] = useState<'yes' | 'no' | 'skip' | null>(null);
    const [isDetailsMode, setIsDetailsMode] = useState(false);

    // Load vote from localStorage on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            const votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
            if (votes[id]) {
                setUserVote(votes[id]);
                // If skipped, we don't necessarily need details button, but maybe? 
                // User said "inactive ... but you can still interact". 
                // Let's show details button anyway if they want to check.
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

    const handleVote = (vote: 'yes' | 'no' | 'skip') => {
        const votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
        votes[id] = vote;
        localStorage.setItem('user_votes', JSON.stringify(votes));

        setUserVote(vote);
        setIsDetailsMode(true);
        setExplanationMode(0); // Close overlays

        if (onVote) onVote(vote);
    };

    const loadDeepExplanation = async () => {
        setLoadingDeep(true);
        setExplanationMode(2); // Switch view immediately to show loader

        try {
            // Check cache or similar? For now just fetch.
            const res = await fetch('/api/explain-more', {
                method: 'POST',
                body: JSON.stringify({ pollId: id })
            });
            const data = await res.json();
            setDeepExplanation(data.explanation);
        } catch (e) {
            console.error(e);
            setDeepExplanation("Tut mir leid, ich konnte keine einfachere Erklärung laden.");
        } finally {
            setLoadingDeep(false);
        }
    };

    // Styling for skipped state
    const cardStatusClass = userVote === 'skip'
        ? "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-300" // "Inactive" look but interactive
        : "";

    return (
        <div className={`group relative w-full h-full bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] ${cardStatusClass}`}>

            {/* Skipped Badge */}
            {userVote === 'skip' && (
                <div className="absolute top-0 right-0 z-10 m-4 px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-full">
                    Übersprungen
                </div>
            )}

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
                                setExplanationMode(1);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors uppercase tracking-wider"
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
                    <div className="flex items-center gap-1.5 mb-2">
                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Originaltitel</p>

                        <div className="group/tooltip relative flex items-center">
                            <HelpCircle size={10} className="text-slate-400 cursor-help" />

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10 pointer-events-none transform translate-y-1 group-hover/tooltip:translate-y-0">
                                <p className="font-medium leading-relaxed text-center">
                                    Der offizielle Titel im Bundestag ist oft lang oder kompliziert formuliert. Ich zeige dir hier zur Transparenz den offiziellen Titel, aber habe ihn für die Übersicht vereinfacht.
                                </p>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 transform translate-y-1/2 rotate-45"></div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {label}
                    </p>
                </div>
            </div>

            {/* --- EXPLANATION OVERLAYS --- */}

            {/* Overlay Level 1: Standard Explanation */}
            {explanationMode === 1 && explanation && (
                <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold">
                            <Info size={20} />
                            <span className="text-sm uppercase tracking-wider">Erklärung</span>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); setExplanationMode(0); }} className="text-slate-400 hover:text-slate-900">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-8">
                            {explanation}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <button
                            onClick={(e) => { e.preventDefault(); setExplanationMode(0); }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors"
                        >
                            Verstanden 👍
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); loadDeepExplanation(); }}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-2xl transition-colors text-sm"
                        >
                            Verstehe ich leider nicht... 😕
                        </button>
                    </div>
                </div>
            )}

            {/* Overlay Level 2: Deep Explanation (ELI15) */}
            {explanationMode === 2 && (
                <div className="absolute inset-0 z-30 bg-indigo-50/98 dark:bg-slate-900/98 backdrop-blur-xl p-8 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold">
                            <span className="text-2xl">🎓</span>
                            <span className="text-sm uppercase tracking-wider">Deep Dive</span>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); setExplanationMode(0); }} className="text-slate-400 hover:text-slate-900">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingDeep ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                <p className="text-sm font-medium animate-pulse">Ich suche eine einfache Erklärung...</p>
                            </div>
                        ) : (
                            <div className="prose prose-lg prose-indigo dark:prose-invert">
                                <ReactMarkdown>
                                    {deepExplanation}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 mt-8">
                        <button
                            onClick={(e) => { e.preventDefault(); setExplanationMode(0); }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-indigo-200"
                        >
                            Alles klar, verstanden! 💡
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); handleVote('skip'); }}
                            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-3 rounded-2xl transition-colors text-sm"
                        >
                            Ist mir zu kompliziert (Überspringen) ⏭️
                        </button>
                    </div>
                </div>
            )}

            {/* Action Buttons (Homepage only) */}
            {onVote && (
                <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 transition-opacity duration-300">
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
            )}

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
            {/* Footer Status Strip (for list view without voting) */}
            {!onVote && (
                <div className={`h-1.5 w-full ${accepted ? 'bg-green-500' : 'bg-red-500'}`} />
            )}
        </div>
    );
}
