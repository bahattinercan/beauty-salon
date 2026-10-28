/**
 * `components/appointments/AppointmentActions.tsx`
 *
 * Amaç: `Islemler` kolonu `COMPLETED` / `CANCELLED` / `NO_SHOW` satırlarında boş
 * kalmıyordu — her satırda en az `Detay` olmasının kabulü buradan verilir.
 *
 * Kilitlenen sözleşme:
 * - Sıra sabit: `Detay` her zaman ilk; `PENDING` → +Onayla;
 *   `CONFIRMED` → +Tamamla, Gelmedi, İptal; bitmiş durumlar → yalnız Detay.
 * - Uçuşta buton metni DEĞİŞMEZ; ikon Loader2'ye döner ve yalnız O buton
 *   `disabled` olur (Diğer butonlar, özellikle `Detay`, tıklanabilir kalır).
 * - İkonlar `aria-hidden`: erişilebilir ad yalnız metinden gelir.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppointmentActions, {
  type AppointmentActionStatus,
} from '@/components/appointments/AppointmentActions';

/** Altı zorunlu prop; testte yalnız `status`/`pending` değişir. */
function actions() {
  return {
    onDetail: vi.fn(),
    onConfirm: vi.fn(),
    onComplete: vi.fn(),
    onNoShow: vi.fn(),
    onCancel: vi.fn(),
  };
}

function renderRow(status: AppointmentActionStatus, pending?: null | 'cancel' | 'complete' | 'confirm' | 'noShow') {
  const handlers = actions();
  const view = render(<AppointmentActions status={status} pending={pending} {...handlers} />);
  return { ...view, handlers };
}

function buttonNames(): string[] {
  return screen.getAllByRole('button').map((button) => button.textContent ?? '');
}

function isDisabled(name: string): boolean {
  const button = screen.getByRole('button', { name }) as HTMLButtonElement;
  return button.disabled;
}

