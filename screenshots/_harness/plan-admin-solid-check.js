const MEASURE = `(() => {
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  const paint = (css) => { ctx.fillStyle = css; ctx.fillRect(0,0,1,1); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const lum = (rgb) => { const c = rgb.map(v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
  const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return +((x+0.05)/(y+0.05)).toFixed(2); };
  const effBg = (el) => { const s=[]; let n=el; while(n){ s.push(getComputedStyle(n).backgroundColor); n=n.parentElement; } s.push(getComputedStyle(document.body).backgroundColor); s.reverse(); ctx.clearRect(0,0,1,1); for(const c of s) paint(c); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const effFg = (el,bg) => { ctx.clearRect(0,0,1,1); paint('rgb('+bg.join(',')+')'); paint(getComputedStyle(el).color); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
  const probe = (sel,label) => { const el=document.querySelector(sel); if(!el) return {label,missing:true}; const bg=effBg(el); const fg=effFg(el,bg); return {label, text:(el.textContent||'').trim().slice(0,20), bg:'rgb('+bg.join(',')+')', ratio:ratio(fg,bg)}; };
  return JSON.stringify({ theme: localStorage.getItem('app_theme'), checks:[
    probe('button[type=submit]','login-submit'),
  ]});
})()`;
const AT = require('fs').readFileSync(process.env.TEMP + '/admin_at.txt','utf8').trim();
module.exports = [
  { type: 'viewport', w: 1440, h: 900, dsf: 1 },
  { type: 'goto', url: 'http://127.0.0.1:3001/login', wait: 2000 },
  { type: 'eval', js: `localStorage.setItem('app_theme','light');'ok'` },
  { type: 'goto', url: 'http://127.0.0.1:3001/login', wait: 2500 },
  { type: 'eval', js: MEASURE, label: 'login-LIGHT' },
  { type: 'shot', out: 'screenshots/admin_panel/light_login.png' },
  { type: 'eval', js: `localStorage.setItem('app_theme','dark');'ok'` },
  { type: 'goto', url: 'http://127.0.0.1:3001/login', wait: 2500 },
  { type: 'eval', js: MEASURE, label: 'login-DARK' },
  { type: 'shot', out: 'screenshots/admin_panel/dark_login.png' },
  { type: 'diag', label: 'login' },
];
