// customer_app — booking flow deep test (correct login first)
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'eval', js: 'localStorage.clear(), 1' },
  { type: 'goto', url: APP, wait: 11000 },

  { type: 'click', x: 195, y: 302, wait: 700 },
  { type: 'type', text: 'musteri@beautysalon.com' },
  { type: 'click', x: 195, y: 366, wait: 700 },
  { type: 'type', text: 'Musteri123!' },
  { type: 'click', x: 195, y: 446, wait: 9000, label: 'Giris Yap' },
  { type: 'shot', out: OUT + 'm17b_home_after_login.png' },

  { type: 'click', x: 150, y: 480, wait: 4500, label: 'home card 1' },
  { type: 'click', x: 195, y: 802, wait: 5000, label: 'Randevu Al' },
  { type: 'click', x: 195, y: 178, wait: 1500, label: 'service 1' },
  { type: 'shot', out: OUT + 'm08b_booking_service_selected.png' },
  { type: 'click', x: 195, y: 798, wait: 4500, label: 'Devam' },
  { type: 'shot', out: OUT + 'm21_booking_staff.png' },
  { type: 'click', x: 195, y: 178, wait: 1500, label: 'staff 1' },
  { type: 'shot', out: OUT + 'm21b_booking_staff_selected.png' },
  { type: 'click', x: 195, y: 798, wait: 4500, label: 'Devam' },
  { type: 'shot', out: OUT + 'm22_booking_datetime.png' },
  { type: 'diag', label: 'booking steps' },
];
