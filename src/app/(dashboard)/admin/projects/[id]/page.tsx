import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AssignCreatorForm } from './AssignCreatorForm';
import { StatusUpdateForm } from './StatusUpdateForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(full_name, email, company_name)
    `)
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch assignments
  const { data: assignments } = await supabase
    .from('project_assignments')
    .select(`
      *,
      creator:profiles!project_assignments_creator_id_fkey(full_name, email)
    `)
    .eq('project_id', id);

  // Fetch available creators
  const { data: creators } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'creator');

  // Fetch scripts
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  // Fetch videos
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
    draft: { label: 'Entwurf', variant: 'default' },
    brief_submitted: { label: 'Brief eingegangen', variant: 'info' },
    ai_processing: { label: 'AI verarbeitet', variant: 'info' },
    scripts_in_review: { label: 'Scripts prüfen', variant: 'warning' },
    scripts_approved: { label: 'Scripts genehmigt', variant: 'success' },
    creator_assigned: { label: 'Creator zugewiesen', variant: 'info' },
    creator_scripting: { label: 'Creator schreibt', variant: 'info' },
    script_review: { label: 'Script Review', variant: 'warning' },
    client_script_review: { label: 'Kunde prüft', variant: 'warning' },
    filming: { label: 'In Produktion', variant: 'info' },
    video_uploaded: { label: 'Video hochgeladen', variant: 'info' },
    video_in_review: { label: 'Video prüfen', variant: 'warning' },
    revision_requested: { label: 'Überarbeitung', variant: 'danger' },
    video_approved: { label: 'Video genehmigt', variant: 'success' },
    delivered: { label: 'Geliefert', variant: 'success' },
    completed: { label: 'Abgeschlossen', variant: 'success' },
  };

  const sc = statusConfig[project.status] || { label: project.status, variant: 'default' as const };

  return (
    <>
      <PageHeader
        title={project.title}
        description={`Kunde: ${project.client?.company_name || project.client?.full_name}`}
        actions={<Badge variant={sc.variant}>{sc.label}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Brief Details */}
          <Card>
            <CardTitle>Briefing-Details</CardTitle>
            <div className="mt-4 space-y-3">
              <DetailRow label="Kampagnenziel" value={project.campaign_objective} />
              <DetailRow label="Plattformen" value={project.platforms?.join(', ')} />
              <DetailRow label="Anzahl Videos" value={String(project.num_videos)} />
              <DetailRow label="Video-Stile" value={project.video_styles?.join(', ')} />
              <DetailRow label="Budget-Stufe" value={project.budget_tier} />
              <DetailRow label="Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString('de-DE') : 'Keine'} />
            </div>
          </Card>

          {/* Key Messaging */}
          {project.key_messaging?.length > 0 && (
            <Card>
              <CardTitle>Key Messages</CardTitle>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {project.key_messaging.map((msg: string, i: number) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Do's & Don'ts */}
          <div className="grid grid-cols-2 gap-4">
            {project.dos?.length > 0 && (
              <Card>
                <CardTitle>Do&apos;s</CardTitle>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
                  {project.dos.map((d: string, i: number) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </Card>
            )}
            {project.donts?.length > 0 && (
              <Card>
                <CardTitle>Don&apos;ts</CardTitle>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-400">
                  {project.donts.map((d: string, i: number) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Scripts */}
          <Card>
            <CardTitle>Scripts ({scripts?.length || 0})</CardTitle>
            {scripts && scripts.length > 0 ? (
              <div className="mt-4 space-y-4">
                {scripts.map((script) => (
                  <div key={script.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {script.type === 'ai_generated' ? 'AI-Script' : 'Creator-Script'} v{script.version}
                      </span>
                      <Badge variant={script.approval_status === 'approved' ? 'success' : script.approval_status === 'pending' ? 'warning' : 'danger'}>
                        {script.approval_status === 'approved' ? 'Genehmigt' : script.approval_status === 'pending' ? 'Ausstehend' : 'Überarbeitung'}
                      </Badge>
                    </div>
                    {script.hooks?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium uppercase text-zinc-500">Hooks:</p>
                        <ul className="list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                          {script.hooks.map((h: string, i: number) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{script.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Noch keine Scripts erstellt.</p>
            )}
          </Card>

          {/* Videos */}
          <Card>
            <CardTitle>Videos ({videos?.length || 0})</CardTitle>
            {videos && videos.length > 0 ? (
              <div className="mt-4 space-y-4">
                {videos.map((video) => (
                  <div key={video.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Video v{video.version}</span>
                      <div className="flex gap-2">
                        <Badge variant={video.admin_approval_status === 'approved' ? 'success' : 'warning'}>
                          Admin: {video.admin_approval_status === 'approved' ? 'Genehmigt' : 'Ausstehend'}
                        </Badge>
                        {video.admin_approval_status === 'approved' && (
                          <Badge variant={video.client_approval_status === 'approved' ? 'success' : 'warning'}>
                            Kunde: {video.client_approval_status === 'approved' ? 'Genehmigt' : 'Ausstehend'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Noch keine Videos hochgeladen.</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <StatusUpdateForm projectId={project.id} currentStatus={project.status} />

          {/* Creator Assignment */}
          <AssignCreatorForm
            projectId={project.id}
            creators={creators || []}
            currentAssignments={assignments || []}
          />

          {/* Reference Videos */}
          {project.reference_video_urls?.length > 0 && (
            <Card>
              <CardTitle>Referenz-Videos</CardTitle>
              <ul className="mt-3 space-y-2">
                {project.reference_video_urls.map((url: string, i: number) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-800">
      <span className="text-sm font-medium text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-900 dark:text-white">{value || '—'}</span>
    </div>
  );
}
