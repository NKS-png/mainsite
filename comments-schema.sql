-- Comments table schema
-- Run this in your Supabase SQL editor

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id UUID REFERENCES auth.users(id) NOT NULL,
   content TEXT NOT NULL,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);