/**
 * AP-003 — `components/ui/Pagination.tsx`
 *
 * Kapsam: tek sayfada hiç render edilmemesi, sınır sayfalarda okların devre
 * dışı kalması ve tıklamaların `onPage` ile doğru hedefi bildirmesi. Sınır
 * hatası (1. sayfada "önceki") API'ye `page=0` isteği üretir.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Pagination from '@/components/ui/Pagination';

describe('Pagination', () => {
  test('totalPages <= 1 iken hiçbir şey render etmez', () => {
    for (const totalPages of [1, 0, -3]) {
      const { container, unmount } = render(
        <Pagination page={1} totalPages={totalPages} onPage={() => {}} />
      );
      expect(container.innerHTML).toBe('');
      unmount();
    }
  });

  test('sayfa sayacını ve iki gezinme düğmesini erişilebilir adlarıyla basar', () => {
    render(<Pagination page={2} totalPages={5} onPage={() => {}} />);
    expect(screen.getByText('Sayfa 2 / 5')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Önceki sayfa' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sonraki sayfa' })).toBeTruthy();
  });

  test('ilk sayfada "önceki" devre dışı, "sonraki" etkin', () => {
    render(<Pagination page={1} totalPages={5} onPage={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Önceki sayfa' }).hasAttribute('disabled')
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Sonraki sayfa' }).hasAttribute('disabled')
    ).toBe(false);
  });

  test('son sayfada "sonraki" devre dışı kalır (sayfa taşması yok)', () => {
    render(<Pagination page={5} totalPages={5} onPage={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Sonraki sayfa' }).hasAttribute('disabled')
    ).toBe(true);
  });

  test('tıklamalar komşu sayfayı bildirir (page-1 / page+1)', async () => {
    const onPage = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={3} totalPages={5} onPage={onPage} />);

    await user.click(screen.getByRole('button', { name: 'Sonraki sayfa' }));
    await user.click(screen.getByRole('button', { name: 'Önceki sayfa' }));

    expect(onPage.mock.calls).toEqual([[4], [2]]);
  });
});
