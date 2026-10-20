// AP-001 — alt pill gezinmenin içerikle çakışıp çakışmadığı (390px, 8 yol, koyu).
// Çalıştırma: CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-clearance-check.js
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3002';
const PATHS = ['/', '/salons', '/appointments', '/users', '/reviews', '/categories', '/settings'];

const seed = `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', 'dark');
  return 'seeded';
})()`;

// Sayfa en alta kaydırılır; pill'in üst kenarı ile içerik bittiği nokta arasındaki boşluk.
const CLEAR = `(() => {
  window.scrollTo(0, document.body.scrollHeight);
  const pill = [...document.querySelectorAll('nav')].find((n) => getComputedStyle(n).position === 'fixed');
  if (!pill) return 'pill yok';
  const r = pill.getBoundingClientRect();
  const main = document.querySelector('main');
  const cs = getComputedStyle(main);
  const padBottom = parseFloat(cs.paddingBottom);
  const last = main.querySelector('ul:last-of-type li, form, section:last-of-type');
  const lr = last ? last.getBoundingClientRect() : null;
  return JSON.stringify({
    pillTop: Math.round(r.top),
    contentPaddingBottom: Math.round(padBottom),
    lastItemBottom: lr ? Math.round(lr.bottom) : null,
    clearance: lr ? Math.round(r.top - lr.bottom) : null,
  });
})()`;

const plan = [
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] },
  { type: 'viewport', w: 390, h: 844, dsf: 1 },
  { type: 'goto', url: BASE + '/login', wait: 6000 },
  { type: 'eval', label: 'seed', js: seed },
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
];
for (const p of PATHS) {
  plan.push({ type: 'goto', url: BASE + p, wait: 8000 });
  plan.push({ type: 'eval', label: 'temizlik ' + p, js: CLEAR });
}
plan.push({ type: 'goto', url: BASE + '/salons', wait: 9000 });
plan.push({ type: 'eval', label: 'salons tablo moduna gec', js: `(() => { const b=[...document.querySelectorAll('button')].find(x=>/Tablo ile gör/.test(x.textContent)); if(!b) return 'toggle yok'; b.click(); return 'ok'; })()` });
plan.push({ type: 'eval', label: 'temizlik /salons (tablo modu)', js: CLEAR });
plan.push({ type: 'diag' });
module.exports = plan;
