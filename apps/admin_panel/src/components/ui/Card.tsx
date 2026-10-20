import { cx } from '@/lib/cx';

/** Yüzey hiyerarşisi: background < surface < surface-variant (ayrım ≥1.1). */
export function Card({
  className,
  as: Tag = 'div',
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' | 'article' }) {
  return (
    <Tag
      className={cx('rounded-card border border-border bg-surface shadow-card', className)}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6', className)}>
      <div className="min-w-0">
        <h2 className="font-display text-base font-bold text-fg sm:text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('p-4 pt-0 sm:p-6 sm:pt-0', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-6', className)}
      {...rest}
    />
  );
}
