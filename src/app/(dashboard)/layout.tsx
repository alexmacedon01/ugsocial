import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { UserRole } from '@/types/database';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile doesn't exist (trigger failed), create it manually
  if (!profile) {
    const meta = user.user_metadata || {};
    const role = meta.role || 'client';
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: meta.full_name || '',
        role,
      })
      .select()
      .single();

    profile = newProfile;
  }

  // If still no profile, something is very wrong — show a fallback
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Profil wird erstellt...</h1>
          <p className="mt-2 text-sm text-zinc-500">Bitte lade die Seite neu.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell role={profile.role as UserRole} userName={profile.full_name || profile.email}>
      {children}
    </DashboardShell>
  );
}
