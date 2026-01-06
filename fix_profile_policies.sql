-- Fix RLS policies for profiles to allow public read access for comment display names
-- This ensures comment authors' names are visible to all users

-- 1. Drop the restrictive policy if it exists (often named "Users can see their own profile")
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 2. Create a policy that allows everyone to READ profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING ( true );

-- 3. Ensure your UPDATE/DELETE policies remain restrictive (Security best practice)
-- Note: These policies should already exist, but ensuring they are correct
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING ( auth.uid() = id );

-- 4. Ensure INSERT policy exists for profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );