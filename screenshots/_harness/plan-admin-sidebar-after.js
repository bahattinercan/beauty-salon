const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const RT = fs.readFileSync(process.env.TEMP + '/admin_rt.txt', 'utf8').trim();
const MEASURE = `(() => {
  const pick = (sel, label) => [...document.querySelectorAll(sel)].map(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { label, w: +r.width.toFixed(1), h: +r.height.toFixed(1), shrink: cs.flexShrink, text: (el.textContent||'').trim().slice(0,24) };
  });
  const avatars = [
    ...pick('aside [class*="w-9"]', 'sidebar-avatar'),
    ...pick('aside [class*="w-10"]', 'sidebar-logo'),
    ...pick('table [class*="rounded-full"]', 'table-avatar'),
  ].filter(a => a.w < 200);
  const txt = [...document.querySelectorAll('aside p')].map(p => {
    const r = p.getBoundingClientRect();
    return { t: (p.textContent||'').trim().slice(0,30), w: +r.width.toFixed(1), overflow: p.scrollWidth > p.clientWidth + 1, clip: getComputedStyle(p).overflow, ellipsis: getComputedStyle(p).textOverflow };
  });
  const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return { avatars, sidebarText: txt, pageOverflowX: overflowX };
})()`;
const HEAD = [
  { type: 'viewport', w: 1440, h: 900, dsf: 1 },
  { type: 'goto', url: 'http://127.0.0.1:3001/login', wait: 2500 },
  { type: 'eval', js: `localStorage.setItem('access_token', ${JSON.stringify(AT)}); localStorage.setItem('refresh_token', ${JSON.stringify(RT)}); localStorage.setItem('user', JSON.stringify({fullName:'Admin',email:'admin@beautysalon.com',role:'ADMIN'})); 'seeded'`, label: 'seed' },
];
module.exports = [
  ...HEAD,
  { type: 'goto', url: 'http://127.0.0.1:3001/', wait: 5000 },
  { type: 'eval', js: MEASURE, label: 'dashboard' },
  { type: 'shot', out: 'screenshots/admin_panel/sidebar_after.png' },
  { type: 'goto', url: 'http://127.0.0.1:3001/users', wait: 5000 },
  { type: 'eval', js: MEASURE, label: 'users' },
  { type: 'shot', out: 'screenshots/admin_panel/users_after.png' },
  { type: 'goto', url: 'http://127.0.0.1:3001/reviews', wait: 5000 },
  { type: 'eval', js: MEASURE, label: 'reviews' },
  { type: 'goto', url: 'http://127.0.0.1:3001/salons', wait: 5000 },
  { type: 'eval', js: MEASURE, label: 'salons' },
  { type: 'goto', url: 'http://127.0.0.1:3001/appointments', wait: 5000 },
  { type: 'eval', js: MEASURE, label: 'appointments' },
  { type: 'goto', url: 'http://127.0.0.1:3001/settings', wait: 5000 },
  { type: 'eval', js: MEASURE, label: 'settings' },
  { type: 'diag', label: 'diag' },
];
