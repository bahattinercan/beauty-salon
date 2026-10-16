const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';
module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'eval', js: 'localStorage.clear(), 1' },
  { type: 'goto', url: APP, wait: 11000 },
  { type: 'shot', out: OUT + 'fix01_login.png' },
  { type: 'click', x: 260, y: 536, wait: 4000, label: 'Kayit Ol' },
  { type: 'shot', out: OUT + 'fix02_register.png' },
  { type: 'diag', label: 'auth' },

  // login
  { type: 'goto', url: APP, wait: 11000 },
  { type: 'click', x: 195, y: 302, wait: 700 },
  { type: 'type', text: 'musteri@beautysalon.com' },
  { type: 'click', x: 195, y: 366, wait: 700 },
  { type: 'type', text: 'Musteri123!' },
  { type: 'click', x: 195, y: 446, wait: 10000, label: 'Giris Yap' },
  { type: 'shot', out: OUT + 'fix03_home_location_notice.png' },

  // appointments (date wrap + time format)
  { type: 'click', x: 246, y: 812, wait: 6000, label: 'nav Randevular' },
  { type: 'shot', out: OUT + 'fix04_appointments_upcoming.png' },
  { type: 'click', x: 195, y: 79, wait: 4500, label: 'tab Gecmis' },
  { type: 'shot', out: OUT + 'fix05_appointments_past.png' },

  // discover: badges + live search
  { type: 'click', x: 148, y: 812, wait: 5000, label: 'nav Kesfet' },
  { type: 'shot', out: OUT + 'fix06_discover.png' },
  { type: 'click', x: 195, y: 40, wait: 900, label: 'search field' },
  { type: 'type', text: 'zen', wait: 2500 },
  { type: 'shot', out: OUT + 'fix07_discover_live_search.png' },
  { type: 'diag', label: 'discover' },

  // profile: real stats + switch
  { type: 'click', x: 343, y: 812, wait: 6000, label: 'nav Profil' },
  { type: 'shot', out: OUT + 'fix08_profile_stats.png' },
  { type: 'click', x: 195, y: 694, wait: 2500, label: 'Karanlik Mod ON' },
  { type: 'shot', out: OUT + 'fix09_profile_dark.png' },
  { type: 'click', x: 195, y: 694, wait: 2500, label: 'Karanlik Mod OFF' },
  { type: 'scroll', dy: 500, wait: 1500 },
  { type: 'shot', out: OUT + 'fix10_profile_switch_light.png' },

  // desktop
  { type: 'viewport', w: 1280, h: 900, dsf: 1 },
  { type: 'goto', url: APP, wait: 12000 },
  { type: 'click', x: 480, y: 868, wait: 5000, label: 'nav Kesfet desktop' },
  { type: 'shot', out: OUT + 'fix11_discover_desktop.png' },
  { type: 'diag', label: 'desktop' },
];
