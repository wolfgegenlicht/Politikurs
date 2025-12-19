'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PollListItem } from './PollListItem';
import { mapTopicsToTheme, SimplifiedTheme, THEMES } from '@/lib/topicUtils';

interface PollListProps {
    polls: any[];
}

export function PollList({ polls }: PollListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read from URL or default to 'Alle'
    const activeTheme = (searchParams.get('topic') as SimplifiedTheme) || 'Alle';

    const handleThemeChange = (theme: SimplifiedTheme) => {
        const params = new URLSearchParams(searchParams.toString());
        if (theme === 'Alle') {
            params.delete('topic');
        } else {
            params.set('topic', theme);
        }

        // Update URL without full reload (scroll: false to keep position)
        router.replace(`/?${params.toString()}`, { scroll: false });
    };

    const filteredPolls = polls.filter(poll => {
        if (activeTheme === 'Alle') return true;
        const theme = mapTopicsToTheme(poll.topics || []);
        return theme === activeTheme;
    });

    return (
        <div className="space-y-8">
            {/* Filter Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Nach Themen filtern
                </h3>
                <div className="flex flex-wrap gap-2">
                    {THEMES.map((theme) => (
                        <button
                            key={theme}
                            onClick={() => handleThemeChange(theme)}
                            className={`
                                px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
                                ${activeTheme === theme
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                                    : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'}
                            `}
                        >
                            {theme}
                        </button>
                    ))}
                </div>
            </div>

            {/* Polls Stack */}
            <div className="space-y-8">
                {filteredPolls.length > 0 ? (
                    filteredPolls.map((poll) => (
                        <div id={`poll-${poll.id}`} key={poll.id} className="transform transition-all duration-300 hover:-translate-y-1">
                            <PollListItem poll={poll} />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-400 font-medium">Keine Abstimmungen zu diesem Thema gefunden.</p>
                        <button onClick={() => handleThemeChange('Alle')} className="mt-4 text-indigo-600 font-bold hover:underline">
                            Alle anzeigen
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
