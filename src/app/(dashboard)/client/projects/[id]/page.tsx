import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('client_id', user!.id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch approved scripts
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', id)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false });

  // Fetch approved videos (admin-approved only, per RLS)
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
    draft: { label: 'Entwurf', variant: 'default' },
    brief_submitted: { label: 'In Bearbeitung', variant: 'info' },
    client_script_review: { label: 'Dein Feedback nötig', variant: 'warning' },
    video_approved: { label: 'Video bereit', variant: 'success' },
    delivered: { label: 'Geliefert', variant: 'success' },
    completed: { label: 'Abgeschlossen', variant: 'success' },
  };

  const sc = statusConfig[project.status] || { label: 'In Bearbeitung', variant: 'info' as const };

  return (
    <>
      <PageHeader
        title={project.title}
        description={`${project.num_videos} Video${project.num_videos !== 1 ? 's' : ''} &middot; ${project.platforms?.join(', ')}`}
        actions={<Badge variant={sc.variant}>{sc.label}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Scripts */}
          <Card>
            <CardTitle>Scripts</CardTitle>
            {scripts && scripts.length > 0 ? (
              <div className="mt-4 space-y-4">
                {scripts.map((script) => (
                  <div key={script.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Script v{script.version}
                      </span>
                      <Badge variant="success">Genehmigt</Badge>
                    </div>
                    {script.hooks?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium uppercase text-zinc-500">Hooks:</p>
                        <ul className="mt-1 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                          {script.hooks.map((h: string, i: number) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{script.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                Scripts werden aktuell erstellt. Du wirst benachrichtigt, sobald sie bereit sind.
              </p>
            )}
          </Card>

          {/* Videos */}
          <Card>
            <CardTitle>Videos</CardTitle>
            {videos && videos.length > 0 ? (
              <div className="mt-4 space-y-4">
                {videos.map((video) => (
                  <div key={video.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Video v{video.version}</span>
                      <Badge variant={video.client_approval_status === 'approved' ? 'success' : 'warning'}>
                        {video.client_approval_status === 'approved' ? 'Angenommen' : 'Feedback ausstehend'}
                      </Badge>
                    </div>
                    {video.video_url && (
                      <div className="mt-3">
                        <video
                          src={video.video_url}
                          controls
                          className="max-h-96 w-full rounded-lg bg-black"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                Noch keine Videos bereit. Videos erscheinen hier, sobald sie unsere Qualitätsprüfung bestanden haben.
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Projekt-Details</CardTitle>
            <div className="mt-4 space-y-3 text-sm">
              <DetailRow label="Kampagnenziel" value={project.campaign_objective} />
              <DetailRow label="Plattformen" value={project.platforms?.join(', ')} />
              <DetailRow label="Video-Stile" value={project.video_styles?.join(', ')} />
              <DetailRow label="Anzahl Videos" value={String(project.num_videos)} />
              <DetailRow label="Budget-Stufe" value={project.budget_tier} />
              {project.deadline && (
                <DetailRow label="Deadline" value={new Date(project.deadline).toLocaleDateString('de-DE')} />
              )}
            </div>
          </Card>

          {project.key_messaging?.length > 0 && (
            <Card>
              <CardTitle>Key Messages</CardTitle>
              <ul className="mt-3 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                {project.key_messaging.map((msg: string, i: number) => (
                  <li key={i}>{msg}</li>
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
      <span className="font-medium text-zinc-500">{label}</span>
      <span className="text-zinc-900 dark:text-white">{value || '—'}</span>
    </div>
  );
}
