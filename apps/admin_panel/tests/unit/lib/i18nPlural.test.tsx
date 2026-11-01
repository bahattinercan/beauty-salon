/**
 * AP-011 K4 — çoğul (plural) desteği, **render seviyesinde**.
 *
 * `tests/lib/i18n.test.ts` (node:test) çözümleme sözleşmesini kilitler; burada
 * aynı davranış `useI18n().t` üzerinden ve gerçek bir çağrı yerinde
 * (`components/ui/Pagination`) doğrulanır. Kapsam: (a) EN'de `count=1` tekil /
 * `count=2` çoğul, (b) TR'de iki sayıda da aynı metin, (c) çoğul çifti olmayan
 * anahtarın eski davranışı, (d) `{count}` yer tutucusunun metin içinde sayı
 * olarak kalması (sayı biçimi bozulmaz).
 *
 * jsdom `navigator.language` = 'en-US' olduğu için dil her render'da
 * `LocaleProvider initialMode` ile açıkça sabitlenir.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import Pagination from '@/components/ui/Pagination';
import LocaleProvider, { useI18n } from '@/providers/LocaleProvider';

/** Çeviri probu: sayfaların yaptığı gibi `t(key, vars)` çağırır. */
function Probe() {
  const { t } = useI18n();
  return (
    <ul>
      <li data-testid="reviews-1">{t('reviews.page.subtitle', { count: 1 })}</li>
      <li data-testid="reviews-2">{t('reviews.page.subtitle', { count: 2 })}</li>
      <li data-testid="users-1">{t('pages.users.subtitle', { count: 1 })}</li>
      <li data-testid="users-2">{t('pages.users.subtitle', { count: 2 })}</li>
      <li data-testid="services-1">{t('categories.card.serviceCount', { count: 1 })}</li>
      <li data-testid="services-2">{t('categories.card.serviceCount', { count: 2 })}</li>
      <li data-testid="stars">{t('reviews.rating.stars', { count: 5, rating: 5 })}</li>
    </ul>
  );
}

function renderWith(locale: 'tr' | 'en', ui: ReactElement) {
  return render(<LocaleProvider initialMode={locale}>{ui}</LocaleProvider>);
}

describe('çoğul (plural) — sözlük çözümlemesi', () => {
  test('en: count=1 tekil, count=2 çoğul metni basar', () => {
    renderWith('en', <Probe />);

    expect(screen.getByTestId('reviews-1').textContent).toBe('1 review');
    expect(screen.getByTestId('reviews-2').textContent).toBe('2 reviews');
    expect(screen.getByTestId('users-1').textContent).toBe('1 user');
    expect(screen.getByTestId('users-2').textContent).toBe('2 users');
    expect(screen.getByTestId('services-1').textContent).toBe('1 service');
    expect(screen.getByTestId('services-2').textContent).toBe('2 services');
  });

  test('tr: count=1 ve count=2 aynı metni basar (çekim yok)', () => {
    renderWith('tr', <Probe />);

    expect(screen.getByTestId('reviews-1').textContent).toBe('1 yorum');
    expect(screen.getByTestId('reviews-2').textContent).toBe('2 yorum');
    expect(screen.getByTestId('users-1').textContent).toBe('1 kullanıcı');
    expect(screen.getByTestId('users-2').textContent).toBe('2 kullanıcı');
    expect(screen.getByTestId('services-1').textContent).toBe('1 hizmet');
    expect(screen.getByTestId('services-2').textContent).toBe('2 hizmet');
  });

  test('çoğul çifti olmayan anahtar eski davranışta: yalnız yer tutucu dolar', () => {
    renderWith('en', <Probe />);
    expect(screen.getByTestId('stars').textContent).toBe('5 stars');
  });
});

describe('çoğul (plural) — gerçek çağrı yeri (Pagination toplamı)', () => {
  test('en: 1 → "1 record", 2 → "2 records"', () => {
    const { unmount } = renderWith(
      'en',
      <Pagination page={1} totalPages={2} total={1} onPage={() => {}} />
    );
    expect(screen.getByText('1 record')).toBeTruthy();
    unmount();

    renderWith('en', <Pagination page={1} totalPages={2} total={2} onPage={() => {}} />);
    expect(screen.getByText('2 records')).toBeTruthy();
  });

  test('tr: 1 → "1 kayıt", 2 → "2 kayıt" (aynı metin)', () => {
    const { unmount } = renderWith(
      'tr',
      <Pagination page={1} totalPages={2} total={1} onPage={() => {}} />
    );
    expect(screen.getByText('1 kayıt')).toBeTruthy();
    unmount();

    renderWith('tr', <Pagination page={1} totalPages={2} total={2} onPage={() => {}} />);
    expect(screen.getByText('2 kayıt')).toBeTruthy();
  });

  test('0 kayıtta sayı görünür kalır (çoğul + {count})', () => {
    renderWith('en', <Pagination page={1} totalPages={2} total={0} onPage={() => {}} />);
    expect(screen.getByText('0 records')).toBeTruthy();
  });
});
