-- Add JSONB column for storing raw topics from API
ALTER TABLE polls 
ADD COLUMN topics JSONB DEFAULT '[]'::jsonb;
