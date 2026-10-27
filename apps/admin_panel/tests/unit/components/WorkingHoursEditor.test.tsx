/**
 * AP-007 W2 — `components/salons/WorkingHoursEditor.tsx`
 *
 * Veri sözleşmesi seed ile aynıdır (`{ monday: { open, close } }`) ve **kapalı
 * gün anahtar olarak yazılmaz**. Testler erişilebilir yüzeyden kurar: gün
 * anahtarları `role=switch`, saatler `aria-label` ile bulunur; `value`
 * dondurulmuş (frozen) verilerek bileşenin onu mutasyona uğratmadığı da
 * kanıtlanır (React state'i ezilen aynı nesne referansı AP-007'nin klasik
 * tuzağı).
 */
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WorkingHoursEditor, {
  DEFAULT_DAY_HOURS,
  WORKING_DAYS,
  type WorkingHours,
} from '@/components/salons/WorkingHoursEditor';

const setTime = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });

describe('WorkingHoursEditor', () => {
  test('7 günün tamamı tek grup altında, Türkçe etiketlerle basılır', () => {
    render(<WorkingHoursEditor value={{}} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Çalışma saatleri' })).toBeTruthy();
    expect(screen.getAllByRole('switch')).toHaveLength(7);
    expect(WORKING_DAYS.map((d) => d.label)).toEqual([
      'Pazartesi',
      'Salı',
      'Çarşamba',
      'Perşembe',
      'Cuma',
      'Cumartesi',
      'Pazar',
    ]);
    for (const { label } of WORKING_DAYS) {
      expect(screen.getByRole('switch', { name: `${label} açık` })).toBeTruthy();
    }
  });

  test('value’daki günler açık gelir ve saatleri inputlarda görünür', () => {
    render(
      <WorkingHoursEditor
        value={{ monday: { open: '09:00', close: '21:00' }, saturday: { open: '10:00', close: '20:00' } }}
        onChange={() => {}}
      />
    );
    expect(
      (screen.getByRole('switch', { name: 'Pazartesi açık' }) as HTMLElement).getAttribute('aria-checked')
    ).toBe('true');
    expect((screen.getByLabelText('Pazartesi açılış saati') as HTMLInputElement).value).toBe('09:00');
    expect((screen.getByLabelText('Pazar açılış saati') as HTMLInputElement).value).toBe('');
  });

  test('kapalı günü açınca varsayılan saatler yazılır', async () => {
    const onChange = vi.fn();
    render(<WorkingHoursEditor value={{}} onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Pazar açık' }));
    expect(onChange.mock.calls[0][0]).toEqual({ sunday: DEFAULT_DAY_HOURS });
  });

  test('günü kapatınca anahtar workingHours’a HİÇ yazılmaz (kapalı = anahtar yok)', async () => {
    const onChange = vi.fn();
    render(
      <WorkingHoursEditor
        value={{
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
        }}
        onChange={onChange}
      />
    );
    await userEvent.click(screen.getByRole('switch', { name: 'Pazartesi açık' }));
    const next = onChange.mock.calls[0][0] as WorkingHours;
    expect('monday' in next).toBe(false);
    expect(Object.keys(next)).toEqual(['tuesday']);
  });

  test('saat değişimi yalnız o günü günceller; kapalı günde saat inputları devre dışıdır', () => {
    const onChange = vi.fn();
    render(
      <WorkingHoursEditor
        value={{ friday: { open: '09:00', close: '18:00' } }}
        onChange={onChange}
      />
    );
    setTime('Cuma açılış saati', '10:30');
    expect(onChange.mock.calls[0][0]).toEqual({ friday: { open: '10:30', close: '18:00' } });

    for (const name of ['Pazartesi açılış saati', 'Pazartesi kapanış saati']) {
      expect((screen.getByLabelText(name) as HTMLInputElement).disabled).toBe(true);
    }
  });

  test('kapanış saati de aynı günün kümesini koruyarak güncellenir', () => {
    const onChange = vi.fn();
    render(
      <WorkingHoursEditor value={{ friday: { open: '10:00', close: '20:00' } }} onChange={onChange} />
    );
    setTime('Cuma kapanış saati', '19:30');
    expect(onChange.mock.calls[0][0]).toEqual({ friday: { open: '10:00', close: '19:30' } });
  });

  test('value mutasyona uğratılmaz; her değişiklikte yeni nesne döner', async () => {
    const onChange = vi.fn();
    const frozen = Object.freeze({
      monday: Object.freeze({ open: '09:00', close: '18:00' }),
    }) as WorkingHours;
    render(<WorkingHoursEditor value={frozen} onChange={onChange} />);
    setTime('Pazartesi açılış saati', '11:00');
    const next = onChange.mock.calls[0][0] as WorkingHours;
    expect(next).not.toBe(frozen);
    expect(next.monday).toEqual({ open: '11:00', close: '18:00' });
    // Orijinal (API'den gelen) nesne aynen duruyor.
    expect(frozen.monday).toEqual({ open: '09:00', close: '18:00' });
    await userEvent.click(screen.getByRole('switch', { name: 'Salı açık' }));
    expect(onChange.mock.calls[1][0]).toEqual({
      monday: { open: '09:00', close: '18:00' },
      tuesday: DEFAULT_DAY_HOURS,
    });
  });

  test('gün satırları tablo gibi hizalanır: başlık satırında açılış/kapanış etiketleri var', () => {
    render(<WorkingHoursEditor value={{}} onChange={() => {}} />);
    expect(screen.getByText('Açılış')).toBeTruthy();
    expect(screen.getByText('Kapanış')).toBeTruthy();
    expect(screen.getByText('Açık')).toBeTruthy();
  });
});
