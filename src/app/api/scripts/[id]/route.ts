import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/scripts/:id — approve/reject script
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { approval_status, feedback } = body;

  if (!['approved', 'revision_requested', 'rejected'].includes(approval_status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('scripts')
    .update({
      approval_status,
      feedback: feedback || null,
      approved_by: approval_status === 'approved' ? user.id : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If script approved, update project status
  if (approval_status === 'approved' && data.type === 'ai_generated') {
    await supabase
      .from('projects')
      .update({ status: 'scripts_approved' })
      .eq('id', data.project_id);
  }

  if (approval_status === 'approved' && data.type === 'creator_rewrite') {
    await supabase
      .from('projects')
      .update({ status: 'client_script_review' })
      .eq('id', data.project_id);
  }

  return NextResponse.json(data);
}
