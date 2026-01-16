'use client';

import { useState, useEffect } from 'react';
import { Info, AlertTriangle, FileText, X } from 'lucide-react';
import { Modal } from '@/components/Modal';

export function VoteDisclaimer() {
    const [isOpen, setIsOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Check local storage on mount
        const hasSeenDisclaimer = localStorage.getItem('has_seen_disclaimer_v1');
        if (!hasSeenDisclaimer) {
            // Small delay for animation
            const timer = setTimeout(() => {
                setShowPopup(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismissPopup = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setShowPopup(false);
        localStorage.setItem('has_seen_disclaimer_v1', 'true');
    };

    const handleOpenModal = () => {
        setIsOpen(true);
        // Also dismiss popup if opening modal
        if (showPopup) {
            setShowPopup(false);
            localStorage.setItem('has_seen_disclaimer_v1', 'true');
        }
    };

    return (
        <>

            {/* Fixed Popup (First Visit) */}
            {showPopup && (
                <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[50] w-[calc(100%-2rem)] md:w-96 animate-in slide-in-from-bottom-10 fade-in duration-700">
                    <div
                        className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-[0_8px_40px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 relative cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={handleOpenModal}
                    >
                        {/* Close X (Dismiss) */}
                        <button
                            onClick={handleDismissPopup}
                            className="absolute -top-2 -right-2 p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full shadow-sm hover:shadow-md transition-all"
                        >
                            <X size={16} strokeWidth={3} />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl shrink-0">
                                <Info size={24} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                                    Was du wissen musst
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Diese App zeigt nur <strong>namentliche Abstimmungen</strong>. Das ist nur ein kleiner Teil der Parlamentsarbeit.
                                </p>
                                <span className="inline-block mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                    Mehr erfahren →
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Persistent Floating Trigger (When Popup is closed) */}
            {!showPopup && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[40] w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all hover:scale-110 active:scale-95 group"
                    aria-label="Infos zu den Daten"
                >
                    <Info size={24} strokeWidth={2.5} />
                    {/* Tooltip */}
                    <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap font-bold">
                        Über die Daten
                    </span>
                </button>
            )}

            {/* Static Teaser (Bottom of Page) */}
            <div className="mb-12 cursor-pointer group" onClick={() => setIsOpen(true)}>
                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-3xl text-center border border-slate-200 dark:border-slate-700 transition-all duration-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:shadow-lg group-hover:scale-[1.02]">
                    <div className="flex items-center justify-center gap-2 mb-3 text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <Info size={16} strokeWidth={2.5} />
                        <strong className="uppercase tracking-widest text-xs font-bold">Wichtiger Hinweis zu den Daten</strong>
                    </div>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                        Abgebildet werden ausschließlich <strong>namentliche Abstimmungen</strong>. Diese Auswahl zeigt nur einen Ausschnitt und kann ein verzerrtes Bild der Parlamentsarbeit zeichnen.
                        <span className="block mt-2 font-bold text-indigo-600 underline decoration-2 decoration-indigo-200 underline-offset-2">Mehr dazu lesen...</span>
                    </p>
                </div>
            </div>

            {/* Detailed Modal */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={
                    <div className="flex items-center gap-3 text-indigo-900 dark:text-indigo-100">
                        <AlertTriangle size={24} className="text-amber-500" strokeWidth={2.5} />
                        <span className="text-lg font-black uppercase tracking-wider">Daten & Kontext</span>
                    </div>
                }
                footer={
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                    >
                        Verstanden, danke!
                    </button>
                }
            >
                <div className="space-y-8">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-black">1</span>
                            Die Spitze des Eisbergs
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Der Bundestag entscheidet oft per Handzeichen. Diese alltäglichen Entscheidungen werden <strong>nicht namentlich erfasst</strong> und fehlen deshalb in dieser App. Du siehst hier ausschließlich <strong>namentliche Abstimmungen</strong> – das sind oft die politisch umstrittensten Themen, aber eben nur ein kleiner Teil der Arbeit.
                        </p>

                        <hr className="border-slate-100 dark:border-slate-800 my-6" />

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-black">2</span>
                            Vorsicht vor Verzerrung ("Bias")
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Da namentliche Abstimmungen extra beantragt werden müssen, nutzen Fraktionen (insbesondere aus der Opposition) dieses Instrument oft strategisch.
                        </p>
                        <ul className="text-sm space-y-2 mt-4 ml-1">
                            <li className="flex gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                <FileText size={18} className="shrink-0 text-slate-400 mt-0.5" />
                                <div>
                                    <strong className="block text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider mb-1">Der "Schaufensterantrag"</strong>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Oft geht es nicht darum, ein Gesetz zu verabschieden (weil man weiß, dass es abgelehnt wird), sondern darum, die anderen Parteien zu einer dokumentierten "Nein"-Stimme bei einem emotionalen Thema zu zwingen.
                                    </span>
                                </div>
                            </li>
                        </ul>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mt-4">
                            <strong>Das Resultat:</strong> Das Bild kann wirken, als ob Parteien "gegen alles" sind, obwohl sie vielleicht nur gegen die spezifische Formulierung des Antrags waren oder dem Antrag nicht zustimmen konnten, weil er von der "falschen" Seite kam.
                        </p>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 mt-6">
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 text-center">
                                <strong>Fazit:</strong> Diese App bietet spannende Einblicke, ist aber kein vollständiges Spiegelbild der gesamten parlamentarischen Arbeit.
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
