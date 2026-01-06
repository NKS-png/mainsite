-- Check current state
SELECT 'Users in auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Users in profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Users with NULL full_name' as table_name, COUNT(*) as count FROM profiles WHERE full_name IS NULL;

-- Show users who don't have profiles
SELECT au.id, au.email, au.raw_user_meta_data->>'name' as meta_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create missing profiles
INSERT INTO profiles (id, full_name, is_admin)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', 'User ' || substr(au.id::text, 1, 8)),
  false
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles);

-- Update any profiles with NULL full_name
UPDATE profiles
SET full_name = 'User ' || substr(id::text, 1, 8)
WHERE full_name IS NULL;

-- Verify the fix
SELECT p.id, p.full_name, au.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 10;