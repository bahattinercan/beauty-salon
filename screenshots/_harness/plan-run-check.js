const fs = require('fs');
const R = (f) => fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/' + f, 'utf8').trim();
const CUST = 'http://127.0.0.1:8899/';
const SALON = 'http://127.0.0.1:8900/';
const OUT = 'screenshots/';
module.exports = [
  // --- customer_app (müşteri) ---
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: CUST + 'manifest.json', wait: 1200 },
  { type: 'seed', pairs: { access_token: R('cust_at.txt'), refresh_token: R('cust_rt.txt') } },
  { type: 'goto', url: CUST, wait: 12000 },
  { type: 'shot', out: OUT + 'run01_customer_home.png' },
  { type: 'click', x: 148, y: 812, wait: 5000, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'run02_customer_discover.png' },
  { type: 'diag', label: 'customer_app' },

  // --- salon_app (salon sahibi) ---
  { type: 'viewport', w: 1024, h: 768, dsf: 1 },
  { type: 'goto', url: SALON + 'manifest.json', wait: 1200 },
  { type: 'seed', pairs: { access_token: R('salon_at.txt'), refresh_token: R('salon_rt.txt') } },
  { type: 'goto', url: SALON, wait: 14000 },
  { type: 'shot', out: OUT + 'run03_salon_dashboard.png' },
  { type: 'diag', label: 'salon_app' },
];
