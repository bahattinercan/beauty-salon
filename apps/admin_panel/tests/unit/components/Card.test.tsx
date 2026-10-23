/**
 * AP-004 — `components/ui/Card.tsx`
 *
 * Kapsam: yüzey hiyerarşisinin (background < surface < surface-variant) tek
 * taşıyıcısı olan `Card` primitifi ve üç yuva (`CardHeader`/`CardBody`/`CardFooter`).
 * `DataTable`, `SalonCard`, `StatCard`, listeler ve dashboard bu primitifi
 * paylaşıyor; `as` prop'unun semantiği (div/section/article) bozulursa ekran
 * okuyucu bölge sınırlarını kaybeder.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';

describe('Card', () => {
  test('varsayılan olarak div + token tabanlı yüzey sınıflarını basar', () => {
    const { container } = render(<Card>içerik</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('rounded-card');
    expect(el.className).toContain('border-border');
    expect(el.className).toContain('bg-surface');
    expect(el.className).toContain('shadow-card');
    expect(el.textContent).toBe('içerik');
  });

  test('`as` prop semantiği değiştirir (article → role=article)', () => {
    render(
      <Card as="article" aria-label="Salon kartı">
        x
      </Card>
    );
    const el = screen.getByRole('article', { name: 'Salon kartı' });
    expect(el.tagName).toBe('ARTICLE');
    expect(el.className).toContain('rounded-card');
  });

  test('className taban sınıfları ezmez, sona eklenir; rest prop\'lar DOM\'a geçer', () => {
    const { container } = render(
      <Card className="p-4" data-testid="kart">
        x
      </Card>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-surface');
    expect(el.className.endsWith('p-4')).toBe(true);
    expect(el.getAttribute('data-testid')).toBe('kart');
  });
});

describe('CardHeader', () => {
  test('başlığı h2 olarak basar (sayfada tek h1 kuralı — AP-001)', () => {
    render(<CardHeader title="Son randevular" />);
    const h = screen.getByRole('heading', { level: 2 });
    expect(h.textContent).toBe('Son randevular');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  test('description opsiyoneldir: verilmezse paragraf çizilmez', () => {
    const { unmount } = render(<CardHeader title="Yorumlar" description="Son 7 gün" />);
    expect(screen.getByText('Son 7 gün')).toBeTruthy();
    unmount();

    render(<CardHeader title="Yorumlar" />);
    expect(screen.queryByText('Son 7 gün')).toBeNull();
  });

  test('action yuvası verilen düğümü başlıkla aynı satırda render eder', () => {
    render(<CardHeader title="Salonlar" action={<a href="/salons/yeni">Yeni salon</a>} />);
    expect(screen.getByRole('link', { name: 'Yeni salon' })).toBeTruthy();
  });
});

describe('CardBody / CardFooter', () => {
  test('CardBody sıfır-üst dolgu sınıfıyla içeriği sarar', () => {
    const { container } = render(<CardBody className="space-y-2">gövde</CardBody>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('pt-0');
    expect(el.className).toContain('space-y-2');
    expect(el.textContent).toBe('gövde');
  });

  test('CardFooter ayırıcı üst çizgi taşır ve rest prop\'ları iletir', () => {
    const { container } = render(
      <CardFooter id="kart-alt" className="justify-end">
        alt
      </CardFooter>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('border-t');
    expect(el.className).toContain('border-border');
    expect(el.id).toBe('kart-alt');
  });
});