describe('AppointmentActions', () => {
  test('COMPLETED satırında tam olarak bir buton var: Detay (boş kolon kapatıldı)', () => {
    renderRow('COMPLETED');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Detay' })).toBeTruthy();
  });

  test('CANCELLED ve NO_SHOW satırlarında da yalnız Detay basılır', () => {
    const { unmount } = renderRow('CANCELLED');
    expect(buttonNames()).toEqual(['Detay']);
    unmount();

    renderRow('NO_SHOW');
    expect(buttonNames()).toEqual(['Detay']);
  });

  test('PENDING → Detay + Onayla; Tamamla/Gelmedi/İptal basılmaz', () => {
    renderRow('PENDING');
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(buttonNames()).toEqual(['Detay', 'Onayla']);
    expect(screen.queryByRole('button', { name: 'Tamamla' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Gelmedi' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'İptal' })).toBeNull();
  });

  test('CONFIRMED → dört buton sabit sırada: Detay, Tamamla, Gelmedi, İptal', () => {
    renderRow('CONFIRMED');
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(buttonNames()).toEqual(['Detay', 'Tamamla', 'Gelmedi', 'İptal']);
  });

  test('her buton yalnız kendi handlerını çağırır', async () => {
    const { handlers, unmount } = renderRow('PENDING');
    await userEvent.click(screen.getByRole('button', { name: 'Detay' }));
    expect(handlers.onDetail).toHaveBeenCalledTimes(1);
    expect(handlers.onConfirm).not.toHaveBeenCalled();
    expect(handlers.onComplete).not.toHaveBeenCalled();
    expect(handlers.onNoShow).not.toHaveBeenCalled();
    expect(handlers.onCancel).not.toHaveBeenCalled();
    unmount();

    const confirmed = renderRow('CONFIRMED');
    await userEvent.click(screen.getByRole('button', { name: 'Tamamla' }));
    expect(confirmed.handlers.onComplete).toHaveBeenCalledTimes(1);
    expect(confirmed.handlers.onDetail).not.toHaveBeenCalled();
    expect(confirmed.handlers.onNoShow).not.toHaveBeenCalled();
    expect(confirmed.handlers.onCancel).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Gelmedi' }));
    expect(confirmed.handlers.onNoShow).toHaveBeenCalledTimes(1);
    expect(confirmed.handlers.onComplete).toHaveBeenCalledTimes(1);
    expect(confirmed.handlers.onCancel).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'İptal' }));
    expect(confirmed.handlers.onCancel).toHaveBeenCalledTimes(1);
    expect(confirmed.handlers.onNoShow).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Detay' }));
    expect(confirmed.handlers.onDetail).toHaveBeenCalledTimes(1);
    expect(confirmed.handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  test("pending='cancel' → İptal disabled ama metni hâlâ 'İptal', diğerleri etkin", () => {
    renderRow('CONFIRMED', 'cancel');
    expect(isDisabled('İptal')).toBe(true);
    // Metin değişmez: uçuş geri bildirimi ikonla verilir, adla değil.
    expect(buttonNames()).toEqual(['Detay', 'Tamamla', 'Gelmedi', 'İptal']);
    expect(isDisabled('Detay')).toBe(false);
    expect(isDisabled('Tamamla')).toBe(false);
    expect(isDisabled('Gelmedi')).toBe(false);
  });

  test("pending='complete' → Tamamla ikonunun yerine dönen Loader2 basılır, Detay tıklanabilir kalır", async () => {
    const { container, handlers } = renderRow('CONFIRMED', 'complete');
    const button = screen.getByRole('button', { name: 'Tamamla' });
    const svgs = Array.from(button.querySelectorAll('svg'));
    expect(svgs).toHaveLength(1);
    const spinner = svgs[0];
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    // Loader2 imzası: dönüş animasyonu sınıfı.
    expect(spinner.getAttribute('class')).toContain('animate-spin');
    // Uçuştaki tek ikon odur; Detay ikonu (Eye) dönmüyor.
    expect(container.querySelectorAll('svg.animate-spin')).toHaveLength(1);

    expect(isDisabled('Tamamla')).toBe(true);
    expect(isDisabled('Detay')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Detay' }));
    expect(handlers.onDetail).toHaveBeenCalledTimes(1);
  });

  test("pending='confirm' ve 'noShow' → yalnız ilgili buton disabled, metinler sabit", () => {
    const { unmount } = renderRow('PENDING', 'confirm');
    expect(isDisabled('Onayla')).toBe(true);
    expect(isDisabled('Detay')).toBe(false);
    expect(buttonNames()).toEqual(['Detay', 'Onayla']);
    unmount();

    renderRow('CONFIRMED', 'noShow');
    expect(isDisabled('Gelmedi')).toBe(true);
    expect(isDisabled('Detay')).toBe(false);
    expect(isDisabled('Tamamla')).toBe(false);
    expect(isDisabled('İptal')).toBe(false);
    expect(buttonNames()).toEqual(['Detay', 'Tamamla', 'Gelmedi', 'İptal']);
  });

  test('bitmiş satırlarda durum aksiyonları tıklanamaz (yalnız Detay handlerı çalışır)', async () => {
    const { handlers } = renderRow('CANCELLED');
    await userEvent.click(screen.getByRole('button', { name: 'Detay' }));
    expect(handlers.onDetail).toHaveBeenCalledTimes(1);
    expect(handlers.onCancel).not.toHaveBeenCalled();
    expect(handlers.onComplete).not.toHaveBeenCalled();
  });

  test('tüm ikonlar aria-hidden: erişilebilir adlar metinle birebir aynı', () => {
    const { container } = renderRow('CONFIRMED');
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of Array.from(svgs)) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
    expect(buttonNames()).toEqual(['Detay', 'Tamamla', 'Gelmedi', 'İptal']);
  });

  test('className kok alana eklenir (tablo hücresi hizalaması ezilebilir)', () => {
    const { container } = render(
      <AppointmentActions
        status="COMPLETED"
        className="justify-start"
        onDetail={() => {}}
        onConfirm={() => {}}
        onComplete={() => {}}
        onNoShow={() => {}}
        onCancel={() => {}}
      />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('flex');
    expect(root.className).toContain('justify-start');
  });
});
