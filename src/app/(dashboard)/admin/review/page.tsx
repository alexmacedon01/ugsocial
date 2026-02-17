import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, Video } from 'lucide-react';
import Link from 'next/link';

export default async function AdminReviewPage() {
  const supabase = await createClient();

  // Fetch projects awaiting review
  const { data: pendingProjects } = await supabase
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(full_name, company_name)
    `)
    .in('status', ['brief_submitted', 'scripts_in_review', 'script_review', 'video_in_review', 'video_uploaded'])
    .order('created_at', { ascending: true });

  // Fetch pending scripts
  const { data: pendingScripts } = await supabase
    .from('scripts')
    .select(`
      *,
      project:projects(title, client_id)
    `)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: true });

  // Fetch pending videos
  const { data: pendingVideos } = await supabase
    .from('videos')
    .select(`
      *,
      project:projects(title, client_id)
    `)
    .eq('admin_approval_status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <>
      <PageHeader
        title="Qualitätsprüfung"
        description="Alle ausstehenden Reviews an einem Ort"
      />

      {/* Pending Briefs */}
      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-2">
            <CardTitle>Neue Briefs</CardTitle>
            {pendingProjects && pendingProjects.filter(p => p.status === 'brief_submitted').length > 0 && (
              <Badge variant="warning">{pendingProjects.filter(p => p.status === 'brief_submitted').length}</Badge>
            )}
          </div>
          {pendingProjects && pendingProjects.filter(p => p.status === 'brief_submitted').length > 0 ? (
            <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {pendingProjects.filter(p => p.status === 'brief_submitted').map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="-mx-6 flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{project.title}</p>
                    <p className="text-sm text-zinc-500">
                      {project.client?.company_name || project.client?.full_name} &middot; {new Date(project.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <Badge variant="info">Neuer Brief</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Keine neuen Briefs.</p>
          )}
        </Card>

        {/* Pending Scripts */}
        <Card>
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-zinc-500" />
            <CardTitle>Scripts zur Freigabe</CardTitle>
            {pendingScripts && pendingScripts.length > 0 && (
              <Badge variant="warning">{pendingScripts.length}</Badge>
            )}
          </div>
          {pendingScripts && pendingScripts.length > 0 ? (
            <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {pendingScripts.map((script) => (
                <Link
                  key={script.id}
                  href={`/admin/projects/${script.project_id}`}
                  className="-mx-6 flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {script.project?.title}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {script.type === 'ai_generated' ? 'AI-Script' : 'Creator-Script'} v{script.version}
                    </p>
                  </div>
                  <Badge variant="warning">Review nötig</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Keine Scripts zur Freigabe.</p>
          )}
        </Card>

        {/* Pending Videos */}
        <Card>
          <div className="flex items-center gap-2">
            <Video size={20} className="text-zinc-500" />
            <CardTitle>Videos zur Freigabe</CardTitle>
            {pendingVideos && pendingVideos.length > 0 && (
              <Badge variant="warning">{pendingVideos.length}</Badge>
            )}
          </div>
          {pendingVideos && pendingVideos.length > 0 ? (
            <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {pendingVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/admin/projects/${video.project_id}`}
                  className="-mx-6 flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {video.project?.title}
                    </p>
                    <p className="text-sm text-zinc-500">Video v{video.version}</p>
                  </div>
                  <Badge variant="warning">Review nötig</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Keine Videos zur Freigabe.</p>
          )}
        </Card>
      </div>
    </>
  );
}
