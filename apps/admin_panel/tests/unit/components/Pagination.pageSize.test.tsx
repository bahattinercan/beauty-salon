/**
 * AP-007 W2 — `components/ui/Pagination.tsx` genişlemesi (D4: geriye uyumlu).
 *
 * `Pagination.test.tsx` (AP-003/AP-004) mevcut davranışı kilitliyor ve ona
 * dokunulmuyor; bu dosya aynı bileşenin YENİ prop'larını ve eski prop'larla
 * davranışın gerçekten değişmediğini birlikte doğrular — dört sayfa
 * (users/appointments/reviews/salons) aynı bileşeni paylaşıyor.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Pagination, { PAGE_SIZE_OPTIONS } from '@/components/ui/Pagination';

describe('Pagination — yeni sayfa boyutu denetimi (AP-007)', () => {
  test('PAGE_SIZE_OPTIONS H3 ile birebir: 20/50/100', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([20, 50, 100]);
  });

  test('total + pageSize aralık metni basar: 21–40 / 87', () => {
    render(
      <Pagination page={2} totalPages={5} onPage={() => {}} total={87} pageSize={20} />
    );
    expect(screen.getByText('21–40 / 87')).toBeTruthy();
    // Aralık metni varsa eski "Sayfa x / y" metni basılmaz (çift sayaç yok).
    expect(screen.queryByText(/Sayfa \d+ \/ \d+/)).toBeNull();
  });

  test('ilk sayfa 1–20 / 87, son sayfa 81–87 / 87 (üst sınır kırpılır)', () => {
    const { unmount } = render(
      <Pagination page={1} totalPages={5} onPage={() => {}} total={87} pageSize={20} />
    );
    expect(screen.getByText('1–20 / 87')).toBeTruthy();
    unmount();

    render(<Pagination page={5} totalPages={5} onPage={() => {}} total={87} pageSize={20} />);
    expect(screen.getByText('81–87 / 87')).toBeTruthy();
  });

  test('boş sonuçta aralık metriği 0–0 / 0 olur', () => {
    render(<Pagination page={1} totalPages={0} onPage={() => {}} total={0} pageSize={20} />);
    expect(screen.getByText('0–0 / 0')).toBeTruthy();
  });

  test('sayfa boyutu seçici erişilebilir adla basılır ve 20/50/100 sunar', () => {
    render(
      <Pagination
        page={1}
        totalPages={5}
        onPage={() => {}}
        total={87}
        pageSize={20}
        onPageSize={() => {}}
      />
    );
    const select = screen.getByLabelText('Sayfa başına kayıt');
    expect(select.tagName).toBe('SELECT');
    expect((select as HTMLSelectElement).value).toBe('20');
    for (const option of ['20', '50', '100']) {
      expect(screen.getByRole('option', { name: option })).toBeTruthy();
    }
  });

  test('seçim onPageSize ile sayı olarak bildirilir (limit query için string değil)', async () => {
    const onPageSize = vi.fn();
    render(
      <Pagination
        page={3}
        totalPages={5}
        onPage={() => {}}
        total={87}
        pageSize={20}
        onPageSize={onPageSize}
      />
    );
    await userEvent.selectOptions(screen.getByLabelText('Sayfa başına kayıt'), '50');
    expect(onPageSize.mock.calls).toEqual([[50]]);
  });

  test('pageSizeOptions özelleştirilebilir', async () => {
    const onPageSize = vi.fn();
    render(
      <Pagination
        page={1}
        totalPages={9}
        onPage={() => {}}
        total={250}
        pageSize={10}
        pageSizeOptions={[10, 25]}
        onPageSize={onPageSize}
      />
    );
    expect(screen.queryByRole('option', { name: '100' })).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText('Sayfa başına kayıt'), '25');
    expect(onPageSize.mock.calls).toEqual([[25]]);
  });

  test('tek sayfada bile sayfa boyutu seçici görünür kalır (okler devre dışı)', () => {
    render(
      <Pagination
        page={1}
        totalPages={1}
        onPage={() => {}}
        total={87}
        pageSize={100}
        onPageSize={() => {}}
      />
    );
    expect(screen.getByLabelText('Sayfa başına kayıt')).toBeTruthy();
    expect(screen.getByText('1–87 / 87')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Sonraki sayfa' }).hasAttribute('disabled')
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Önceki sayfa' }).hasAttribute('disabled')
    ).toBe(true);
  });

  test('yeni modda gezinme okları eski anlamıyla çalışmaya devam eder', async () => {
    const onPage = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination
        page={2}
        totalPages={5}
        onPage={onPage}
        total={87}
        pageSize={20}
        onPageSize={() => {}}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Sonraki sayfa' }));
    await user.click(screen.getByRole('button', { name: 'Önceki sayfa' }));
    expect(onPage.mock.calls).toEqual([[3], [1]]);
  });

  test('total verilip pageSize verilmezse tek bir toplam metni basılır, uydurma aralık yok', () => {
    render(<Pagination page={1} totalPages={9} onPage={() => {}} total={250} />);
    expect(screen.getByText('250 kayıt')).toBeTruthy();
    expect(screen.queryByText(/–/)).toBeNull();
  });

  // --- regresyon kilidi: eski prop kümesiyle çıktı değişmemeli (R4) ---

  test('eski prop’larla yeni kontrol basılmaz: select yok, sayfa sayacı aynen', () => {
    const { container } = render(<Pagination page={2} totalPages={5} onPage={() => {}} />);
    expect(container.querySelector('select')).toBeNull();
    expect(screen.getByText('Sayfa 2 / 5')).toBeTruthy();
  });

  test('eski prop’larla tek sayfada hâlâ hiçbir şey render edilmez', () => {
    for (const totalPages of [1, 0, -3]) {
      const { container, unmount } = render(
        <Pagination page={1} totalPages={totalPages} onPage={() => {}} />
      );
      expect(container.innerHTML).toBe('');
      unmount();
    }
  });
});
