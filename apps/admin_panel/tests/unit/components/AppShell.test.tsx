/**
 * AP-004 — `components/shell/AppShell.tsx`
 *
 * Kapsam: kabuğun iki modu. `/login` **yalın** modda render edilir (ray, pill nav
 * ve çekmece yok — giriş ekranında gezinme sızdırmamalı); diğer yollarda
 * `SideRail` + `BottomPillNav` + `MobileDrawer` birlikte kurulur ve header'daki
 * "Menüyü aç" düğmesi çekmeceyi açar (`aria-expanded` senkron kalır).
 *
 * `next/navigation` ve `@/providers/DashboardProvider` bu testte mock'lanır:
 * gerçek provider mount'ta `/admin/dashboard` çağrısı yapar (ağ yok kuralı).
 * `src/**` değişmez.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navState = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/providers/DashboardProvider', () => ({
  DashboardProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDashboard: () => ({ data: null, loading: false, error: null, refetch: () => {} }),
}));

import AppShell from '@/components/shell/AppShell';
import ThemeProvider from '@/providers/ThemeProvider';

function renderShell(children: React.ReactNode = <p>sayfa içeriği</p>) {
  return render(
    <ThemeProvider>
      <AppShell>{children}</AppShell>
    </ThemeProvider>
  );
}

describe('AppShell — /login yalın modu', () => {
  test('giriş yolunda yalnız main basılır; gezinme ve çekmece yoktur', () => {
    navState.pathname = '/login';
    renderShell(<p>giriş formu</p>);

    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Menüyü aç' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();

    const main = screen.getByRole('main');
    expect(main.className).toContain('bg-background');
    expect(screen.getByText('giriş formu')).toBeTruthy();
    expect(main.contains(screen.getByText('giriş formu'))).toBe(true);
  });
});

describe('AppShell — panel modu', () => {
  test('sol ray, alt pill nav ve header aynı anda kurulur', () => {
    navState.pathname = '/';
    renderShell();

    expect(screen.getByRole('complementary')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Ana gezinme' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Hızlı gezinme' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Menüyü aç' })).toBeTruthy();
  });

  test('children main içinde render edilir', () => {
    navState.pathname = '/salons';
    renderShell(<p>salon listesi</p>);
    const main = screen.getByRole('main');
    expect(main.contains(screen.getByText('salon listesi'))).toBe(true);
  });

  test('"Menüyü aç" çekmeceyi açar ve aria-expanded senkronlanır', async () => {
    navState.pathname = '/';
    const user = userEvent.setup();
    renderShell();

    const trigger = screen.getByRole('button', { name: 'Menüyü aç' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('dialog', { name: 'Gezinme menüsü' })).toBeNull();

    await user.click(trigger);

    expect(
      screen.getByRole('button', { name: 'Menüyü aç' }).getAttribute('aria-expanded')
    ).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Gezinme menüsü' })).toBeTruthy();
  });

  test('çekmecedeki X düğmesi çekmeceyi kapatır (aria-expanded geri döner)', async () => {
    navState.pathname = '/';
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }));
    await user.click(screen.getByRole('button', { name: 'Kapat' }));

    expect(screen.queryByRole('dialog', { name: 'Gezinme menüsü' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Menüyü aç' }).getAttribute('aria-expanded')
    ).toBe('false');
  });
});
