/**
 * AP i18n — `app/login/page.tsx`
 *
 * Kapsam: Giriş sayfasının görünen metinleri `pages.login.*` anahtarlarından
 * gelir — (a) `initialMode="tr"` ile bugünkü Türkçe kopya basılır,
 * (b) `initialMode="en"` ile aynı alanlar İngilizce basılır (ham anahtar
 * görünmez). jsdom `navigator.language` 'en-US' olduğu için dil her testte
 * açıkça sabitlenir.
 *
 * `next/navigation` mock'lanır (ağ/davranış yok); `fetch` çağrılmaz çünkü test
 * yalnız render eder.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

import LoginPage from '@/app/login/page';
import LocaleProvider from '@/providers/LocaleProvider';
import ThemeProvider from '@/providers/ThemeProvider';

describe('LoginPage i18n', () => {
  test("tr modunda bugünkü Türkçe kopya basılır", () => {
    render(
      <LocaleProvider initialMode="tr">
        <ThemeProvider>
          <LoginPage />
        </ThemeProvider>
      </LocaleProvider>
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent?.trim()).toBe('Admin Girişi');
    expect(screen.getByText('Beauty Salon Yönetim Paneli')).toBeTruthy();
    expect(screen.getByLabelText(/E-posta adresi/)).toBeTruthy();
    expect(screen.getByLabelText(/Şifre/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeTruthy();
    expect(screen.getByText('Tema')).toBeTruthy();
  });

  test('en modunda metinler İngilizceye döner, ham anahtar görünmez', () => {
    render(
      <LocaleProvider initialMode="en">
        <ThemeProvider>
          <LoginPage />
        </ThemeProvider>
      </LocaleProvider>
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent?.trim()).toBe('Admin Login');
    expect(screen.getByText('Beauty Salon Management Panel')).toBeTruthy();
    expect(screen.getByLabelText(/Email address/)).toBeTruthy();
    expect(screen.getByLabelText(/Password/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.queryByText(/pages\.login\./)).toBeNull();
  });
});
