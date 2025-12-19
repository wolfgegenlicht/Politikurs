import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetAll() {
    console.log('⚠️  Clearing ALL AI questions, titles, and explanations...');

    // Delete all rows in poll_questions
    const { error, count } = await supabase
        .from('poll_questions')
        .delete()
        .gt('poll_id', 0); // Safety check to target all valid IDs

    if (error) {
        console.error('❌ Error deleting questions:', error.message);
    } else {
        console.log(`✅ Success! Cleared poll_questions.`);
        console.log(`🚀 Next Step: Run 'curl http://localhost:3000/api/sync-polls' to re-generate everything with the new logic.`);
    }
}

resetAll();
