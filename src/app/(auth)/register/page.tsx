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
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
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

    // If email confirmation is enabled, the user won't have a session yet
    if (data?.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    router.push(`/${role}`);
    router.refresh();
  };

  if (success) {
    return (
      <div className="bg-mesh-gradient flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="glass-panel rounded-2xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-lg">
              UF
            </div>
            <h1 className="text-2xl font-bold text-text-primary">E-Mail bestätigen</h1>
            <p className="mt-4 text-sm text-text-secondary">
              Wir haben dir eine Bestätigungs-E-Mail an <strong className="text-text-primary">{email}</strong> gesendet.
              Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mesh-gradient flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="glass-panel rounded-2xl p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-lg">
              UF
            </div>
            <h1 className="text-2xl font-bold text-text-primary">UGC Flow</h1>
            <p className="mt-2 text-sm text-text-secondary">
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
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Konto erstellen
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Bereits registriert?{' '}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
