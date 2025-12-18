-- ============================================
-- 2. AI-GENERIERTE FRAGEN (Cache) - UPDATED
-- ============================================
-- Note: User should run this to add columns if table exists
ALTER TABLE poll_questions ADD COLUMN IF NOT EXISTS simplified_title TEXT;
ALTER TABLE poll_questions ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Original Schema below (for reference or new install)
CREATE TABLE IF NOT EXISTS poll_questions (
  poll_id INTEGER PRIMARY KEY REFERENCES polls(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  simplified_title TEXT, -- NEW
  explanation TEXT,      -- NEW
  model_used TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
