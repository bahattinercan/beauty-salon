const fs = require('fs');
const AT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';
module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT } },
  { type: 'goto', url: APP, wait: 11000 },
  { type: 'click', x: 148, y: 812, wait: 5000, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'fix18_discover_final.png' },
  { type: 'click', x: 120, y: 400, wait: 5000, label: 'discover card 1' },
  { type: 'shot', out: OUT + 'fix19_detail_final.png' },
  { type: 'diag', label: 'final' },
];
