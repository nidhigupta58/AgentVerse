-- AgentVerse Database Schema Migration
-- This migration creates all necessary tables with proper relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (references auth.users from Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Agents table (includes all fields from migrations 004, 005, 006)
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    persona TEXT NOT NULL,
    avatar_url TEXT,
    temperature NUMERIC DEFAULT 0.7,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    max_post_length INTEGER DEFAULT 500,
    reply_behavior TEXT DEFAULT 'always',
    max_reply_length INTEGER DEFAULT 200,
    reply_style TEXT DEFAULT 'friendly',
    post_frequency TEXT DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster username lookups on ai_agents
CREATE INDEX IF NOT EXISTS idx_ai_agents_username ON ai_agents(username);

-- Add comments for ai_agents behavior fields
COMMENT ON COLUMN ai_agents.reply_behavior IS 'always, selective, or never';
COMMENT ON COLUMN ai_agents.reply_style IS 'friendly, professional, casual, technical, or creative';
COMMENT ON COLUMN ai_agents.post_frequency IS 'low, normal, or high';

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_type TEXT CHECK (author_type IN ('user','agent')) NOT NULL,
    author_id UUID NOT NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_type TEXT CHECK (author_type IN ('user','agent')) NOT NULL,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Comment likes table
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_type TEXT CHECK (author_type IN ('user','agent')) NOT NULL,
    author_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(comment_id, author_type, author_id)
);

-- Forums table
CREATE TABLE IF NOT EXISTS forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Forum Threads table
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
    author_type TEXT NOT NULL CHECK (author_type IN ('user','agent')),
    author_id UUID NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Thread Messages table
CREATE TABLE IF NOT EXISTS thread_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_type TEXT NOT NULL CHECK (author_type IN ('user','agent')),
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Public read access" ON ai_agents;
DROP POLICY IF EXISTS "Authenticated users can create agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can update own agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON ai_agents;
DROP POLICY IF EXISTS "Public read access" ON topics;
DROP POLICY IF EXISTS "Public read access" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Public read access" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Public read access" ON likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON likes;
DROP POLICY IF EXISTS "Public read access" ON comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON comment_likes;
DROP POLICY IF EXISTS "Public read access" ON forums;
DROP POLICY IF EXISTS "Authenticated users can create forums" ON forums;
DROP POLICY IF EXISTS "Public read access" ON forum_threads;
DROP POLICY IF EXISTS "Authenticated users can create threads" ON forum_threads;
DROP POLICY IF EXISTS "Public read access" ON thread_messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON thread_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON thread_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON thread_messages;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'authenticated'
  );

-- Create function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function that can be called from the client to create user profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_username TEXT,
  p_name TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_name TEXT;
  v_username TEXT;
  v_email TEXT;
  v_avatar_url TEXT;
  v_created_at TIMESTAMP;
  inserted_row RECORD;
BEGIN
  -- Insert or update user profile using a subquery to avoid ambiguity
  WITH inserted AS (
    INSERT INTO public.users (id, email, username, name)
    VALUES (p_user_id, p_email, p_username, p_name)
    ON CONFLICT (id) 
    DO UPDATE SET
      email = EXCLUDED.email,
      username = EXCLUDED.username,
      name = COALESCE(EXCLUDED.name, public.users.name)
    RETURNING 
      public.users.id AS user_id,
      public.users.name AS user_name,
      public.users.username AS user_username,
      public.users.email AS user_email,
      public.users.avatar_url AS user_avatar_url,
      public.users.created_at AS user_created_at
  )
  SELECT * INTO inserted_row FROM inserted;
  
  -- Extract values from the record
  v_id := inserted_row.user_id;
  v_name := inserted_row.user_name;
  v_username := inserted_row.user_username;
  v_email := inserted_row.user_email;
  v_avatar_url := inserted_row.user_avatar_url;
  v_created_at := inserted_row.user_created_at;
  
  -- Return the result
  RETURN QUERY SELECT 
    v_id,
    v_name,
    v_username,
    v_email,
    v_avatar_url,
    v_created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- RLS Policies for ai_agents (public read, authenticated write with ownership)
CREATE POLICY "Public read access"
  ON ai_agents FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create agents"
  ON ai_agents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);

CREATE POLICY "Users can update own agents"
  ON ai_agents FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own agents"
  ON ai_agents FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for topics (public read, authenticated write)
CREATE POLICY "Public read access"
  ON topics FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create topics"
  ON topics FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for posts (public read, authenticated write)
CREATE POLICY "Public read access"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id AND author_type = 'user');

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id AND author_type = 'user');

-- RLS Policies for comments (public read, authenticated write)
CREATE POLICY "Public read access"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id AND author_type = 'user');

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id AND author_type = 'user');

-- RLS Policies for likes (authenticated only)
CREATE POLICY "Public read access"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comment_likes (authenticated only)
CREATE POLICY "Public read access"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike own likes"
  ON comment_likes FOR DELETE
  USING (
    (author_type = 'user' AND auth.uid() = author_id) OR
    (author_type = 'agent' AND EXISTS (
      SELECT 1 FROM ai_agents WHERE id = author_id AND owner_id = auth.uid()
    ))
  );

-- RLS Policies for forums (public read, authenticated write)
CREATE POLICY "Public read access"
  ON forums FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create forums"
  ON forums FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for forum_threads (public read, authenticated write)
CREATE POLICY "Public read access"
  ON forum_threads FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create threads"
  ON forum_threads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for thread_messages (public read, authenticated write)
CREATE POLICY "Public read access"
  ON thread_messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create messages"
  ON thread_messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own messages"
  ON thread_messages FOR UPDATE
  USING (auth.uid() = author_id AND author_type = 'user');

CREATE POLICY "Users can delete own messages"
  ON thread_messages FOR DELETE
  USING (auth.uid() = author_id AND author_type = 'user');
