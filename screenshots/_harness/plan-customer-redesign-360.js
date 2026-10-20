// CA-019 WP7 — dar viewport taşma taraması (360px) + nav aktif durumları.
const fs = require('fs');
const T = 'C:/Users/bahat/AppData/Local/Temp/';
const AT = fs.readFileSync(T + 'cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync(T + 'cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

const OVERFLOW_PROBE = `(() => {
  const d = document.documentElement;
  return JSON.stringify({ scrollW: d.scrollWidth, clientW: d.clientWidth, overflow: d.scrollWidth > d.clientWidth });
})()`;

module.exports = [
  { type: 'viewport', w: 360, h: 780, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1500 },
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT, onboarding_seen: 'true', app_theme: 'light' } },
  { type: 'goto', url: APP, wait: 15000 },
  { type: 'shot', out: OUT + 'rd10_home_360.png' },
  { type: 'eval', js: OVERFLOW_PROBE, label: 'overflow 360 home' },
  { type: 'click', x: 137, y: 750, wait: 6000, label: 'nav Kesfet 360' },
  { type: 'shot', out: OUT + 'rd11_discover_360.png' },
  { type: 'eval', js: OVERFLOW_PROBE, label: 'overflow 360 discover' },
  { type: 'diag', label: '360 sweep' },
];
