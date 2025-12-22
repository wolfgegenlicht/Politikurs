const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectPoll() {
    const pollId = 6165;
    console.log(`Inspecting Poll ${pollId}...`);

    // 1. Fetch Poll & Question
    const { data: poll, error } = await supabase
        .from('polls')
        .select(`
            id, 
            label, 
            poll_questions (
                question, 
                vote_flip
            ),
            vote_results (
                fraction_label,
                votes_yes,
                votes_no,
                votes_abstain
            )
        `)
        .eq('id', pollId)
        .single();

    if (error) {
        console.error("Error:", error);
        return;
    }

    // 2. Output Data
    console.log("Poll Label:", poll.label);
    console.log("Questions:", JSON.stringify(poll.poll_questions, null, 2));

    // 3. Output All Party Results
    console.log("Party Results:");
    poll.vote_results.forEach(r => {
        console.log(`- ${r.fraction_label}: Yes=${r.votes_yes}, No=${r.votes_no}, Abstain=${r.votes_abstain}`);
    });


    // 4. Simulate Logic
    const question = Array.isArray(poll.poll_questions) ? poll.poll_questions[0] : poll.poll_questions;
    const voteFlip = question?.vote_flip || false;

    let originalVoteDirection = 'abstain';
    if (afdResult.votes_yes > afdResult.votes_no) originalVoteDirection = 'yes';
    else if (afdResult.votes_no > afdResult.votes_yes) originalVoteDirection = 'no';

    console.log("Original Vote Direction (Motion):", originalVoteDirection);
    console.log("Vote Flip Active:", voteFlip);

    let effectiveVote = originalVoteDirection;
    if (voteFlip) {
        if (originalVoteDirection === 'yes') effectiveVote = 'no';
        else if (originalVoteDirection === 'no') effectiveVote = 'yes';
    }

    console.log("Effective Vote (Question):", effectiveVote);
}

inspectPoll();
