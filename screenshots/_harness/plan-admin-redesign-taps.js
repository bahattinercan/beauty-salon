// AP-001 — odaklı doğrulama: dokunma hedefleri + düzeltilmiş kontrast probu + son kareler.
// Çalıştırma: CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-redesign-taps.js
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3002';

const seed = (theme) => `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', '${theme}');
  return location.href;
})()`;

const TARGETS = `(() => {
  const bad = [];
  let min = 999, n = 0;
  for (const el of document.querySelectorAll('a,button,select,input,textarea,[role=button],[role=switch]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    n++;
    const m = Math.min(r.width, r.height);
    if (m < min) min = m;
    if (m < 44) bad.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), label: (el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,22), cls: (el.className||'').toString().slice(0,42) });
  }
  return JSON.stringify({ count: n, under44: bad.length, min: +min.toFixed(1), sample: bad.slice(0, 6) });
})()`;

const CONTRAST = (W) => `(() => {
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  const paint = (css) => { ctx.fillStyle = css; ctx.fillRect(0,0,1,1); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const lum = (rgb) => { const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
  const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return +((x+0.05)/(y+0.05)).toFixed(2); };
  const effBg = (el) => { const st=[]; let n=el; while(n){ const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') st.push(c); n = n.parentElement; } st.reverse(); ctx.clearRect(0,0,1,1); for (const c of st) paint(c); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const probe = (el, label) => { if (!el) return { label, missing: true }; const bg = effBg(el); const fg = paint(getComputedStyle(el).color); return { label, ratio: ratio(fg,bg), fs: getComputedStyle(el).fontSize }; };
  const q = (s) => document.querySelector(s);
  const links = [...document.querySelectorAll('aside a')];
  const isActive = (a) => String(a.className).includes('bg-on-nav-pill/12');
  return JSON.stringify({
    htmlClass: document.documentElement.className,
    h1Count: document.querySelectorAll('h1').length,
    overflow: document.documentElement.scrollWidth - ${W},
    probes: [
      probe(links.find((a) => !isActive(a)), 'ray link (pasif)'),
      probe(links.find(isActive), 'ray link (aktif)'),
      probe(q('main h1'), 'sayfa başlığı (h1)'),
      probe(q('main table th'), 'tablo başlığı'),
      probe(q('main table td'), 'tablo hücresi'),
      probe(q('main [class^="badge-"]'), 'rozet'),
      probe(q('main button'), 'buton metni'),
      probe(q('main [role=switch] span'), 'switch zemini (dekoratif)'),
      probe(q('main p'), 'gövde paragrafı'),
    ],
  });
})()`;

const plan = [{ type: 'viewport', w: 1440, h: 900, dsf: 1 }];
for (const theme of ['light', 'dark']) {
  plan.push({ type: 'emulate', features: [{ name: 'prefers-color-scheme', value: theme }] });
  plan.push({ type: 'goto', url: BASE + '/login', wait: 6000 });
  plan.push({ type: 'eval', label: 'seed ' + theme, js: seed(theme) });
  for (const [w, routes] of [[1440, ['/', '/salons']], [390, ['/', '/appointments', '/settings']]]) {
    for (const r of routes) {
      plan.push({ type: 'viewport', w, h: 844, dsf: w === 390 ? 2 : 1 });
      plan.push({ type: 'goto', url: BASE + r, wait: 9000 });
      plan.push({ type: 'eval', label: `${theme} tap ${w} ${r}`, js: TARGETS });
      plan.push({ type: 'eval', label: `${theme} contrast ${w} ${r}`, js: CONTRAST(w) });
    }
  }
}
// son kareler
plan.push({ type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] });
plan.push({ type: 'goto', url: BASE + '/login', wait: 6000 });
plan.push({ type: 'eval', label: 'seed light final', js: seed('light') });
for (const [w, r, out] of [
  [1440, '/', 'rd2_light_dashboard_1440'],
  [1440, '/salons', 'rd2_light_salons_1440'],
  [1440, '/categories', 'rd2_light_categories_1440'],
  [390, '/', 'rd2_light_dashboard_390'],
  [390, '/appointments', 'rd2_light_appointments_390'],
  [390, '/login', 'rd2_light_login_390'],
]) {
  plan.push({ type: 'viewport', w, h: 844, dsf: w === 390 ? 2 : 1 });
  plan.push({ type: 'goto', url: BASE + r, wait: 9000 });
  plan.push({ type: 'shot', out: `screenshots/admin_panel/${out}.png` });
}
plan.push({ type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
plan.push({ type: 'goto', url: BASE + '/login', wait: 6000 });
plan.push({ type: 'eval', label: 'seed dark final', js: seed('dark') });
for (const [w, r, out] of [
  [1440, '/', 'rd2_dark_dashboard_1440'],
  [1440, '/settings', 'rd2_dark_settings_1440'],
  [390, '/users', 'rd2_dark_users_390'],
]) {
  plan.push({ type: 'viewport', w, h: 844, dsf: w === 390 ? 2 : 1 });
  plan.push({ type: 'goto', url: BASE + r, wait: 9000 });
  plan.push({ type: 'shot', out: `screenshots/admin_panel/${out}.png` });
}
plan.push({ type: 'diag' });
module.exports = plan;
