// customer_app — appointments tabs, discover search/filter, favorite toggle
const fs = require('fs');
const AT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'geo', lat: 41.0082, lng: 28.9784 },
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT } },
  { type: 'goto', url: APP, wait: 11000 },

  // appointments tabs
  { type: 'click', x: 246, y: 812, wait: 6000, label: 'nav Randevular' },
  { type: 'click', x: 195, y: 79, wait: 4000, label: 'tab Gecmis' },
  { type: 'shot', out: OUT + 'h01_appointments_past.png' },
  { type: 'click', x: 325, y: 79, wait: 4000, label: 'tab Iptal' },
  { type: 'shot', out: OUT + 'h02_appointments_cancelled.png' },

  // discover search + filter
  { type: 'click', x: 148, y: 812, wait: 5000, label: 'nav Kesfet' },
  { type: 'click', x: 195, y: 40, wait: 900, label: 'search field' },
  { type: 'type', text: 'manikur', wait: 3500 },
  { type: 'shot', out: OUT + 'h03_discover_search.png' },
  { type: 'keys', key: 'Backspace', count: 7, wait: 2500 },
  { type: 'click', x: 346, y: 40, wait: 3000, label: 'filter icon' },
  { type: 'shot', out: OUT + 'h04_discover_filter.png' },
  { type: 'diag', label: 'discover' },
];
