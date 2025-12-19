'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { getPartyColor } from '@/lib/partyUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

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
    // Removed local partyColors definition

    // --- AGGREGATION LOGIC ---
    let totalYes = 0;
    let totalNo = 0;
    let totalAbstain = 0;
    let totalNoShow = 0;

    // Breakdown maps: Category index -> [{ party: string, count: number }]
    // 0: Yes, 1: No, 2: Abstain, 3: NoShow
    const breakdowns: Record<number, { party: string; count: number }[]> = {
        0: [], 1: [], 2: [], 3: []
    };

    sortedResults.forEach(r => {
        // Vote Flip: "Yes" in DB became "No" in meaning, etc.
        const yesCount = voteFlip ? r.votes_no : r.votes_yes;
        const noCount = voteFlip ? r.votes_yes : r.votes_no;
        const abstainCount = r.votes_abstain;
        const noShowCount = r.votes_no_show;

        totalYes += yesCount;
        totalNo += noCount;
        totalAbstain += abstainCount;
        totalNoShow += noShowCount;

        if (yesCount > 0) breakdowns[0].push({ party: r.fraction_label, count: yesCount });
        if (noCount > 0) breakdowns[1].push({ party: r.fraction_label, count: noCount });
        if (abstainCount > 0) breakdowns[2].push({ party: r.fraction_label, count: abstainCount });
        if (noShowCount > 0) breakdowns[3].push({ party: r.fraction_label, count: noShowCount });
    });

    // Sort breakdowns by count desc
    Object.values(breakdowns).forEach(list => list.sort((a, b) => b.count - a.count));

    const totalVotes = totalYes + totalNo + totalAbstain + totalNoShow;

    const chartData = {
        labels: ['Dafür', 'Dagegen', 'Enthaltung', 'Nicht beteiligt'],
        datasets: [
            {
                data: [totalYes, totalNo, totalAbstain, totalNoShow],
                backgroundColor: [
                    '#22c55e', // Green-500
                    '#ef4444', // Red-500
                    '#94a3b8', // Slate-400
                    '#e2e8f0', // Slate-200
                ],
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    const chartOptions = {
        cutout: '75%',
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate-900
                padding: 16,
                titleFont: {
                    family: 'inherit',
                    size: 16,
                    weight: 'bold' as const
                },
                bodyFont: {
                    family: 'inherit',
                    size: 13
                },
                cornerRadius: 16,
                displayColors: true,
                callbacks: {
                    label: function (context: any) {
                        return ''; // Hide default label
                    },
                    afterBody: function (context: any) {
                        const index = context[0].dataIndex; // 0=Yes, 1=No...
                        const breakdown = breakdowns[index];

                        if (!breakdown || breakdown.length === 0) return ['Keine Stimmen'];

                        return breakdown.map(item => ` ${item.party}: ${item.count}`); // Simple list
                    }
                }
            }
        },
        maintainAspectRatio: false,
    };

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

            {/* Global Aggregated Pie Chart */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-8 tracking-tight text-center">
                    Gesamtergebnis
                </h3>
                <div className="flex flex-col items-center justify-center gap-12">

                    {/* Pie Chart */}
                    <div className="relative w-72 h-72 flex-shrink-0 isolate">
                        <div className="absolute inset-0 flex flex-col items-center justify-center -z-10">
                            <span className="text-4xl font-black text-slate-900">
                                {totalVotes}
                            </span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Stimmen</span>
                        </div>
                        <div className="relative z-10 w-full h-full">
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Custom Legend for Categories */}
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                        {/* Yes */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-bold text-green-700 text-sm">Dafür ({totalYes})</span>
                        </div>
                        {/* No */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-100">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="font-bold text-red-700 text-sm">Dagegen ({totalNo})</span>
                        </div>
                        {/* Abstain */}
                        {totalAbstain > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                <span className="font-bold text-slate-600 text-sm">Enth. ({totalAbstain})</span>
                            </div>
                        )}
                        {/* No Show */}
                        {totalNoShow > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                <span className="font-bold text-slate-400 text-sm">Nicht bet. ({totalNoShow})</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Party Breakdown Grid */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">
                    Details nach Fraktion
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {sortedResults.map((result) => {
                        const total = result.votes_yes + result.votes_no + result.votes_abstain + result.votes_no_show;

                        // FLIP LOGIC:
                        const displayYes = voteFlip ? result.votes_no : result.votes_yes;
                        const displayNo = voteFlip ? result.votes_yes : result.votes_no;

                        const yesPercent = total > 0 ? (displayYes / total) * 100 : 0;
                        const noPercent = total > 0 ? (displayNo / total) * 100 : 0;
                        const abstainPercent = total > 0 ? (result.votes_abstain / total) * 100 : 0;
                        const noShowPercent = total > 0 ? (result.votes_no_show / total) * 100 : 0;

                        return (
                            <div key={result.fraction_id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-[16px] h-[16px] rounded-full shrink-0"
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
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enthaltung</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-slate-500">{Math.round(abstainPercent)}%</div>
                                                <div className="text-xs text-slate-400 font-medium">{result.votes_abstain} Stimmen</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Nicht beteiligt (Nur anzeigen wenn > 0) */}
                                    {result.votes_no_show > 0 && (
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nicht bet.</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-slate-300">{Math.round(noShowPercent)}%</div>
                                                <div className="text-xs text-slate-300 font-medium">{result.votes_no_show} Stimmen</div>
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
