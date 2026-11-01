/**
 * `components/reviews/ReviewActions.tsx`
 *
 * Amaç: yorum kartındaki dört işlem tek yerde toplansın — sayfa bileşeni buton
 * sırasını kendi tekrar etmesin (AP-010).
 *
 * Kilitlenen sözleşme:
 * - Sıra sabit: `Detay` → `Yanıtla`/`Yanıtı düzenle` → `Gizle`/`Görünür yap` → `Sil`.
 * - `hasReply` yanıt butonunun **metnini** değiştirir (yanıt varsa düzenleme),
 *   `isVisible` görünürlük butonunun metnini değiştirir.
 * - Uçuşta buton metni DEĞİŞMEZ; ikon Loader2'ye döner ve yalnız O buton
 *   `disabled` olur (özellikle `Detay` tıklanabilir kalır).
 * - İkonlar `aria-hidden`: erişilebilir ad yalnız metinden gelir.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ReviewActions, {
  type ReviewPendingAction,
} from '@/components/reviews/ReviewActions';
import LocaleProvider from '@/providers/LocaleProvider';
import type { ReactElement } from 'react';

/** Bileşen `t()` kullanır: her render Türkçe locale ile sarılır. */
function renderTr(node: ReactElement) {
  return render(<LocaleProvider initialMode="tr">{node}</LocaleProvider>);
}

/** Dört zorunlu callback; testte yalnız görünürlük/yanıt/uçuş değişir. */
function handlers() {
  return {
    onDetail: vi.fn(),
    onReply: vi.fn(),
    onToggleVisibility: vi.fn(),
    onDelete: vi.fn(),
  };
}

function renderRow(opts: {
  isVisible: boolean;
  hasReply: boolean;
  pending?: ReviewPendingAction;
}) {
  const hs = handlers();
  const view = renderTr(
    <ReviewActions
      isVisible={opts.isVisible}
      hasReply={opts.hasReply}
      pending={opts.pending}
      {...hs}
    />
  );
  return { ...view, handlers: hs };
}

function buttonNames(): string[] {
  return screen.getAllByRole('button').map((button) => button.textContent ?? '');
}

function isDisabled(name: string): boolean {
  const button = screen.getByRole('button', { name }) as HTMLButtonElement;
  return button.disabled;
}

describe('ReviewActions — sııra ve metinler', () => {
  test('görünür + yanıtsız → Detay, Yanıtla, Gizle, Sil (sıra sabit)', () => {
    renderRow({ isVisible: true, hasReply: false });
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(buttonNames()).toEqual(['Detay', 'Yanıtla', 'Gizle', 'Sil']);
  });

  test('gizli + yanıtsız → görünürlük butonu "Görünür yap" olur', () => {
    renderRow({ isVisible: false, hasReply: false });
    expect(buttonNames()).toEqual(['Detay', 'Yanıtla', 'Görünür yap', 'Sil']);
  });

  test('görünür + yanıtlı → yanıt butonu "Yanıtı düzenle" olur', () => {
    renderRow({ isVisible: true, hasReply: true });
    expect(buttonNames()).toEqual(['Detay', 'Yanıtı düzenle', 'Gizle', 'Sil']);
  });

  test('gizli + yanıtlı → dört kombinasyonun dördü birden doğru', () => {
    renderRow({ isVisible: false, hasReply: true });
    expect(buttonNames()).toEqual(['Detay', 'Yanıtı düzenle', 'Görünür yap', 'Sil']);
  });

  test('Sil her zaman sonda, Detay her zaman başta (dört kombinasyonda)', () => {
    for (const isVisible of [true, false]) {
      for (const hasReply of [true, false]) {
        const { unmount } = renderRow({ isVisible, hasReply });
        const names = buttonNames();
        expect(names[0]).toBe('Detay');
        expect(names[names.length - 1]).toBe('Sil');
        unmount();
      }
    }
  });
});

