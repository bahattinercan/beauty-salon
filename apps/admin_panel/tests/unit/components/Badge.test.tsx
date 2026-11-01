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
import { translate } from '@/lib/i18n';

import LocaleProvider from '@/providers/LocaleProvider';
import type { ReactElement } from 'react';

/**
 * Bileşen kendi sabit metinlerini sözlükten (`ui.*`) basar; testler bugünkü
 * Türkçe kopyayı görsün diye her render `LocaleProvider initialMode="tr"` ile
 * sarmalanır (jsdom `navigator.language` = 'en-US' olduğu için 'system' modu
 * İngilizceye düşerdi).
 */
const renderTr = (ui: ReactElement) =>
  render(<LocaleProvider initialMode="tr">{ui}</LocaleProvider>);

describe('Badge', () => {
  test('varsayılan ton "neutral" ve çocuk metni aynen basılır', () => {
    renderTr(<Badge>Beklemede</Badge>);
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
      const { container, unmount } = renderTr(<Badge tone={tone}>{tone}</Badge>);
      const el = container.firstElementChild as HTMLElement;
      expect(el.className).toContain(cls);
      expect(el.className).not.toContain('dark:');
      unmount();
    }
  });

  test('className verildiğinde ton sınıfı korunur, ek sınıf sona eklenir', () => {
    renderTr(<Badge tone="info" className="extra-cls">x</Badge>);
    const el = screen.getByText('x');
    expect(el.className).toBe('badge-info extra-cls');
  });
});

describe('StatusBadge + durum sözlükleri', () => {
  test('SALON_STATUS: üç panel durumu beklenen anahtar ve tonla eşlenir', () => {
    expect(SALON_STATUS['onaylı']).toEqual({ labelKey: 'ui.badge.salon.approved', tone: 'success' });
    expect(SALON_STATUS['bekliyor']).toEqual({ labelKey: 'ui.badge.salon.pending', tone: 'warning' });
    expect(SALON_STATUS['pasif']).toEqual({ labelKey: 'ui.badge.salon.passive', tone: 'error' });
    // Etiket metni haritada DEĞİL sözlükte durur (harita dile bağlı olmayan saf veri).
    expect(translate('tr', SALON_STATUS['onaylı'].labelKey)).toBe('Onaylı');
    expect(translate('en', SALON_STATUS['onaylı'].labelKey)).toBe('Approved');
  });

  test('APPOINTMENT_STATUS: beş API enum değeri eksiksiz ve tonları ayrık', () => {
    expect(Object.keys(APPOINTMENT_STATUS).sort()).toEqual([
      'CANCELLED',
      'COMPLETED',
      'CONFIRMED',
      'NO_SHOW',
      'PENDING',
    ]);
    expect(APPOINTMENT_STATUS.PENDING).toEqual({
      labelKey: 'ui.badge.appointment.PENDING',
      tone: 'warning',
    });
    expect(translate('tr', APPOINTMENT_STATUS.PENDING.labelKey)).toBe('Bekliyor');
    expect(translate('tr', APPOINTMENT_STATUS.NO_SHOW.labelKey)).toBe('Gelmedi');
    expect(APPOINTMENT_STATUS.COMPLETED.tone).toBe('success');
    expect(APPOINTMENT_STATUS.CANCELLED.tone).toBe('error');
    expect(APPOINTMENT_STATUS.NO_SHOW.tone).toBe('neutral');
  });

  test('USER_ROLE: ADMIN / SALON_OWNER / CUSTOMER anahtarları sabittir', () => {
    expect(USER_ROLE.ADMIN.labelKey).toBe('ui.badge.role.ADMIN');
    expect(USER_ROLE.SALON_OWNER.labelKey).toBe('ui.badge.role.SALON_OWNER');
    expect(USER_ROLE.CUSTOMER.labelKey).toBe('ui.badge.role.CUSTOMER');
    expect(translate('tr', USER_ROLE.ADMIN.labelKey)).toBe('Admin');
    expect(translate('tr', USER_ROLE.SALON_OWNER.labelKey)).toBe('Salon Sahibi');
    expect(translate('tr', USER_ROLE.CUSTOMER.labelKey)).toBe('Müşteri');
  });

  test('sözlükte bulunan değer için etiket + ton birlikte uygulanır', () => {
    renderTr(<StatusBadge map={APPOINTMENT_STATUS} value="CONFIRMED" />);
    const el = screen.getByText('Onaylandı');
    expect(el.className).toContain('badge-info');
  });

  test('bilinmeyen değerde fallbackLabel + ham değer parantez içinde gösterilir', () => {
    renderTr(<StatusBadge map={SALON_STATUS} value="arsivlenmis" fallbackLabel="Bilinmiyor" />);
    expect(screen.getByText('Bilinmiyor (arsivlenmis)')).toBeTruthy();
    expect(screen.queryByText('arsivlenmis')).toBeNull();
  });

  test('bilinmeyen değer ham enum olarak DEĞİL, ui.badge.unknown + değer olarak gösterilir', () => {
    renderTr(<StatusBadge map={SALON_STATUS} value="arsivlenmis" />);
    const el = screen.getByText('Bilinmiyor (arsivlenmis)');
    expect(el.className).toContain('badge-neutral');
    // Ham değer tek başına hiçbir düğümde basılmaz (AP-011 K3).
    expect(screen.queryByText('arsivlenmis')).toBeNull();
  });
});
