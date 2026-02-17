import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role) {
      redirect(`/${profile.role}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
              UF
            </div>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">UGC Flow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Registrieren
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
            UGC-Produktion.
            <br />
            <span className="text-zinc-400">Auf Enterprise-Level.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            AI-gestützte Scripts. Zertifizierte Creator. Qualitätskontrolle bei jedem Video.
            Die Plattform für Marken, die UGC ernst nehmen.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Jetzt starten
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-8 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">AI-Script-Engine</h3>
              <p className="mt-2 text-sm text-zinc-500">
                KI-generierte Scripts basierend auf deiner Marke, Zielgruppe und Performance-Daten. Jedes Script wird von Experten geprüft.
              </p>
            </div>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">3.000+ Creator</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Zugang zu zertifizierten UGC-Creatorn aus dem DACH-Raum. Manuell gematcht für deine Marke und Zielgruppe.
              </p>
            </div>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Qualitätsgarantie</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Jedes Video durchläuft unsere Qualitätsprüfung, bevor du es siehst. Kein Raten — nur Videos, die konvertieren.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} UGC Flow. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
