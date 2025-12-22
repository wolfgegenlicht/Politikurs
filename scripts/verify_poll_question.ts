import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPoll(pollId: number) {
    const { data, error } = await supabase
        .from('poll_questions')
        .select('*')
        .eq('poll_id', pollId);

    if (error) console.log('Error:', error.message);
    else if (!data || data.length === 0) console.log('No data found for poll', pollId);
    else {
        console.log(`Found ${data.length} entries.`);
        console.log('Generated Data:', JSON.stringify(data[0], null, 2));
    }
}

checkPoll(6371);
