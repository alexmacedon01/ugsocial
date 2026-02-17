import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/videos/:id — approve/reject video
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const body = await request.json();

  // Admin approval
  if (profile?.role === 'admin') {
    const { admin_approval_status, admin_feedback } = body;

    if (!['approved', 'revision_requested', 'rejected'].includes(admin_approval_status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('videos')
      .update({
        admin_approval_status,
        admin_feedback: admin_feedback || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update project status based on admin decision
    if (admin_approval_status === 'approved') {
      await supabase
        .from('projects')
        .update({ status: 'video_approved' })
        .eq('id', data.project_id);
    } else if (admin_approval_status === 'revision_requested') {
      await supabase
        .from('projects')
        .update({ status: 'revision_requested' })
        .eq('id', data.project_id);
    }

    return NextResponse.json(data);
  }

  // Client approval (only for admin-approved videos)
  if (profile?.role === 'client') {
    const { client_approval_status, client_feedback } = body;

    if (!['approved', 'revision_requested'].includes(client_approval_status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify the video is admin-approved first
    const { data: video } = await supabase
      .from('videos')
      .select('admin_approval_status, project_id')
      .eq('id', id)
      .single();

    if (video?.admin_approval_status !== 'approved') {
      return NextResponse.json({ error: 'Video not yet admin-approved' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('videos')
      .update({
        client_approval_status,
        client_feedback: client_feedback || null,
        is_final: client_approval_status === 'approved',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update project status
    if (client_approval_status === 'approved') {
      await supabase
        .from('projects')
        .update({ status: 'delivered' })
        .eq('id', data.project_id);
    } else if (client_approval_status === 'revision_requested') {
      await supabase
        .from('projects')
        .update({ status: 'revision_requested' })
        .eq('id', data.project_id);
    }

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
