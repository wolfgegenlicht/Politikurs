'use client';

interface VoteResult {
    fraction_id: number;
    fraction_label: string;
    votes_yes: number;
    votes_no: number;
    votes_abstain: number;
    votes_no_show: number;
}

interface UserStats {
    total_yes: number;
    total_no: number;
}

interface ResultsChartProps {
    results: VoteResult[];
    userStats?: UserStats;
    voteFlip?: boolean;
}

export function ResultsChart({ results, userStats, voteFlip = false }: ResultsChartProps) {
    const sortedResults = [...results].sort((a, b) =>
        a.fraction_label.localeCompare(b.fraction_label)
    );

    const partyColors: Record<string, string> = {
        'CDU/CSU': '#1e293b', // Slate-800
        'SPD': '#e11d48',     // Rose-600
        'AfD': '#0ea5e9',     // Sky-500
        'FDP': '#fbbf24',     // Amber-400
        'GRÜNEN': '#22c55e',  // Green-500
        'BÜNDNIS 90/DIE GRÜNEN': '#22c55e',
        'DIE LINKE': '#db2777', // Pink-600
        'BSW': '#be123c'      // Rose-700
    };

    function getPartyColor(label: string): string {
        for (const [key, color] of Object.entries(partyColors)) {
            if (label.includes(key)) return color;
        }
        return '#94a3b8'; // Slate-400
    }

    return (
        <div className="space-y-12">
            {/* User Statistics */}
            {userStats && (userStats.total_yes > 0 || userStats.total_no > 0) && (
                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>

                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 relative z-10">
                        Community-Trend
                    </h3>
                    <div className="flex items-center gap-12 relative z-10">
                        <div>
                            <div className="text-4xl font-black text-white mb-1">{userStats.total_yes}</div>
                            <div className="text-sm font-bold text-green-400 uppercase tracking-wider">Dafür</div>
                        </div>
                        <div className="h-12 w-px bg-slate-700"></div>
                        <div>
                            <div className="text-4xl font-black text-white mb-1">{userStats.total_no}</div>
                            <div className="text-sm font-bold text-red-400 uppercase tracking-wider">Dagegen</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Partei-Ergebnisse */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">
                    Bundestag-Ergebnisse
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {sortedResults.map((result) => {
                        const total = result.votes_yes + result.votes_no + result.votes_abstain;

                        // FLIP LOGIC:
                        // If voteFlip is true:
                        // - Original "Yes" (Parliament) -> displayed as "Dagegen" (Red)
                        // - Original "No" (Parliament) -> displayed as "Dafür" (Green)

                        const displayYes = voteFlip ? result.votes_no : result.votes_yes;
                        const displayNo = voteFlip ? result.votes_yes : result.votes_no;

                        const yesPercent = total > 0 ? (displayYes / total) * 100 : 0;
                        const noPercent = total > 0 ? (displayNo / total) * 100 : 0;
                        // Enthaltung als Rest
                        const abstainPercent = total > 0 ? (result.votes_abstain / total) * 100 : 0;

                        return (
                            <div key={result.fraction_id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getPartyColor(result.fraction_label) }}
                                    />
                                    <span className="font-bold text-slate-700 text-sm truncate">
                                        {result.fraction_label}
                                    </span>
                                </div>

                                {/* Minimal Progress Bar */}
                                <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden mb-3">
                                    <div className="bg-green-500" style={{ width: `${yesPercent}%` }} />
                                    <div className="bg-slate-300" style={{ width: `${abstainPercent}%` }} />
                                    <div className="bg-red-500" style={{ width: `${noPercent}%` }} />
                                </div>

                                <div className="flex justify-between text-xs font-semibold text-slate-400">
                                    <span className="text-green-600">{Math.round(yesPercent)}% Dafür</span>
                                    <span className="text-red-500">{Math.round(noPercent)}% Dagegen</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
