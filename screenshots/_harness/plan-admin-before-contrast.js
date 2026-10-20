// Admin panel "önce" durumunun ölçülmüştür: gerçek light + gerçek dark kareleri
// ve çalışma zamanı WCAG kontrastı (sınıf adı tahmini değil, boyanmış piksel).
// Çalıştırma: CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-before-contrast.js
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const BASE = 'http://127.0.0.1:3001';

const seed = (theme) => `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', '${theme}');
  return 'seeded ' + '${theme}';
})()`;

const CONTRAST = `(() => {
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  // paint ÜST ÜSTE boya gibi davranır: her çağrı mevcut pikselin üzerine yazılır.
  const paint = (css) => { ctx.fillStyle = css; ctx.fillRect(0,0,1,1); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const lum = (rgb) => { const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
  const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return +((x+0.05)/(y+0.05)).toFixed(2); };
  const effBg = (el) => { const st=[]; let n=el; while(n){ st.push(getComputedStyle(n).backgroundColor); n=n.parentElement; } st.push(getComputedStyle(document.body).backgroundColor); st.reverse(); ctx.clearRect(0,0,1,1); for(const c of st) { if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') paint(c); } return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const probe = (el, label) => { if (!el) return { label, missing: true }; const bg = effBg(el); const fg = paint(getComputedStyle(el).color); return { label, ratio: ratio(fg,bg), fg: 'rgb('+fg.join(',')+')', bg: 'rgb('+bg.join(',')+')', fs: getComputedStyle(el).fontSize, cls: (el.className||'').toString().slice(0,50) }; };
  const q = (s) => document.querySelector(s);
  const links = [...document.querySelectorAll('aside nav a')];
  const out = {
    htmlClass: document.documentElement.className,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    probes: [
      probe(q('aside h1'), 'sidebar brand h1'),
      probe(links.find(a => !a.className.includes('bg-primary')), 'sidebar link (pasif)'),
      probe(links.find(a => a.className.includes('bg-primary')), 'sidebar link (aktif)'),
      probe(q('aside p'), 'sidebar e-posta'),
      probe(q('main h1'), 'sayfa başlığı (main h1)'),
      probe(q('main .text-gray-600'), 'kart etiketi .text-gray-600'),
      probe(q('main .text-gray-900'), 'kart değeri .text-gray-900'),
      probe(q('main table th'), 'tablo başlığı'),
      probe(q('main table td'), 'tablo hücresi'),
      probe(q('main .bg-white'), 'kart zemini (.bg-white)'),
    ],
    // taşma + sidebar en/boy
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    sidebarW: q('aside') ? Math.round(q('aside').getBoundingClientRect().width) : null,
  };
  return JSON.stringify(out);
})()`;

const plan = [{ type: 'viewport', w: 1440, h: 900, dsf: 1 }];
for (const theme of ['light', 'dark']) {
  plan.push({ type: 'emulate', features: [{ name: 'prefers-color-scheme', value: theme }] });
  plan.push({ type: 'goto', url: BASE + '/login', wait: 7000 });
  plan.push({ type: 'eval', label: 'seed ' + theme, js: seed(theme) });
  plan.push({ type: 'goto', url: BASE + '/', wait: 12000 });
  plan.push({ type: 'eval', label: 'contrast ' + theme + ' dashboard', js: CONTRAST });
  plan.push({ type: 'shot', out: 'screenshots/admin_panel/before_' + theme + '_dashboard_1440.png' });
  plan.push({ type: 'goto', url: BASE + '/salons', wait: 9000 });
  plan.push({ type: 'eval', label: 'contrast ' + theme + ' salons', js: CONTRAST });
  plan.push({ type: 'shot', out: 'screenshots/admin_panel/before_' + theme + '_salons_1440.png' });
}
// gerçek mobil kareler (light)
plan.push({ type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] });
for (const p of ['/', '/salons', '/login']) {
  plan.push({ type: 'viewport', w: 390, h: 844, dsf: 2 });
  plan.push({ type: 'goto', url: BASE + p, wait: 9000 });
  plan.push({ type: 'shot', out: 'screenshots/admin_panel/before_light_mobile390' + (p === '/' ? '_dashboard' : p) + '.png' });
}
plan.push({ type: 'diag' });
module.exports = plan;
