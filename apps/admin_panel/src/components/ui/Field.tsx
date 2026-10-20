'use client';

import { cx } from '@/lib/cx';
import type { LucideIcon } from 'lucide-react';

/** Etiket + açıklama + hata; tüm formların tek ölçüsü. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-fg">
        {label}
        {required ? <span className="ml-1 text-error">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : hint ? (
        <p className="text-sm text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'min-h-11 w-full rounded-field border border-border-strong bg-surface px-3 text-sm text-fg ' +
  'placeholder:text-fg-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export function Input({
  icon: Icon,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }) {
  if (!Icon) return <input className={cx(CONTROL, className)} {...rest} />;
  return (
    <div className={cx('relative', className)}>
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
      <input className={cx(CONTROL, 'pl-9')} {...rest} />
    </div>
  );
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(CONTROL, 'appearance-none pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CONTROL, 'min-h-24 py-2', className)} {...rest} />;
}

/**
 * Ayarlar sayfasının anahtarı. Dokunma hedefi ≥44px olsun diye tıklanabilir
 * öğe 44px yüksekliğinde bir butondur; 28px'lik görsel ray içindedir.
 */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-14 shrink-0 items-center justify-start"
    >
      <span
        className={cx(
          'relative block h-7 w-12 rounded-pill transition-colors',
          checked ? 'bg-success' : 'bg-border-strong'
        )}
        aria-hidden
      >
        <span
          className={cx(
            'absolute left-0.5 top-0.5 h-6 w-6 rounded-pill bg-surface shadow-card transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </span>
    </button>
  );
}
