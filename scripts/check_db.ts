import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkData() {
    console.log('Checking poll_questions table...');
    const { data: questions, error } = await supabase
        .from('poll_questions')
        .select('*, vote_flip')
        .in('poll_id', [6360, 6361, 6359]) // Russia, Nuclear, Draft checks
        .limit(5);

    if (error) {
        console.error('Error fetching questions:', error);
    } else {
        console.log(`Found ${questions?.length} rows in poll_questions.`);
        if (questions) {
            console.log(JSON.stringify(questions, null, 2));
        }
    }

    console.log('\nChecking polls table (first 3)...');
    const { data: polls } = await supabase.from('polls').select('id, label').limit(3);
    console.log(JSON.stringify(polls, null, 2));
}

checkData();
