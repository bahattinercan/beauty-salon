// customer_app — staff selection feedback + submit booking
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

  { type: 'click', x: 150, y: 480, wait: 4500, label: 'home card 1' },
  { type: 'click', x: 195, y: 802, wait: 5000, label: 'Randevu Al' },
  { type: 'click', x: 195, y: 178, wait: 1500, label: 'service 1' },
  { type: 'click', x: 195, y: 798, wait: 4500, label: 'Devam' },
  { type: 'click', x: 195, y: 271, wait: 1800, label: 'staff 2 (Deniz Aksoy)' },
  { type: 'shot', out: OUT + 'g06_staff_selected.png' },
  { type: 'click', x: 195, y: 798, wait: 5000, label: 'Devam' },
  { type: 'click', x: 60, y: 324, wait: 2500, label: 'slot 09:00' },
  { type: 'click', x: 256, y: 801, wait: 5000, label: 'Devam Et' },
  { type: 'click', x: 256, y: 801, wait: 7000, label: 'Randevuyu Onayla' },
  { type: 'shot', out: OUT + 'g07_booking_result.png' },
  { type: 'diag', label: 'after submit' },
];
