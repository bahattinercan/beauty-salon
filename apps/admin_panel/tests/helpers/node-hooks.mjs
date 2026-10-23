/**
 * AP-002 §5/§6 — test-yalnız module hook'ları (bağımlılık DEĞİL, altyapı DEĞİL).
 *
 * Neden var: `apps/admin_panel/node_modules` yok ve kurulum/ağ yasak. Node'un
 * yerleşik type-stripping'i `.ts` dosyalarını yükler ama `package.json` bağımlılıklarını
 * (lucide-react, react) çözemez, `tsconfig.json` `paths` (`@/*`) eşlemesini de okumaz.
 * Bu dosya `node:module` `registerHooks` ile üç şeyi yapar:
 *
 *   1. `lucide-react`  -> ./stubs/lucide-react.mjs  (ikon bileşenleri; davranış yok)
 *   2. `react`         -> ./stubs/react.mjs         (hook'ların snapshot okuma yolu)
 *   3. `@/<yol>`       -> <repo>/apps/admin_panel/src/<yol>  (.ts/.tsx/index.* denenir)
 *                         NOT: bugünkü testler bu dalı KULLANMIYOR — `src/lib/*.ts` içinde
 *                         `@/` importu yok (yalnız `.tsx` dosyaları kullanıyor ve onlar
 *                         yüklenemiyor). Gelecekte `.ts`leşen bir modül `@/lib/x`
 *                         import ederse hazır olsun diye bırakıldı; test edilmemiş daldır.
 *
 * SINIR (AP-002 §10.2): stub'lar gerçek paketlerin yerine geçmez. Amaç yalnız
 * "modül yüklenebilsin, saf mantığı test edilebilsin". Gerçek React render/hook
 * semantiği ya da gerçek lucide ikon adları bu kapıda KANITLANMAZ.
 *
 * Kullanım: test dosyasının en üstünde yan etki için import edilir, sonra `src/lib/*.ts`
 * dinamik `import()` ile yüklenir (statik import hook'lardan önce çözülürdü).
 */
import { registerHooks } from 'node:module';
import { statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const here = import.meta.dirname;
export const testsDir = path.resolve(here, '..');
export const panelDir = path.resolve(testsDir, '..');
export const srcDir = path.join(panelDir, 'src');

const stubUrl = (name) => pathToFileURL(path.join(here, 'stubs', name)).href;

const PACKAGE_STUBS = {
  'lucide-react': stubUrl('lucide-react.mjs'),
  react: stubUrl('react.mjs'),
};

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx'];

function isFile(candidate) {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function resolveAlias(specifier) {
  const base = path.join(srcDir, specifier.slice(2));
  for (const ext of EXTENSIONS) {
    const candidate = `${base}${ext}`;
    if (isFile(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

let registered = false;

/** Hook'ları bir kez kaydeder. Test dosyası import eder etmez çağrılır. */
export function registerTestHooks() {
  if (registered) return;
  registered = true;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      const stubbed = PACKAGE_STUBS[specifier];
      if (stubbed) return { url: stubbed, shortCircuit: true, format: 'module' };

      if (specifier.startsWith('@/')) {
        const mapped = resolveAlias(specifier);
        if (mapped) return { url: mapped, shortCircuit: true };
      }

      return nextResolve(specifier, context);
    },
  });
}

registerTestHooks();
