import { cx } from '@/lib/cx';

/**
 * Sayfa başlığının tek hâli. Eskiden 8 sayfada kopyalanmıştı ve sayfada iki
 * `h1` vardı (yan menünün marka yazısı + sayfa başlığı) — burada marka `div`,
 * başlık tek `h1`dir.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('mb-5 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-extrabold text-fg sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-fg-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
