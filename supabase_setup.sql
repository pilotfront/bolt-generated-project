-- Create the profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create policy for users to read all profiles
CREATE POLICY "Allow users to read all profiles" ON profiles
FOR SELECT
USING (TRUE);

-- Create the likes table
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  liked_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert likes
CREATE POLICY "Allow users to insert likes" ON likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to read their own likes
CREATE POLICY "Allow users to read their own likes" ON likes
FOR SELECT
USING (auth.uid() = user_id);

-- Create the matches table
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id),
  user2_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read matches where they are involved
CREATE POLICY "Allow users to read matches where they are involved" ON matches
FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create the messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  sender_id UUID REFERENCES auth.users(id),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert messages in their matches
CREATE POLICY "Allow users to insert messages in their matches" ON messages
FOR INSERT
WITH CHECK (sender_id = auth.uid() AND match_id IN (SELECT id FROM matches WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- Create policy for users to read messages in their matches
CREATE POLICY "Allow users to read messages in their matches" ON messages
FOR SELECT
USING (match_id IN (SELECT id FROM matches WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- Storage policies
-- Create a policy to allow users to upload their own avatars
CREATE POLICY "Allow users to upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK ((bucket_id = 'avatars'::text) AND (auth.uid() = uuid((regexp_match(name, 'avatars/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1])));

-- Create a policy to allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatars" ON storage.objects
FOR UPDATE USING ((bucket_id = 'avatars'::text) AND (auth.uid() = uuid((regexp_match(name, 'avatars/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1])));

-- Create a policy to allow users to read their own avatars
CREATE POLICY "Allow users to read their own avatars" ON storage.objects
FOR SELECT USING ((bucket_id = 'avatars'::text) AND (auth.uid() = uuid((regexp_match(name, 'avatars/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1])));
