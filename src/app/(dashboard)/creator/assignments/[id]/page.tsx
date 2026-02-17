import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreatorWorkflow } from './CreatorWorkflow';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CreatorAssignmentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: assignment, error } = await supabase
    .from('project_assignments')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('id', id)
    .eq('creator_id', user!.id)
    .single();

  if (error || !assignment) {
    notFound();
  }

  const project = assignment.project;

  // Fetch scripts for this project
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  // Fetch videos for this assignment
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('assignment_id', id)
    .order('created_at', { ascending: false });

  const aiScripts = scripts?.filter(s => s.type === 'ai_generated' && s.approval_status === 'approved') || [];
  const creatorScripts = scripts?.filter(s => s.type === 'creator_rewrite') || [];

  return (
    <>
      <PageHeader
        title={project.title}
        description={`${project.num_videos} Video${project.num_videos !== 1 ? 's' : ''} &middot; ${project.platforms?.join(', ')}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Workflow Checklist */}
          <CreatorWorkflow
            assignmentId={id}
            projectId={project.id}
            assignmentStatus={assignment.status}
            hasAiScripts={aiScripts.length > 0}
            hasCreatorScript={creatorScripts.length > 0}
            hasVideos={(videos?.length || 0) > 0}
          />

          {/* AI Scripts */}
          <Card>
            <CardTitle>AI-generierte Scripts</CardTitle>
            {aiScripts.length > 0 ? (
              <div className="mt-4 space-y-4">
                {aiScripts.map((script) => (
                  <div key={script.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="mb-3">
                      <p className="text-xs font-medium uppercase text-zinc-500">Hooks:</p>
                      <ul className="mt-1 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                        {script.hooks?.map((h: string, i: number) => <li key={i}>{h}</li>)}
                      </ul>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium uppercase text-zinc-500">Script:</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{script.body}</p>
                    </div>
                    {script.filming_instructions && (
                      <div className="mb-3">
                        <p className="text-xs font-medium uppercase text-zinc-500">Filming-Anweisungen:</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{script.filming_instructions}</p>
                      </div>
                    )}
                    {script.reasoning && (
                      <div className="rounded bg-amber-50 p-3 dark:bg-amber-900/20">
                        <p className="text-xs font-medium uppercase text-amber-700 dark:text-amber-400">Warum dieses Script:</p>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{script.reasoning}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Scripts werden noch erstellt. Du wirst benachrichtigt.</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardTitle>Projekt-Info</CardTitle>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Kampagnenziel</span>
                <span className="text-zinc-900 dark:text-white">{project.campaign_objective || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Plattformen</span>
                <span className="text-zinc-900 dark:text-white">{project.platforms?.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Video-Stile</span>
                <span className="text-zinc-900 dark:text-white">{project.video_styles?.join(', ')}</span>
              </div>
              {project.deadline && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Deadline</span>
                  <span className="font-medium text-red-600">{new Date(project.deadline).toLocaleDateString('de-DE')}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Do's & Don'ts */}
          {(project.dos?.length > 0 || project.donts?.length > 0) && (
            <Card>
              <CardTitle>Do&apos;s & Don&apos;ts</CardTitle>
              {project.dos?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase text-emerald-600">Do&apos;s:</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                    {project.dos.map((d: string, i: number) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}
              {project.donts?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase text-red-600">Don&apos;ts:</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                    {project.donts.map((d: string, i: number) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Key Messages */}
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

          {/* Reference Videos */}
          {project.reference_video_urls?.length > 0 && (
            <Card>
              <CardTitle>Referenz-Videos</CardTitle>
              <ul className="mt-3 space-y-2">
                {project.reference_video_urls.map((url: string, i: number) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                      Referenz {i + 1}
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
