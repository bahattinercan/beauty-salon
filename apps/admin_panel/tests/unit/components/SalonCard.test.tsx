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

describe('SalonMedia', () => {
  test('src yoksa role=img + "görsel yok" etiketiyle gradyan basar', () => {
    render(<SalonMedia id="salon-1" alt="Güzellik Merkezi" />);
    const media = screen.getByRole('img', { name: 'Güzellik Merkezi — görsel yok' });
    expect(media.getAttribute('style')).toContain('linear-gradient');
    expect(media.tagName).toBe('DIV');
  });

  test('aynı id deterministik renk üretir, farklı id farklı karışım', () => {
    const first = render(<SalonMedia id="abc" alt="A" />);
    const firstStyle = screen.getByRole('img').getAttribute('style');
    first.unmount();

    const second = render(<SalonMedia id="abc" alt="A" />);
    expect(screen.getByRole('img').getAttribute('style')).toBe(firstStyle);
    second.unmount();

    const third = render(<SalonMedia id="zzzzzzzzzzzz" alt="A" />);
    expect(screen.getByRole('img').getAttribute('style')).not.toBe(firstStyle);
    third.unmount();
  });

  test('src varsa gerçek img basar (lazy yükleme, alt metin korunur)', () => {
    render(<SalonMedia id="salon-1" src="/uploads/a.jpg" alt="Güzellik Merkezi" />);
    const img = screen.getByRole('img', { name: 'Güzellik Merkezi' }) as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe('/uploads/a.jpg');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toContain('object-cover');
  });
});

describe('SalonCard', () => {
  test('kartı article olarak basar ve salon adını başlıkta gösterir', () => {
    render(<SalonCard salon={SALON} />);
    const card = screen.getByRole('article');
    expect(card).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Güzellik Merkezi');
  });

  test('durum rozeti SALON_STATUS sözlüğünden etiket + ton üretir', () => {
    const { unmount } = render(<SalonCard salon={SALON} />);
    const badge = screen.getByText('Onaylı');
    expect(badge.className).toContain('badge-success');
    unmount();

    render(<SalonCard salon={{ ...SALON, status: 'pasif' }} />);
    expect(screen.getByText('Pasif').className).toContain('badge-error');
  });

  test('ilçe + il tek chip içinde virgülle birleşir, yoksa chip çizilmez', () => {
    const { unmount } = render(
      <SalonCard salon={{ ...SALON, city: 'İstanbul', district: 'Kadıköy' }} />
    );
    expect(screen.getByText('Kadıköy, İstanbul')).toBeTruthy();
    unmount();

    const second = render(<SalonCard salon={{ ...SALON, city: null, district: null }} />);
    expect(screen.queryByText('Kadıköy, İstanbul')).toBeNull();
    second.unmount();
  });

  test('puan bir ondalıkla, yorum sayısı parantez içinde gösterilir', () => {
    render(<SalonCard salon={{ ...SALON, rating: 4.5, reviewCount: 12 }} />);
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('(12)')).toBeTruthy();
  });

  test('puan yoksa puan rozeti çizilmez; rating=0 geçerli bir puandır', () => {
    const { unmount } = render(<SalonCard salon={{ ...SALON, rating: null }} />);
    expect(screen.queryByText('0.0')).toBeNull();
    unmount();

    render(<SalonCard salon={{ ...SALON, rating: 0 }} />);
    expect(screen.getByText('0.0')).toBeTruthy();
  });

  test('isNew=true iken "Yeni" rozeti basılır, aksi hâlde basılmaz', () => {
    const { unmount } = render(<SalonCard salon={{ ...SALON, isNew: true }} />);
    expect(screen.getByText('Yeni').className).toContain('badge-lime');
    unmount();

    render(<SalonCard salon={SALON} />);
    expect(screen.queryByText('Yeni')).toBeNull();
  });

  test('sahip adı varsa gösterilir, eylem yuvası verilen düğümü render eder', () => {
    render(
      <SalonCard
        salon={{ ...SALON, owner: 'Ayşe Yılmaz' }}
        actions={<button type="button">Detay</button>}
      />
    );
    expect(screen.getByText('Ayşe Yılmaz')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Detay' })).toBeTruthy();
  });

  test('kapak görseli varsa gerçek img, yoksa logo, o da yoksa gradyan kullanılır', () => {
    const { unmount } = render(
      <SalonCard salon={{ ...SALON, coverImageUrl: '/uploads/cover.jpg' }} />
    );
    expect(screen.getByRole('img', { name: 'Güzellik Merkezi' }).tagName).toBe('IMG');
    unmount();

    const second = render(<SalonCard salon={{ ...SALON, logoUrl: '/uploads/logo.png' }} />);
    expect(
      (screen.getByRole('img', { name: 'Güzellik Merkezi' }) as HTMLImageElement).getAttribute('src')
    ).toBe('/uploads/logo.png');
    second.unmount();

    render(<SalonCard salon={SALON} />);
    expect(screen.getByRole('img', { name: 'Güzellik Merkezi — görsel yok' })).toBeTruthy();
  });
});
