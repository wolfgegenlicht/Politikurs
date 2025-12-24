'use client';

import { useState } from 'react';
import { Info, ThumbsUp, ThumbsDown, Check, X, HelpCircle, ChevronRight, ChevronDown, ExternalLink, GraduationCap, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Modal } from './Modal';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Update Interface
interface PollCardProps {
    id: number;
    question: string;
    label: string;
    simplifiedTitle?: string;
    explanation?: string;
    related_links?: { label: string; url: string }[];
    date: string;
    accepted: boolean;
    onVote?: (vote: 'yes' | 'no' | 'skip') => void;
    onDetailsClick?: () => void; // NEW: Explicit navigation handler
}

export function PollCard({ id, question, label, simplifiedTitle, explanation, related_links, date, accepted, onVote, onDetailsClick }: PollCardProps) {
    // ... rest of state ...

    // ... (keep handleVote logic as is, it updates local state) ...

    // Explanation State: 0 = closed, 1 = short, 2 = deep
    const [explanationMode, setExplanationMode] = useState<0 | 1 | 2>(0);
    const [deepExplanation, setDeepExplanation] = useState<string | null>(null);
    const [loadingDeep, setLoadingDeep] = useState(false);

    const [pollAnalysis, setPollAnalysis] = useState<any>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    const [userVote, setUserVote] = useState<'yes' | 'no' | 'skip' | null>(null);
    const [isDetailsMode, setIsDetailsMode] = useState(false);
    const [isOriginalTitleOpen, setIsOriginalTitleOpen] = useState(false);

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

        // Toggle logic: If clicking the same vote again, deselect (set to null)
        const finalVote = userVote === vote ? null : vote;

        if (finalVote === null) {
            delete votes[id];
        } else {
            votes[id] = finalVote;
        }

        localStorage.setItem('user_votes', JSON.stringify(votes));

        setUserVote(finalVote);
        setIsDetailsMode(finalVote !== null);
        setExplanationMode(0); // Close overlays

        if (onVote) onVote(finalVote as any);
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

    const loadPollAnalysis = async () => {
        if (pollAnalysis) return;
        setLoadingAnalysis(true);
        try {
            const { data } = await supabase
                .from('poll_analysis')
                .select('*')
                .eq('poll_id', id)
                .single();

            if (data) {
                setPollAnalysis(data);
            }
        } catch (e) {
            console.error('Error loading analysis:', e);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    // Styling for skipped state
    const cardStatusClass = userVote === 'skip'
        ? "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-300" // "Inactive" look but interactive
        : "";

    return (
        <div className={`group relative w-full h-full bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] ${cardStatusClass}`}>

            {/* Skipped Badge */}
            {userVote === 'skip' && (
                <div className="absolute top-0 right-0 z-10 m-4 px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-full">
                    Übersprungen
                </div>
            )}

            {/* Card Content Container */}
            <div className="p-8 flex-1 flex flex-col">

                {/* Header: Date */}
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {formattedDate}
                    </span>
                </div>

                {/* Main Heading: The Question */}
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-4 tracking-tight">
                    {question}
                </h2>

                {/* Explanation Trigger (Below Title) Infos und Argumente - Force Rebuild */}
                {explanation && (
                    <div className="mb-6 flex justify-start">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setExplanationMode(1);
                                loadPollAnalysis();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 border-amber-200 border-[1px] bg-amber-50 hover:bg-amber-100 rounded-full transition-colors uppercase tracking-wider"
                        >
                            <Info size={14} strokeWidth={3} />
                            Info & Argumente
                        </button>
                    </div>
                )}

                {/* Simplified Title (Hidden for now as per user request) */}
                {/* 
                <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                    {displayTitle}
                </p> 
                */}

                {/* Original Title (Collapsed/Subtle) */}
                <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setIsOriginalTitleOpen(!isOriginalTitleOpen)}
                        className="flex items-center gap-1.5 mb-2 group/accordion w-full text-left"
                    >
                        {isOriginalTitleOpen ? (
                            <ChevronDown size={12} className="text-slate-400 group-hover/accordion:text-indigo-600 transition-colors" />
                        ) : (
                            <ChevronRight size={12} className="text-slate-400 group-hover/accordion:text-indigo-600 transition-colors" />
                        )}

                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider group-hover/accordion:text-indigo-600 transition-colors">Originaltitel</p>

                        <div
                            className="group/tooltip relative flex items-center ml-1"
                            onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking tooltip
                        >
                            <HelpCircle size={10} className="text-slate-400 cursor-help hover:text-indigo-600 transition-colors" />

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10 pointer-events-none transform translate-y-1 group-hover/tooltip:translate-y-0">
                                <p className="font-medium leading-relaxed text-center">
                                    Der Titel aus dem Bundestag ist oft kompliziert, doppelt verneint oder zeigt den Endbeschluss. Damit es für dich einfacher ist, habe ich den Titel in eine einfach verständliche Frage umformuliert. Hier siehst du zum Vergleich den Original-Text.
                                </p>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 transform translate-y-1/2 rotate-45"></div>
                            </div>
                        </div>
                    </button>

                    {isOriginalTitleOpen && (
                        <p className="text-xs text-slate-500 font-medium leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                            {label}
                        </p>
                    )}
                </div>
            </div>

            {/* --- EXPLANATION MODALS --- */}

            {/* Modal Level 1: Standard Explanation */}
            <Modal
                isOpen={explanationMode === 1}
                onClose={() => setExplanationMode(0)}
                title={
                    <div className="flex items-center gap-2 text-indigo-600">
                        <Info size={20} strokeWidth={3} />
                        <span className="text-sm uppercase tracking-wider font-black">Erklärung</span>
                    </div>
                }
                footer={
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => setExplanationMode(0)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                        >
                            Verstanden 👍
                        </button>
                        <button
                            onClick={() => loadDeepExplanation()}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-2xl transition-colors text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            Verstehe ich leider nicht... 😕
                        </button>
                    </div>
                }
            >
                <div className="space-y-8">
                    <div className="prose prose-lg md:prose-xl prose-slate dark:prose-invert max-w-none font-semibold leading-relaxed">
                        <ReactMarkdown>
                            {explanation}
                        </ReactMarkdown>
                    </div>

                    {related_links && related_links.length > 0 && (
                        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Offizielle Quellen</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {related_links.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-sm font-bold text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                        <span className="truncate pr-4">{link.label}</span>
                                        <ExternalLink size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Debatte im Bundestag</h4>

                        {loadingAnalysis ? (
                            <div className="flex items-center justify-center py-8 text-slate-400">
                                <span className="text-xs font-bold uppercase tracking-wider animate-pulse">Analysiere Debatte...</span>
                            </div>
                        ) : pollAnalysis ? (
                            <div className="space-y-6">
                                {/* Context Description */}
                                {pollAnalysis.description && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                                        {pollAnalysis.description}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* PRO Arguments */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <h5 className="text-xs font-black uppercase tracking-wider text-green-600 dark:text-green-400">Dafür</h5>
                                        </div>
                                        {pollAnalysis.pro_arguments && pollAnalysis.pro_arguments.map((arg: string, i: number) => (
                                            <div key={i} className="text-sm text-slate-700 dark:text-slate-200 bg-green-50/50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/20">
                                                {arg}
                                            </div>
                                        ))}
                                    </div>

                                    {/* CONTRA Arguments */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <h5 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">Dagegen</h5>
                                        </div>
                                        {pollAnalysis.contra_arguments && pollAnalysis.contra_arguments.map((arg: string, i: number) => (
                                            <div key={i} className="text-sm text-slate-700 dark:text-slate-200 bg-red-50/50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                                                {arg}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sources */}
                                {pollAnalysis.sources && pollAnalysis.sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-wrap gap-3">
                                            {pollAnalysis.sources.map((url: string, i: number) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase tracking-wider"
                                                >
                                                    <FileText size={10} />
                                                    Quelle {i + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">Zu dieser Abstimmung liegt noch keine Debatten-Analyse vor.</p>
                        )}
                    </div>
                </div>
            </Modal >

            {/* Modal Level 2: Deep Explanation (ELI15) */}
            <Modal
                isOpen={explanationMode === 2}
                onClose={() => setExplanationMode(0)}
                title={
                    <div className="flex items-center gap-2 text-indigo-600">
                        <GraduationCap size={22} strokeWidth={2.5} />
                        <span className="text-sm uppercase tracking-wider font-black">Deep Dive</span>
                    </div>
                }
                footer={
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => setExplanationMode(0)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                        >
                            Alles klar, verstanden!
                        </button>
                        <button
                            onClick={() => handleVote('skip')}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 font-bold py-3 rounded-2xl transition-colors text-sm"
                        >
                            Ist mir zu kompliziert (Überspringen)
                        </button>
                    </div>
                }
            >
                {loadingDeep ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 animate-ping opacity-25"></div>
                            <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-b-indigo-600"></div>
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Ich suche eine einfache Erklärung...</p>
                    </div>
                ) : (
                    <div className="prose prose-lg md:prose-xl prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown>
                            {deepExplanation || ''}
                        </ReactMarkdown>
                    </div>
                )}
            </Modal >

            {/* Action Buttons (Homepage only) */}
            {
                onVote && (
                    <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 transition-opacity duration-300">
                        <button
                            onClick={(e) => { e.preventDefault(); handleVote('no'); }}
                            className={`
                            group flex flex-col items-center justify-center border rounded-2xl py-4 transition-all active:scale-95
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
                            group flex flex-col items-center justify-center border rounded-2xl py-4 transition-all active:scale-95
                            ${userVote === 'yes'
                                    ? 'bg-green-500 text-white border-green-600 ring-2 ring-green-200'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-900/10 text-slate-400 hover:text-green-500'}
                        `}
                        >
                            <Check size={28} className={`mb-1 transition-transform ${userVote === 'yes' ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={3} />
                            <span className="font-bold uppercase tracking-wider text-[10px]">Dafür</span>
                        </button>
                    </div>
                )
            }

            {/* Details Link if voted */}
            {
                isDetailsMode && (
                    <div className="p-4 pt-0">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                if (onDetailsClick) onDetailsClick();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors font-bold uppercase tracking-wider text-xs animate-in fade-in slide-in-from-top-2"
                        >
                            Details anzeigen
                        </button>
                    </div>
                )
            }
            {/* Footer Status Strip (for list view without voting) */}
            {
                !onVote && (
                    <div className={`h-1.5 w-full ${accepted ? 'bg-green-500' : 'bg-red-500'}`} />
                )
            }
        </div >
    );
}