describe('ReviewActions — uçuş kuralı', () => {
  test("pending='reply' → yalnız Yanıtla disabled, metni değişmez, Detay tıklanabilir", async () => {
    const { handlers: hs } = renderRow({
      isVisible: true,
      hasReply: false,
      pending: 'reply',
    });
    expect(isDisabled('Yanıtla')).toBe(true);
    expect(buttonNames()).toEqual(['Detay', 'Yanıtla', 'Gizle', 'Sil']);
    expect(isDisabled('Detay')).toBe(false);
    expect(isDisabled('Gizle')).toBe(false);
    expect(isDisabled('Sil')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Detay' }));
    expect(hs.onDetail).toHaveBeenCalledTimes(1);
  });

  test("pending='visibility' → görünürlük butonu disabled ama metni hâlâ 'Gizle'", () => {
    renderRow({ isVisible: true, hasReply: false, pending: 'visibility' });
    expect(isDisabled('Gizle')).toBe(true);
    expect(buttonNames()).toEqual(['Detay', 'Yanıtla', 'Gizle', 'Sil']);
    expect(isDisabled('Yanıtla')).toBe(false);
    expect(isDisabled('Sil')).toBe(false);
  });

  test("pending='delete' → yalnız Sil disabled; yanıtlı satırda metin 'Yanıtı düzenle' kalır", () => {
    renderRow({ isVisible: false, hasReply: true, pending: 'delete' });
    expect(isDisabled('Sil')).toBe(true);
    expect(isDisabled('Yanıtı düzenle')).toBe(false);
    expect(isDisabled('Görünür yap')).toBe(false);
    expect(buttonNames()).toEqual(['Detay', 'Yanıtı düzenle', 'Görünür yap', 'Sil']);
  });

  test("pending='reply' → uçuş ikonunun yerine dönen Loader2 basılır, diğer ikonlar dönmez", () => {
    const { container } = renderRow({ isVisible: true, hasReply: false, pending: 'reply' });
    const button = screen.getByRole('button', { name: 'Yanıtla' });
    const svgs = Array.from(button.querySelectorAll('svg'));
    expect(svgs).toHaveLength(1);
    expect(svgs[0].getAttribute('aria-hidden')).toBe('true');
    // Loader2 imzası: dönüş animasyonu sınıfı.
    expect(svgs[0].getAttribute('class')).toContain('animate-spin');
    expect(container.querySelectorAll('svg.animate-spin')).toHaveLength(1);
  });

  test('pending=null → hiçbir buton disabled değil, spinner yok', () => {
    const { container } = renderRow({ isVisible: true, hasReply: true });
    for (const name of ['Detay', 'Yanıtı düzenle', 'Gizle', 'Sil']) {
      expect(isDisabled(name)).toBe(false);
    }
    expect(container.querySelectorAll('svg.animate-spin')).toHaveLength(0);
  });
});

describe('ReviewActions — callback ve erişilebilirlik', () => {
  test('her buton yalnız kendi handlerını çağırır', async () => {
    const { handlers: hs } = renderRow({ isVisible: true, hasReply: false });

    await userEvent.click(screen.getByRole('button', { name: 'Detay' }));
    expect(hs.onDetail).toHaveBeenCalledTimes(1);
    expect(hs.onReply).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Yanıtla' }));
    expect(hs.onReply).toHaveBeenCalledTimes(1);
    expect(hs.onDetail).toHaveBeenCalledTimes(1);
    expect(hs.onToggleVisibility).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Gizle' }));
    expect(hs.onToggleVisibility).toHaveBeenCalledTimes(1);
    expect(hs.onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Sil' }));
    expect(hs.onDelete).toHaveBeenCalledTimes(1);
    expect(hs.onToggleVisibility).toHaveBeenCalledTimes(1);
  });

  test('tüm ikonlar aria-hidden: erişilebilir adlar metinle birebir aynı', () => {
    const { container } = renderRow({ isVisible: false, hasReply: true });
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of Array.from(svgs)) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
    expect(buttonNames()).toEqual(['Detay', 'Yanıtı düzenle', 'Görünür yap', 'Sil']);
  });

  test('className kok alana eklenir (kart altı hizalaması ezilebilir)', () => {
    const { container } = renderTr(
      <ReviewActions
        isVisible
        hasReply={false}
        className="justify-start"
        onDetail={() => {}}
        onReply={() => {}}
        onToggleVisibility={() => {}}
        onDelete={() => {}}
      />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('flex');
    expect(root.className).toContain('justify-start');
  });
});
