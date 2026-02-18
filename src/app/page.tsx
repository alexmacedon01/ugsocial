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
    <div className="bg-mesh-gradient flex min-h-screen flex-col">
      {/* Header */}
      <header className="glass-panel-heavy sticky top-0 z-50 rounded-none border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-sm">
              UF
            </div>
            <span className="text-lg font-semibold text-text-primary">UGC Flow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="btn-accent rounded-xl px-5 py-2 text-sm font-medium"
            >
              Registrieren
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-text-primary sm:text-6xl">
            UGC-Produktion.
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Auf Enterprise-Level.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-text-secondary">
            AI-gestützte Scripts. Zertifizierte Creator. Qualitätskontrolle bei jedem Video.
            Die Plattform für Marken, die UGC ernst nehmen.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-accent rounded-xl px-8 py-3 text-sm font-medium"
            >
              Jetzt starten
            </Link>
            <Link
              href="/login"
              className="btn-glass rounded-xl px-8 py-3 text-sm font-medium text-text-primary"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="glass-panel rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">AI-Script-Engine</h3>
              <p className="mt-2 text-sm text-text-secondary">
                KI-generierte Scripts basierend auf deiner Marke, Zielgruppe und Performance-Daten. Jedes Script wird von Experten geprüft.
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">3.000+ Creator</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Zugang zu zertifizierten UGC-Creatorn aus dem DACH-Raum. Manuell gematcht für deine Marke und Zielgruppe.
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Qualitätsgarantie</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Jedes Video durchläuft unsere Qualitätsprüfung, bevor du es siehst. Kein Raten — nur Videos, die konvertieren.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm text-text-tertiary">
            &copy; {new Date().getFullYear()} UGC Flow. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
