'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type Theme } from '@/providers/ThemeProvider';

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Açık', Icon: Sun },
  { value: 'dark', label: 'Koyu', Icon: Moon },
  { value: 'system', label: 'Sistem', Icon: Monitor },
];

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, mounted } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={`flex items-center gap-1 rounded-xl border border-border bg-surface-variant p-1 ${className}`}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`flex flex-1 items-center justify-center rounded-lg p-2 transition-colors ${
              active
                ? 'bg-surface text-primary shadow-sm dark:shadow-none'
                : 'text-fg-subtle hover:text-fg-muted'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
