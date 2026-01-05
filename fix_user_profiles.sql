-- Fix user profiles to use correct metadata field
-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create corrected trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update existing profiles that have NULL full_name
UPDATE profiles
SET full_name = auth.users.raw_user_meta_data->>'name'
FROM auth.users
WHERE profiles.id = auth.users.id
  AND profiles.full_name IS NULL
  AND auth.users.raw_user_meta_data->>'name' IS NOT NULL;

-- Create profiles for users who don't have them
INSERT INTO profiles (id, full_name, is_admin)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', 'User ' || substr(id::text, 1, 8)),
  false
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);

-- For users who signed up without providing name, set a default
UPDATE profiles
SET full_name = 'User ' || substr(id::text, 1, 8)
WHERE full_name IS NULL;