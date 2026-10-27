/**
 * AP-007 W2 — `components/salons/ImageField.tsx` + `lib/api.ts#uploadFile`
 *
 * Test kendi modülümüzü mock'lamaz: `fetch` stub'lanır, böylece gerçek zincir
 * (ImageField → uploadFile → fetch) sınanır. AP-007'nin R6 tuzağı burada
 * kilitlenir: multipart gövde gidecekse `Content-Type` **gönderilmemeli**;
 * boundary'yi `fetch` kurar, JSON başlığı multer'ı kırardı.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ImageField from '@/components/salons/ImageField';

const UPLOAD_URL = 'http://localhost:3000/api/v1/upload/single';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const pngFile = () =>
  new File([new Uint8Array([137, 80, 78, 71])], 'logo.png', { type: 'image/png' });

const pickFile = async (file: File) => {
  const input = screen.getByLabelText('Logo') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
};

const firstCall = (spy: { mock: { calls: unknown[] } }): [string, RequestInit] =>
  spy.mock.calls[0] as [string, RequestInit];

describe('ImageField', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'tok-123');
  });

  test('dosya seçilince tek görsel ucuna POST gider ve dönen yol bildirilir', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(200, { success: true, data: { url: '/uploads/abc.png' } })
    );
    const onChange = vi.fn();
    render(<ImageField label="Logo" value={null} onChange={onChange} />);

    const input = screen.getByLabelText('Logo') as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input.accept).toContain('image/png');

    await pickFile(pngFile());

    const [url, init] = firstCall(spy);
    expect(url).toBe(UPLOAD_URL);
    expect(init.method).toBe('POST');
    expect(onChange).toHaveBeenCalledWith('/uploads/abc.png');
  });

  test('gövde FormData’dır; Content-Type GÖNDERİLMEZ, Authorization korunur (R6)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(200, { success: true, data: { url: '/uploads/abc.png' } })
    );
    render(<ImageField label="Logo" value={null} onChange={vi.fn()} />);
    await pickFile(pngFile());

    const [, init] = firstCall(spy);
    const form = init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    const uploaded = form.get('file') as File;
    expect(uploaded.name).toBe('logo.png');

    const headers = (init.headers ?? {}) as Record<string, string>;
    const names = Object.keys(headers).map((h) => h.toLowerCase());
    expect(names).not.toContain('content-type');
    expect(headers.Authorization).toBe('Bearer tok-123');
  });

  test('oturum tokeni yoksa Authorization başlığı da gönderilmez', async () => {
    localStorage.clear();
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(200, { success: true, data: { url: '/uploads/abc.png' } })
    );
    render(<ImageField label="Logo" value={null} onChange={vi.fn()} />);
    await pickFile(pngFile());
    expect(firstCall(spy)[1].headers).toBeUndefined();
  });

  test('yükleme sürerken durum duyurulur ve dosya girişi devre dışı kalır', async () => {
    let settle!: (res: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      settle = resolve;
    });
    vi.spyOn(globalThis, 'fetch').mockReturnValue(pending);
    const onChange = vi.fn();
    render(<ImageField label="Logo" value={null} onChange={onChange} />);

    const input = screen.getByLabelText('Logo') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [pngFile()] } });

    expect(screen.getByText('Görsel yükleniyor')).toBeTruthy();
    expect(input.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Dosya seç' }).hasAttribute('disabled')).toBe(true);
    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      settle(jsonResponse(200, { success: true, data: { url: '/uploads/sonra.png' } }));
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('/uploads/sonra.png'));
    expect(screen.queryByText('Görsel yükleniyor')).toBeNull();
    expect((screen.getByLabelText('Logo') as HTMLInputElement).disabled).toBe(false);
  });

  test('API hatası role=alert ile okunur ve onChange çağrılmaz', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(413, { success: false, message: 'Dosya çok büyük' })
    );
    const onChange = vi.fn();
    render(<ImageField label="Logo" value={null} onChange={onChange} />);
    await pickFile(pngFile());

    expect(screen.getByRole('alert').textContent).toBe('Dosya çok büyük');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('yanıtta yol yoksa sessiz kalmaz: hata basar', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, { success: true, data: {} }));
    const onChange = vi.fn();
    render(<ImageField label="Logo" value={null} onChange={onChange} />);
    await pickFile(pngFile());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('görsel yolu');
  });

  test('değer varsa önizleme API origin’ine tamamlanmış hâlde basılır', () => {
    render(<ImageField label="Kapak görseli" value="/uploads/kapak.png" onChange={vi.fn()} />);
    const img = screen.getByRole('img', { name: 'Kapak görseli önizleme' });
    expect(img.getAttribute('src')).toBe('http://localhost:3000/uploads/kapak.png');
  });

  test('mutlak URL olduğu gibi kullanılır (ör. harici CDN)', () => {
    render(
      <ImageField
        label="Kapak görseli"
        value="https://cdn.example.com/a.png"
        onChange={vi.fn()}
      />
    );
    expect(
      screen.getByRole('img', { name: 'Kapak görseli önizleme' }).getAttribute('src')
    ).toBe('https://cdn.example.com/a.png');
  });

  test('görsel yokken yer tutucu basılır, kaldırma devre dışıdır', () => {
    render(<ImageField label="Logo" value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'Logo: görsel yok' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Logo görselini kaldır' }).hasAttribute('disabled')
    ).toBe(true);
  });

  test('kaldır mevcut yolu null’a döndürür', async () => {
    const onChange = vi.fn();
    render(<ImageField label="Logo" value="/uploads/abc.png" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Logo görselini kaldır' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  test('URL yapıştırma alternatifi fetch ETMEZ; boşken düğme devre dışıdır', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const onChange = vi.fn();
    render(<ImageField label="Logo" value={null} onChange={onChange} />);

    const apply = screen.getByRole('button', { name: 'URL kullan' });
    expect(apply.hasAttribute('disabled')).toBe(true);

    await userEvent.type(screen.getByLabelText('Logo URL'), '/uploads/yapistirildi.png');
    await userEvent.click(apply);

    expect(onChange).toHaveBeenCalledWith('/uploads/yapistirildi.png');
    expect(spy).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Logo URL') as HTMLInputElement).value).toBe('');
  });

  test('URL alanında Enter uygulamayı tetikler (form gönderimi yok)', () => {
    const onChange = vi.fn();
    render(<ImageField label="Logo" value={null} onChange={onChange} />);
    const input = screen.getByLabelText('Logo URL') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '/uploads/enter.png' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('/uploads/enter.png');
  });
});
