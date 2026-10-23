/**
 * AP-004 — `components/shell/PageHeader.tsx`
 *
 * Kapsam: sayfa başlığının **tek `h1`** kuralı (AP-001'de 8 sayfada iki `h1`
 * vardı: marka yazısı + sayfa başlığı). `PageHeader` başlığı `h1` olarak
 * basar, alt başlık ve eylem yuvası opsiyoneldir.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import PageHeader from '@/components/shell/PageHeader';

describe('PageHeader', () => {
  test('başlığı tek h1 olarak basar', () => {
    render(<PageHeader title="Salonlar" />);
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(1);
    expect(headings[0].tagName).toBe('H1');
    expect(headings[0].textContent).toBe('Salonlar');
  });

  test('alt başlık verilmezse paragraf çizilmez', () => {
    const { unmount } = render(<PageHeader title="Kullanıcılar" subtitle="128 kayıt" />);
    expect(screen.getByText('128 kayıt').tagName).toBe('P');
    unmount();

    render(<PageHeader title="Kullanıcılar" />);
    expect(screen.queryByText('128 kayıt')).toBeNull();
  });

  test('eylem yuvası verilen düğümleri render eder ve ek sınıf köke eklenir', () => {
    const { container } = render(
      <PageHeader
        title="Randevular"
        className="mb-8"
        actions={<button type="button">Yeni randevu</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Yeni randevu' })).toBeTruthy();
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('mb-5');
    expect(root.className.endsWith('mb-8')).toBe(true);
  });

  test('eylem yuvası boşken fazladan sarmalayıcı üretmez', () => {
    const { container } = render(<PageHeader title="Ayarlar" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.children).toHaveLength(1);
  });
});
