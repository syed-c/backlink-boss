-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  groq_api_key TEXT,
  notification_email BOOLEAN DEFAULT true,
  notification_failure BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Websites Table
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  wp_username TEXT NOT NULL,
  wp_app_password TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  heading_sheet_id TEXT,
  heading_sheet_name TEXT DEFAULT 'Headings',
  image_model TEXT DEFAULT 'gptimage',
  image_width INTEGER DEFAULT 1600,
  image_height INTEGER DEFAULT 900,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_websites_user_id ON websites(user_id);

-- Campaigns Table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  company_name TEXT NOT NULL,
  page_type TEXT NOT NULL,
  keyword_1 TEXT NOT NULL,
  keyword_2 TEXT NOT NULL,
  keyword_3 TEXT NOT NULL,
  keyword_4 TEXT NOT NULL,
  keyword_5 TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'stopped')),
  total_backlinks INTEGER DEFAULT 0,
  indexed_backlinks INTEGER DEFAULT 0,
  failed_backlinks INTEGER DEFAULT 0,
  csv_file_path TEXT,
  headings_file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_website_id ON campaigns(website_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Backlinks Table
CREATE TABLE backlinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
  indexed_blog_url TEXT,
  heading_generated TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  indexed_at TIMESTAMPTZ
);

CREATE INDEX idx_backlinks_campaign_id ON backlinks(campaign_id);
CREATE INDEX idx_backlinks_status ON backlinks(status);

-- Index History Table
CREATE TABLE index_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  indexed_url TEXT NOT NULL,
  backlinks_count INTEGER NOT NULL,
  content_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_user_id ON index_history(user_id);
CREATE INDEX idx_history_website_id ON index_history(website_id);
CREATE INDEX idx_history_created_at ON index_history(created_at DESC);

-- Used Headings Table
CREATE TABLE used_headings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, website_id, heading)
);

CREATE INDEX idx_used_headings_website_id ON used_headings(website_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_headings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for websites
CREATE POLICY "Users can view own websites" ON websites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own websites" ON websites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own websites" ON websites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites" ON websites
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for backlinks
CREATE POLICY "Users can view backlinks of own campaigns" ON backlinks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = backlinks.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert backlinks for own campaigns" ON backlinks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = backlinks.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update backlinks of own campaigns" ON backlinks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = backlinks.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- RLS Policies for index_history
CREATE POLICY "Users can view own history" ON index_history
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for used_headings
CREATE POLICY "Users can view own used headings" ON used_headings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own used headings" ON used_headings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for campaigns and backlinks
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE backlinks;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backlinks_updated_at BEFORE UPDATE ON backlinks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();