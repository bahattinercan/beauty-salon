/**
 * AP-003 — `components/ui/Badge.tsx`
 *
 * Kapsam: ton → token sınıfı eşlemesi ve panelin durum sözlüklerinin
 * (`SALON_STATUS`, `APPOINTMENT_STATUS`, `USER_ROLE`) tek kaynaktan doğru
 * etiket/ton üretmesi. Bu sözlükler 3+ sayfada kullanılıyor; yanlış bir ton
 * eşlemesi durumu renk körü kullanıcı için ayırt edilemez kılar.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import Badge, {
  APPOINTMENT_STATUS,
  SALON_STATUS,
  StatusBadge,
  USER_ROLE,
} from '@/components/ui/Badge';

describe('Badge', () => {
  test('varsayılan ton "neutral" ve çocuk metni aynen basılır', () => {
    render(<Badge>Beklemede</Badge>);
    const el = screen.getByText('Beklemede');
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toContain('badge-neutral');
  });

  test('her ton kendi token sınıfına eşlenir (dark: varyantı YOK — AP-001 kuralı)', () => {
    const cases = [
      ['success', 'badge-success'],
      ['error', 'badge-error'],
      ['warning', 'badge-warning'],
      ['info', 'badge-info'],
      ['neutral', 'badge-neutral'],
    ] as const;

    for (const [tone, cls] of cases) {
      const { container, unmount } = render(<Badge tone={tone}>{tone}</Badge>);
      const el = container.firstElementChild as HTMLElement;
      expect(el.className).toContain(cls);
      expect(el.className).not.toContain('dark:');
      unmount();
    }
  });

  test('className verildiğinde ton sınıfı korunur, ek sınıf sona eklenir', () => {
    render(<Badge tone="info" className="extra-cls">x</Badge>);
    const el = screen.getByText('x');
    expect(el.className).toBe('badge-info extra-cls');
  });
});

describe('StatusBadge + durum sözlükleri', () => {
  test('SALON_STATUS: üç panel durumu beklenen etiket ve tonla eşlenir', () => {
    expect(SALON_STATUS['onaylı']).toEqual({ label: 'Onaylı', tone: 'success' });
    expect(SALON_STATUS['bekliyor']).toEqual({ label: 'Bekliyor', tone: 'warning' });
    expect(SALON_STATUS['pasif']).toEqual({ label: 'Pasif', tone: 'error' });
  });

  test('APPOINTMENT_STATUS: beş API enum değeri eksiksiz ve tonları ayrık', () => {
    expect(Object.keys(APPOINTMENT_STATUS).sort()).toEqual([
      'CANCELLED',
      'COMPLETED',
      'CONFIRMED',
      'NO_SHOW',
      'PENDING',
    ]);
    expect(APPOINTMENT_STATUS.PENDING).toEqual({ label: 'Bekliyor', tone: 'warning' });
    expect(APPOINTMENT_STATUS.COMPLETED.tone).toBe('success');
    expect(APPOINTMENT_STATUS.CANCELLED.tone).toBe('error');
    expect(APPOINTMENT_STATUS.NO_SHOW.tone).toBe('neutral');
  });

  test('USER_ROLE: ADMIN / SALON_OWNER / CUSTOMER etiketleri sabittir', () => {
    expect(USER_ROLE.ADMIN.label).toBe('Admin');
    expect(USER_ROLE.SALON_OWNER.label).toBe('Salon Sahibi');
    expect(USER_ROLE.CUSTOMER.label).toBe('Müşteri');
  });

  test('sözlükte bulunan değer için etiket + ton birlikte uygulanır', () => {
    render(<StatusBadge map={APPOINTMENT_STATUS} value="CONFIRMED" />);
    const el = screen.getByText('Onaylandı');
    expect(el.className).toContain('badge-info');
  });

  test('bilinmeyen değerde fallbackLabel kullanılır (ham enum sızmaz)', () => {
    render(<StatusBadge map={SALON_STATUS} value="arsivlenmis" fallbackLabel="Bilinmiyor" />);
    expect(screen.getByText('Bilinmiyor')).toBeTruthy();
    expect(screen.queryByText('arsivlenmis')).toBeNull();
  });

  test('bilinmeyen değer ve fallback yoksa ham değer neutral tonla gösterilir', () => {
    render(<StatusBadge map={SALON_STATUS} value="arsivlenmis" />);
    const el = screen.getByText('arsivlenmis');
    expect(el.className).toContain('badge-neutral');
  });
});
