import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkColumns() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const checks = [
        { table: 'poll_questions', column: 'arguments_pro' },
        { table: 'poll_questions', column: 'arguments_contra' },
        { table: 'poll_questions', column: 'stakeholders' },
        { table: 'polls', column: 'related_links' },
    ];

    console.log("Checking DB schema for Decision Support columns...\n");

    for (const check of checks) {
        const { error } = await supabase
            .from(check.table)
            .select(check.column)
            .limit(1);

        if (error) {
            console.error(`❌ Column '${check.column}' in table '${check.table}' is MISSING.`);
            console.error(`   Error details: ${error.message}\n`);
        } else {
            console.log(`✅ Column '${check.column}' in table '${check.table}' exists.`);
        }
    }
}

checkColumns();
