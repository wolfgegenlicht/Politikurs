-- Add vote_flip column to poll_questions table
ALTER TABLE public.poll_questions 
ADD COLUMN IF NOT EXISTS vote_flip boolean DEFAULT false;

COMMENT ON COLUMN public.poll_questions.vote_flip IS 'If true, the simplified question has inverted polarity compared to the original motion (e.g. motion was "Reject X", question is "Accept X?"). Frontend should swap Yes/No results.';
