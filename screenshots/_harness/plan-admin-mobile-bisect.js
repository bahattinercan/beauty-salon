// 390px'te yatay taşmanın sorumlusunu tahminle değil bisect ile bulur:
// main'in her alt ağacını display:none yapıp documentElement.scrollWidth'i yeniden okur.
// Çalıştırma: CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-mobile-bisect.js
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const BASE = 'http://127.0.0.1:3001';

const SEED = `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  return 'seeded';
})()`;

const BISECT = `(() => {
  const W = 390;
  const de = document.documentElement;
  const base = de.scrollWidth;
  const main = document.querySelector('main') || document.body;
  const kids = [...main.children];
  const rows = [];
  for (const k of kids) {
    const prev = k.style.display;
    k.style.display = 'none';
    const after = de.scrollWidth;
    k.style.display = prev;
    rows.push({
      tag: k.tagName.toLowerCase(),
      cls: (k.className || '').toString().slice(0, 60),
      w: Math.round(k.getBoundingClientRect().width),
      drops: base - after,
    });
  }
  // en kötü alt ağacın içinde derinleş: tablo mu, filtre çubuğu mu?
  let deep = [];
  let node = kids.slice().sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  for (let depth = 0; depth < 4 && node; depth++) {
    const cur = de.scrollWidth;
    const cand = [...node.children].map((c) => {
      const prev = c.style.display;
      c.style.display = 'none';
      const after = de.scrollWidth;
      c.style.display = prev;
      return { el: c, tag: c.tagName.toLowerCase(), cls: (c.className || '').toString().slice(0, 60), w: Math.round(c.getBoundingClientRect().width), drops: cur - after };
    }).filter((c) => c.drops > 0).sort((a, b) => b.drops - a.drops)[0];
    if (!cand) break;
    deep.push({ depth, tag: cand.tag, cls: cand.cls, w: cand.w, drops: cand.drops });
    node = cand.el;
  }
  const tables = [...document.querySelectorAll('table')].map((t) => {
    const r = t.getBoundingClientRect();
    const cols = t.querySelectorAll('thead th').length;
    return { w: Math.round(r.width), cols, rows: t.querySelectorAll('tbody tr').length, wrap: (t.parentElement.className || '').toString().slice(0, 50) };
  });
  return JSON.stringify({ emulated: W, scrollWidth: base, overflow: base - W, top: rows.sort((a, b) => b.drops - a.drops).slice(0, 4), deep, tables }, null, 0);
})()`;

const pages = ['/', '/salons', '/users', '/appointments', '/reviews', '/categories', '/settings'];
const plan = [
  { type: 'viewport', w: 390, h: 844, dsf: 1 },
  { type: 'goto', url: BASE + '/login', wait: 8000 },
  { type: 'eval', label: 'seed', js: SEED },
];
for (const p of pages) {
  plan.push({ type: 'viewport', w: 390, h: 844, dsf: 1 });
  plan.push({ type: 'goto', url: BASE + p, wait: 9000 });
  plan.push({ type: 'eval', label: 'bisect ' + p, js: BISECT });
}
plan.push({ type: 'diag' });
module.exports = plan;
