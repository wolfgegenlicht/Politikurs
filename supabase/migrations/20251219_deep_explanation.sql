-- Add column to store Deep Explanations (ELI15)
ALTER TABLE poll_questions 
ADD COLUMN deep_explanation TEXT;
