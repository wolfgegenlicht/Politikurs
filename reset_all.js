const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAll() {
    console.log('⚠️  Starting FULL RESET of all synced content...');

    const contentTables = ['vote_results', 'poll_questions', 'user_vote_stats'];
    for (const table of contentTables) {
        console.log(`- Clearing table: ${table}...`);
        const { error } = await supabase.from(table).delete().neq('poll_id', -1);
        if (error) console.warn(`  ! Note/Error in ${table}: ${error.message}`);
    }

    console.log(`- Clearing table: polls...`);
    const { error: pollError } = await supabase.from('polls').delete().neq('id', -1);
    if (pollError) console.warn(`  ! Error in polls: ${pollError.message}`);

    console.log('\n✅ Database content cleared!');
    console.log('🚀 Next Step: Visit http://localhost:3000/api/sync-polls to re-sync everything.');
}

resetAll();
