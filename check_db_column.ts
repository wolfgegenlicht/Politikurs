import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkColumn() {
    console.log("Checking DB schema...");
    const { data, error } = await supabase
        .from('poll_questions')
        .select('deep_explanation')
        .limit(1);

    if (error) {
        console.error("Column check failed (likely missing):", error.message);
        console.log("⚠️ Please run the migration: supabase/migrations/20251219_deep_explanation.sql");
    } else {
        console.log("✅ Column 'deep_explanation' exists!");
    }
}

checkColumn();
