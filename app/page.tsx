import { createClient } from '@supabase/supabase-js';
import React from 'react';
import Link from 'next/link';
import { PollCard } from '@/components/PollCard';
import { PollListItem } from '../components/PollListItem';
import { PollList } from '@/components/PollList';
import { Footer } from '@/components/Footer';
import { FilterBar } from '@/components/FilterBar';
import { mapTopicsToTheme } from '@/lib/topicUtils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bundestag Abstimmungen - PolitiKurs',
  description: 'Durchsuche aktuelle Abstimmungen des Bundestages, übersetzt in einfache Sprache. Finde heraus, welche Partei deine Interessen vertritt.',
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 60; // ISR: Revalidate every minute

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Check for placeholder credentials to avoid build errors
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Setup Required</h1>
          <p className="text-gray-600 mb-6">
            The application is not yet connected to Supabase.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              Please update <code className="font-bold">.env.local</code> with your actual Supabase URL and Keys.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            See the README or walkthrough for details.
          </p>
        </div>
      </div>
    );
  }

  // Lade Polls mit generierten Fragen AND simplified titles
  const { data: rawPolls, error } = await supabase
    .from('polls')
    .select('id, label, description, poll_date, accepted, poll_questions!inner(*), vote_results(*), topics')
    .order('poll_date', { ascending: false })
    .limit(100); // Increased limit as we are filtering



  if (error) {
    console.error('Error fetching polls:', error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500">Fehler beim Laden der Abstimmungen.</p>
        <p className="text-sm text-gray-500 mt-2">{error.message}</p>
      </div>
    );
  }

  let polls = rawPolls || [];

  // --- FILTER LOGIC ---
  const filterParty = typeof params.party === 'string' ? params.party : '';
  const filterVote = typeof params.vote === 'string' ? params.vote : '';
  const filterTopic = typeof params.topic === 'string' ? params.topic : '';

  if (filterParty || filterVote || filterTopic) {
    polls = polls.filter((poll) => {
      let matchesTopic = true;
      let matchesPartyVote = true;

      // 1. Topic Filter
      if (filterTopic && filterTopic !== 'Alle') {
        const theme = mapTopicsToTheme(poll.topics || []);
        matchesTopic = theme === filterTopic;
      }

      // 2. Party & Vote Filter
      if (filterParty) {
        // Find the generated question to get vote_flip
        const rawQuestions = poll.poll_questions;
        const question = Array.isArray(rawQuestions) ? rawQuestions[0] : rawQuestions;
        const voteFlip = question?.vote_flip || false;

        // Find the party's vote results
        const partyResult = poll.vote_results.find((r: any) => {
          const label = (r.fraction_label || '').toLowerCase();
          const target = filterParty.toLowerCase();
          return label.includes(target) || (target === 'cdu/csu' && label.includes('cdu'));
        });

        if (!partyResult) {
          matchesPartyVote = false;
        } else {
          // Determine Party's Majority Vote
          const yes = partyResult.votes_yes || 0;
          const no = partyResult.votes_no || 0;

          let originalVoteDirection = 'abstain';
          if (yes > no) originalVoteDirection = 'yes';
          else if (no > yes) originalVoteDirection = 'no';

          // Calculate Effective Vote
          let effectiveVote = originalVoteDirection;
          if (voteFlip) {
            if (originalVoteDirection === 'yes') effectiveVote = 'no';
            else if (originalVoteDirection === 'no') effectiveVote = 'yes';
          }

          // Compare vote if filterVote is set
          if (filterVote) {
            matchesPartyVote = effectiveVote === filterVote;
          } else {
            // If only party is selected, we show all polls where party voted (which is checked by partyResult existence)
            matchesPartyVote = true;
          }
        }
      } else if (filterVote) {
        // Vote selected but no Party? Implementation choice: Ignore or require Party.
        // Current UI requires Party to enable Vote dropdown.
        // But if manually set in URL? Let's ignore Vote filter if no Party is set.
        matchesPartyVote = true;
      }

      return matchesTopic && matchesPartyVote;
    });
  }

  if (polls.length === 0 && (!rawPolls || rawPolls.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🗳️ Bundestag: Wie hättest du abgestimmt?
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Teste deine politische Meinung zu echten Bundestagsabstimmungen
            </p>
            <div className="bg-white p-6 rounded-lg ">
              <p className="text-gray-500">
                Noch keine Abstimmungen geladen. Bitte synchronisiere die Daten.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                (API Route /api/sync-polls aufrufen)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl shadow-xl shadow-indigo-500/20 mb-6 rotate-3 hover:rotate-6 transition-transform">
            <span className="text-3xl">🗳️</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            PolitiKurs
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Wie hättest du im Bundestag entschieden?
          </p>
        </div>

        <React.Suspense fallback={<div className="h-16 flex items-center justify-center">Lade Filter...</div>}>
          <FilterBar />
        </React.Suspense>

        {/* Polls Stack */}
        <div className="space-y-8">
          <React.Suspense fallback={<div className="text-center p-8">Lade Abstimmungen...</div>}>
            <PollList polls={polls || []} />
          </React.Suspense>
        </div>

        {/* Footer Info */}
        <Footer />
      </div>
    </div>
  );
}
