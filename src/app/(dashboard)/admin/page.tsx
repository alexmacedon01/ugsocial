import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Briefcase, Users, Star, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch dashboard stats
  const [projectsRes, clientsRes, creatorsRes, pendingReviewRes] = await Promise.all([
    supabase.from('projects').select('id, status', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'client'),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'creator'),
    supabase.from('projects').select('id', { count: 'exact' }).in('status', ['brief_submitted', 'scripts_in_review', 'video_in_review']),
  ]);

  const stats = [
    {
      label: 'Aktive Projekte',
      value: projectsRes.count || 0,
      icon: <Briefcase size={20} />,
      href: '/admin/projects',
    },
    {
      label: 'Kunden',
      value: clientsRes.count || 0,
      icon: <Users size={20} />,
      href: '/admin/clients',
    },
    {
      label: 'Creator',
      value: creatorsRes.count || 0,
      icon: <Star size={20} />,
      href: '/admin/creators',
    },
    {
      label: 'Warten auf Review',
      value: pendingReviewRes.count || 0,
      icon: <AlertCircle size={20} />,
      href: '/admin/review',
    },
  ];

  // Fetch recent projects
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('id, title, status, created_at, client_id')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Übersicht aller Projekte, Kunden und Creator"
      />

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
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
          </Link>
        ))}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardTitle>Neueste Projekte</CardTitle>
        <CardDescription>Zuletzt eingegangene Projektbriefs</CardDescription>
        <div className="mt-4">
          {recentProjects && recentProjects.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 -mx-6 px-6"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{project.title}</p>
                    <p className="text-sm text-zinc-500">
                      {new Date(project.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">
              Noch keine Projekte vorhanden.
            </p>
          )}
        </div>
      </Card>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
    draft: { label: 'Entwurf', variant: 'default' },
    brief_submitted: { label: 'Brief eingegangen', variant: 'info' },
    ai_processing: { label: 'AI verarbeitet', variant: 'info' },
    scripts_in_review: { label: 'Scripts prüfen', variant: 'warning' },
    scripts_approved: { label: 'Scripts genehmigt', variant: 'success' },
    creator_assigned: { label: 'Creator zugewiesen', variant: 'info' },
    creator_scripting: { label: 'Creator schreibt', variant: 'info' },
    script_review: { label: 'Script Review', variant: 'warning' },
    client_script_review: { label: 'Kunde prüft Script', variant: 'warning' },
    filming: { label: 'In Produktion', variant: 'info' },
    video_uploaded: { label: 'Video hochgeladen', variant: 'info' },
    video_in_review: { label: 'Video prüfen', variant: 'warning' },
    revision_requested: { label: 'Überarbeitung', variant: 'danger' },
    video_approved: { label: 'Video genehmigt', variant: 'success' },
    delivered: { label: 'Geliefert', variant: 'success' },
    completed: { label: 'Abgeschlossen', variant: 'success' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' as const };
  return <Badge variant={variant}>{label}</Badge>;
}
