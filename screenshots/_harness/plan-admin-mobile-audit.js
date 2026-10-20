// Admin panel — mevcut durumun ölçümlü denetimi (redesign planı için kanıt).
// Çalıştırma (repo kökünden, API :3200 + admin_panel :3000 ayakta):
//   CDP_PORT=9333 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-mobile-audit.js
//
// Ölçtükleri:
//  - viewport sweep: her genişlikte documentElement.scrollWidth (yatay taşma)
//  - taşma sorumluları (clip-aware: display:none bisect)
//  - tap-target minimumları genişlik başına
//  - tipografi sayımı (kendi metnine sahip öğeler)
//  - sidebar görünürlüğü / içerik-ofseti (fixed ml-64)
//  - token dışı (hardcoded gray) öğe sayımı çalışma zamanında
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const BASE = 'http://127.0.0.1:3001';
const W = [1440, 1024, 768, 390, 360];

const SEED = `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  return location.href;
})()`;

// Yatay taşma + sidebar + taşan öğeler (clip-aware değil, sadece şüpheli listesi)
const OVERFLOW = (w) => `(() => {
  const w = ${w};
  const de = document.documentElement;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > w + 1 || r.left < -1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 90),
        left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
        text: (el.textContent || '').trim().slice(0, 40),
      });
    }
  }
  const aside = document.querySelector('aside');
  const main = document.querySelector('main');
  const mr = main && main.getBoundingClientRect();
  return JSON.stringify({
    emulated: w,
    innerWidth: window.innerWidth,
    visualViewport: Math.round(window.visualViewport ? window.visualViewport.width : -1),
    scrollWidth: de.scrollWidth,
    overflowPx: de.scrollWidth - w,
    sidebar: aside ? { w: Math.round(aside.getBoundingClientRect().width), pos: getComputedStyle(aside).position } : null,
    mainLeft: mr ? Math.round(mr.left) : null,
    mainWidth: mr ? Math.round(mr.width) : null,
    offenders: offenders.slice(0, 12),
  });
})()`;

const TARGETS = (w) => `(() => {
  const w = ${w};
  const sel = 'a,button,select,input,textarea,[role=button]';
  let min = 999, worst = null, n = 0;
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    n++;
    const m = Math.min(r.width, r.height);
    if (m < min) { min = m; worst = { tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,70), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent||'').trim().slice(0,24) }; }
  }
  return JSON.stringify({ emulated: w, count: n, minTap: +min.toFixed(1), worst });
})()`;

const TYPE = `(() => {
  const hist = {};
  let h = null;
  for (const el of document.querySelectorAll('body :not(svg):not(script):not(style)')) {
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const s = Math.round(parseFloat(getComputedStyle(el).fontSize));
    hist[s] = (hist[s] || 0) + 1;
    if (el.tagName === 'H1' && !h) h = { size: s, text: el.textContent.trim().slice(0, 40) };
  }
  return JSON.stringify({ sizes: hist, h1: h });
})()`;

const COLORSCAN = `(() => {
  const bad = { gray: 0, white: 0, token: 0, darkVariant: 0 };
  const samples = {};
  for (const el of document.querySelectorAll('body *')) {
    const c = (el.className || '').toString();
    if (!c) continue;
    for (const m of c.matchAll(/(?:bg|text|border)-(?:gray|slate|red|green|blue|yellow|amber|purple|indigo)-\\d{2,3}/g)) {
      bad.gray++; samples[m[0]] = (samples[m[0]] || 0) + 1;
    }
    for (const m of c.matchAll(/(?:bg|text)-white/g)) bad.white++;
    for (const m of c.matchAll(/(?:bg|text|border)-(?:fg|fg-muted|fg-subtle|surface|surface-variant|background|border|border-strong|primary|primary-solid|on-primary|secondary|accent|success|error|warning|info)\\b/g)) bad.token++;
    bad.darkVariant += (c.match(/dark:/g) || []).length;
  }
  const dead = [...document.querySelectorAll('[class*="text-text-"]')].length;
  return JSON.stringify({ ...bad, deadTextTextClasses: dead, top: Object.entries(samples).sort((a,b)=>b[1]-a[1]).slice(0,12) });
})()`;

const pages = ['/', '/salons', '/users', '/settings', '/login'];

const plan = [];
// oturum aç: login sayfasına git, tokenı yaz
plan.push({ type: 'viewport', w: 1440, h: 900, dsf: 1 });
plan.push({ type: 'goto', url: BASE + '/login', wait: 9000 });
plan.push({ type: 'eval', label: 'seed', js: SEED });
plan.push({ type: 'goto', url: BASE + '/', wait: 12000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/audit_light_dashboard_1440.png' });
plan.push({ type: 'eval', label: 'colorscan', js: COLORSCAN });
plan.push({ type: 'eval', label: 'type', js: TYPE });

for (const w of W) {
  for (const p of pages) {
    plan.push({ type: 'viewport', w, h: 844, dsf: 1 });
    plan.push({ type: 'goto', url: BASE + p, wait: p === '/login' ? 6000 : 9000 });
    plan.push({ type: 'eval', label: 'ovf ' + w + ' ' + p, js: OVERFLOW(w) });
  }
}
// genişlik başına tap target + kareler
for (const w of [1440, 1024, 390]) {
  plan.push({ type: 'viewport', w, h: 844, dsf: 1 });
  plan.push({ type: 'goto', url: BASE + '/salons', wait: 9000 });
  plan.push({ type: 'eval', label: 'tap ' + w, js: TARGETS(w) });
}
plan.push({ type: 'viewport', w: 390, h: 844, dsf: 2 });
plan.push({ type: 'goto', url: BASE + '/', wait: 12000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/audit_mobile_390_dashboard.png' });
plan.push({ type: 'goto', url: BASE + '/salons', wait: 9000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/audit_mobile_390_salons.png' });
plan.push({ type: 'goto', url: BASE + '/login', wait: 7000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/audit_mobile_390_login.png' });
plan.push({ type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
plan.push({ type: 'goto', url: BASE + '/', wait: 10000 });
plan.push({ type: 'shot', out: 'screenshots/admin_panel/audit_dark_dashboard_1440.png' });
plan.push({ type: 'diag' });

module.exports = plan;
