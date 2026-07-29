CREATE TABLE entries (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('word', 'phrase')),
  kz TEXT NOT NULL,
  ru TEXT NOT NULL,
  example_kz TEXT DEFAULT '',
  example_ru TEXT DEFAULT '',
  category VARCHAR(20) NOT NULL DEFAULT 'general',
  difficulty INTEGER DEFAULT 0,
  source TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  entry_id INTEGER REFERENCES entries(id) ON DELETE CASCADE,
  knowledge_level INTEGER DEFAULT 0 CHECK (knowledge_level >= 0 AND knowledge_level <= 5),
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  review_status VARCHAR(20) DEFAULT 'new' CHECK (review_status IN ('new', 'learning', 'review', 'mastered')),
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

CREATE TABLE rule_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  rule_id TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'learned', 'review')),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, rule_id)
);

CREATE TABLE daily_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  correct INTEGER DEFAULT 0,
  wrong INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE TABLE streaks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own rule_progress"
  ON rule_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rule_progress"
  ON rule_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rule_progress"
  ON rule_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own daily_stats"
  ON daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_stats"
  ON daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_stats"
  ON daily_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW
  EXECUTE FUNCTION update_progress_updated_at();

CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_entry_id ON progress(entry_id);
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date);
