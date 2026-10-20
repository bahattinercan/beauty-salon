// AP-001 WP8 — yeniden tasarım sonrası DOĞRULAMA (tek CDP oturumu).
// Çalıştırma (repo kökünden; API :3200, panel :3002 production ya da :3001 dev):
//   CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-redesign-verify.js
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3002';
const W = [1440, 1024, 768, 390, 360];
const PAGES = ['/', '/salons', '/users', '/appointments', '/reviews', '/categories', '/settings', '/login'];

const seed = (theme) => `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', '${theme}');
  return 'seeded ' + '${theme}';
})()`;

const OVERFLOW = (w) => `(() => {
  const W = ${w};
  const de = document.documentElement;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > W + 1 || r.left < -1) {
      offenders.push({ tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,70), right: Math.round(r.right), text: (el.textContent||'').trim().slice(0,30) });
    }
  }
  return JSON.stringify({
    emulated: W,
    innerWidth: window.innerWidth,
    visual: Math.round(window.visualViewport ? window.visualViewport.width : -1),
    scrollWidth: de.scrollWidth,
    overflow: de.scrollWidth - W,
    offenders: offenders.slice(0, 6),
  });
})()`;

const TARGETS = `(() => {
  let min = 999, worst = null, n = 0, small = 0;
  for (const el of document.querySelectorAll('a,button,select,input,textarea,[role=button],[role=switch]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    n++;
    const m = Math.min(r.width, r.height);
    if (m < 44) small++;
    if (m < min) { min = m; worst = { tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,60), w: Math.round(r.width), h: Math.round(r.height), label: (el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,24) }; }
  }
  return JSON.stringify({ count: n, under44: small, min: +min.toFixed(1), worst });
})()`;

// Boyanmış pikselden kontrast: sidebar/ray, aktif öğe, tablo başlık/hücre, rozet, buton.
const CONTRAST = `(() => {
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  const paint = (css) => { ctx.fillStyle = css; ctx.fillRect(0,0,1,1); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const lum = (rgb) => { const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
  const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return +((x+0.05)/(y+0.05)).toFixed(2); };
  const effBg = (el) => { const st=[]; let n=el; while(n){ const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') st.push(c); n = n.parentElement; } st.reverse(); ctx.clearRect(0,0,1,1); for (const c of st) paint(c); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const probe = (el, label) => { if (!el) return { label, missing: true }; const bg = effBg(el); const fg = paint(getComputedStyle(el).color); return { label, ratio: ratio(fg,bg), fs: getComputedStyle(el).fontSize }; };
  const q = (s) => document.querySelector(s);
  const rail = q('aside');
  const railLinks = rail ? [...rail.querySelectorAll('a')] : [];
  return JSON.stringify({
    htmlClass: document.documentElement.className,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    h1Count: document.querySelectorAll('h1').length,
    probes: [
      probe(railLinks.find(a => !a.className.includes('bg-on-nav-pill')), 'ray link (pasif)'),
      probe(railLinks.find(a => a.className.includes('bg-on-nav-pill')), 'ray link (aktif)'),
      probe(q('main h1'), 'sayfa başlığı (h1)'),
      probe(q('main table th'), 'tablo başlığı'),
      probe(q('main table td'), 'tablo hücresi'),
      probe(q('main [class^="badge-"]'), 'rozet'),
      probe(q('main button'), 'buton metni'),
      probe(q('main a'), 'link'),
    ],
  });
})()`;

const plan = [{ type: 'viewport', w: 1440, h: 900, dsf: 1 }];

// 1) oturum + light sweep
plan.push({ type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] });
plan.push({ type: 'goto', url: BASE + '/login', wait: 7000 });
plan.push({ type: 'eval', label: 'seed light', js: seed('light') });
for (const w of W) {
  for (const p of PAGES) {
    plan.push({ type: 'viewport', w, h: 844, dsf: 1 });
    plan.push({ type: 'goto', url: BASE + p, wait: p === '/login' ? 5000 : 9000 });
    plan.push({ type: 'eval', label: 'light ovf ' + w + ' ' + p, js: OVERFLOW(w) });
  }
}
plan.push({ type: 'viewport', w: 1440, h: 900, dsf: 1 });
plan.push({ type: 'goto', url: BASE + '/', wait: 10000 });
plan.push({ type: 'eval', label: 'light contrast dashboard', js: CONTRAST });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_light_dashboard_1440.png' });
plan.push({ type: 'goto', url: BASE + '/salons', wait: 9000 });
plan.push({ type: 'eval', label: 'light tap 1440', js: TARGETS });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_light_salons_1440.png' });
plan.push({ type: 'viewport', w: 390, h: 844, dsf: 2 });
plan.push({ type: 'goto', url: BASE + '/appointments', wait: 9000 });
plan.push({ type: 'eval', label: 'light tap 390', js: TARGETS });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_light_appointments_390.png' });
plan.push({ type: 'goto', url: BASE + '/', wait: 9000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_light_dashboard_390.png' });
plan.push({ type: 'goto', url: BASE + '/login', wait: 6000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_light_login_390.png' });

// 2) dark
plan.push({ type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
plan.push({ type: 'goto', url: BASE + '/login', wait: 6000 });
plan.push({ type: 'eval', label: 'seed dark', js: seed('dark') });
plan.push({ type: 'viewport', w: 1440, h: 900, dsf: 1 });
plan.push({ type: 'goto', url: BASE + '/', wait: 10000 });
plan.push({ type: 'eval', label: 'dark contrast dashboard', js: CONTRAST });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_dark_dashboard_1440.png' });
plan.push({ type: 'goto', url: BASE + '/salons', wait: 9000 });
plan.push({ type: 'eval', label: 'dark contrast salons', js: CONTRAST });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_dark_salons_1440.png' });
plan.push({ type: 'goto', url: BASE + '/settings', wait: 9000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_dark_settings_1440.png' });
plan.push({ type: 'viewport', w: 390, h: 844, dsf: 2 });
plan.push({ type: 'goto', url: BASE + '/users', wait: 9000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_dark_users_390.png' });
plan.push({ type: 'goto', url: BASE + '/', wait: 9000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_dark_dashboard_390.png' });

// 3) drawer / gezinme davranışı (390px, dark)
plan.push({ type: 'viewport', w: 390, h: 844, dsf: 2 });
plan.push({ type: 'goto', url: BASE + '/categories', wait: 9000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/rd_dark_categories_390.png' });
plan.push({ type: 'diag' });
module.exports = plan;
