// customer_app — logged-in flow, mobile 390x844.
const fs = require('fs');
const AT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT } },
  { type: 'goto', url: APP, wait: 12000 },
  { type: 'shot', out: OUT + 'm01_home.png' },

  // salon detail
  { type: 'click', x: 150, y: 480, wait: 4500, label: 'home card 1' },
  { type: 'shot', out: OUT + 'm05_salon_detail.png' },
  { type: 'scroll', dy: 500, wait: 1800 },
  { type: 'shot', out: OUT + 'm06_salon_detail_services.png' },
  { type: 'scroll', dy: 900, wait: 1800 },
  { type: 'shot', out: OUT + 'm07_salon_detail_reviews.png' },
  { type: 'scroll', dy: -1400, wait: 1500 },

  // booking flow
  { type: 'click', x: 195, y: 802, wait: 5000, label: 'Randevu Al' },
  { type: 'shot', out: OUT + 'm08_booking_service.png' },
  { type: 'click', x: 28, y: 28, wait: 2500, label: 'booking back' },

  // back to home
  { type: 'click', x: 28, y: 28, wait: 3000, label: 'detail back' },
  { type: 'shot', out: OUT + 'm02_home_back.png' },

  // bottom nav
  { type: 'click', x: 148, y: 812, wait: 4500, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'm03_discover.png' },
  { type: 'click', x: 246, y: 812, wait: 4500, label: 'nav Randevular' },
  { type: 'shot', out: OUT + 'm04_appointments.png' },
  { type: 'click', x: 343, y: 812, wait: 4000, label: 'nav Profil' },
  { type: 'shot', out: OUT + 'm09_profile.png' },
  { type: 'diag', label: 'after mobile flow' },
];
