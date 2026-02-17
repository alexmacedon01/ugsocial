-- ============================================
-- UGC FLOW — Fix Auth Issues
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add INSERT policy for profiles (needed for fallback profile creation)
-- Drop if exists first to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Fix the auto-create profile trigger with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, that's fine
    RETURN new;
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 4. Add SELECT policy for profiles allowing users to select during insert
-- (needed for the dashboard layout to check if profile exists)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can select own profile for auth" ON profiles;
  CREATE POLICY "Users can select own profile for auth"
    ON profiles FOR SELECT
    USING (auth.uid() = id);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
