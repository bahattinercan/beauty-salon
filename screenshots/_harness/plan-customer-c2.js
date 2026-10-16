// customer_app — auth flow: login error, login success, logout, register, forgot password
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'eval', js: 'localStorage.clear(), 1', label: 'clear storage' },
  { type: 'goto', url: APP, wait: 11000 },

  // wrong password -> error
  { type: 'click', x: 195, y: 302, wait: 800, label: 'email field' },
  { type: 'type', text: 'musteri@beautysalon.com' },
  { type: 'click', x: 195, y: 366, wait: 800, label: 'password field' },
  { type: 'type', text: 'YanlisSifre123' },
  { type: 'click', x: 195, y: 446, wait: 5000, label: 'Giris Yap (wrong)' },
  { type: 'shot', out: OUT + 'm16_login_error.png' },
  { type: 'diag', label: 'login error state' },

  // correct password
  { type: 'click', x: 195, y: 366, wait: 800, label: 'password field' },
  { type: 'keys', key: 'Backspace', count: 20, wait: 500 },
  { type: 'type', text: 'Musteri123!' },
  { type: 'click', x: 195, y: 446, wait: 9000, label: 'Giris Yap (correct)' },
  { type: 'shot', out: OUT + 'm17_home_after_login.png' },

  // logout
  { type: 'click', x: 343, y: 812, wait: 3500, label: 'nav Profil' },
  { type: 'scroll', dy: 500, wait: 1500 },
  { type: 'shot', out: OUT + 'm20_profile_bottom.png' },
  { type: 'diag', label: 'profile bottom' },
];
