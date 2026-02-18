import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Briefcase, Video, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch projects first (needed for video count query)
  const projectsRes = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false });

  const projects = projectsRes.data || [];
  const projectIds = projects.map(p => p.id);

  // Only query videos if there are projects (empty .in() can cause errors)
  let videoCount = 0;
  if (projectIds.length > 0) {
    const videosRes = await supabase
      .from('videos')
      .select('id', { count: 'exact' })
      .eq('admin_approval_status', 'approved')
      .in('project_id', projectIds);
    videoCount = videosRes.count || 0;
  }

  const activeProjects = projects.filter(p => !['completed', 'delivered'].includes(p.status));

  const stats = [
    { label: 'Aktive Projekte', value: activeProjects.length, icon: <Briefcase size={20} /> },
    { label: 'Fertige Videos', value: videoCount, icon: <Video size={20} /> },
    { label: 'Gesamt Projekte', value: projects.length, icon: <FileText size={20} /> },
  ];

  return (
    <>
      <PageHeader
        title="Willkommen zurück"
        description="Verwalte deine UGC-Projekte und Videos"
        actions={
          <Link href="/client/brief/new">
            <Button>
              <Plus size={16} />
              Neues Projekt
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Projects */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Aktive Projekte</CardTitle>
          <Link href="/client/projects" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            Alle anzeigen
          </Link>
        </div>
        {activeProjects.length > 0 ? (
          <div className="divide-y divide-white/10">
            {activeProjects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/client/projects/${project.id}`}
                className="-mx-6 flex items-center justify-between px-6 py-3 transition-colors hover:bg-white/10"
              >
                <div>
                  <p className="font-medium text-text-primary">{project.title}</p>
                  <p className="text-sm text-text-secondary">
                    {project.num_videos} Video{project.num_videos !== 1 ? 's' : ''} &middot; {new Date(project.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <StatusBadge status={project.status} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-text-secondary">Noch keine Projekte.</p>
            <Link href="/client/brief/new">
              <Button variant="secondary" className="mt-4">
                Erstes Projekt erstellen
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
    draft: { label: 'Entwurf', variant: 'default' },
    brief_submitted: { label: 'In Bearbeitung', variant: 'info' },
    ai_processing: { label: 'In Bearbeitung', variant: 'info' },
    scripts_in_review: { label: 'In Bearbeitung', variant: 'info' },
    scripts_approved: { label: 'In Bearbeitung', variant: 'info' },
    creator_assigned: { label: 'Creator arbeitet', variant: 'info' },
    creator_scripting: { label: 'Creator arbeitet', variant: 'info' },
    script_review: { label: 'In Bearbeitung', variant: 'info' },
    client_script_review: { label: 'Dein Feedback nötig', variant: 'warning' },
    filming: { label: 'In Produktion', variant: 'info' },
    video_uploaded: { label: 'In Bearbeitung', variant: 'info' },
    video_in_review: { label: 'In Bearbeitung', variant: 'info' },
    revision_requested: { label: 'In Überarbeitung', variant: 'warning' },
    video_approved: { label: 'Dein Feedback nötig', variant: 'warning' },
    delivered: { label: 'Geliefert', variant: 'success' },
    completed: { label: 'Abgeschlossen', variant: 'success' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' as const };
  return <Badge variant={variant}>{label}</Badge>;
}
