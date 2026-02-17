import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock } from 'lucide-react';
import Link from 'next/link';

export default async function CreatorAssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: assignments } = await supabase
    .from('project_assignments')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false });

  const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
    pending: { label: 'Neu', variant: 'info' },
    accepted: { label: 'Angenommen', variant: 'success' },
    in_progress: { label: 'In Arbeit', variant: 'warning' },
    completed: { label: 'Abgeschlossen', variant: 'success' },
    declined: { label: 'Abgelehnt', variant: 'default' },
  };

  return (
    <>
      <PageHeader
        title="Meine Aufträge"
        description="Alle dir zugewiesenen Projekte"
      />

      {assignments && assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const sl = statusLabels[assignment.status] || { label: assignment.status, variant: 'default' as const };
            return (
              <Link key={assignment.id} href={`/creator/assignments/${assignment.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">
                        {assignment.project?.title || 'Projekt'}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
                        <span>{assignment.project?.num_videos} Video{assignment.project?.num_videos !== 1 ? 's' : ''}</span>
                        <span>&middot;</span>
                        <span>{assignment.project?.platforms?.join(', ')}</span>
                        {assignment.project?.deadline && (
                          <>
                            <span>&middot;</span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {new Date(assignment.project.deadline).toLocaleDateString('de-DE')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={sl.variant}>{sl.label}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="py-12 text-center text-sm text-zinc-500">
            Noch keine Aufträge. Neue Aufträge erscheinen hier, sobald sie dir zugewiesen werden.
          </p>
        </Card>
      )}
    </>
  );
}
