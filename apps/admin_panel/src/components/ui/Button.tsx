'use client';

import { cx } from '@/lib/cx';

type Variant = 'primary' | 'lime' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon' | 'icon-sm';

/**
 * AP-001: buton stilleri tek yerden. Marka dolgusunda metin HER ZAMAN
 * `text-on-primary`dir (dark temada marka açıldığı için `text-white` okunmaz —
 * bu hata sınıfını mobil plan CA-019 yakaladı).
 */
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-field font-semibold transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-solid text-on-primary hover:bg-primary-solid-hover',
  // Lime yalnızca dolgudur; üstündeki metin koyu token'dır.
  lime: 'bg-accent-lime text-on-accent-lime hover:brightness-95',
  outline: 'border border-border-strong bg-surface text-fg hover:bg-surface-variant',
  ghost: 'text-fg-muted hover:bg-surface-variant hover:text-fg',
  danger: 'border border-error/30 bg-error/10 text-error hover:bg-error/20',
};

const SIZES: Record<Size, string> = {
  // Dokunma hedefi: dar ekranda ≥44px (WCAG 2.2 hedef boyutu), geniş ekranda
  // tablo yoğunluğu için 40px'e iner.
  sm: 'h-11 px-3 text-sm md:h-10',
  md: 'h-11 px-4 text-sm',
  icon: 'h-11 w-11',
  'icon-sm': 'h-11 w-11 md:h-9 md:w-9',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    />
  );
}
