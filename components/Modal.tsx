'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string | ReactNode;
    children: ReactNode;
    footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Optional: prevent focus trap or other accessibility helpers here
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-[32px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500 ease-out mx-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-10 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex-1">
                        {typeof title === 'string' ? (
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                {title}
                            </h3>
                        ) : title}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 -mr-3 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 rounded-full"
                        aria-label="Schließen"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar overscroll-contain">
                    <div className="max-w-prose mx-auto">
                        {children}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                    <div className="max-w-prose mx-auto w-full flex flex-col gap-4">
                        {footer || (
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-5 rounded-[24px] hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98] flex flex-col items-center justify-center group"
                            >
                                <span className="text-lg">Schließen</span>
                                <span className="text-[10px] opacity-50 font-bold uppercase tracking-[0.2em] mt-1 group-hover:opacity-100 transition-opacity">Zurück zur Übersicht</span>
                            </button>
                        )}

                        {/* Always show a subtle close option at the bottom if a custom footer is used */}
                        {footer && (
                            <button
                                onClick={onClose}
                                className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <span>Schließen</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
