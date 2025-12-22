'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';
import { ResetDataButton } from './ResetDataButton';

export function Footer() {
    return (
        <div className="mt-16 text-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Datenquelle</p>
            <a href="https://www.abgeordnetenwatch.de" target="_blank" className="text-indigo-600 font-bold hover:underline block mb-8">
                Abgeordnetenwatch.de
            </a>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider mb-8">
                <Link href="/impressum" className="hover:text-slate-600">Impressum</Link>
                <Link href="/datenschutz" className="hover:text-slate-600">Datenschutz</Link>
                <a href="https://github.com/wolfgangstefani/checkvotes" target="_blank" className="hover:text-slate-600 flex items-center gap-2">
                    <Github size={14} />
                    <span>Open Source</span>
                </a>
                <Link href="https://www.wolfgegenlicht.de" className="hover:text-slate-600">Ein Projekt von wolfgegenlicht</Link>
            </div>
            <ResetDataButton />
        </div>
    );
}
