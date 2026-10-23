/**
 * AP-004 — `components/ui/Field.tsx`
 *
 * Kapsam: form alanlarının erişilebilirlik sözleşmesi. `Field` etiket–kontrol
 * bağını (`htmlFor`) ve zorunlu işaretini kurar; hata varsa ipucu **gizlenir**
 * (iki metin üst üste binmesin). `Toggle` `role=switch` + `aria-checked`
 * yayınlar ve dokunma hedefi ≥44px (`min-h-11`) kalır — ayarlar sayfasının
 * tek anahtarı.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from 'lucide-react';

import { Field, Input, Select, Textarea, Toggle } from '@/components/ui/Field';

describe('Field', () => {
  test('label → kontrol bağını htmlFor/id ile kurar (getByLabelText çözer)', () => {
    render(
      <Field label="Salon adı" htmlFor="salon-adi">
        <Input id="salon-adi" defaultValue="Güzellik" />
      </Field>
    );
    const input = screen.getByLabelText('Salon adı');
    expect(input.tagName).toBe('INPUT');
    expect((input as HTMLInputElement).value).toBe('Güzellik');
  });

  test('required verildiğinde yıldız işareti erişilebilir ada eklenir', () => {
    render(
      <Field label="Telefon" htmlFor="tel" required>
        <Input id="tel" />
      </Field>
    );
    expect(screen.getByText('*')).toBeTruthy();
    // Erişilebilir ad yıldızı da içerir; kontrol hâlâ bulunabilir olmalı.
    expect(screen.getByLabelText(/Telefon/)).toBeTruthy();
  });

  test('hint hata yokken görünür, hata varken yerini hataya bırakır', () => {
    const { unmount } = render(
      <Field label="E-posta" htmlFor="mail" hint="Kurumsal adres">
        <Input id="mail" />
      </Field>
    );
    expect(screen.getByText('Kurumsal adres')).toBeTruthy();
    unmount();

    render(
      <Field label="E-posta" htmlFor="mail" hint="Kurumsal adres" error="Geçersiz adres">
        <Input id="mail" />
      </Field>
    );
    expect(screen.getByText('Geçersiz adres')).toBeTruthy();
    expect(screen.queryByText('Kurumsal adres')).toBeNull();
  });

  test('error=null ipucunu gizlemez (API "hata yok" gönderir)', () => {
    render(
      <Field label="Adres" htmlFor="adres" hint="İlçe + il" error={null}>
        <Input id="adres" />
      </Field>
    );
    expect(screen.getByText('İlçe + il')).toBeTruthy();
  });
});

describe('Input / Select / Textarea', () => {
  test('ikon verilmezse sarmalayıcı çizilmez, kontrol doğrudan basılır', () => {
    const { container } = render(<Input aria-label="Düz" />);
    expect(container.firstElementChild?.tagName).toBe('INPUT');
    expect(container.querySelector('svg')).toBeNull();
    expect((container.firstElementChild as HTMLElement).className).toContain('min-h-11');
  });

  test('ikon verilirse sarmalayıcı içinde aria-hidden ikon + sol dolgu', () => {
    const { container } = render(<Input aria-label="Ara" icon={Search} />);
    const input = screen.getByLabelText('Ara');
    expect(input.className).toContain('pl-9');
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  test('Select seçenekleri basar ve appearance-none sınıfını taşır', () => {
    render(
      <Select aria-label="Durum" defaultValue="onaylı">
        <option value="onaylı">Onaylı</option>
        <option value="pasif">Pasif</option>
      </Select>
    );
    const select = screen.getByLabelText('Durum') as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('onaylı');
    expect(select.className).toContain('appearance-none');
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  test('Textarea ek yükseklik sınıfıyla basılır ve değerini korur', () => {
    const { container } = render(<Textarea aria-label="Not" defaultValue="Merhaba" />);
    const ta = screen.getByLabelText('Not') as HTMLTextAreaElement;
    expect(ta.value).toBe('Merhaba');
    expect((container.firstElementChild as HTMLElement).className).toContain('min-h-24');
  });
});

describe('Toggle', () => {
  test('role=switch ve aria-checked durumu yayınlar, etiket erişilebilir addır', () => {
    const { unmount } = render(<Toggle checked label="Bildirimler" onChange={() => {}} />);
    const sw = screen.getByRole('switch', { name: 'Bildirimler' });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    unmount();

    render(<Toggle checked={false} label="Bildirimler" onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Bildirimler' }).getAttribute('aria-checked')).toBe(
      'false'
    );
  });

  test('tıklama mevcut değerin tersini ister (kapalıyken true)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle checked={false} label="Hafta sonu" onChange={onChange} />);

    await user.click(screen.getByRole('switch', { name: 'Hafta sonu' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('tıklama açıkken false ister; görsel ray dokunma hedefi ≥44px kalır', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle checked label="SMS" onChange={onChange} />);

    const sw = screen.getByRole('switch', { name: 'SMS' });
    expect(sw.className).toContain('min-h-11');
    await user.click(sw);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
