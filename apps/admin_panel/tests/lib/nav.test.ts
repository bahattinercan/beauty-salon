/**
 * AP-002 H2 — `src/lib/nav.ts`
 *
 * Kapsam: (a) `isNavActive` alt yol eşleşmesi, (b) `NAV_ITEMS` sözleşmesi
 * (7 öğe, 4 primary, benzersiz href), (c) her href için gerçek bir
 * `src/app/<href>/page.tsx` sayfasının var olması.
 *
 * (c) gerçek bir regresyonu yakalar: gezinmeye eklenen ama sayfası açılmayan bir
 * route üretime 404 olarak sızar.
 *
 * Bağımlılık notu: `nav.ts` `lucide-react` import ediyor ve `node_modules` yok;
 * modül `tests/helpers/node-hooks.mjs` stub'ı ile yükleniyor (AP-002 §5).
 * Bu yüzden `src/lib/nav.ts` statik import EDİLMEZ, hook kaydından sonra
 * dinamik `import()` kullanılır.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import path from 'node:path';

import { srcDir } from '../helpers/node-hooks.mjs';

type NavModule = typeof import('../../src/lib/nav.ts');

const navModule: Promise<NavModule> = import('../../src/lib/nav.ts');

const pageFile = (href: string): string =>
  href === '/' ? path.join(srcDir, 'app', 'page.tsx') : path.join(srcDir, 'app', href.slice(1), 'page.tsx');

test('isNavActive: kök yol yalnız "/" ile eşleşir', async () => {
  const { isNavActive } = await navModule;
  assert.equal(isNavActive('/', '/'), true);
  assert.equal(isNavActive('/salons', '/'), false);
});

test('isNavActive: alt yollar üst öğeyi aktif eder', async () => {
  const { isNavActive } = await navModule;
  assert.equal(isNavActive('/salons/123', '/salons'), true);
  assert.equal(isNavActive('/salons', '/salons'), true);
  assert.equal(isNavActive('/users', '/salons'), false);
  assert.equal(isNavActive('/appointments/9/edit', '/appointments'), true);
});

test('isNavActive: SideRail/BottomPillNav/MobileDrawer tek kaynaktan beslenir', async () => {
  // Üç kabuk bileşeni de bu fonksiyonu import eder; kaynak tek olsun diye
  // davranış tek yerde sabitlenir.
  const { isNavActive } = await navModule;
  const hrefless = ['/reviews', '/categories', '/settings'];
  for (const href of hrefless) {
    assert.equal(isNavActive(href, href), true);
  }
});

test('NAV_ITEMS: 7 öğe ve 4 primary öğe', async () => {
  const { NAV_ITEMS } = await navModule;
  assert.equal(NAV_ITEMS.length, 7);
  assert.equal(NAV_ITEMS.filter((item) => item.primary).length, 4);
});

test('NAV_ITEMS: href\'ler benzersiz ve "/" ile başlar', async () => {
  const { NAV_ITEMS } = await navModule;
  const hrefs = NAV_ITEMS.map((item) => item.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
  for (const href of hrefs) {
    assert.equal(href.startsWith('/'), true, `href "/" ile başlamalı: ${href}`);
  }
});

test('NAV_ITEMS: her href için src/app altında gerçek bir page.tsx var', async () => {
  const { NAV_ITEMS } = await navModule;
  const missing: string[] = [];
  for (const { href } of NAV_ITEMS) {
    const file = pageFile(href);
    let exists = false;
    try {
      exists = statSync(file).isFile();
    } catch {
      exists = false;
    }
    if (!exists) missing.push(`${href} -> ${path.relative(srcDir, file)}`);
  }
  assert.deepEqual(missing, [], `sayfası olmayan gezinme öğeleri: ${missing.join(', ')}`);
});

test('NAV_ITEMS: her öğe etiket ve ikon taşır', async () => {
  const { NAV_ITEMS } = await navModule;
  for (const item of NAV_ITEMS) {
    assert.equal(typeof item.label, 'string');
    assert.equal(item.label.length > 0, true);
    assert.equal(typeof item.icon, 'function');
  }
});
