export interface PartyMatchResult {
    fraction_id: number;
    fraction_label: string;
    match_count: number;
    total_votes: number;
    percentage: number;
}

export function calculatePartyMatches(polls: any[], userVotes: Record<number, 'yes' | 'no' | 'skip'>): PartyMatchResult[] {
    const partyStats: Record<number, { label: string; matches: number; total: number }> = {};

    // For each poll the user voted on
    polls.forEach(poll => {
        const userVote = userVotes[poll.id];
        if (!userVote || userVote === 'skip') return;

        const questionData = Array.isArray(poll.poll_questions) ? poll.poll_questions[0] : poll.poll_questions;
        const voteFlip = questionData?.vote_flip || false;
        const results = poll.vote_results || [];

        // Check each party's majority in this poll
        results.forEach((r: any) => {
            if (!partyStats[r.fraction_id]) {
                partyStats[r.fraction_id] = { label: r.fraction_label, matches: 0, total: 0 };
            }

            const totalVotes = r.votes_yes + r.votes_no + r.votes_abstain;
            if (totalVotes === 0) return; // Party didn't participate

            // If majority of the party abstained, don't count it for matching
            if (r.votes_abstain > r.votes_yes && r.votes_abstain > r.votes_no) return;

            const partyMajority = r.votes_yes > r.votes_no ? 'yes' : 'no';
            if (r.votes_yes === r.votes_no) return; // Skip ties (too ambiguous for 'matching')

            // Agreement Logic (Sync with VoteMatchAnalysis.tsx)
            const matches = (userVote === 'yes' !== voteFlip) === (partyMajority === 'yes');

            if (matches) {
                partyStats[r.fraction_id].matches++;
            }
            partyStats[r.fraction_id].total++;

        });
    });

    // Convert to array and calculate percentage
    return Object.entries(partyStats)
        .map(([id, stats]) => ({
            fraction_id: parseInt(id),
            fraction_label: stats.label,
            match_count: stats.matches,
            total_votes: stats.total,
            percentage: stats.total > 0 ? Math.round((stats.matches / stats.total) * 100) : 0
        }))
        .filter(p => p.total_votes > 0)
        .sort((a, b) => b.percentage - a.percentage || b.total_votes - a.total_votes);
}
