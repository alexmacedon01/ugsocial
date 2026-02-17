-- ============================================
-- UGC FLOW — Initial Database Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

create type user_role as enum ('admin', 'client', 'creator');
create type project_status as enum (
  'draft',
  'brief_submitted',
  'ai_processing',
  'scripts_in_review',
  'scripts_approved',
  'creator_assigned',
  'creator_scripting',
  'script_review',
  'client_script_review',
  'filming',
  'video_uploaded',
  'video_in_review',
  'revision_requested',
  'video_approved',
  'delivered',
  'completed'
);
create type approval_status as enum ('pending', 'approved', 'revision_requested', 'rejected');
create type assignment_status as enum ('pending', 'accepted', 'declined', 'in_progress', 'completed');
create type availability_status as enum ('available', 'busy', 'unavailable');
create type script_type as enum ('ai_generated', 'creator_rewrite');
create type channel_type as enum ('project', 'direct', 'admin_client', 'admin_creator');

-- ============================================
-- 1. CREATE ALL TABLES FIRST (no cross-table RLS yet)
-- ============================================

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  role user_role not null default 'client',
  avatar_url text,
  company_name text,
  phone text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- CLIENT PROFILES
create table client_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null unique,
  brand_name text not null default '',
  industry text not null default '',
  brand_guidelines_url text,
  website text,
  target_demographics jsonb,
  target_psychographics jsonb,
  competitor_urls text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- CREATOR PROFILES
create table creator_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null unique,
  bio text,
  portfolio_url text,
  specializations text[] default '{}',
  languages text[] default '{"Deutsch"}',
  location text,
  rating numeric(3,2) default 0,
  total_projects int default 0,
  is_certified boolean default false,
  availability availability_status default 'available',
  hourly_rate numeric(10,2),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- PRODUCTS
create table products (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text not null default '',
  key_selling_points text[] default '{}',
  images text[] default '{}',
  price text,
  url text,
  created_at timestamptz default now() not null
);

-- PROJECTS
create table projects (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  status project_status default 'draft' not null,
  product_id uuid references products(id) on delete set null,
  campaign_objective text not null default '',
  platforms text[] default '{}',
  budget_tier text,
  num_videos int default 1,
  video_styles text[] default '{}',
  key_messaging text[] default '{}',
  dos text[] default '{}',
  donts text[] default '{}',
  reference_video_urls text[] default '{}',
  timeline text,
  deadline date,
  creator_preferences jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- PROJECT ASSIGNMENTS
create table project_assignments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  creator_id uuid references profiles(id) on delete cascade not null,
  assigned_by uuid references profiles(id) not null,
  status assignment_status default 'pending' not null,
  created_at timestamptz default now() not null,
  unique(project_id, creator_id)
);

-- SCRIPTS
create table scripts (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  assignment_id uuid references project_assignments(id) on delete set null,
  version int default 1,
  type script_type not null default 'ai_generated',
  hooks text[] default '{}',
  body text not null default '',
  cta_variations text[] default '{}',
  stage_directions text,
  broll_suggestions text[] default '{}',
  text_overlay_cues text[] default '{}',
  filming_instructions text,
  reasoning text,
  approval_status approval_status default 'pending' not null,
  approved_by uuid references profiles(id),
  feedback text,
  created_at timestamptz default now() not null
);

-- VIDEOS
create table videos (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  assignment_id uuid references project_assignments(id) on delete cascade not null,
  script_id uuid references scripts(id) on delete set null,
  video_url text not null,
  thumbnail_url text,
  duration int,
  version int default 1,
  is_final boolean default false,
  admin_approval_status approval_status default 'pending' not null,
  admin_feedback text,
  client_approval_status approval_status default 'pending' not null,
  client_feedback text,
  created_at timestamptz default now() not null
);

-- MESSAGES
create table messages (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade not null,
  recipient_id uuid references profiles(id) on delete cascade,
  channel channel_type not null default 'project',
  content text not null,
  attachments text[] default '{}',
  is_read boolean default false,
  created_at timestamptz default now() not null
);

-- ============================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================

alter table profiles enable row level security;
alter table client_profiles enable row level security;
alter table creator_profiles enable row level security;
alter table products enable row level security;
alter table projects enable row level security;
alter table project_assignments enable row level security;
alter table scripts enable row level security;
alter table videos enable row level security;
alter table messages enable row level security;

-- ============================================
-- 4. RLS POLICIES (all tables exist now)
-- ============================================

-- PROFILES
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- CLIENT PROFILES
create policy "Clients can view own client profile"
  on client_profiles for select using (user_id = auth.uid());

