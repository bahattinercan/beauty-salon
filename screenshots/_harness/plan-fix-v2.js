const fs = require('fs');
const AT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';
module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  // geo YOK: konum reddedilmiş halde booking akışı çalışmalı (eski snackbar bug'ı)
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT } },
  { type: 'goto', url: APP, wait: 11000 },
  { type: 'click', x: 148, y: 812, wait: 5000, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'fix12_discover_badge_fixed.png' },
  { type: 'click', x: 195, y: 40, wait: 800, label: 'search field' },
  { type: 'type', text: 'manik', wait: 2500 },
  { type: 'shot', out: OUT + 'fix13_live_search_partial.png' },
  { type: 'keys', key: 'Backspace', count: 5, wait: 2000 },

  // salon detail: collapsed header contrast
  { type: 'click', x: 120, y: 400, wait: 5000, label: 'discover card 1' },
  { type: 'shot', out: OUT + 'fix14_detail_top.png' },
  { type: 'scroll', dy: 700, wait: 2000 },
  { type: 'shot', out: OUT + 'fix15_detail_collapsed_header.png' },

  // booking flow with location denied
  { type: 'click', x: 195, y: 802, wait: 5000, label: 'Randevu Al' },
  { type: 'click', x: 195, y: 178, wait: 1500, label: 'service 1' },
  { type: 'shot', out: OUT + 'fix16_booking_service_selected.png' },
  { type: 'click', x: 195, y: 798, wait: 5000, label: 'Devam' },
  { type: 'shot', out: OUT + 'fix17_booking_staff.png' },
  { type: 'diag', label: 'booking with location denied' },
];
