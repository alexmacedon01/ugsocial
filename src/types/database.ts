export type UserRole = 'admin' | 'client' | 'creator';

export type ProjectStatus =
  | 'draft'
  | 'brief_submitted'
  | 'ai_processing'
  | 'scripts_in_review'
  | 'scripts_approved'
  | 'creator_assigned'
  | 'creator_scripting'
  | 'script_review'
  | 'client_script_review'
  | 'filming'
  | 'video_uploaded'
  | 'video_in_review'
  | 'revision_requested'
  | 'video_approved'
  | 'delivered'
  | 'completed';

export type ApprovalStatus = 'pending' | 'approved' | 'revision_requested' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  brand_name: string;
  industry: string;
  brand_guidelines_url: string | null;
  website: string | null;
  target_demographics: Record<string, unknown> | null;
  target_psychographics: Record<string, unknown> | null;
  competitor_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  portfolio_url: string | null;
  specializations: string[];
  languages: string[];
  location: string | null;
  rating: number;
  total_projects: number;
  is_certified: boolean;
  availability_status: 'available' | 'busy' | 'unavailable';
  hourly_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  client_id: string;
  name: string;
  description: string;
  key_selling_points: string[];
  images: string[];
  price: string | null;
  url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  status: ProjectStatus;
  product_id: string | null;
  campaign_objective: string;
  platforms: string[];
  budget_tier: string | null;
  num_videos: number;
  video_styles: string[];
  key_messaging: string[];
  dos: string[];
  donts: string[];
  reference_video_urls: string[];
  timeline: string | null;
  deadline: string | null;
  creator_preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  creator_id: string;
  assigned_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  created_at: string;
}

export interface Script {
  id: string;
  project_id: string;
  assignment_id: string | null;
  version: number;
  script_type: 'ai_generated' | 'creator_rewrite';
  hooks: string[];
  body: string;
  cta_variations: string[];
  stage_directions: string | null;
  broll_suggestions: string[];
  text_overlay_cues: string[];
  filming_instructions: string | null;
  reasoning: string | null;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  feedback: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  project_id: string;
  assignment_id: string;
  script_id: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  version: number;
  is_final: boolean;
  admin_approval_status: ApprovalStatus;
  admin_feedback: string | null;
  client_approval_status: ApprovalStatus;
  client_feedback: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  channel_type: 'project' | 'direct' | 'admin_client' | 'admin_creator';
  content: string;
  attachments: string[];
  is_read: boolean;
  created_at: string;
}
