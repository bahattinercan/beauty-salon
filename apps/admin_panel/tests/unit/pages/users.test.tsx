/**
 * AP-011 — `app/users/page.tsx`
 *
 * Kapsam: Kullanıcı Yönetimi sayfasının görünen metinleri (`pages.users.*`) ve
 * `createdAt` tarih biçimlendirmesi aktif `locale` ile çalışır:
 *  - `initialMode="tr"` iken Türkçe başlık/etiketler ve `20 Eylül 2026`,
 *  - `initialMode="en"` iken İngilizce başlık/etiketler ve `September 20, 2026`.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));

vi.mock('@/lib/api', () => ({ apiFetch: apiFetchMock, uploadFile: vi.fn() }));

import UsersPage from '@/app/users/page';
import LocaleProvider from '@/providers/LocaleProvider';

const apiUsers = [
  {
    id: 'user-1',
    fullName: 'Zeynep Kaya',
    email: 'zeynep@test.com',
    phone: '+90 532 000 00 00',
    role: 'SALON_OWNER' as const,
    isActive: true,
    isVerified: true,
    createdAt: '2026-09-20T08:30:00.000Z',
  },
];

describe('UsersPage i18n ve tarih biçimlendirmesi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({
      success: true,
      data: {
        data: apiUsers,
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    });
  });

  test('tr modunda Türkçe metinler ve Türkçe uzun tarih basılır', async () => {
    render(
      <LocaleProvider initialMode="tr">
        <UsersPage />
      </LocaleProvider>
    );

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { name: 'Kullanıcı Yönetimi' })).toBeTruthy();
    expect(screen.getByText('1 kullanıcı')).toBeTruthy();

    const table = screen.getByRole('table');
    expect(within(table).getByText('Zeynep Kaya')).toBeTruthy();
    expect(within(table).getByText('Salon Sahibi')).toBeTruthy();
    expect(within(table).getByText('20 Eylül 2026')).toBeTruthy();
    expect(within(table).queryByText('September 20, 2026')).toBeNull();
  });

  test('en modunda İngilizce metinler ve İngilizce uzun tarih basılır', async () => {
    render(
      <LocaleProvider initialMode="en">
        <UsersPage />
      </LocaleProvider>
    );

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { name: 'User Management' })).toBeTruthy();
    // AP-011 K4: tek kayıtta EN çoğul varyantı (`pages.users.subtitle_one`) devreye girer.
    expect(screen.getByText('1 user')).toBeTruthy();

    const table = screen.getByRole('table');
    expect(within(table).getByText('Zeynep Kaya')).toBeTruthy();
    expect(within(table).getByText('Salon Owner')).toBeTruthy();
    expect(within(table).getByText('September 20, 2026')).toBeTruthy();
    expect(within(table).queryByText('20 Eylül 2026')).toBeNull();
  });
});
