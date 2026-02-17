import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default async function CreatorMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get assigned projects
  const { data: assignments } = await supabase
    .from('project_assignments')
    .select('id, project:projects(id, title)')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeader
        title="Nachrichten"
        description="Kommunikation zu deinen Aufträgen"
      />

      {assignments && assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <Link key={assignment.id} href={`/creator/assignments/${assignment.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(assignment as any).project?.title || 'Projekt'}
                    </p>
                    <p className="text-sm text-zinc-500">Nachrichten zum Auftrag</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <p className="py-12 text-center text-sm text-zinc-500">
            Noch keine Aufträge — Nachrichten erscheinen hier, sobald du einem Projekt zugewiesen wirst.
          </p>
        </Card>
      )}
    </>
  );
}
