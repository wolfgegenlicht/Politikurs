-- Migration to add Decision Support columns
-- Run this in the Supabase SQL Editor

ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS related_links JSONB DEFAULT '[]';

ALTER TABLE poll_questions 
ADD COLUMN IF NOT EXISTS arguments_pro JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS arguments_contra JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS stakeholders JSONB DEFAULT '[]';
