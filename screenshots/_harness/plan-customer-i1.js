// customer_app — register screen, dark mode, logout, desktop widths
const fs = require('fs');
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'eval', js: 'localStorage.clear(), 1' },
  { type: 'geo', lat: 41.0082, lng: 28.9784 },
  { type: 'goto', url: APP, wait: 11000 },

  // register screen
  { type: 'click', x: 260, y: 536, wait: 4000, label: 'Kayit Ol link' },
  { type: 'shot', out: OUT + 'i01_register.png' },
  { type: 'scroll', dy: 600, wait: 1500 },
  { type: 'shot', out: OUT + 'i01b_register_scrolled.png' },
  { type: 'click', x: 28, y: 28, wait: 3000, label: 'back to login' },

  // login -> dark mode
  { type: 'click', x: 195, y: 302, wait: 700 },
  { type: 'type', text: 'musteri@beautysalon.com' },
  { type: 'click', x: 195, y: 366, wait: 700 },
  { type: 'type', text: 'Musteri123!' },
  { type: 'click', x: 195, y: 446, wait: 9000, label: 'Giris Yap' },
  { type: 'click', x: 343, y: 812, wait: 4000, label: 'nav Profil' },
  { type: 'click', x: 195, y: 694, wait: 3000, label: 'Karanlik Mod row' },
  { type: 'shot', out: OUT + 'i02_profile_dark.png' },
  { type: 'click', x: 50, y: 812, wait: 5000, label: 'nav Ana Sayfa' },
  { type: 'shot', out: OUT + 'i03_home_dark.png' },
  { type: 'click', x: 343, y: 812, wait: 4000, label: 'nav Profil' },
  { type: 'click', x: 195, y: 694, wait: 3000, label: 'Karanlik Mod off' },

  // desktop width
  { type: 'viewport', w: 1280, h: 900, dsf: 1 },
  { type: 'goto', url: APP, wait: 11000 },
  { type: 'shot', out: OUT + 'i04_home_desktop.png' },
  { type: 'click', x: 300, y: 868, wait: 5000, label: 'nav Kesfet (desktop)' },
  { type: 'shot', out: OUT + 'i05_discover_desktop.png' },
  { type: 'diag', label: 'desktop' },
];
