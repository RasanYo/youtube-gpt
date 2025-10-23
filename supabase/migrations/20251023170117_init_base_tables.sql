-- Drop existing tables and types if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TYPE IF EXISTS video_status CASCADE;

DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TYPE IF EXISTS video_status CASCADE;

-- Create VideoStatus enum
CREATE TYPE video_status AS ENUM ('QUEUED', 'PROCESSING', 'READY', 'FAILED');

-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT,
  thumbnail_url TEXT,
  channel_name TEXT,
  duration INTEGER DEFAULT 0,
  status video_status DEFAULT 'QUEUED',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for videos table
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON public.videos(youtube_id);

-- Create indexes for conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_videos_updated_at 
  BEFORE UPDATE ON public.videos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON public.conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for videos table
CREATE POLICY "Users can view their own videos" ON public.videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" ON public.videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON public.videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON public.videos
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for conversations table
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);
