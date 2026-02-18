import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { UserRole } from '@/types/database';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      redirect('/login');
    }

    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist (trigger failed), create it manually
    if (!profile) {
      const meta = user.user_metadata || {};
      const role = meta.role || 'client';

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: meta.full_name || '',
          role,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Profile insert error:', insertError);
      }
      profile = newProfile;
    }

    // If still no profile, show debug info so we can see what's wrong
    if (!profile) {
      return (
        <div className="bg-mesh-gradient flex min-h-screen items-center justify-center px-4">
          <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
            <h1 className="text-xl font-bold text-text-primary">Profil konnte nicht erstellt werden</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Benutzer-ID: {user.id.substring(0, 8)}...
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              E-Mail: {user.email}
            </p>
            {profileError && (
              <p className="mt-2 text-xs text-red-500">
                DB Fehler: {profileError.message} (Code: {profileError.code})
              </p>
            )}
            <p className="mt-4 text-sm text-text-secondary">
              Bitte stelle sicher, dass die Datenbank-Migration ausgefuehrt wurde.
            </p>
            <a
              href="/login"
              className="btn-accent mt-4 inline-block rounded-xl px-4 py-2 text-sm font-medium"
            >
              Zurueck zur Anmeldung
            </a>
          </div>
        </div>
      );
    }

    return (
      <DashboardShell role={profile.role as UserRole} userName={profile.full_name || profile.email}>
        {children}
      </DashboardShell>
    );
  } catch (error: unknown) {
    // redirect() throws a special error in Next.js — re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    console.error('Dashboard layout error:', error);
    return (
      <div className="bg-mesh-gradient flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-text-primary">Etwas ist schiefgelaufen</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </p>
          <a
            href="/login"
            className="btn-accent mt-4 inline-block rounded-xl px-4 py-2 text-sm font-medium"
          >
            Zurueck zur Anmeldung
          </a>
        </div>
      </div>
    );
  }
}
