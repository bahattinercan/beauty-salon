// customer_app — dark mode (mobile) + desktop/tablet widths
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

  // dark mode
  { type: 'click', x: 343, y: 812, wait: 4000, label: 'nav Profil' },
  { type: 'click', x: 195, y: 694, wait: 2500, label: 'Karanlik Mod ON' },
  { type: 'shot', out: OUT + 'j01_profile_dark.png' },
  { type: 'click', x: 50, y: 812, wait: 5000, label: 'nav Ana Sayfa' },
  { type: 'shot', out: OUT + 'j02_home_dark.png' },
  { type: 'click', x: 148, y: 812, wait: 4500, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'j03_discover_dark.png' },
  { type: 'click', x: 246, y: 812, wait: 4500, label: 'nav Randevular' },
  { type: 'shot', out: OUT + 'j04_appointments_dark.png' },

  // back to light + desktop widths
  { type: 'click', x: 343, y: 812, wait: 3500, label: 'nav Profil' },
  { type: 'click', x: 195, y: 694, wait: 2500, label: 'Karanlik Mod OFF' },
  { type: 'viewport', w: 1280, h: 900, dsf: 1 },
  { type: 'goto', url: APP, wait: 12000 },
  { type: 'shot', out: OUT + 'k01_home_desktop.png' },
  { type: 'click', x: 480, y: 868, wait: 5000, label: 'nav Kesfet desktop' },
  { type: 'shot', out: OUT + 'k02_discover_desktop.png' },
  { type: 'click', x: 160, y: 868, wait: 4500, label: 'nav Ana Sayfa desktop' },
  { type: 'diag', label: 'desktop' },
];
