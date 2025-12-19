'use client';

import Link from 'next/link';
import { ResetDataButton } from './ResetDataButton';

export function Footer() {
    return (
        <div className="mt-16 text-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Datenquelle</p>
            <a href="https://www.abgeordnetenwatch.de" target="_blank" className="text-indigo-600 font-bold hover:underline block mb-8">
                Abgeordnetenwatch.de
            </a>

            <div className="flex justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider mb-8">
                <Link href="/impressum" className="hover:text-slate-600">Impressum</Link>
                <Link href="/datenschutz" className="hover:text-slate-600">Datenschutz</Link>
                <Link href="https://www.wolfgegenlicht.de" className="hover:text-slate-600">Ein Projekt von wolfgegenlicht</Link>
            </div>
            <ResetDataButton />
        </div>
    );
}
