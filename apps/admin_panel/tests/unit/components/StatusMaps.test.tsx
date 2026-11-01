/**
 * AP-011 K3 — enum/harita kapsam kapısı (vitest).
 *
 * Kapanan delik: rol/durum değerleri sayfa başına ayrı haritalarla lokalize
 * ediliyordu; yeni bir API enum değeri eklendiğinde harita güncellenmezse
 * arayüzde HAM DEĞER görünüyordu. Bu dosya üç şeyi zorlar:
 *
 * (a) Her kanonik değerin (`src/lib/enums.ts`) haritada girdisi var — fazlası da
 *     kabul edilmez (harita = kanonik liste, ikinci bir liste değil).
 * (b) Her `labelKey` (rozet haritaları + `ROLE_LABEL_KEYS`) tr **ve** en
 *     sözlüğünde çözümleniyor (eksik anahtar `translate` tarafından anahtarın
 *     kendisi olarak döner, yani sessizce ham anahtar basılırdı).
 * (c) Haritada karşılığı olmayan değer görünür fallback üretiyor:
 *     `ui.badge.unknown` + değer parantez içinde; ham değer tek başına basılmaz.
 *
 * Derleme zamanı tarafı `satisfies Record<...>` ile `Badge.tsx` içinde:
 * eksik girdi `npm run typecheck`i kırar. Bu dosya derlemenin yakalayamadığını
 * (sözlük anahtarının gerçekten var olması, çalışma zamanı fallback'i) kapatır.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import LocaleProvider from '@/providers/LocaleProvider';
import { LOCALES, translate, type Locale } from '@/lib/i18n';
import {
  APPOINTMENT_STATUSES,
  SALON_STATUSES,
  USER_ROLES,
  type AppointmentStatus,
  type SalonStatus,
  type UserRole,
} from '@/lib/enums';
import {
  APPOINTMENT_STATUS,
  ROLE_LABEL_KEYS,
  SALON_STATUS,
  StatusBadge,
  USER_ROLE,
  localizeStatusMap,
  resolveStatusLabel,
  type StatusMapLike,
} from '@/components/ui/Badge';

/** `useI18n().t` yerine: saf çözümleyici, istenen dili sabitler. */
const tFor = (locale: Locale) => (key: string) => translate(locale, key);

const renderTr = (ui: ReactElement) =>
  render(<LocaleProvider initialMode="tr">{ui}</LocaleProvider>);

/** Harita → kanonik değer listesi karşılaştırması (fazla girdi de hata). */
const statusMaps: {
  name: string;
  values: readonly string[];
  map: StatusMapLike;
}[] = [
  { name: 'APPOINTMENT_STATUS', values: APPOINTMENT_STATUSES, map: APPOINTMENT_STATUS },
  { name: 'USER_ROLE', values: USER_ROLES, map: USER_ROLE },
  { name: 'SALON_STATUS', values: SALON_STATUSES, map: SALON_STATUS },
];

