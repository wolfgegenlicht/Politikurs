'use client';

import { useRouter } from 'next/navigation';

export function BackButton({ currentPollId }: { currentPollId?: number }) {
    const router = useRouter();

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();

        // Check if there is history? 
        // Ideally router.back() goes to previous page (Home with filter).
        // If opened directly, it might go nowhere.
        if (window.history.length > 2) {
            router.back();
        } else {
            // Fallback if no history (e.g. direct link)
            const anchor = currentPollId ? `#poll-${currentPollId}` : '';
            router.push('/' + anchor);
        }
    };

    return (
        <button
            onClick={handleBack}
            className="inline-flex items-center text-slate-400 hover:text-slate-900 mb-8 transition-colors text-sm font-semibold tracking-wide uppercase"
        >
            <span className="mr-2">←</span> Zurück
        </button>
    );
}
