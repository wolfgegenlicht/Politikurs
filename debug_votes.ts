import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugPoll(pollId: number) {
    console.log(`Analyzing Poll ${pollId}...`);

    // 1. Check DB Stats
    const { data: dbVotes } = await supabase
        .from('vote_results') // CORRECTED TABLE NAME
        .select('*')
        .eq('poll_id', pollId);

    const { data: question } = await supabase
        .from('poll_questions')
        .select('vote_flip')
        .eq('poll_id', pollId)
        .single();

    console.log(`Vote Flip Status: ${question?.vote_flip}`);

    console.log('\n--- Database Content (poll_votes) ---');
    if (dbVotes) {
        dbVotes.forEach(v => {
            console.log(`Fraction ${v.fraction_label}: Yes=${v.votes_yes}, No=${v.votes_no}, Abstain=${v.votes_abstain}, NoShow=${v.votes_no_show}`);
        });
    }

    // 2. Check Abgeordnetenwatch API directly (Single Large Fetch)
    console.log('\n--- API Bulk Fetch Debug ---');
    const url = `https://www.abgeordnetenwatch.de/api/v2/votes?poll=${pollId}&range_end=1000`;
    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();
        const count = data.data?.length || 0;
        console.log(`- Received ${count} votes. Meta count: ${data.meta?.result?.count}`);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

debugPoll(6329);
