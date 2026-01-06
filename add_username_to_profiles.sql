-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.username IS 'Optional unique username for display purposes';