'use client';

import { PollListItem } from './PollListItem';

interface PollListProps {
    polls: any[];
}

export function PollList({ polls }: PollListProps) {
    return (
        <div className="space-y-8">
            {/* Polls Stack */}
            <div className="space-y-8">
                {polls.length > 0 ? (
                    polls.map((poll) => (
                        <div id={`poll-${poll.id}`} key={poll.id} className="transform transition-all duration-300 hover:-translate-y-1">
                            <PollListItem poll={poll} />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-400 font-medium">Keine Abstimmungen gefunden.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
