'use client';

import { useRouter } from 'next/navigation';
import { PollCard } from './PollCard';

// Define Interface locally or import (duplication to be safe from import errors)
interface Poll {
    id: number;
    label: string;
    poll_date: string;
    accepted: boolean;
    poll_questions: {
        question: string;
        simplified_title?: string;
        explanation?: string;
    }[] | null;
}

export function PollListItem({ poll }: { poll: Poll }) {
    const router = useRouter();

    // Handler for saving vote (locally/temporarily) and redirecting
    const handleVote = async (vote: 'yes' | 'no') => {
        // Opt: Save vote via API here, or just redirect and let Detail page handle it?
        // User said "After I said 'dafür' or 'dagegen' I'll get redirected to the page, where i can see the details."
        // Let's call the API to save the vote first, then redirect.

        try {
            await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollId: poll.id, vote })
            });

            router.push(`/poll/${poll.id}`);
        } catch (e) {
            console.error("Vote failed, redirecting anyway", e);
            router.push(`/poll/${poll.id}`);
        }
    };

    return (
        <PollCard
            question={poll.poll_questions?.[0]?.question || poll.label}
            label={poll.label}
            simplifiedTitle={poll.poll_questions?.[0]?.simplified_title || poll.label} // Fallback to label if simplified title is missing
            explanation={poll.poll_questions?.[0]?.explanation}
            date={poll.poll_date}
            accepted={poll.accepted}
            onVote={handleVote}
        />
    );
}
