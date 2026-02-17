-- ============================================
-- UGC FLOW — Fix Infinite Recursion in RLS Policies
-- THE ROOT CAUSE: policies on "profiles" that query "profiles" = infinite loop
-- FIX: Use auth.jwt() to check role instead of querying profiles table
-- ============================================

-- ============================================
-- STEP 1: Drop ALL policies that cause recursion (querying profiles from other tables' policies)
-- ============================================

-- PROFILES policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can select own profile for auth" ON profiles;

-- CLIENT PROFILES policies
DROP POLICY IF EXISTS "Clients can view own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Admins can view all client profiles" ON client_profiles;
DROP POLICY IF EXISTS "Clients can update own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Clients can insert own client profile" ON client_profiles;

-- CREATOR PROFILES policies
DROP POLICY IF EXISTS "Creators can view own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Admins can view all creator profiles" ON creator_profiles;
DROP POLICY IF EXISTS "Creators can update own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Creators can insert own profile" ON creator_profiles;

-- PRODUCTS policies
DROP POLICY IF EXISTS "Clients can manage own products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;

-- PROJECTS policies
DROP POLICY IF EXISTS "Clients can view own projects" ON projects;
DROP POLICY IF EXISTS "Clients can insert own projects" ON projects;
DROP POLICY IF EXISTS "Clients can update own projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Creators can view assigned projects" ON projects;

-- ASSIGNMENTS policies
DROP POLICY IF EXISTS "Admins can manage all assignments" ON project_assignments;
DROP POLICY IF EXISTS "Creators can view own assignments" ON project_assignments;
DROP POLICY IF EXISTS "Creators can update own assignments" ON project_assignments;
DROP POLICY IF EXISTS "Clients can view assignments for their projects" ON project_assignments;

-- SCRIPTS policies
DROP POLICY IF EXISTS "Admins can manage all scripts" ON scripts;
DROP POLICY IF EXISTS "Clients can view approved scripts for their projects" ON scripts;
DROP POLICY IF EXISTS "Creators can view scripts for their assignments" ON scripts;
DROP POLICY IF EXISTS "Creators can insert scripts for their assignments" ON scripts;

-- VIDEOS policies
DROP POLICY IF EXISTS "Admins can manage all videos" ON videos;
DROP POLICY IF EXISTS "Clients can view approved videos for their projects" ON videos;
DROP POLICY IF EXISTS "Creators can view own videos" ON videos;
DROP POLICY IF EXISTS "Creators can insert videos for their assignments" ON videos;

-- MESSAGES policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages read status" ON messages;


-- ============================================
-- STEP 2: Helper function to get user role from JWT (avoids querying profiles)
-- ============================================

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'user_role', ''),
    (current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================
-- STEP 3: Recreate ALL RLS policies using auth.jwt() instead of subqueries on profiles
-- ============================================

-- PROFILES — simple, no recursion
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (auth.user_role() = 'admin');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- CLIENT PROFILES
CREATE POLICY "Clients can view own client profile"
  ON client_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all client profiles"
  ON client_profiles FOR SELECT
  USING (auth.user_role() = 'admin');

CREATE POLICY "Clients can update own client profile"
  ON client_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Clients can insert own client profile"
  ON client_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- CREATOR PROFILES
CREATE POLICY "Creators can view own creator profile"
  ON creator_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all creator profiles"
  ON creator_profiles FOR SELECT
  USING (auth.user_role() = 'admin');

CREATE POLICY "Creators can update own creator profile"
  ON creator_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Creators can insert own creator profile"
  ON creator_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- PRODUCTS
CREATE POLICY "Clients can manage own products"
  ON products FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (auth.user_role() = 'admin');


-- PROJECTS
CREATE POLICY "Clients can view own projects"
  ON projects FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own projects"
  ON projects FOR UPDATE
  USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all projects"
  ON projects FOR ALL
  USING (auth.user_role() = 'admin');

CREATE POLICY "Creators can view assigned projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_assignments.project_id = projects.id
      AND project_assignments.creator_id = auth.uid()
    )
  );


-- PROJECT ASSIGNMENTS
CREATE POLICY "Admins can manage all assignments"
  ON project_assignments FOR ALL
  USING (auth.user_role() = 'admin');

CREATE POLICY "Creators can view own assignments"
  ON project_assignments FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can update own assignments"
  ON project_assignments FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Clients can view assignments for their projects"
  ON project_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assignments.project_id
      AND projects.client_id = auth.uid()
    )
  );


-- SCRIPTS
CREATE POLICY "Admins can manage all scripts"
  ON scripts FOR ALL
  USING (auth.user_role() = 'admin');

CREATE POLICY "Clients can view approved scripts for their projects"
  ON scripts FOR SELECT
  USING (
    approval_status = 'approved' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = scripts.project_id
      AND projects.client_id = auth.uid()
    )
  );

CREATE POLICY "Creators can view scripts for their assignments"
  ON scripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_assignments.project_id = scripts.project_id
      AND project_assignments.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert scripts for their assignments"
  ON scripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_assignments.id = scripts.assignment_id
      AND project_assignments.creator_id = auth.uid()
    )
  );


-- VIDEOS
CREATE POLICY "Admins can manage all videos"
  ON videos FOR ALL
  USING (auth.user_role() = 'admin');

CREATE POLICY "Clients can view approved videos for their projects"
  ON videos FOR SELECT
  USING (
    admin_approval_status = 'approved' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = videos.project_id
      AND projects.client_id = auth.uid()
    )
  );

CREATE POLICY "Creators can view own videos"
  ON videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_assignments.id = videos.assignment_id
      AND project_assignments.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert videos for their assignments"
  ON videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_assignments.id = videos.assignment_id
      AND project_assignments.creator_id = auth.uid()
    )
  );


-- MESSAGES
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (auth.user_role() = 'admin');

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages read status"
  ON messages FOR UPDATE
  USING (recipient_id = auth.uid());


-- ============================================
-- STEP 4: Fix trigger with error handling
-- ============================================

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
    RETURN new;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
