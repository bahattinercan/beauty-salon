/**
 * AP-004 — `components/shell/BottomPillNav.tsx`
 *
 * Kapsam: dar ekran gezinmesinin kuralları — yalnız `primary: true` öğeler pill'de
 * görünür, aktif öğe `aria-current="page"` ile işaretlenir (CA-019 karşılığı) ve
 * "Daha fazla" düğmesi drawer'ı açar. `next/navigation` bu testte mock'lanır.
 *
 * i18n: etiketler `NAV_ITEMS[].labelKey` üzerinden `t()` ile basılır; jsdom'un
 * tarayıcı dili 'en-US' olduğu için Türkçe metin assert'leri `initialMode="tr"`
 * ile sabitlenir.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navState = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

import BottomPillNav from '@/components/shell/BottomPillNav';
import LocaleProvider from '@/providers/LocaleProvider';
import { NAV_ITEMS } from '@/lib/nav';
import { translate } from '@/lib/i18n';

function renderPill(onMore: () => void = () => {}) {
  return render(
    <LocaleProvider initialMode="tr">
      <BottomPillNav onMore={onMore} />
    </LocaleProvider>
  );
}

describe('BottomPillNav', () => {
  test('"Hızlı gezinme" adlı bir nav basar', () => {
    navState.pathname = '/';
    renderPill();
    expect(screen.getByRole('navigation', { name: 'Hızlı gezinme' })).toBeTruthy();
  });

  test('yalnız primary öğeler + "Daha fazla" düğmesi listelenir (5 hücre)', () => {
    navState.pathname = '/';
    renderPill();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);

    const primaryHrefs = NAV_ITEMS.filter((i) => i.primary).map((i) => i.href);
    expect(primaryHrefs).toEqual(['/', '/salons', '/appointments', '/users']);
    for (const href of primaryHrefs) {
      const labelKey = NAV_ITEMS.find((i) => i.href === href)?.labelKey ?? '';
      const label = translate('tr', labelKey);
      expect(label.length > 0).toBe(true);
      expect(screen.getByRole('link', { name: new RegExp(`^${label}`) })).toBeTruthy();
    }
    // primary olmayanlar alt pill'de yok
    expect(screen.queryByRole('link', { name: /Yorumlar/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Kategoriler/ })).toBeNull();
  });

  test('aktif öğe aria-current="page" taşır, diğerleri taşımaz', () => {
    navState.pathname = '/appointments';
    renderPill();

    const active = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('aria-current') === 'page');
    expect(active.map((l) => l.getAttribute('href'))).toEqual(['/appointments']);
  });

  test('alt yol da aktif sayılır (/salons/123 → Salonlar)', () => {
    navState.pathname = '/salons/123';
    renderPill();
    const active = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('aria-current') === 'page');
    expect(active.map((l) => l.getAttribute('href'))).toEqual(['/salons']);
  });

  test('"Daha fazla" düğmesi onMore geri çağrısını bir kez tetikler', async () => {
    navState.pathname = '/';
    const onMore = vi.fn();
    const user = userEvent.setup();
    renderPill(onMore);

    const more = screen.getByRole('button', { name: /Daha fazla/ });
    expect(more.textContent).toBe('Daha fazla');
    await user.click(more);
    expect(onMore).toHaveBeenCalledTimes(1);
  });

  test('aktif öğenin ikon yuvası dolu daire token\'ını, pasif öğe şeffaf zemini kullanır', () => {
    navState.pathname = '/users';
    renderPill();

    const activeCircle = screen
      .getByRole('link', { name: /Kullanıcılar/ })
      .querySelector('span.rounded-pill');
    expect(activeCircle?.className).toContain('bg-on-nav-pill');
    expect(activeCircle?.className).toContain('text-nav-pill');

    const idleCircle = screen
      .getByRole('link', { name: /Panel/ })
      .querySelector('span.rounded-pill');
    expect(idleCircle?.className).toContain('bg-transparent');
  });
});
