import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(full_name, email, company_name)
    `)
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

  return (
    <>
      <PageHeader
        title="Alle Projekte"
        description="Verwalte alle Client-Projekte und deren Status"
      />

      {projects && projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => {
            const sc = statusConfig[project.status] || { label: project.status, variant: 'default' as const };
            return (
              <Link key={project.id} href={`/admin/projects/${project.id}`}>
                <Card className="transition-all hover:shadow-lg hover:scale-[1.01]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">{project.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
                        <span>{project.client?.company_name || project.client?.full_name || 'Unbekannt'}</span>
                        <span>&middot;</span>
                        <span>{project.num_videos} Video{project.num_videos !== 1 ? 's' : ''}</span>
                        <span>&middot;</span>
                        <span>{project.platforms?.join(', ')}</span>
                        <span>&middot;</span>
                        <span>{new Date(project.created_at).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="py-12 text-center text-sm text-text-secondary">
            Noch keine Projekte eingegangen.
          </p>
        </Card>
      )}
    </>
  );
}
