// CA-020 kaniti: golge tokenlari + koyulastirilmis yildiz (light/dark).
// Calistir: CDP_PORT=9466 node screenshots/_harness/drive.js screenshots/_harness/plan-customer-tokens.js
const fs = require('fs');
const T = process.env.TEMP;
const AT = fs.readFileSync(T + '/cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync(T + '/cust_rt.txt', 'utf8').trim();
const APP = 'http://127.0.0.1:8898/';
const OUT = 'screenshots/customer_app/';

const seed = (theme) => ({
  type: 'seed',
  pairs: { access_token: AT, refresh_token: RT, app_theme: theme, onboarding_seen: 'true' },
});

const plan = [
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] },
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  seed('light'),
  { type: 'goto', url: APP, wait: 16000 },
  { type: 'shot', out: OUT + 'ca20_home_light.png' },
  { type: 'click', x: 148, y: 812, wait: 5000, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'ca20_discover_light.png' },
  { type: 'click', x: 150, y: 480, wait: 5000, label: 'salon karti -> detay' },
  { type: 'shot', out: OUT + 'ca20_detail_light.png' },
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] },
  seed('dark'),
  { type: 'goto', url: APP, wait: 16000 },
  { type: 'shot', out: OUT + 'ca20_home_dark.png' },
  { type: 'click', x: 148, y: 812, wait: 5000, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'ca20_discover_dark.png' },
  { type: 'click', x: 150, y: 480, wait: 5000, label: 'salon karti -> detay' },
  { type: 'shot', out: OUT + 'ca20_detail_dark.png' },
  { type: 'diag' },
];
module.exports = plan;
