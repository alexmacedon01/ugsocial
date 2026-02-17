import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default async function ClientMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get projects that have messages
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('client_id', user!.id)
    .order('updated_at', { ascending: false });

  return (
    <>
      <PageHeader
        title="Nachrichten"
        description="Kommunikation zu deinen Projekten"
      />

      {projects && projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/client/projects/${project.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{project.title}</p>
                    <p className="text-sm text-zinc-500">Projekt-Nachrichten ansehen</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <p className="py-12 text-center text-sm text-zinc-500">
            Erstelle zuerst ein Projekt, um Nachrichten zu senden.
          </p>
        </Card>
      )}
    </>
  );
}
