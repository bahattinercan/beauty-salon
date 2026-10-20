'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cx } from '@/lib/cx';
import Button from '@/components/ui/Button';

/** categories sayfasındaki satır içi modalin erişilebilir hâli. */
export default function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default bg-fg/45"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative mx-auto my-4 w-full rounded-card border border-border bg-surface shadow-raised',
          width
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-6">
          <h2 className="font-display text-lg font-bold text-fg">{title}</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Kapat">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4 sm:p-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
