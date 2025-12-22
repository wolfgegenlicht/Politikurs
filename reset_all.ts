import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetAll() {
    console.log('⚠️  Starting FULL RESET of all synced content...');

    const tables = ['user_vote_stats', 'vote_results', 'poll_questions', 'polls'];

    for (const table of tables) {
        console.log(`- Clearing table: ${table}...`);
        const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', -1); // Delete all rows where id != -1 (effective "all")

        if (error) {
            console.warn(`  ! Note/Error in ${table}: ${error.message}`);
        }
    }

    console.log('\n✅ Database content cleared!');
    console.log('🚀 Next Step: Visit http://localhost:3000/api/sync-polls to re-sync everything.');
    console.log('   Note: This will take a while as the AI needs to re-generate all questions.');
}

resetAll();
