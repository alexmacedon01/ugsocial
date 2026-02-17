import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default async function AdminClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  // Get project counts per client
  const { data: projectCounts } = await supabase
    .from('projects')
    .select('client_id');

  const countMap = new Map<string, number>();
  projectCounts?.forEach(p => {
    countMap.set(p.client_id, (countMap.get(p.client_id) || 0) + 1);
  });

  return (
    <>
      <PageHeader
        title="Kunden"
        description={`${clients?.length || 0} Kunden registriert`}
      />

      {clients && clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {client.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {client.company_name || client.full_name}
                    </p>
                    <p className="text-sm text-zinc-500">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">
                    {countMap.get(client.id) || 0} Projekte
                  </Badge>
                  <span className="text-sm text-zinc-400">
                    seit {new Date(client.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="py-12 text-center text-sm text-zinc-500">
            Noch keine Kunden registriert.
          </p>
        </Card>
      )}
    </>
  );
}
