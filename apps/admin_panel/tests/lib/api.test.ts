/**
 * AP-002 H3 — `src/lib/api.ts`
 *
 * Kapsam: (a) sunucu `message` alanı hata mesajına taşınır, (b) JSON olmayan hata
 * gövdesi `API error <status>` üretir, (c) `access_token` yokken `Authorization`
 * başlığı GÖNDERİLMEZ ama `Content-Type: application/json` gönderilir, (d) token
 * varsa `Bearer` başlığı eklenir, (e) başarılı yanıt gövdesi döndürülür.
 *
 * Neden kapı: panelin tüm veri yolu buradan geçiyor; (c) yanlışsa korumalı uçlar
 * sessizce 401 alır.
 *
 * Ağ yok: `globalThis.fetch` `node:test` mock'u ile değiştirilir, sahte yanıt
 * yereldir (AP-002 §4 ölçüm 5).
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

import { installDom } from '../helpers/dom.mjs';

type ApiModule = typeof import('../../src/lib/api.ts');

const apiModule: Promise<ApiModule> = import('../../src/lib/api.ts');

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

function fakeResponse(ok: boolean, status: number, json: () => Promise<unknown>): FakeResponse {
  return { ok, status, json };
}

/** `fetch`'i sahte yanıtla değiştirir ve çağrı argümanlarını kaydeder. */
async function mockFetch(response: FakeResponse) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return response;
  });
  return { calls, restore: () => fn.mock.restore() };
}

test('apiFetch: hata gövdesindeki sunucu mesajı Error.message olur', async () => {
  const { apiFetch } = await apiModule;
  const fetchSpy = await mockFetch(
    fakeResponse(false, 400, async () => ({ message: 'Salon bulunamadı' }))
  );
  try {
    await assert.rejects(
      () => apiFetch('/salons/999'),
      (error: unknown) => {
        assert.equal(error instanceof Error, true);
        assert.equal((error as Error).message, 'Salon bulunamadı');
        return true;
      }
    );
  } finally {
    fetchSpy.restore();
  }
});

test('apiFetch: JSON olmayan gövdede "API error <status>" mesajı üretir', async () => {
  const { apiFetch } = await apiModule;
  const fetchSpy = await mockFetch(
    fakeResponse(false, 500, () => Promise.reject(new SyntaxError('Unexpected token <')))
  );
  try {
    await assert.rejects(
      () => apiFetch('/users'),
      (error: unknown) => {
        assert.equal((error as Error).message, 'API error 500');
        return true;
      }
    );
  } finally {
    fetchSpy.restore();
  }
});

test('apiFetch: message alanı boşsa status tabanlı mesaja düşer', async () => {
  const { apiFetch } = await apiModule;
  const fetchSpy = await mockFetch(fakeResponse(false, 403, async () => ({})));
  try {
    await assert.rejects(() => apiFetch('/reviews'), /^Error: API error 403$/);
  } finally {
    fetchSpy.restore();
  }
});

test('apiFetch: token yokken Authorization başlığı GÖNDERİLMEZ', async () => {
  const { apiFetch } = await apiModule;
  const fetchSpy = await mockFetch(fakeResponse(true, 200, async () => ({ items: [] })));
  try {
    // `installDom` çağrılmıyor: window/localStorage yok => sunucu tarafı yolu.
    const body = (await apiFetch('/salons?page=2')) as { items: unknown[] };
    const [{ url, init }] = fetchSpy.calls;
    const headers = init.headers as Record<string, string>;
    assert.equal(body.items.length, 0);
    assert.equal('Authorization' in headers, false);
    assert.equal(headers['Content-Type'], 'application/json');
    assert.equal(url.endsWith('/api/v1/salons?page=2'), true, `beklenmeyen URL: ${url}`);
  } finally {
    fetchSpy.restore();
  }
});

test('apiFetch: access_token varsa Bearer başlığı eklenir', async () => {
  const { apiFetch } = await apiModule;
  const dom = installDom({ storage: { access_token: 'test-token-123' } });
  const fetchSpy = await mockFetch(fakeResponse(true, 200, async () => ({ ok: true })));
  try {
    const body = await apiFetch('/auth/me');
    const [{ init }] = fetchSpy.calls;
    const headers = init.headers as Record<string, string>;
    assert.equal(headers.Authorization, 'Bearer test-token-123');
    assert.deepEqual(body, { ok: true });
  } finally {
    fetchSpy.restore();
    dom.restore();
  }
});

test('apiFetch: çağıranın verdiği başlıklar varsayılanları ezer', async () => {
  const { apiFetch } = await apiModule;
  const fetchSpy = await mockFetch(fakeResponse(true, 200, async () => ({})));
  try {
    await apiFetch('/upload', { headers: { 'Content-Type': 'multipart/form-data' } });
    const [{ init }] = fetchSpy.calls;
    const headers = init.headers as Record<string, string>;
    assert.equal(headers['Content-Type'], 'multipart/form-data');
  } finally {
    fetchSpy.restore();
  }
});
