// Admin panel dark mode doğrulaması.
// Çalıştırma (repo kökünden):
//   CDP_PORT=9333 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-darkmode.js
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const RT = fs.readFileSync(process.env.TEMP + '/admin_rt.txt', 'utf8').trim();
const BASE = 'http://127.0.0.1:3001';

const SEED = `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('refresh_token', ${JSON.stringify(RT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', 'dark');
  return 'seeded';
})()`;

const STATE = `JSON.stringify({
  path: location.pathname,
  theme: localStorage.getItem('app_theme'),
  htmlClass: document.documentElement.className,
  colorScheme: document.documentElement.style.colorScheme,
  bodyBg: getComputedStyle(document.body).backgroundColor,
  bodyColor: getComputedStyle(document.body).color,
})`;

const MEASURE = `(() => {
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  const paint = (css) => { ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const lum = (rgb) => { const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
  const effBg = (el) => {
    const stack = [];
    let n = el;
    while (n) { stack.push(getComputedStyle(n).backgroundColor); n = n.parentElement; }
    stack.push(getComputedStyle(document.body).backgroundColor);
    stack.reverse();
    ctx.clearRect(0, 0, 1, 1);
    for (const c of stack) paint(c);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  const effFg = (el, bg) => {
    ctx.clearRect(0, 0, 1, 1);
    paint('rgb(' + bg.join(',') + ')');
    paint(getComputedStyle(el).color);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  const probe = (sel, label) => {
    const el = document.querySelector(sel);
    if (!el) return { label, missing: true };
    const bg = effBg(el);
    const fg = effFg(el, bg);
    return { label, text: (el.textContent || '').trim().slice(0, 26), fg: 'rgb(' + fg.join(',') + ')', bg: 'rgb(' + bg.join(',') + ')', ratio: ratio(fg, bg) };
  };
  return JSON.stringify({
    path: location.pathname,
    htmlClass: document.documentElement.className,
    theme: localStorage.getItem('app_theme'),
    checks: [
      probe('aside a[class*=bg-primary-solid]', 'sidebar-active'),
      probe('aside a:not([class*=bg-primary-solid])', 'sidebar-link'),
      probe('main button[class*=bg-primary-solid]', 'solid-button'),
      probe('main h1', 'page-title'),
      probe('main p', 'main-paragraph'),
      probe('thead th', 'table-head'),
      probe('tbody td', 'table-cell'),
      probe('tbody tr:nth-child(2) span[class^="badge-"]', 'badge'),
      probe('tbody button[class*=rounded-lg]', 'row-action'),
    ].filter(Boolean),
  });
})()`;

const TOKEN_PROBE = `fetch('http://127.0.0.1:3200/api/v1/admin/dashboard', { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } }).then(r => 'API status=' + r.status).catch(e => 'API fail: ' + e.message)`;

module.exports = [
  { type: 'viewport', w: 1440, h: 900, dsf: 1 },

  // ---- FOUC kanıtı: dark seed + kısa bekleme, React hydrate olmadan sınıf hazır mı? ----
  { type: 'goto', url: `${BASE}/login`, wait: 2000 },
  { type: 'eval', js: SEED, label: 'seed-tokens+dark' },
  { type: 'eval', js: TOKEN_PROBE, label: 'token-probe' },
  { type: 'goto', url: `${BASE}/login`, wait: 400 },
  { type: 'eval', js: STATE, label: 'FOUC-CHECK (400ms)' },
  { type: 'wait', ms: 2000 },
  { type: 'eval', js: STATE, label: 'login-dark' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_login.png' },

  // ---- Authenticated dark süpürme ----
  { type: 'goto', url: `${BASE}/`, wait: 5000 },
  { type: 'eval', js: MEASURE, label: 'dashboard-dark' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_dashboard.png' },

  { type: 'goto', url: `${BASE}/salons`, wait: 4000 },
  { type: 'eval', js: MEASURE, label: 'salons-dark' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_salons.png' },

  { type: 'goto', url: `${BASE}/users`, wait: 4000 },
  { type: 'eval', js: MEASURE, label: 'users-dark' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_users.png' },

  { type: 'goto', url: `${BASE}/appointments`, wait: 4000 },
  { type: 'eval', js: MEASURE, label: 'appointments-dark' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_appointments.png' },

  { type: 'goto', url: `${BASE}/reviews`, wait: 4000 },
  { type: 'eval', js: MEASURE, label: 'reviews-dark' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_reviews.png' },

  { type: 'goto', url: `${BASE}/categories`, wait: 4000 },
  { type: 'eval', js: MEASURE, label: 'categories-dark' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_categories.png' },

  { type: 'goto', url: `${BASE}/settings`, wait: 4000 },
  { type: 'eval', js: MEASURE, label: 'settings-dark' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_settings.png' },

  // ---- Gerçek toggle tıklaması: dark -> light ----
  { type: 'eval', js: `document.querySelector('[aria-label="Açık"]').click(); 'clicked-light'`, label: 'click-light' },
  { type: 'wait', ms: 600 },
  { type: 'eval', js: STATE, label: 'after-light-click' },
  { type: 'eval', js: MEASURE, label: 'settings-light' },
  { type: 'shot', out: 'screenshots/admin_panel/light_settings.png' },

  { type: 'goto', url: `${BASE}/`, wait: 4000 },
  { type: 'eval', js: MEASURE, label: 'dashboard-light' },
  { type: 'shot', out: 'screenshots/admin_panel/light_dashboard.png' },

  // ---- Sistem modu + OS teması emülasyonu ----
  { type: 'eval', js: `document.querySelector('[aria-label="Sistem"]').click(); 'clicked-system'`, label: 'click-system' },
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] },
  { type: 'wait', ms: 600 },
  { type: 'eval', js: STATE, label: 'system+emulated-dark' },
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] },
  { type: 'wait', ms: 600 },
  { type: 'eval', js: STATE, label: 'system+emulated-light' },

  // ---- Persistence: dark seç, reload et ----
  { type: 'eval', js: `document.querySelector('[aria-label="Koyu"]').click(); 'clicked-dark'`, label: 'click-dark' },
  { type: 'wait', ms: 400 },
  { type: 'goto', url: `${BASE}/users`, wait: 2500 },
  { type: 'eval', js: STATE, label: 'persist-after-reload' },

  // ---- Konsol / hydration hataları ----
  { type: 'diag', label: 'final' },
];
