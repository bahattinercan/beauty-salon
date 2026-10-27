/**
 * AP-007 W2 — `components/ui/FilterBar.tsx`
 *
 * Kabuk yalnız dizilim taşır; jsdom layout hesaplamadığı için gerçek "tek satır"
 * ölçümü (H1: ≥1024px'te tek `offsetTop`) W4'ün headless harness'inde yapılır.
 * Burada kilitlenen şey sözleşmenin kendisidir: tek grup, sıra, daralma sınıfları
 * ve boş yuvaların sarmalayıcı üretmemesi.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FilterBar from '@/components/ui/FilterBar';

describe('FilterBar', () => {
  test('kontrolleri varsayılan erişilebilir adla tek grup altında toplar', () => {
    render(<FilterBar leading={<input aria-label="Ara" />} />);
    expect(screen.getByRole('group', { name: 'Filtre çubuğu' })).toBeTruthy();
  });

  test('ariaLabel özelleştirilebilir (aynı sayfada ikinci çubuk ayrışsın diye)', () => {
    render(<FilterBar ariaLabel="Görünüm kontrolleri" trailing={<button type="button">Kartlar</button>} />);
    expect(screen.getByRole('group', { name: 'Görünüm kontrolleri' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Filtre çubuğu' })).toBeNull();
  });

  test('leading → children → trailing sırası korunur', () => {
    render(
      <FilterBar
        leading={<button type="button">arama</button>}
        trailing={<button type="button">gorunum</button>}
      >
        <button type="button">sehir</button>
      </FilterBar>
    );
    const order = Array.from(
      screen.getByRole('group').querySelectorAll('button'),
      (b) => b.textContent
    );
    expect(order).toEqual(['arama', 'sehir', 'gorunum']);
  });

  test('daralma sözleşmesi: leading flex-1 + min-w-[12rem], trailing shrink-0', () => {
    const { container } = render(
      <FilterBar
        leading={<input aria-label="Ara" />}
        trailing={<button type="button">Kartlar</button>}
      />
    );
    const bar = container.firstElementChild as HTMLElement;
    // ≥lg'de tek satır, altında sarar (plan §5.3).
    expect(bar.className).toContain('flex-wrap');
    expect(bar.className).toContain('lg:flex-nowrap');

    const leading = bar.firstElementChild as HTMLElement;
    expect(leading.className).toContain('flex-1');
    expect(leading.className).toContain('min-w-[12rem]');

    const trailing = bar.lastElementChild as HTMLElement;
    expect(trailing.className).toContain('shrink-0');
  });

  test('children sarmalanmaz: wrap modunda her kontrol kendi kendine sarayabilir', () => {
    const { container } = render(
      <FilterBar>
        <button type="button">bir</button>
        <button type="button">iki</button>
      </FilterBar>
    );
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.children.length).toBe(2);
    expect(bar.firstElementChild?.tagName).toBe('BUTTON');
  });

  test('verilmeyen yuvalar boş sarmalayıcı üretmez', () => {
    const { container } = render(<FilterBar leading={<input aria-label="Ara" />} />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.children.length).toBe(1);
  });

  test('className kabuğa eklenir, içerideki düğmeler tıklanabilir kalır', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <FilterBar className="mb-3" trailing={<button type="button" onClick={onClick}>Kartlar</button>} />
    );
    expect((container.firstElementChild as HTMLElement).className).toContain('mb-3');
    await user.click(screen.getByRole('button', { name: 'Kartlar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
