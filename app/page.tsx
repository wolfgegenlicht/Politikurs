import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { PollCard } from '@/components/PollCard';
import { PollListItem } from '@/components/PollListItem';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Client wrapper for interactivity? No, we can use Server Actions or Client Component
// Let's keep Page as Server Component but make a client wrapper for the list?
// Or just iterate PollCards which are now Client Components.

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
  } | {
    question: string;
    simplified_title?: string;
    explanation?: string;
  }[] | null;
}

export const revalidate = 3600; // ISR: Revalidate every hour

export default async function HomePage() {
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
  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      id,
      label,
      poll_date,
      accepted,
      poll_questions (
        question,
        simplified_title,
        explanation
      )
    `)
    .order('poll_date', { ascending: false })
    .limit(20);



  if (error) {
    console.error('Error fetching polls:', error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500">Fehler beim Laden der Abstimmungen.</p>
        <p className="text-sm text-gray-500 mt-2">{error.message}</p>
      </div>
    );
  }

  if (!polls || polls.length === 0) {
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
            <div className="bg-white p-6 rounded-lg shadow-sm">
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
            BundesCheck
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Deine Meinung vs. Bundestag
          </p>
        </div>

        {/* Polls Stack */}
        <div className="space-y-8">
          {polls?.map((poll: Poll) => (
            <div id={`poll-${poll.id}`} key={poll.id} className="transform transition-all duration-300 hover:-translate-y-1">
              <PollListItem poll={poll} />
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Datenquelle</p>
          <a href="https://www.abgeordnetenwatch.de" target="_blank" className="text-indigo-600 font-bold hover:underline">
            Abgeordnetenwatch.de
          </a>
        </div>
      </div>
    </div>
  );
}
