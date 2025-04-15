/*
  # User Profiles Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `username` (text, unique)
      - `bio` (text)
      - `avatar_url` (text)
      - `level` (int)
      - `xp` (int)
      - `social_links` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for authenticated users to:
      - Read any user profile
      - Update their own profile
      - Insert their own profile
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  username text NOT NULL,
  bio text,
  avatar_url text,
  level int DEFAULT 1,
  xp int DEFAULT 0,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(username)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view any profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp_points int)
RETURNS int AS $$
DECLARE
  level_threshold int := 100; -- Base XP needed for level 2
  growth_factor float := 1.5; -- How much more XP is needed for each level
  current_level int := 1;
  current_threshold int := level_threshold;
BEGIN
  -- If XP is less than the first threshold, return level 1
  IF xp_points < level_threshold THEN
    RETURN current_level;
  END IF;
  
  -- Otherwise, keep calculating until we find the right level
  WHILE xp_points >= current_threshold LOOP
    current_level := current_level + 1;
    current_threshold := current_threshold + (level_threshold * power(growth_factor, current_level - 1)::int);
  END LOOP;
  
  RETURN current_level;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update level when XP changes
CREATE OR REPLACE FUNCTION update_level_from_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate the new level based on XP
  NEW.level := calculate_level(NEW.xp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_level
BEFORE INSERT OR UPDATE OF xp ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_level_from_xp();

-- Update achievement function to add XP to user profile
CREATE OR REPLACE FUNCTION add_xp_for_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- If achievement was just completed, add XP to user profile
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    -- Get the points from the achievement type
    DECLARE
      achievement_points int;
    BEGIN
      SELECT points INTO achievement_points
      FROM achievement_types
      WHERE id = NEW.achievement_type_id;
      
      -- Update the user's XP
      UPDATE user_profiles
      SET xp = xp + achievement_points
      WHERE user_id = NEW.user_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_xp_on_achievement_completion
AFTER INSERT OR UPDATE OF completed ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION add_xp_for_achievement();

-- Add function to get XP needed for next level
CREATE OR REPLACE FUNCTION xp_for_next_level(current_level int)
RETURNS int AS $$
DECLARE
  level_threshold int := 100; -- Base XP needed for level 2
  growth_factor float := 1.5; -- How much more XP is needed for each level
BEGIN
  RETURN (level_threshold * power(growth_factor, current_level - 1))::int;
END;
$$ LANGUAGE plpgsql;
