/**
 * AP-003 — `components/ui/Button.tsx`
 *
 * Kapsam: varyant → token sınıfı sözleşmesi (özellikle marka dolgusunda
 * `text-on-primary`), boyut sınıfları, `type` varsayılanı ve devre dışı
 * davranışı. AP-001'in yakaladığı "dark temada okunmaz marka metni" hata
 * sınıfı burada kilitlenir.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Button from '@/components/ui/Button';

describe('Button', () => {
  test('varsayılan olarak type="button", primary varyant ve md boyut kullanır', () => {
    render(<Button>Kaydet</Button>);
    const el = screen.getByRole('button', { name: 'Kaydet' });
    expect(el.getAttribute('type')).toBe('button');
    expect(el.className).toContain('bg-primary-solid');
    expect(el.className).toContain('text-on-primary');
    expect(el.className).toContain('h-11');
  });

  test('varyantlar ayrık token sınıfları üretir (lime metni koyu token)', () => {
    const cases = [
      ['primary', 'text-on-primary'],
      ['lime', 'text-on-accent-lime'],
      ['outline', 'border-border-strong'],
      ['ghost', 'text-fg-muted'],
      ['danger', 'text-error'],
    ] as const;

    for (const [variant, cls] of cases) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      const el = screen.getByRole('button', { name: variant });
      expect(el.className).toContain(cls);
      unmount();
    }
  });

  test('boyut sınıfları: sm yoğun ekranda 40px, icon kare 44px', () => {
    const { unmount } = render(<Button size="sm">küçük</Button>);
    expect(screen.getByRole('button', { name: 'küçük' }).className).toContain('md:h-10');
    unmount();

    render(
      <Button size="icon" aria-label="kapat">
        x
      </Button>
    );
    const icon = screen.getByRole('button', { name: 'kapat' });
    expect(icon.className).toContain('h-11');
    expect(icon.className).toContain('w-11');
  });

  test('type="submit" dışarıdan geçirilebilir (form gönderimi bozulmaz)', () => {
    render(<Button type="submit">Gönder</Button>);
    expect(screen.getByRole('button', { name: 'Gönder' }).getAttribute('type')).toBe('submit');
  });

  test('devre dışı buton tıklama işleyicisini çağırmaz', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Sil
      </Button>
    );

    const el = screen.getByRole('button', { name: 'Sil' });
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.className).toContain('disabled:opacity-50');

    await user.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('etkin buton tıklaması işleyiciyi bir kez çağırır; className sona eklenir', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button className="w-full" onClick={onClick}>
        Onayla
      </Button>
    );

    const el = screen.getByRole('button', { name: 'Onayla' });
    expect(el.className.endsWith('w-full')).toBe(true);

    await user.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
