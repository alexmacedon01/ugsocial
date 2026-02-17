'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { UserRole } from '@/types/database';

const roleOptions = [
  { value: 'client', label: 'Unternehmen (Kunde)' },
  { value: 'creator', label: 'UGC Creator' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(`/${role}`);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">UGC Flow</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Erstelle dein Konto
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            id="fullName"
            label="Vollständiger Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Max Mustermann"
            required
          />
          <Input
            id="email"
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="max@unternehmen.de"
            required
          />
          <Input
            id="password"
            label="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 8 Zeichen"
            minLength={8}
            required
          />
          <Select
            id="role"
            label="Rolle"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Konto erstellen
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Bereits registriert?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-white">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
