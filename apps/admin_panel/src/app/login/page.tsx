'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { cx } from '@/lib/cx';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Yerel geliştirmede demo admin ile hızlı giriş için forma ön doldurma.
// Üretim derlemesinde NODE_ENV = 'production' olduğu için Next.js bu bloğu
// dead-code olarak eler; demo şifresi bundle'a hiç girmez.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEV_PREFILL_EMAIL = IS_PRODUCTION ? '' : 'admin@beautysalon.com';
const DEV_PREFILL_PASSWORD = IS_PRODUCTION ? '' : 'Admin123!';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEV_PREFILL_EMAIL);
  const [password, setPassword] = useState(DEV_PREFILL_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Giriş başarısız oldu');
      }

      if (data.data?.user?.role !== 'ADMIN') {
        throw new Error('Bu panele yalnızca Admin rolündeki kullanıcılar erişebilir');
      }

      localStorage.setItem('access_token', data.data.accessToken);
      localStorage.setItem('refresh_token', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex items-center justify-end gap-3 px-4 py-4">
        <span className="text-sm font-semibold text-fg-muted">Tema</span>
        <ThemeToggle />
      </div>

      <main className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center">
        <div className="w-full max-w-md overflow-hidden rounded-card border border-border bg-surface shadow-raised">
          {/* Mobil marka bandı (primaryGradient) — panelin tek gradient yüzeyi. */}
          <div
            className="px-6 py-7"
            style={{
              background: 'linear-gradient(135deg, var(--banner-from), var(--banner-to))',
            }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-pill bg-on-primary/15">
              <span className="font-display text-sm font-extrabold text-on-primary">BS</span>
            </span>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-on-primary">
              Admin Girişi
            </h1>
            <p className="mt-1 text-sm text-on-primary/80">Beauty Salon Yönetim Paneli</p>
          </div>

          <div className="p-5 sm:p-6">
            {error ? (
              <div
                role="alert"
                className={cx(
                  'mb-4 flex items-start gap-3 rounded-field border border-error/30 bg-error/10 p-3 text-sm text-error'
                )}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="E-posta adresi" htmlFor="email" required>
                <Input
                  id="email"
                  icon={Mail}
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@beautysalon.com"
                />
              </Field>

              <Field label="Şifre" htmlFor="password" required>
                <Input
                  id="password"
                  icon={Lock}
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Giriş yapılıyor…
                  </>
                ) : (
                  'Giriş yap'
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
