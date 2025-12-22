import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetPoll(pollId: number) {
    console.log(`Resetting AI question for Poll ${pollId}...`);

    // Delete question to trigger regeneration in sync
    const { error } = await supabase
        .from('poll_questions')
        .delete()
        .eq('poll_id', pollId);

    if (error) console.error('Error deleting:', error);
    else console.log('Successfully deleted existing question/explanation. Run sync to regenerate.');
}

resetPoll(6371);
