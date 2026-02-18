import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ClientProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeader
        title="Meine Projekte"
        description="Alle deine UGC-Projekte im Überblick"
        actions={
          <Link href="/client/brief/new">
            <Button>
              <Plus size={16} />
              Neues Projekt
            </Button>
          </Link>
        }
      />

      {projects && projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/client/projects/${project.id}`}>
              <Card className="transition-all hover:shadow-lg hover:scale-[1.01]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-text-primary">{project.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
                      <span>{project.num_videos} Video{project.num_videos !== 1 ? 's' : ''}</span>
                      <span>&middot;</span>
                      <span>{project.platforms?.join(', ')}</span>
                      <span>&middot;</span>
                      <span>{new Date(project.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="py-12 text-center">
            <p className="text-text-secondary">Noch keine Projekte erstellt.</p>
            <Link href="/client/brief/new">
              <Button variant="secondary" className="mt-4">
                Erstes Projekt erstellen
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
    draft: { label: 'Entwurf', variant: 'default' },
    brief_submitted: { label: 'In Bearbeitung', variant: 'info' },
    client_script_review: { label: 'Dein Feedback nötig', variant: 'warning' },
    video_approved: { label: 'Video bereit', variant: 'success' },
    delivered: { label: 'Geliefert', variant: 'success' },
    completed: { label: 'Abgeschlossen', variant: 'success' },
  };

  const match = config[status] || { label: 'In Bearbeitung', variant: 'info' as const };
  return <Badge variant={match.variant}>{match.label}</Badge>;
}
