'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh-gradient">
      <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-xl font-bold text-text-primary">Fehler aufgetreten</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {error.message || 'Ein unbekannter Fehler ist aufgetreten.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Erneut versuchen
          </button>
          <a
            href="/login"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-white/10"
          >
            Zur Anmeldung
          </a>
        </div>
      </div>
    </div>
  );
}
