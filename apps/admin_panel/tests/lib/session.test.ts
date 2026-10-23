/**
 * `src/lib/session.ts` — AP-002 §5 kapsam genişletmesi (H1–H3'e ek 4. modül).
 *
 * Kapsam: (a) `useStoredUser` localStorage'daki kullanıcıyı ayrıştırır, geçersiz
 * JSON'da ve anahtar yokken `null` döner, (b) sunucu tarafında (window yok) `null`,
 * (c) `clearSession` üç anahtarı da siler.
 *
 * Bağımlılık/stub notu (AP-002 §10.4): `session.ts` `react` import ediyor ama
 * `node_modules` yok; `tests/helpers/stubs/react.mjs` yalnız `useSyncExternalStore`
 * snapshot okumasını ve `useMemo` türetmesini taklit eder. Bu yüzden burada
 * KANITLANAN şey "snapshot -> ayrıştırma" eşlemesidir; React'in yeniden render
 * semantiği bu kapının iddiası değildir.
 *
 * `localStorage`/`window` global'leri `tests/helpers/dom.mjs` ile kurulur ve
 * her testten sonra sökülür.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { installDom, withStoredUser } from '../helpers/dom.mjs';
// Hook'lar önce kaydedilmeli: `react` stub'ı olmadan `session.ts` yüklenemez.
import '../helpers/node-hooks.mjs';

type SessionModule = typeof import('../../src/lib/session.ts');

const sessionModule: Promise<SessionModule> = import('../../src/lib/session.ts');

test('useStoredUser: geçerli JSON kullanıcıyı nesne olarak döner', async () => {
  const { useStoredUser } = await sessionModule;
  const dom = installDom(withStoredUser({ fullName: 'Ayşe Yılmaz', role: 'ADMIN' }));
  try {
    const user = useStoredUser();
    assert.equal(user?.fullName, 'Ayşe Yılmaz');
    assert.equal(user?.role, 'ADMIN');
  } finally {
    dom.restore();
  }
});

test('useStoredUser: bozuk JSON\'da çöker değil, null döner', async () => {
  const { useStoredUser } = await sessionModule;
  const dom = installDom({ storage: { user: '{bozuk-json' } });
  try {
    assert.equal(useStoredUser(), null);
  } finally {
    dom.restore();
  }
});

test('useStoredUser: anahtar yokken null döner', async () => {
  const { useStoredUser } = await sessionModule;
  const dom = installDom();
  try {
    assert.equal(useStoredUser(), null);
    assert.equal(dom.store.has('user'), false);
  } finally {
    dom.restore();
  }
});

test('useStoredUser: sunucu tarafında (window yok) null döner', async () => {
  const { useStoredUser } = await sessionModule;
  // installDom çağrılmıyor: hydration öncesi yol.
  assert.equal(typeof globalThis.window, 'undefined');
  assert.equal(useStoredUser(), null);
});

test('clearSession: access_token, refresh_token ve user anahtarlarını siler', async () => {
  const { clearSession } = await sessionModule;
  const dom = installDom({
    storage: {
      access_token: 'a',
      refresh_token: 'r',
      user: JSON.stringify({ role: 'ADMIN' }),
      diger: 'dokunulmamali',
    },
  });
  try {
    clearSession();
    assert.deepEqual(dom.removed.sort(), ['access_token', 'refresh_token', 'user']);
    assert.equal(dom.store.has('access_token'), false);
    assert.equal(dom.store.has('refresh_token'), false);
    assert.equal(dom.store.has('user'), false);
    // Kapsam dışı anahtara dokunulmaz.
    assert.equal(dom.store.get('diger'), 'dokunulmamali');
  } finally {
    dom.restore();
  }
});
