/**
 * AP-004 — `components/shell/MobileDrawer.tsx`
 *
 * Kapsam: dar ekran çekmecesinin erişilebilirlik ve kapanma sözleşmesi —
 * `role=dialog` + `aria-modal`, Esc, arka plan (scrim) tıklaması, X düğmesi,
 * **yol değişiminde otomatik kapanma**, gövde kaydırma kilidinin geri bırakılması
 * ve çıkış akışı. Çekmece kapanmazsa kullanıcı dar ekranda hiçbir sayfaya
 * geçemez; bu yüzden kapanma yolları tek tek sabitlenir.
 */
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navState = vi.hoisted(() => ({ pathname: '/salons' }));
const routerPush = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: routerPush, replace: vi.fn(), back: vi.fn() }),
}));

import MobileDrawer from '@/components/shell/MobileDrawer';
import ThemeProvider from '@/providers/ThemeProvider';
import { NAV_ITEMS } from '@/lib/nav';

function renderDrawer(open = true) {
  const onClose = vi.fn();
  const utils = render(
    <ThemeProvider>
      <MobileDrawer open={open} onClose={onClose} />
    </ThemeProvider>
  );
  return { onClose, ...utils };
}

describe('MobileDrawer — kapalıyken', () => {
  test('open=false iken diyalog çizilmez ve gövde kilidi kurulmaz', () => {
    navState.pathname = '/salons';
    const { onClose } = renderDrawer(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    // Kapalıyken yol senkronu effect'i yine çalışır (montajda bir kez).
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('MobileDrawer — açıkken', () => {
  test('role=dialog + aria-modal ve "Gezinme menüsü" erişilebilir adı', () => {
    navState.pathname = '/salons';
    renderDrawer();
    const dialog = screen.getByRole('dialog', { name: 'Gezinme menüsü' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('NAV_ITEMS\'ın tamamını listeler ve aktif öğeyi işaretler', () => {
    navState.pathname = '/categories';
    renderDrawer();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(NAV_ITEMS.length);
    const active = links.filter((l) => l.getAttribute('aria-current') === 'page');
    expect(active.map((l) => l.getAttribute('href'))).toEqual(['/categories']);
    expect(active[0].querySelector('.bg-accent-lime')).not.toBeNull();
  });

  test('başlıktaki X düğmesi ve scrim tıklaması onClose çağırır', async () => {
    navState.pathname = '/salons';
    const { onClose } = renderDrawer();
    onClose.mockClear();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Kapat' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Menüyü kapat' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test('Esc tuşu çekmeceyi kapatır', () => {
    navState.pathname = '/salons';
    const { onClose } = renderDrawer();
    onClose.mockClear();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('yol değişince otomatik kapanır', () => {
    navState.pathname = '/salons';
    const { onClose, rerender } = renderDrawer();
    onClose.mockClear();

    navState.pathname = '/users';
    rerender(
      <ThemeProvider>
        <MobileDrawer open onClose={onClose} />
      </ThemeProvider>
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('kapanınca (unmount) gövde kaydırma kilidi geri bırakılır', () => {
    navState.pathname = '/salons';
    const { unmount } = renderDrawer();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  test('e-posta localStorage kullanıcısından okunur', () => {
    navState.pathname = '/salons';
    localStorage.setItem('user', JSON.stringify({ email: 'admin@salon.dev' }));
    renderDrawer();
    expect(screen.getByText('admin@salon.dev')).toBeTruthy();
  });

  test('çıkış düğmesi oturumu temizler ve /login\'e yönlendirir', async () => {
    navState.pathname = '/salons';
    localStorage.setItem('access_token', 'a');
    localStorage.setItem('user', JSON.stringify({ email: 'a@b.dev' }));
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole('button', { name: 'Çıkış yap' }));

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(routerPush).toHaveBeenCalledWith('/login');
  });
});
