// AP-001 — sadece dokunma hedefleri (hızlı geri bildirim).
// Çalıştırma: CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-taps-only.js
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3002';

const seed = `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', 'light');
  return 'seeded';
})()`;

// Dar ekranda 44px, geniş ekranda 24px alt sınırı (WCAG 2.5.8 hedef boyutu).
const TARGETS = (minTarget) => `(() => {
  const MIN = ${minTarget};
  const bad = [];
  let min = 999, n = 0;
  for (const el of document.querySelectorAll('a,button,select,input,textarea,[role=button],[role=switch]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    n++;
    const m = Math.min(r.width, r.height);
    if (m < min) min = m;
    if (m < MIN) bad.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), label: (el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,22) });
  }
  return JSON.stringify({ minTarget: MIN, count: n, under: bad.length, min: +min.toFixed(1), sample: bad.slice(0,8) });
})()`;

const plan = [
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] },
  { type: 'viewport', w: 1440, h: 900, dsf: 1 },
  { type: 'goto', url: BASE + '/login', wait: 6000 },
  { type: 'eval', label: 'seed', js: seed },
];
for (const [w, minTarget, routes] of [[390, 44, ['/', '/salons', '/appointments', '/settings', '/categories', '/reviews']], [1440, 24, ['/', '/salons']]]) {
  for (const r of routes) {
    plan.push({ type: 'viewport', w, h: 844, dsf: w === 390 ? 2 : 1 });
    plan.push({ type: 'goto', url: BASE + r, wait: 8000 });
    plan.push({ type: 'eval', label: `tap ${w} ${r}`, js: TARGETS(minTarget) });
  }
}
plan.push({ type: 'diag' });
module.exports = plan;
