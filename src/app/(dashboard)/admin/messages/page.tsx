import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default async function AdminMessagesPage() {
  const supabase = await createClient();

  // Get all projects with recent messages
  const { data: recentMessages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(full_name, role),
      project:projects(title)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Group messages by project
  const projectMap = new Map<string, { title: string; messages: typeof recentMessages }>();
  recentMessages?.forEach((msg) => {
    if (msg.project_id) {
      if (!projectMap.has(msg.project_id)) {
        projectMap.set(msg.project_id, {
          title: msg.project?.title || 'Unbekanntes Projekt',
          messages: [],
        });
      }
      projectMap.get(msg.project_id)!.messages!.push(msg);
    }
  });

  return (
    <>
      <PageHeader
        title="Nachrichten"
        description="Alle Projekt-Konversationen"
      />

      {projectMap.size > 0 ? (
        <div className="space-y-3">
          {Array.from(projectMap.entries()).map(([projectId, { title, messages }]) => {
            const lastMsg = messages![0];
            return (
              <Link key={projectId} href={`/admin/projects/${projectId}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                      <MessageSquare size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900 dark:text-white">{title}</p>
                      <p className="mt-0.5 truncate text-sm text-zinc-500">
                        {lastMsg.sender?.full_name}: {lastMsg.content}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Date(lastMsg.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="py-12 text-center text-sm text-zinc-500">
            Noch keine Nachrichten.
          </p>
        </Card>
      )}
    </>
  );
}
