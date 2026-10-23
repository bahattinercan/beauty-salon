/**
 * AP-004 — `components/shell/SideRail.tsx`
 *
 * Kapsam: geniş ekran gezinme rayı — `NAV_ITEMS`'ın tamamı (7 öğe) tek kaynaktan
 * basılır, aktif öğe `aria-current="page"`, oturum bilgisi `localStorage`'dan
 * okunur (baş harfler türetilir) ve çıkış `clearSession()` + `/login` yönlendirmesi
 * yapar. `next/navigation` mock'lanır; `src/**` değişmez.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navState = vi.hoisted(() => ({ pathname: '/salons' }));
const routerPush = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: routerPush, replace: vi.fn(), back: vi.fn() }),
}));

import SideRail from '@/components/shell/SideRail';
import ThemeProvider from '@/providers/ThemeProvider';
import { NAV_ITEMS } from '@/lib/nav';

function renderRail() {
  return render(
    <ThemeProvider>
      <SideRail />
    </ThemeProvider>
  );
}

describe('SideRail — gezinme', () => {
  test('"Ana gezinme" adlı nav içinde NAV_ITEMS\'ın tamamını sırayla basar', () => {
    navState.pathname = '/salons';
    renderRail();
    const nav = screen.getByRole('navigation', { name: 'Ana gezinme' });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(NAV_ITEMS.length);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(NAV_ITEMS.map((i) => i.href));
    expect(nav.contains(links[0])).toBe(true);
  });

  test('aktif öğe aria-current="page" taşır ve vurgu işaretini basar', () => {
    navState.pathname = '/appointments/42';
    renderRail();
    const active = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('aria-current') === 'page');
    expect(active.map((l) => l.getAttribute('href'))).toEqual(['/appointments']);
    expect(active[0].querySelector('.bg-accent-lime')).not.toBeNull();
  });

  test('pasif öğelerde aria-current ve vurgu işareti yoktur', () => {
    navState.pathname = '/users';
    renderRail();
    const salons = screen.getByRole('link', { name: /Salonlar/ });
    expect(salons.getAttribute('aria-current')).toBeNull();
    expect(salons.querySelector('.bg-accent-lime')).toBeNull();
  });

  test('ray içinde tema seçici bulunur (Tema radiogroup)', () => {
    navState.pathname = '/';
    renderRail();
    expect(screen.getByRole('radiogroup', { name: 'Tema' })).toBeTruthy();
  });
});

describe('SideRail — oturum', () => {
  test('kayıtlı kullanıcı yoksa "Admin" ve boş e-posta ile açılır', () => {
    navState.pathname = '/';
    renderRail();
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Çıkış yap' })).toBeTruthy();
  });

  test('localStorage kullanıcısından ad, e-posta ve baş harfler türetilir', () => {
    navState.pathname = '/';
    localStorage.setItem(
      'user',
      JSON.stringify({ fullName: 'ayşe yılmaz', email: 'ayse@salon.dev', role: 'ADMIN' })
    );
    renderRail();
    expect(screen.getByText('ayşe yılmaz')).toBeTruthy();
    expect(screen.getByText('ayse@salon.dev')).toBeTruthy();
    // Ad + soyad ilk harfleri büyük harfe çevrilir (2 karakter sınırı).
    expect(screen.getByText('AY')).toBeTruthy();
  });

  test('çıkış: oturum anahtarlarını siler ve /login\'e yönlendirir', async () => {
    navState.pathname = '/';
    localStorage.setItem('access_token', 'a');
    localStorage.setItem('refresh_token', 'r');
    localStorage.setItem('user', JSON.stringify({ fullName: 'Test', email: 't@x.dev' }));
    const user = userEvent.setup();
    renderRail();

    await user.click(screen.getByRole('button', { name: 'Çıkış yap' }));

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(routerPush).toHaveBeenCalledWith('/login');
  });
});
