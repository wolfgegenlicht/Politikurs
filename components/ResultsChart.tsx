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
                            <div key={result.fraction_id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full shadow-sm"
                                            style={{ backgroundColor: getPartyColor(result.fraction_label) }}
                                        />
                                        <div>
                                            <span className="font-bold text-slate-800 text-base block">
                                                {result.fraction_label}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                                {total} Sitze
                                            </span>
                                        </div>
                                    </div>

                                    {/* Donut Chart */}
                                    <div className="relative w-16 h-16">
                                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                            {/* Background Circle */}
                                            <path
                                                className="text-slate-100"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            {/* Segments - calculated based on circumferences */}
                                            {(() => {
                                                const r = 15.9155;
                                                const c = 2 * Math.PI * r;

                                                // Values
                                                const GreenVal = yesPercent; // 0-100
                                                const RedVal = noPercent;
                                                const GreyVal = abstainPercent;

                                                // Offsets
                                                // Green starts at 0
                                                // Red starts after Green
                                                // Grey starts after Green + Red

                                                return (
                                                    <>
                                                        {/* Green Segment (Dafür) */}
                                                        {GreenVal > 0 && (
                                                            <path
                                                                className="text-green-500 transition-all duration-1000 ease-out"
                                                                strokeDasharray={`${GreenVal}, 100`}
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                        )}
                                                        {/* Red Segment (Dagegen) */}
                                                        {RedVal > 0 && (
                                                            <path
                                                                className="text-red-500 transition-all duration-1000 ease-out"
                                                                strokeDasharray={`${RedVal}, 100`}
                                                                strokeDashoffset={`-${GreenVal}`}
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                        )}
                                                        {/* Grey Segment (Enthaltung) */}
                                                        {GreyVal > 0 && (
                                                            <path
                                                                className="text-slate-300 transition-all duration-1000 ease-out"
                                                                strokeDasharray={`${GreyVal}, 100`}
                                                                strokeDashoffset={`-${GreenVal + RedVal}`}
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    </div>
                                </div>

                                {/* Detailed Stats Grid */}
                                <div className="space-y-3">
                                    {/* Dafür */}
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dafür</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-800">{Math.round(yesPercent)}%</div>
                                            <div className="text-xs text-slate-400 font-medium">{displayYes} Stimmen</div>
                                        </div>
                                    </div>

                                    {/* Dagegen */}
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dagegen</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-800">{Math.round(noPercent)}%</div>
                                            <div className="text-xs text-slate-400 font-medium">{displayNo} Stimmen</div>
                                        </div>
                                    </div>

                                    {/* Enthaltung (Nur anzeigen wenn > 0) */}
                                    {result.votes_abstain > 0 && (
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enthaltung</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-slate-400">{Math.round(abstainPercent)}%</div>
                                                <div className="text-xs text-slate-300 font-medium">{result.votes_abstain} Stimmen</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
