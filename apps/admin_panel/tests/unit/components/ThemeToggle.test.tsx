/**
 * AP-003 — `components/ThemeToggle.tsx`
 *
 * Kapsam: `role=radiogroup` sözleşmesi, başlangıç temasının localStorage'dan
 * okunması ve seçimin `app_theme` anahtarına yazılması. `src/` değişmez:
 * bileşen gerçek `ThemeProvider` ile sarılır, yalnız jsdom'un sağlamadığı
 * `matchMedia` `tests/unit/setup.ts` içinde stub'lanır.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ThemeToggle from '@/components/ThemeToggle';
import ThemeProvider, { THEME_STORAGE_KEY } from '@/providers/ThemeProvider';

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  test('"Tema" adlı radiogroup içinde üç seçenek sunar (Açık/Koyu/Sistem)', () => {
    renderToggle();
    expect(screen.getByRole('radiogroup', { name: 'Tema' })).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Açık',
      'Koyu',
      'Sistem',
    ]);
  });

  test('kayıt yokken varsayılan tema "Sistem" seçili gelir', () => {
    renderToggle();
    expect(screen.getByRole('radio', { name: 'Sistem' }).getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(screen.getByRole('radio', { name: 'Açık' }).getAttribute('aria-checked')).toBe(
      'false'
    );
  });

  test('kayıtlı tema "light" ise açılışta "Açık" seçili olur', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    renderToggle();
    expect(screen.getByRole('radio', { name: 'Açık' }).getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  test('"Koyu"ya tıklamak seçimi değiştirir ve app_theme anahtarına yazar', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('radio', { name: 'Koyu' }));

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Koyu' }).getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(screen.getByRole('radio', { name: 'Sistem' }).getAttribute('aria-checked')).toBe(
      'false'
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
