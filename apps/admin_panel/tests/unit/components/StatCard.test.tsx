/**
 * AP-004 — `components/ui/StatCard.tsx`
 *
 * Kapsam: dashboard özet kartının sayı/etiket/ipucu sözleşmesi ve `delta`
 * işaretinin renk + ikonla **birlikte** kodlanması (renk körü kullanıcı için
 * tek başına renk yeterli değil). Ton → token eşlemesi `dark:` varyantı
 * yazmadan iki temada da okunur kalmalı (AP-001 kuralı).
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';

import StatCard from '@/components/ui/StatCard';

describe('StatCard', () => {
  test('etiket ve değeri basar, değer tabular-nums ile hizalanır', () => {
    render(<StatCard label="Toplam kullanıcı" value={1234} />);
    expect(screen.getByText('Toplam kullanıcı').tagName).toBe('P');
    const value = screen.getByText('1234');
    expect(value.className).toContain('tnum');
    expect(value.className).toContain('font-display');
  });

  test('metin değeri (ör. para birimi) olduğu gibi yazılır', () => {
    render(<StatCard label="Ciro" value="₺12.500" />);
    expect(screen.getByText('₺12.500')).toBeTruthy();
  });

  test('hint opsiyoneldir; verilmezse ek paragraf çizilmez', () => {
    const { unmount } = render(<StatCard label="Salon" value={8} hint="3 onay bekliyor" />);
    expect(screen.getByText('3 onay bekliyor')).toBeTruthy();
    unmount();

    render(<StatCard label="Salon" value={8} />);
    expect(screen.queryByText('3 onay bekliyor')).toBeNull();
  });

  test('pozitif delta "+" ile ve success tonuyla gösterilir', () => {
    render(<StatCard label="Randevu" value={42} delta={12} />);
    const delta = screen.getByText('+12%');
    expect(delta.closest('p')?.className).toContain('text-success');
  });

  test('negatif delta eksi işaretiyle ve error tonuyla gösterilir', () => {
    render(<StatCard label="İptal" value={3} delta={-4} />);
    const delta = screen.getByText('-4%');
    expect(delta.closest('p')?.className).toContain('text-error');
  });

  test('delta=null/undefined iken delta satırı hiç çizilmez', () => {
    const first = render(<StatCard label="Yorum" value={0} delta={null} />);
    expect(first.container.textContent).not.toContain('%');
    expect(first.container.querySelector('svg')).toBeNull();
    first.unmount();

    const second = render(<StatCard label="Yorum" value={0} />);
    expect(second.container.textContent).not.toContain('%');
  });

  test('ikon verildiğinde ton → token sınıfı uygulanır ve ikon aria-hidden kalır', () => {
    const { container } = render(
      <StatCard label="Kullanıcı" value={10} icon={Users} tone="warning" />
    );
    const slot = container.querySelector('span.grid');
    expect(slot?.className).toContain('bg-warning/16');
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  test('ikon verilmezse ikon yuvası çizilmez', () => {
    const { container } = render(<StatCard label="Kullanıcı" value={10} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
