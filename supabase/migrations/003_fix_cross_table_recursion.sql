-- ============================================
-- UGC FLOW — Fix Cross-Table RLS Recursion
-- ROOT CAUSE: projects ↔ project_assignments circular policies
--   projects policy "Creators can view assigned projects" queries project_assignments
--   project_assignments policy "Clients can view assignments for their projects" queries projects
--   = INFINITE RECURSION
--
-- FIX: Use SECURITY DEFINER helper functions that bypass RLS
-- ============================================

-- ============================================
-- STEP 1: Drop ALL policies on affected tables
-- ============================================

-- PROJECTS
DROP POLICY IF EXISTS "Clients can view own projects" ON projects;
DROP POLICY IF EXISTS "Clients can insert own projects" ON projects;
DROP POLICY IF EXISTS "Clients can update own projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Creators can view assigned projects" ON projects;

-- PROJECT ASSIGNMENTS
DROP POLICY IF EXISTS "Admins can manage all assignments" ON project_assignments;
DROP POLICY IF EXISTS "Creators can view own assignments" ON project_assignments;
DROP POLICY IF EXISTS "Creators can update own assignments" ON project_assignments;
DROP POLICY IF EXISTS "Clients can view assignments for their projects" ON project_assignments;

-- SCRIPTS
DROP POLICY IF EXISTS "Admins can manage all scripts" ON scripts;
DROP POLICY IF EXISTS "Clients can view approved scripts for their projects" ON scripts;
DROP POLICY IF EXISTS "Creators can view scripts for their assignments" ON scripts;
DROP POLICY IF EXISTS "Creators can insert scripts for their assignments" ON scripts;

-- VIDEOS
DROP POLICY IF EXISTS "Admins can manage all videos" ON videos;
DROP POLICY IF EXISTS "Clients can view approved videos for their projects" ON videos;
DROP POLICY IF EXISTS "Creators can view own videos" ON videos;
DROP POLICY IF EXISTS "Creators can insert videos for their assignments" ON videos;


-- ============================================
-- STEP 2: Create SECURITY DEFINER helper functions
-- These bypass RLS, breaking the circular dependency
-- ============================================

-- Check if a user is the creator assigned to a project (bypasses project_assignments RLS)
CREATE OR REPLACE FUNCTION public.is_creator_of_project(p_project_id uuid, p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_assignments
    WHERE project_id = p_project_id
    AND creator_id = p_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if a user is the client (owner) of a project (bypasses projects RLS)
CREATE OR REPLACE FUNCTION public.is_client_of_project(p_project_id uuid, p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND client_id = p_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if a user is the creator of a specific assignment (bypasses project_assignments RLS)
CREATE OR REPLACE FUNCTION public.is_creator_of_assignment(p_assignment_id uuid, p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_assignments
    WHERE id = p_assignment_id
    AND creator_id = p_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================
-- STEP 3: Recreate ALL policies using helper functions (NO cross-table queries)
-- ============================================

-- === PROJECTS ===

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
  USING (public.get_my_role() = 'admin');

-- Uses SECURITY DEFINER function instead of direct subquery → no recursion
CREATE POLICY "Creators can view assigned projects"
  ON projects FOR SELECT
  USING (public.is_creator_of_project(id, auth.uid()));


-- === PROJECT ASSIGNMENTS ===

CREATE POLICY "Admins can manage all assignments"
  ON project_assignments FOR ALL
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Creators can view own assignments"
  ON project_assignments FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can update own assignments"
  ON project_assignments FOR UPDATE
  USING (creator_id = auth.uid());

-- Uses SECURITY DEFINER function instead of direct subquery → no recursion
CREATE POLICY "Clients can view assignments for their projects"
  ON project_assignments FOR SELECT
  USING (public.is_client_of_project(project_id, auth.uid()));


-- === SCRIPTS ===

CREATE POLICY "Admins can manage all scripts"
  ON scripts FOR ALL
  USING (public.get_my_role() = 'admin');

-- Uses SECURITY DEFINER function instead of direct subquery
CREATE POLICY "Clients can view approved scripts for their projects"
  ON scripts FOR SELECT
  USING (
    approval_status = 'approved'
    AND public.is_client_of_project(project_id, auth.uid())
  );

-- Uses SECURITY DEFINER function instead of direct subquery
CREATE POLICY "Creators can view scripts for their assignments"
  ON scripts FOR SELECT
  USING (public.is_creator_of_project(project_id, auth.uid()));

-- Uses SECURITY DEFINER function instead of direct subquery
CREATE POLICY "Creators can insert scripts for their assignments"
  ON scripts FOR INSERT
  WITH CHECK (public.is_creator_of_assignment(assignment_id, auth.uid()));


-- === VIDEOS ===

CREATE POLICY "Admins can manage all videos"
  ON videos FOR ALL
  USING (public.get_my_role() = 'admin');

-- Uses SECURITY DEFINER function instead of direct subquery
CREATE POLICY "Clients can view approved videos for their projects"
  ON videos FOR SELECT
  USING (
    admin_approval_status = 'approved'
    AND public.is_client_of_project(project_id, auth.uid())
  );

-- Uses SECURITY DEFINER function instead of direct subquery
CREATE POLICY "Creators can view own videos"
  ON videos FOR SELECT
  USING (public.is_creator_of_assignment(assignment_id, auth.uid()));

-- Uses SECURITY DEFINER function instead of direct subquery
CREATE POLICY "Creators can insert videos for their assignments"
  ON videos FOR INSERT
  WITH CHECK (public.is_creator_of_assignment(assignment_id, auth.uid()));
