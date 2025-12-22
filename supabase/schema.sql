-- ============================================
-- 1. POLLS (Abstimmungen)
-- ============================================
CREATE TABLE IF NOT EXISTS polls (
  id INTEGER PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  poll_date DATE NOT NULL,
  accepted BOOLEAN,
  legislature_id INTEGER NOT NULL,
  abgeordnetenwatch_url TEXT,
  topics JSONB DEFAULT '[]',
  related_links JSONB DEFAULT '[]',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polls_date ON polls(poll_date DESC);
CREATE INDEX IF NOT EXISTS idx_polls_legislature ON polls(legislature_id);

-- ============================================
-- 2. AI-GENERIERTE FRAGEN (Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS poll_questions (
  poll_id INTEGER PRIMARY KEY REFERENCES polls(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  simplified_title TEXT,
  explanation TEXT,
  deep_explanation TEXT,
  vote_flip BOOLEAN DEFAULT false,
  arguments_pro JSONB DEFAULT '[]',
  arguments_contra JSONB DEFAULT '[]',
  stakeholders JSONB DEFAULT '[]',
  model_used TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ABSTIMMUNGSERGEBNISSE NACH PARTEI (Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS vote_results (
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  fraction_id INTEGER NOT NULL,
  fraction_label TEXT NOT NULL,
  votes_yes INTEGER DEFAULT 0,
  votes_no INTEGER DEFAULT 0,
  votes_abstain INTEGER DEFAULT 0,
  votes_no_show INTEGER DEFAULT 0,
  PRIMARY KEY (poll_id, fraction_id)
);

CREATE INDEX IF NOT EXISTS idx_vote_results_poll ON vote_results(poll_id);

-- ============================================
-- 4. USER VOTES (Anonymisiert mit Session)
-- ============================================
CREATE TABLE IF NOT EXISTS user_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  user_vote TEXT NOT NULL CHECK (user_vote IN ('yes', 'no')),
  session_id TEXT NOT NULL, -- Browser Fingerprint oder Cookie
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, session_id) -- Verhindert Mehrfach-Votes
);

CREATE INDEX IF NOT EXISTS idx_user_votes_poll ON user_votes(poll_id);

-- ============================================
-- 5. AGGREGIERTE USER-STATISTIKEN (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS user_vote_stats (
  poll_id INTEGER PRIMARY KEY REFERENCES polls(id) ON DELETE CASCADE,
  total_yes INTEGER DEFAULT 0,
  total_no INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger zum Aktualisieren der Stats
CREATE OR REPLACE FUNCTION update_user_vote_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_vote_stats (poll_id, total_yes, total_no)
  VALUES (
    NEW.poll_id,
    CASE WHEN NEW.user_vote = 'yes' THEN 1 ELSE 0 END,
    CASE WHEN NEW.user_vote = 'no' THEN 1 ELSE 0 END
  )
  ON CONFLICT (poll_id) DO UPDATE SET
    total_yes = user_vote_stats.total_yes + CASE WHEN NEW.user_vote = 'yes' THEN 1 ELSE 0 END,
    total_no = user_vote_stats.total_no + CASE WHEN NEW.user_vote = 'no' THEN 1 ELSE 0 END,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_vote_stats ON user_votes;
CREATE TRIGGER trigger_update_user_vote_stats
AFTER INSERT ON user_votes
FOR EACH ROW
EXECUTE FUNCTION update_user_vote_stats();
