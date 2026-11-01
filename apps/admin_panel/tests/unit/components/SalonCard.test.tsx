/**
 * AP-004 — `components/ui/SalonCard.tsx`
 *
 * Kapsam: salon kartının içerik sözleşmesi ve **fotoğrafsız** durumun tasarım
 * boşluğuna düşmemesi (CA-019 WP0 dersi): `SalonMedia` ya gerçek `<img>` ya da
 * deterministik token gradyanı + `role="img"` yerine geçen etiket basar.
 * Ayrıca durum rozetinin `SALON_STATUS` sözlüğüyle eşleşmesi, puan/yorum sayısı
 * biçimi ve "Yeni" rozeti test edilir.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import SalonCard, { SalonMedia } from '@/components/ui/SalonCard';

const SALON = {
  id: 'salon-1',
  name: 'Güzellik Merkezi',
  status: 'onaylı',
};

import LocaleProvider from '@/providers/LocaleProvider';
import { translate } from '@/lib/i18n';

import type { ReactElement } from 'react';

/**
 * Görünen metinler sözlükten `t()` ile basılır; testler bugünkü Türkçe kopyayı
 * görsün diye her render `LocaleProvider initialMode="tr"` ile sarmalanır.
 */
const renderTr = (ui: ReactElement) =>
  render(<LocaleProvider initialMode="tr">{ui}</LocaleProvider>);

describe('SalonMedia', () => {
  test('src yoksa role=img + "görsel yok" etiketiyle gradyan basar', () => {
    renderTr(<SalonMedia id="salon-1" alt="Güzellik Merkezi" />);
    const media = screen.getByRole('img', {
      name: `Güzellik Merkezi ${translate('tr', 'salons.card.noImage')}`,
    });
    expect(media.getAttribute('style')).toContain('linear-gradient');
    expect(media.tagName).toBe('DIV');
  });

  test('aynı id deterministik renk üretir, farklı id farklı karışım', () => {
    const first = renderTr(<SalonMedia id="abc" alt="A" />);
    const firstStyle = screen.getByRole('img').getAttribute('style');
    first.unmount();

    const second = renderTr(<SalonMedia id="abc" alt="A" />);
    expect(screen.getByRole('img').getAttribute('style')).toBe(firstStyle);
    second.unmount();

    const third = renderTr(<SalonMedia id="zzzzzzzzzzzz" alt="A" />);
    expect(screen.getByRole('img').getAttribute('style')).not.toBe(firstStyle);
    third.unmount();
  });

  test('src varsa gerçek img basar (lazy yükleme, alt metin korunur)', () => {
    renderTr(<SalonMedia id="salon-1" src="/uploads/a.jpg" alt="Güzellik Merkezi" />);
    const img = screen.getByRole('img', { name: 'Güzellik Merkezi' }) as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe('/uploads/a.jpg');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toContain('object-cover');
  });
});

describe('SalonCard', () => {
  test('kartı article olarak basar ve salon adını başlıkta gösterir', () => {
    renderTr(<SalonCard salon={SALON} />);
    const card = screen.getByRole('article');
    expect(card).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Güzellik Merkezi');
  });

  test('durum rozeti SALON_STATUS sözlüğünden etiket + ton üretir', () => {
    const { unmount } = renderTr(<SalonCard salon={SALON} />);
    const badge = screen.getByText('Onaylı');
    expect(badge.className).toContain('badge-success');
    unmount();

    renderTr(<SalonCard salon={{ ...SALON, status: 'pasif' }} />);
    expect(screen.getByText('Pasif').className).toContain('badge-error');
  });

  test('ilçe + il tek chip içinde virgülle birleşir, yoksa chip çizilmez', () => {
    const { unmount } = renderTr(
      <SalonCard salon={{ ...SALON, city: 'İstanbul', district: 'Kadıköy' }} />
    );
    expect(screen.getByText('Kadıköy, İstanbul')).toBeTruthy();
    unmount();

    const second = renderTr(<SalonCard salon={{ ...SALON, city: null, district: null }} />);
    expect(screen.queryByText('Kadıköy, İstanbul')).toBeNull();
    second.unmount();
  });

  test('puan bir ondalıkla, yorum sayısı parantez içinde gösterilir', () => {
    renderTr(<SalonCard salon={{ ...SALON, rating: 4.5, reviewCount: 12 }} />);
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('(12)')).toBeTruthy();
  });

  test('puan yoksa puan rozeti çizilmez; rating=0 geçerli bir puandır', () => {
    const { unmount } = renderTr(<SalonCard salon={{ ...SALON, rating: null }} />);
    expect(screen.queryByText('0.0')).toBeNull();
    unmount();

    renderTr(<SalonCard salon={{ ...SALON, rating: 0 }} />);
    expect(screen.getByText('0.0')).toBeTruthy();
  });

  test('isNew=true iken "Yeni" rozeti basılır, aksi hâlde basılmaz', () => {
    const { unmount } = renderTr(<SalonCard salon={{ ...SALON, isNew: true }} />);
    expect(screen.getByText(translate('tr', 'salons.card.new')).className).toContain('badge-lime');
    unmount();

    renderTr(<SalonCard salon={SALON} />);
    expect(screen.queryByText(translate('tr', 'salons.card.new'))).toBeNull();
  });

  test('sahip adı varsa gösterilir, eylem yuvası verilen düğümü render eder', () => {
    renderTr(
      <SalonCard
        salon={{ ...SALON, owner: 'Ayşe Yılmaz' }}
        actions={<button type="button">Detay</button>}
      />
    );
    expect(screen.getByText('Ayşe Yılmaz')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Detay' })).toBeTruthy();
  });

  test('kapak görseli varsa gerçek img, yoksa logo, o da yoksa gradyan kullanılır', () => {
    const { unmount } = renderTr(
      <SalonCard salon={{ ...SALON, coverImageUrl: '/uploads/cover.jpg' }} />
    );
    expect(screen.getByRole('img', { name: 'Güzellik Merkezi' }).tagName).toBe('IMG');
    unmount();

    const second = renderTr(<SalonCard salon={{ ...SALON, logoUrl: '/uploads/logo.png' }} />);
    expect(
      (screen.getByRole('img', { name: 'Güzellik Merkezi' }) as HTMLImageElement).getAttribute('src')
    ).toBe('/uploads/logo.png');
    second.unmount();

    renderTr(<SalonCard salon={SALON} />);
    expect(
      screen.getByRole('img', {
        name: `Güzellik Merkezi ${translate('tr', 'salons.card.noImage')}`,
      })
    ).toBeTruthy();
  });
});