create policy "Admins can view all client profiles"
  on client_profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Clients can update own client profile"
  on client_profiles for update using (user_id = auth.uid());

create policy "Clients can insert own client profile"
  on client_profiles for insert with check (user_id = auth.uid());

-- CREATOR PROFILES
create policy "Creators can view own profile"
  on creator_profiles for select using (user_id = auth.uid());

create policy "Admins can view all creator profiles"
  on creator_profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Creators can update own profile"
  on creator_profiles for update using (user_id = auth.uid());

create policy "Creators can insert own profile"
  on creator_profiles for insert with check (user_id = auth.uid());

-- PRODUCTS
create policy "Clients can manage own products"
  on products for all using (client_id = auth.uid());

create policy "Admins can view all products"
  on products for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- PROJECTS
create policy "Clients can view own projects"
  on projects for select using (client_id = auth.uid());

create policy "Clients can insert own projects"
  on projects for insert with check (client_id = auth.uid());

create policy "Clients can update own projects"
  on projects for update using (client_id = auth.uid());

create policy "Admins can manage all projects"
  on projects for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Creators can view assigned projects"
  on projects for select using (
    exists (
      select 1 from project_assignments
      where project_assignments.project_id = projects.id
      and project_assignments.creator_id = auth.uid()
    )
  );

-- PROJECT ASSIGNMENTS
create policy "Admins can manage all assignments"
  on project_assignments for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Creators can view own assignments"
  on project_assignments for select using (creator_id = auth.uid());

create policy "Creators can update own assignments"
  on project_assignments for update using (creator_id = auth.uid());

create policy "Clients can view assignments for their projects"
  on project_assignments for select using (
    exists (
      select 1 from projects
      where projects.id = project_assignments.project_id
      and projects.client_id = auth.uid()
    )
  );

-- SCRIPTS
create policy "Admins can manage all scripts"
  on scripts for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Clients can view approved scripts for their projects"
  on scripts for select using (
    approval_status = 'approved' and
    exists (
      select 1 from projects
      where projects.id = scripts.project_id
      and projects.client_id = auth.uid()
    )
  );

create policy "Creators can view scripts for their assignments"
  on scripts for select using (
    exists (
      select 1 from project_assignments
      where project_assignments.project_id = scripts.project_id
      and project_assignments.creator_id = auth.uid()
    )
  );

create policy "Creators can insert scripts for their assignments"
  on scripts for insert with check (
    exists (
      select 1 from project_assignments
      where project_assignments.id = scripts.assignment_id
      and project_assignments.creator_id = auth.uid()
    )
  );

-- VIDEOS
create policy "Admins can manage all videos"
  on videos for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Clients can view approved videos for their projects"
  on videos for select using (
    admin_approval_status = 'approved' and
    exists (
      select 1 from projects
      where projects.id = videos.project_id
      and projects.client_id = auth.uid()
    )
  );

create policy "Creators can view own videos"
  on videos for select using (
    exists (
      select 1 from project_assignments
      where project_assignments.id = videos.assignment_id
      and project_assignments.creator_id = auth.uid()
    )
  );

create policy "Creators can insert videos for their assignments"
  on videos for insert with check (
    exists (
      select 1 from project_assignments
      where project_assignments.id = videos.assignment_id
      and project_assignments.creator_id = auth.uid()
    )
  );

-- MESSAGES
create policy "Users can view messages they sent or received"
  on messages for select using (
    sender_id = auth.uid() or recipient_id = auth.uid()
  );

create policy "Admins can view all messages"
  on messages for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert messages"
  on messages for insert with check (sender_id = auth.uid());

create policy "Users can update own messages read status"
  on messages for update using (recipient_id = auth.uid());

-- ============================================
-- 5. INDEXES
-- ============================================

create index idx_projects_client on projects(client_id);
create index idx_projects_status on projects(status);
create index idx_assignments_project on project_assignments(project_id);
create index idx_assignments_creator on project_assignments(creator_id);
create index idx_scripts_project on scripts(project_id);
create index idx_videos_project on videos(project_id);
create index idx_messages_project on messages(project_id);
create index idx_messages_sender on messages(sender_id);
create index idx_messages_recipient on messages(recipient_id);

-- ============================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

create trigger update_client_profiles_updated_at
  before update on client_profiles
  for each row execute procedure update_updated_at();

create trigger update_creator_profiles_updated_at
  before update on creator_profiles
  for each row execute procedure update_updated_at();

create trigger update_projects_updated_at
  before update on projects
  for each row execute procedure update_updated_at();
