'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Fehler aufgetreten</h1>
        <p className="mt-2 text-sm text-zinc-500">
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
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Zur Anmeldung
          </a>
        </div>
      </div>
    </div>
  );
}
