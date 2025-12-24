'use client';

import { useRouter } from 'next/navigation';
import { PollCard } from './PollCard';

// Define Interface locally or import (duplication to be safe from import errors)
// Interface Update
interface Poll {
    id: number;
    label: string;
    poll_date: string;
    accepted: boolean;
    poll_questions: {
        question: string;
        simplified_title?: string;
        explanation?: string;
        vote_flip?: boolean;
    } | {
        question: string;
        simplified_title?: string;
        explanation?: string;
        vote_flip?: boolean;
    }[] | null;
    related_links?: { label: string; url: string }[];
}

export function PollListItem({ poll }: { poll: Poll }) {
    const router = useRouter();

    // Helper to extract question data regardless of structure (Array vs Object)
    const questionData = Array.isArray(poll.poll_questions)
        ? poll.poll_questions[0]
        : poll.poll_questions;

    // Handler for saving vote (locally/temporarily)
    const handleVote = async (vote: 'yes' | 'no' | 'skip') => {
        try {
            await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollId: poll.id, vote })
            });
            // Kein Redirect mehr hier!
        } catch (e) {
            console.error("Vote failed", e);
        }
    };

    const handleDetailsClick = () => {
        router.push(`/poll/${poll.id}`);
    };

    return (
        <PollCard
            id={poll.id}
            question={questionData?.question || poll.label}
            label={poll.label}
            simplifiedTitle={questionData?.simplified_title || poll.label}
            explanation={questionData?.explanation}
            related_links={poll.related_links}
            date={poll.poll_date}
            accepted={poll.accepted}
            onVote={handleVote}
            onDetailsClick={handleDetailsClick}
        />
    );
}
