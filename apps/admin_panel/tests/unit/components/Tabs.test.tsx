/**
 * AP-003 — `components/ui/Tabs.tsx`
 *
 * Kapsam: `role=tablist/tab`, `aria-selected` tekilliği, seçim bildirimi ve
 * sayaç rozetinin yalnız `count` verildiğinde çizilmesi. `aria-selected`
 * tekilliği bozulursa ekran okuyucu iki etkin sekme duyurur.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Tabs from '@/components/ui/Tabs';

type TabValue = 'all' | 'pending' | 'done';

const ITEMS: { value: TabValue; label: string; count?: number }[] = [
  { value: 'all', label: 'Tümü', count: 12 },
  { value: 'pending', label: 'Bekleyen', count: 3 },
  { value: 'done', label: 'Tamamlanan' },
];

describe('Tabs', () => {
  test('tablist erişilebilir adıyla ve üç sekme olarak render edilir', () => {
    render(<Tabs items={ITEMS} value="all" onChange={() => {}} ariaLabel="Randevu durumu" />);
    const list = screen.getByRole('tablist', { name: 'Randevu durumu' });
    expect(list).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  test('yalnız seçili sekme aria-selected=true taşır', () => {
    render(<Tabs items={ITEMS} value="pending" onChange={() => {}} />);
    const selected = screen
      .getAllByRole('tab')
      .filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain('Bekleyen');
  });

  test('tıklama onChange ile sekme değerini bildirir', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} value="all" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: /Tamamlanan/ }));
    expect(onChange.mock.calls).toEqual([['done']]);
  });

  test('sayaç rozeti yalnız count tanımlı sekmede görünür', () => {
    render(<Tabs items={ITEMS} value="all" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /Tümü/ }).textContent).toBe('Tümü12');
    expect(screen.getByRole('tab', { name: /Tamamlanan/ }).textContent).toBe('Tamamlanan');
  });
});
