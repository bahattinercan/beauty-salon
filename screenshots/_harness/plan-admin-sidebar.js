const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const RT = fs.readFileSync(process.env.TEMP + '/admin_rt.txt', 'utf8').trim();
const MEASURE = `(() => {
  const aside = document.querySelector('aside');
  const rows = [...document.querySelectorAll('aside div')].filter(d => d.className && String(d.className).includes('w-9'));
  const out = [];
  for (const el of rows) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out.push({
      rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      flex: cs.flex, flexShrink: cs.flexShrink, flexBasis: cs.flexBasis,
      width: cs.width, minWidth: cs.minWidth, boxSizing: cs.boxSizing,
      cls: el.className, text: el.textContent,
    });
  }
  // sibling info of the avatar's parent
  const parent = rows[0] ? rows[0].parentElement : null;
  let sibs = null;
  if (parent) {
    const pr = parent.getBoundingClientRect();
    sibs = {
      parentRect: { w: +pr.width.toFixed(1), h: +pr.height.toFixed(1) },
      parentCls: parent.className,
      children: [...parent.children].map(c => { const r = c.getBoundingClientRect(); return { cls: String(c.className).slice(0, 70), w: +r.width.toFixed(1), flex: getComputedStyle(c).flex, minWidth: getComputedStyle(c).minWidth }; }),
    };
  }
  return { asideW: aside ? +aside.getBoundingClientRect().width.toFixed(1) : null, avatars: out, sibs };
})()`;
module.exports = [
  { type: 'viewport', w: 1440, h: 900, dsf: 1 },
  { type: 'goto', url: 'http://127.0.0.1:3001/login', wait: 3000 },
  { type: 'eval', js: `localStorage.setItem('access_token', ${JSON.stringify(AT)}); localStorage.setItem('refresh_token', ${JSON.stringify(RT)}); localStorage.setItem('user', JSON.stringify({fullName:'Admin',email:'admin@beautysalon.com',role:'ADMIN'})); 'seeded'`, label: 'seed-localstorage' },
  { type: 'goto', url: 'http://127.0.0.1:3001/', wait: 5000 },
  { type: 'eval', js: MEASURE, label: 'measure-avatar' },
  { type: 'shot', out: 'screenshots/admin_panel/sidebar_before.png' },
];
