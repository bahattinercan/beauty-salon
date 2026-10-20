// CA-019 WP7 — customer_app yeniden tasarım kareleri (light).
// Önce: node serve.js apps/customer_app/build/web 8899
const fs = require('fs');
const T = 'C:/Users/bahat/AppData/Local/Temp/';
const AT = fs.readFileSync(T + 'cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync(T + 'cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1500 },
  {
    type: 'seed',
    pairs: {
      access_token: AT,
      refresh_token: RT,
      onboarding_seen: 'true',
      app_theme: 'light',
    },
  },
  { type: 'goto', url: APP, wait: 15000 },
  { type: 'shot', out: OUT + 'rd01_home_light.png' },
  { type: 'eval', js: `Object.keys(localStorage).join(',')`, label: 'storage keys' },
  { type: 'click', x: 148, y: 812, wait: 6000, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'rd02_discover_light.png' },
  { type: 'scroll', dy: 480, wait: 2000 },
  { type: 'shot', out: OUT + 'rd03_discover_cards_light.png' },
  { type: 'diag', label: 'light flow' },
];
