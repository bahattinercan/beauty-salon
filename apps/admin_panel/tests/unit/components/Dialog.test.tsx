/**
 * AP-004 — `components/ui/Dialog.tsx`
 *
 * Kapsam: modal erişilebilirlik sözleşmesi — `role=dialog` + `aria-modal`,
 * başlığın erişilebilir ad olması, Esc ile kapanma, arka plan (scrim) tıklaması,
 * gövde kaydırma kilidinin açılıp **geri bırakılması** ve boyut eşlemesi.
 * Kilit geri bırakılmazsa modal kapandıktan sonra sayfa kaydırılamaz kalır.
 */
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Dialog from '@/components/ui/Dialog';

function renderDialog(props: Partial<React.ComponentProps<typeof Dialog>> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <Dialog open onClose={onClose} title="Kategori düzenle" {...props}>
      <input aria-label="Kategori adı" />
    </Dialog>
  );
  return { onClose, ...utils };
}

describe('Dialog — kapalıyken', () => {
  test('open=false iken hiçbir düğüm basmaz', () => {
    const { container } = render(
      <Dialog open={false} onClose={() => {}} title="Gizli">
        içerik
      </Dialog>
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});

describe('Dialog — açıkken', () => {
  test('role=dialog + aria-modal ve başlık erişilebilir ad olur', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Kategori düzenle' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Kategori düzenle');
  });

  test('children basılır, footer yoksa alt bölge çizilmez', () => {
    renderDialog();
    expect(screen.getByLabelText('Kategori adı')).toBeTruthy();
    expect(screen.queryByText('Kaydet')).toBeNull();
  });

  test('footer verildiğinde eylemleri render eder', () => {
    renderDialog({ footer: <button type="button">Kaydet</button> });
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeTruthy();
  });

  test('açılırken odak paneline taşınır ve gövde kaydırmasını kilitler', () => {
    const { container } = renderDialog();
    const panel = screen.getByRole('dialog');
    expect(container.contains(document.activeElement)).toBe(true);
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.tagName).toBe('BUTTON');
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('kapanınca (unmount) gövde kaydırma kilidi geri bırakılır', () => {
    const { unmount } = renderDialog();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  test('Esc tuşu onClose çağırır', () => {
    const { onClose } = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('scrim (arka plan) tıklaması onClose çağırır', async () => {
    const { onClose } = renderDialog();
    const user = userEvent.setup();
    const buttons = screen.getAllByRole('button', { name: 'Kapat' });
    // İlk "Kapat" düğmesi tam ekran scrim'dir; ikincisi başlıktaki X.
    expect(buttons).toHaveLength(2);
    await user.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('başlıktaki X düğmesi de onClose çağırır', async () => {
    const { onClose } = renderDialog();
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Kapat' })[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('boyut eşlemesi: sm/md/lg genişlik sınıfına dönüşür', () => {
    const cases = [
      ['sm', 'max-w-md'],
      ['md', 'max-w-xl'],
      ['lg', 'max-w-3xl'],
    ] as const;

    for (const [size, cls] of cases) {
      const { unmount } = renderDialog({ size });
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain(cls);
      unmount();
    }
  });

  test('Tab tuzağı: son odaklanabilir öğeden sonra ilk öğeye döner', () => {
    renderDialog({ footer: <button type="button">Kaydet</button> });
    const closeX = screen.getAllByRole('button', { name: 'Kapat' })[1];
    const save = screen.getByRole('button', { name: 'Kaydet' });

    save.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeX);

    closeX.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(save);
  });
});
