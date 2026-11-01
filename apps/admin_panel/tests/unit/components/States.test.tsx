/**
 * AP-003 — `components/ui/States.tsx`
 *
 * Kapsam: yükleme/boş/hata durumlarının ekran okuyucuya doğru duyurulması
 * (`sr-only` etiket), boş durumun eylem yuvası ve hata durumunun "Yeniden
 * dene" geri çağrısı. Bu üç durum her listede tekrar ediyor; sessiz bozulma
 * kullanıcıya boş ekran olarak görünür.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Button from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock, Skeleton } from '@/components/ui/States';

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

describe('LoadingBlock', () => {
  test('varsayılan "Yükleniyor…" etiketini sr-only olarak duyurur', () => {
    renderTr(<LoadingBlock />);
    const label = screen.getByText('Yükleniyor…');
    expect(label.className).toContain('sr-only');
    expect(label.tagName).toBe('SPAN');
  });

  test('özel etiket verildiğinde onu kullanır ve spinner aria-hidden kalır', () => {
    const { container } = renderTr(<LoadingBlock label="Randevular getiriliyor" />);
    expect(screen.getByText('Randevular getiriliyor')).toBeTruthy();
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('Skeleton', () => {
  test('nabız animasyonu ve verilen ek sınıfı taşır', () => {
    const { container } = renderTr(<Skeleton className="h-4 w-24" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('h-4');
  });
});

describe('EmptyState', () => {
  test('başlık ve açıklamayı basar, açıklama opsiyoneldir', () => {
    const { unmount } = renderTr(
      <EmptyState title="Kayıt yok" description="Filtreyi değiştirin" />
    );
    expect(screen.getByText('Kayıt yok')).toBeTruthy();
    expect(screen.getByText('Filtreyi değiştirin')).toBeTruthy();
    unmount();

    renderTr(<EmptyState title="Kayıt yok" />);
    expect(screen.queryByText('Filtreyi değiştirin')).toBeNull();
  });

  test('action yuvası verilen düğümü render eder', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderTr(
      <EmptyState
        title="Salon yok"
        action={<Button onClick={onClick}>Yeni salon</Button>}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Yeni salon' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorState', () => {
  test('sabit başlık + hata mesajını gösterir, onRetry yoksa düğme çizmez', () => {
    renderTr(<ErrorState message="Sunucuya ulaşılamadı" />);
    expect(screen.getByText('Veri alınamadı')).toBeTruthy();
    expect(screen.getByText('Sunucuya ulaşılamadı')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('onRetry verildiğinde "Yeniden dene" tek tıklamada çağrılır', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderTr(<ErrorState message="Zaman aşımı" onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: /Yeniden dene/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
