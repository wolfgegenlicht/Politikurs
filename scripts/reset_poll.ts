import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetPoll(pollId: number) {
    console.log(`Clearing AI question cache for poll ${pollId}...`);

    const { error } = await supabase
        .from('poll_questions')
        .delete()
        .eq('poll_id', pollId);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! The question has been removed.');
        console.log('Please run the Sync API now to re-generate it with the new logical check.');
    }
}

resetPoll(6360);
