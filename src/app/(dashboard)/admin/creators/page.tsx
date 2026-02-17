import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Star } from 'lucide-react';

export default async function AdminCreatorsPage() {
  const supabase = await createClient();

  const { data: creators } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'creator')
    .order('created_at', { ascending: false });

  // Get creator profiles for additional data
  const creatorIds = creators?.map(c => c.id) || [];
  const { data: creatorProfiles } = await supabase
    .from('creator_profiles')
    .select('*')
    .in('user_id', creatorIds);

  const profileMap = new Map(creatorProfiles?.map(cp => [cp.user_id, cp]) || []);

  return (
    <>
      <PageHeader
        title="Creator-Pool"
        description={`${creators?.length || 0} Creator registriert`}
      />

      {creators && creators.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => {
            const cp = profileMap.get(creator.id);
            return (
              <Card key={creator.id}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {creator.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-white">{creator.full_name}</p>
                    <p className="text-sm text-zinc-500">{creator.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {cp?.is_certified && <Badge variant="success">Zertifiziert</Badge>}
                      {cp?.availability && (
                        <Badge variant={cp.availability === 'available' ? 'success' : cp.availability === 'busy' ? 'warning' : 'default'}>
                          {cp.availability === 'available' ? 'Verfügbar' : cp.availability === 'busy' ? 'Beschäftigt' : 'Nicht verfügbar'}
                        </Badge>
                      )}
                      {cp?.rating > 0 && (
                        <Badge variant="info">
                          <Star size={12} className="mr-0.5 inline" />
                          {cp.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    {cp?.specializations && cp.specializations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cp.specializations.map((s: string) => (
                          <span key={s} className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="py-12 text-center text-sm text-zinc-500">
            Noch keine Creator registriert.
          </p>
        </Card>
      )}
    </>
  );
}
