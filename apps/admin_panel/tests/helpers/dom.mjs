/**
 * Test-yalnız DOM/localStorage kurulumu (AP-002 §10.4).
 *
 * Node'da `window`, `document`, `localStorage`, `getComputedStyle` YOK
 * (ölçüldü: dördü de `undefined`). Testler gerçek bir DOM taklit etmek yerine
 * yalnız modüllerin dokunduğu üç global'i kurar ve `restore()` ile söker.
 *
 * Kullanım:
 *   const dom = installDom({ storage: { user: '{"role":"ADMIN"}' } });
 *   const dom = installDom({ tokens: { '--primary-solid': '#123456' } });
 *   dom.restore();
 */
const TRACKED = ['window', 'document', 'localStorage', 'getComputedStyle'];

/**
 * @param {object} [options]
 * @param {Record<string, string>} [options.storage] localStorage başlangıç anahtarları
 * @param {Record<string, string>} [options.tokens] getComputedStyle'ın döndüreceği CSS değişkenleri
 */
export function installDom({ storage = null, tokens = null } = {}) {
  if (storage !== null && typeof storage !== 'object') {
    throw new TypeError('installDom: `storage` bir nesne olmalı (anahtar -> string değer)');
  }
  const saved = new Map();
  for (const key of TRACKED) saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));

  const store = new Map(Object.entries(storage ?? {}).map(([key, value]) => [key, String(value)]));
  const removed = [];
  const written = [];

  const localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      written.push([key, value]);
      store.set(key, String(value));
    },
    removeItem(key) {
      removed.push(key);
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };

  globalThis.window = globalThis;
  globalThis.localStorage = localStorage;

  if (tokens) {
    globalThis.document = { documentElement: { nodeName: 'HTML' } };
    globalThis.getComputedStyle = () => ({
      getPropertyValue(name) {
        const value = tokens[name];
        return value === undefined ? '' : value;
      },
    });
  }

  return {
    removed,
    written,
    store,
    restore() {
      for (const key of TRACKED) {
        const descriptor = saved.get(key);
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

/** localStorage'a yazılmış JSON kullanıcısını hızlıca kurmak için. */
export function storedUser(value) {
  return { user: JSON.stringify(value) };
}

/** `storedUser(...)` çıktısını `installDom({ storage })` biçimine çevirir. */
export function withStoredUser(value) {
  return { storage: storedUser(value) };
}
