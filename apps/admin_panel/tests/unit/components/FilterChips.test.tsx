/**
 * AP-007 W2 — `components/ui/FilterChips.tsx`
 *
 * H2 kabulü: her etkin filtre için bir chip, chip kaldırınca o filtre gider,
 * "Temizle" hepsini sıfırlar ve chip sayısı `aria-live` ile duyurulur. Kritik
 * ayrıntı: canlı bölge 0 filtrede de DOM'da kalmalı — ilk chip ile birlikte
 * oluşturulursa ekran okuyucu ilk duyuruyu kaçırır.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FilterChips, { type FilterChip } from '@/components/ui/FilterChips';

const chips: FilterChip[] = [
  { key: 'q', label: 'Arama: kuaför', onRemove: () => {} },
  { key: 'city', label: 'Şehir: İstanbul', onRemove: () => {} },
];

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

describe('FilterChips', () => {
  test('her chip kendi erişilebilir adıyla bir düğme olarak basılır', () => {
    renderTr(<FilterChips chips={chips} onClearAll={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(3); // 2 chip + Temizle
    expect(
      screen.getByRole('button', { name: 'Şehir: İstanbul filtresini kaldır' })
    ).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Etkin filtreler' })).toBeTruthy();
  });

  test('X ikonu erişilebilir adı çiftlemez (aria-hidden)', () => {
    const { container } = renderTr(<FilterChips chips={chips} onClearAll={() => {}} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  test('chip tıklaması yalnız kendi onRemove-unu çağırır', async () => {
    const onRemoveQ = vi.fn();
    const onRemoveCity = vi.fn();
    renderTr(
      <FilterChips
        chips={[
          { key: 'q', label: 'Arama: kuaför', onRemove: onRemoveQ },
          { key: 'city', label: 'Şehir: İstanbul', onRemove: onRemoveCity },
        ]}
        onClearAll={() => {}}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Arama: kuaför filtresini kaldır' }));
    expect(onRemoveQ).toHaveBeenCalledTimes(1);
    expect(onRemoveCity).not.toHaveBeenCalled();
  });

  test('Temizle tümünü sıfırlar; etiketi varsayılan, özelleştirilebilir', async () => {
    const onClearAll = vi.fn();
    const { unmount } = renderTr(<FilterChips chips={chips} onClearAll={onClearAll} />);
    await userEvent.click(screen.getByRole('button', { name: 'Temizle' }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
    unmount();

    renderTr(<FilterChips chips={chips} onClearAll={onClearAll} clearLabel="Filtreleri temizle" />);
    await userEvent.click(screen.getByRole('button', { name: 'Filtreleri temizle' }));
    expect(onClearAll).toHaveBeenCalledTimes(2);
  });

  test('onClearAll yoksa Temizle düğmesi basılmaz', () => {
    renderTr(<FilterChips chips={chips} />);
    expect(screen.queryByRole('button', { name: 'Temizle' })).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('canlı bölge chip sayısını duyurur ve rerenderda aynı node kalır', () => {
    const { rerender, container } = renderTr(<FilterChips chips={chips} onClearAll={() => {}} />);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region?.textContent).toBe('2 filtre etkin');

    rerender(
      <LocaleProvider initialMode="tr">
        <FilterChips
          chips={[...chips, { key: 'rating', label: 'Puan: 4+', onRemove: () => {} }]}
          onClearAll={() => {}}
        />
      </LocaleProvider>
    );
    // Bölge yeniden oluşturulmamalı: duyurunun okunması için aynı node olmalı.
    expect(container.querySelector('[aria-live="polite"]')).toBe(region);
    expect(region?.textContent).toBe('3 filtre etkin');
  });

  test('filtre yokken chip ve Temizle basılmaz, ama canlı bölge DOMda kalır', () => {
    const { container } = renderTr(<FilterChips chips={[]} onClearAll={() => {}} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('list')).toBeNull();
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toBeTruthy();
    expect(region?.textContent).toBe('');
  });
});
