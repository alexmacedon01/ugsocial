import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Briefcase, CheckCircle, Clock, Video } from 'lucide-react';
import Link from 'next/link';

export default async function CreatorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch creator assignments with project details
  const { data: assignments } = await supabase
    .from('project_assignments')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false });

  const allAssignments = assignments || [];
  const activeAssignments = allAssignments.filter(a => ['pending', 'accepted', 'in_progress'].includes(a.status));
  const completedCount = allAssignments.filter(a => a.status === 'completed').length;

  // Fetch creator profile
  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single();

  const stats = [
    { label: 'Aktive Aufträge', value: activeAssignments.length, icon: <Briefcase size={20} /> },
    { label: 'Abgeschlossen', value: completedCount, icon: <CheckCircle size={20} /> },
    { label: 'Bewertung', value: creatorProfile?.rating?.toFixed(1) || '—', icon: <Video size={20} /> },
  ];

  return (
    <>
      <PageHeader
        title="Creator Dashboard"
        description="Deine Aufträge und aktuelle Projekte"
      />

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Assignments */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Aktive Aufträge</CardTitle>
          <Link href="/creator/assignments" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            Alle anzeigen
          </Link>
        </div>
        {activeAssignments.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {activeAssignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/creator/assignments/${assignment.id}`}
                className="-mx-6 flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {assignment.project?.title || 'Projekt'}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                    <Clock size={14} />
                    {assignment.project?.deadline
                      ? `Deadline: ${new Date(assignment.project.deadline).toLocaleDateString('de-DE')}`
                      : 'Keine Deadline'}
                  </div>
                </div>
                <AssignmentBadge status={assignment.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-zinc-500">
            Keine aktiven Aufträge. Neue Aufträge erscheinen hier automatisch.
          </p>
        )}
      </Card>
    </>
  );
}

function AssignmentBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
    pending: { label: 'Neu', variant: 'info' },
    accepted: { label: 'Angenommen', variant: 'success' },
    in_progress: { label: 'In Arbeit', variant: 'warning' },
    completed: { label: 'Abgeschlossen', variant: 'success' },
    declined: { label: 'Abgelehnt', variant: 'default' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' as const };
  return <Badge variant={variant}>{label}</Badge>;
}
