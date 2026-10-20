// CA-019 WP7 — dark tema kareleri (tema bayrağı secure storage'dan).
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
      app_theme: 'dark',
    },
  },
  { type: 'goto', url: APP, wait: 15000 },
  { type: 'shot', out: OUT + 'rd04_home_dark.png' },
  { type: 'click', x: 148, y: 812, wait: 6000, label: 'nav Kesfet' },
  { type: 'scroll', dy: 380, wait: 2500 },
  { type: 'shot', out: OUT + 'rd05_discover_cards_dark.png' },
  { type: 'diag', label: 'dark flow' },
];
