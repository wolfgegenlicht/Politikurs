-- Add originator column to poll_questions table
ALTER TABLE poll_questions 
ADD COLUMN IF NOT EXISTS originator TEXT;

-- Add helpful comment
COMMENT ON COLUMN poll_questions.originator IS 'The entity (fraction, government, etc.) that introduced the motion, extracted by AI.';
