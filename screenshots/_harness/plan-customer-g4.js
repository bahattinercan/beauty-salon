// customer_app — appointments list after the booking was created
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
  { type: 'click', x: 246, y: 812, wait: 6000, label: 'nav Randevular' },
  { type: 'shot', out: OUT + 'g08_appointments_after_booking.png' },
  { type: 'scroll', dy: 400, wait: 1500 },
  { type: 'shot', out: OUT + 'g08b_appointments_scrolled.png' },
  { type: 'diag', label: 'appointments' },
];
