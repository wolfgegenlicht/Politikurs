'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Vote, Target, User } from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <nav className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl shadow-indigo-500/20">
                <Link
                    href="/"
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-sm ${pathname === '/'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-105'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Vote size={18} />
                    <span>Voten</span>
                </Link>
                <Link
                    href="/matches"
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-sm ${pathname === '/matches'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-105'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Target size={18} />
                    <span>Matches</span>
                </Link>
            </nav>
        </div>
    );
}
