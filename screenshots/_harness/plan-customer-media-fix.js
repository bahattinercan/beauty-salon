const fs = require('fs');
const AT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8902/';
const ELEGANCE = '890cdc38-8761-414b-a377-3ba3b8ff18ff';
const mediaProbe = `performance.getEntriesByType('resource').map(e=>e.name).filter(n=>n.includes('uploads')).join(' | ') || 'NO_UPLOADS_REQUEST'`;
module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1500 },
  { type: 'geo', lat: 41.0082, lng: 28.9784 },
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT } },
  { type: 'goto', url: APP, wait: 12000 },
  { type: 'shot', out: OUT + 'fix01_home.png' },
  { type: 'goto', url: APP + '#/salon/' + ELEGANCE, wait: 9000 },
  { type: 'shot', out: OUT + 'fix02_salon_detail.png' },
  { type: 'eval', js: mediaProbe, label: 'media requests after deeplink' },
  { type: 'diag', label: 'salon detail deeplink' },
];
