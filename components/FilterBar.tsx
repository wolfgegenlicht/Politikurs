'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { THEMES } from '@/lib/topicUtils';

const PARTIES = [
    'SPD',
    'CDU/CSU',
    'Bündnis 90/Die Grünen',
    'FDP',
    'AfD',
    'Die Linke',
    'BSW',
    'Gruppe Die Linke',
    'Gruppe BSW'
];

export function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    const selectedParty = searchParams.get('party') || '';
    const selectedVote = searchParams.get('vote') || '';
    const selectedTopic = searchParams.get('topic') || '';

    const hasActiveFilter = selectedParty || selectedVote || selectedTopic;

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleChange = (key: string, value: string) => {
        const queryString = createQueryString(key, value);
        router.push(`/?${queryString}`);
    };

    const clearFilters = () => {
        router.push('/');
        setIsOpen(false);
    };

    return (
        <div className="mb-8 flex flex-col items-center">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all shadow-sm
                    ${hasActiveFilter
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                        : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}
                `}
            >
                <Filter size={18} />
                <span>Filter {hasActiveFilter ? '(Aktiv)' : ''}</span>
                {isOpen ? <X size={18} className="ml-1 opacity-50" /> : null}
            </button>

            {/* Collapsible Content */}
            {isOpen && (
                <div className="mt-4 w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-6 animate-in slide-in-from-top-2 fade-in duration-200">

                    {/* Topics Section */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-3">
                            Themen
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleChange('topic', '')}
                                className={`
                                    px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                    ${!selectedTopic
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                                `}
                            >
                                Alle
                            </button>
                            {THEMES.filter(t => t !== 'Alle').map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => handleChange('topic', selectedTopic === theme ? '' : theme)}
                                    className={`
                                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                        ${selectedTopic === theme
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'}
                                    `}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-6" />

                    {/* Party & Vote Section */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Party Select */}
                        <div className="flex-1">
                            <label htmlFor="party-select" className="block text-xs font-bold uppercase text-slate-400 mb-2">
                                Partei
                            </label>
                            <select
                                id="party-select"
                                value={selectedParty}
                                onChange={(e) => handleChange('party', e.target.value)}
                                className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                            >
                                <option value="">Alle Parteien</option>
                                {PARTIES.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Vote Direction Select */}
                        <div className="flex-1">
                            <label htmlFor="vote-select" className="block text-xs font-bold uppercase text-slate-400 mb-2">
                                Abstimmung
                            </label>
                            <select
                                id="vote-select"
                                value={selectedVote}
                                onChange={(e) => handleChange('vote', e.target.value)}
                                className={`w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer ${!selectedParty && selectedVote ? 'border-amber-300 bg-amber-50' : ''}`}
                            >
                                <option value="">Alle Abstimmungen</option>
                                <option value="yes">Hat "Dafür" gestimmt</option>
                                <option value="no">Hat "Dagegen" gestimmt</option>
                            </select>
                        </div>
                    </div>

                    {/* Hint / Actions */}
                    <div className="mt-6 flex items-center justify-between">
                        <div>
                            {!selectedParty && selectedVote && (
                                <p className="text-xs text-amber-600 font-medium animate-pulse">
                                    💡 Bitte wähle eine Partei.
                                </p>
                            )}
                        </div>

                        {hasActiveFilter && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1"
                            >
                                Filter zurücksetzen
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