describe('enum haritaları: kanonik değerlerle birebir kapsam (a)', () => {
  for (const { name, values, map } of statusMaps) {
    test(`${name}: ${values.length} kanonik değerin tamamı haritada, fazlası yok`, () => {
      expect(Object.keys(map).sort()).toEqual([...values].sort());
    });
  }

  test('dört kanonik liste de boş değil ve tekil', () => {
    for (const values of [APPOINTMENT_STATUSES, USER_ROLES, SALON_STATUSES]) {
      expect(values.length).toBeGreaterThan(0);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  test('ROLE_LABEL_KEYS her rol için tek bir sözlük anahtarı taşır', () => {
    expect(Object.keys(ROLE_LABEL_KEYS).sort()).toEqual([...USER_ROLES].sort());
    for (const role of USER_ROLES) {
      expect(ROLE_LABEL_KEYS[role]).toMatch(/^pages\.users\.roles\./);
    }
  });
});

describe('labelKey → tr/en sözlüğü (b)', () => {
  const labelKeys = [
    ...Object.values(APPOINTMENT_STATUS).map((meta) => meta.labelKey),
    ...Object.values(USER_ROLE).map((meta) => meta.labelKey),
    ...Object.values(SALON_STATUS).map((meta) => meta.labelKey),
    ...Object.values(ROLE_LABEL_KEYS),
  ];

  test('toplanan anahtar sayısı kanonik listelerle tutarlı', () => {
    expect(labelKeys).toHaveLength(
      APPOINTMENT_STATUSES.length + USER_ROLES.length + SALON_STATUSES.length + USER_ROLES.length
    );
  });

  test('her anahtar iki dilde de çözümleniyor (eksik anahtar ham anahtar olarak döner)', () => {
    for (const key of labelKeys) {
      for (const locale of LOCALES) {
        expect(translate(locale, key), `${locale}: ${key} sözlükte yok`).not.toBe(key);
      }
    }
  });

  test('bilinmeyen değer etiketi de iki dilde var', () => {
    expect(translate('tr', 'ui.badge.unknown')).toBe('Bilinmiyor');
    expect(translate('en', 'ui.badge.unknown')).toBe('Unknown');
  });
});

describe('görünür fallback (c)', () => {
  test('haritada olmayan değer: unknown etiketi + değer parantez içinde (tr/en)', () => {
    const partial: StatusMapLike = { PENDING: APPOINTMENT_STATUS.PENDING };

    expect(resolveStatusLabel(partial, 'REFUNDED', tFor('tr'))).toBe('Bilinmiyor (REFUNDED)');
    expect(resolveStatusLabel(partial, 'REFUNDED', tFor('en'))).toBe('Unknown (REFUNDED)');
    // Ham değer tek başına dönmez.
    expect(resolveStatusLabel(partial, 'REFUNDED', tFor('tr'))).not.toBe('REFUNDED');
  });

  test('harita girdisi var ama sözlük anahtarı yoksa da ham anahtar basılmaz', () => {
    const brokenKey: StatusMapLike = {
      PENDING: { labelKey: 'ui.badge.appointment.SILINMIS', tone: 'warning' },
    };
    expect(resolveStatusLabel(brokenKey, 'PENDING', tFor('tr'))).toBe(
      'Bilinmiyor (PENDING)'
    );
  });

  test('bilinen değerde davranış değişmedi: sözlükten gelen etiket aynen basılır', () => {
    expect(resolveStatusLabel(APPOINTMENT_STATUS, 'CONFIRMED', tFor('tr'))).toBe('Onaylandı');
    expect(resolveStatusLabel(APPOINTMENT_STATUS, 'NO_SHOW', tFor('en'))).toBe('No-show');
    expect(resolveStatusLabel(USER_ROLE, 'SALON_OWNER', tFor('tr'))).toBe('Salon Sahibi');
  });

  test('StatusBadge bilinmeyen değeri neutral tonla ve fallback metniyle basar', () => {
    renderTr(<StatusBadge map={SALON_STATUS} value="arsivlenmis" />);
    const el = screen.getByText('Bilinmiyor (arsivlenmis)');
    expect(el.className).toContain('badge-neutral');
    expect(screen.queryByText('arsivlenmis')).toBeNull();
  });
});

describe('localizeStatusMap: sayfa haritaları tek yerden üretilir', () => {
  test('kanonik değerlerin tamamı çözülür, hiçbir girdi düşmez', () => {
    const localized = localizeStatusMap(APPOINTMENT_STATUS, tFor('tr'));
    expect(Object.keys(localized).sort()).toEqual([...APPOINTMENT_STATUSES].sort());
    expect(localized.CONFIRMED).toEqual({ label: 'Onaylandı', tone: 'info' });
  });

  test('labelKeys verilirse etiket o sözlükten okunur (pages.users.roles.*)', () => {
    const localized = localizeStatusMap(USER_ROLE, tFor('tr'), ROLE_LABEL_KEYS);
    expect(localized.ADMIN.label).toBe('Admin');
    expect(localized.SALON_OWNER.label).toBe('Salon Sahibi');
    // Ton değişmez: rozet rengi tek kaynaktan gelir.
    expect(localized.ADMIN.tone).toBe(USER_ROLE.ADMIN.tone);
  });
});

describe('kanonik tipler kullanım yerlerinde korunur', () => {
  test('AppointmentStatus / UserRole / SalonStatus literal kümeleri', () => {
    // Tip düzeyi kontrol: aşağıdaki atamalar derlenmiyorsa tip listesi daralmıştır.
    const appointment: AppointmentStatus = 'NO_SHOW';
    const role: UserRole = 'SALON_OWNER';
    const salon: SalonStatus = 'bekliyor';

    expect(APPOINTMENT_STATUSES).toContain(appointment);
    expect(USER_ROLES).toContain(role);
    expect(SALON_STATUSES).toContain(salon);
  });
});
