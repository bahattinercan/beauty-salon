// Clean single-browser verification of the admin panel sidebar avatar fix.
// Usage: CDP_PORT=9333 node verify-admin-sidebar-fix.js
const fs = require('fs');
const P = process.env.TEMP;
const AT = fs.readFileSync(P + '/admin_at.txt', 'utf8').trim();
const RT = fs.readFileSync(P + '/admin_rt.txt', 'utf8').trim();
const PORT = Number(process.env.CDP_PORT || 9333);
const BASE = 'http://127.0.0.1:3001';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MEASURE = `(() => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
  const av = document.querySelector('aside [class*="w-9"]');
  const logo = document.querySelector('aside [class*="w-10"]');
  const email = [...document.querySelectorAll('aside p')].find(p => (p.textContent || '').includes('@'));
  return {
    url: location.href,
    avatar: av ? { ...box(av), shrink: getComputedStyle(av).flexShrink, letter: av.textContent.trim() } : null,
    logo: logo ? box(logo) : null,
    email: email ? { w: box(email).w, ellipsis: getComputedStyle(email).textOverflow, clip: getComputedStyle(email).overflow, truncated: email.scrollWidth > email.clientWidth + 1, title: email.getAttribute('title') } : null,
    pageOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    consoleErrors: 0,
  };
})()`;

async function main() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const t = list.find((x) => x.type === 'page');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  let id = 0; const pend = new Map(); const ev = [];
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pend.has(msg.id)) { const { r, j } = pend.get(msg.id); pend.delete(msg.id); msg.error ? j(new Error(JSON.stringify(msg.error))) : r(msg.result); return; }
    if (msg.method) ev.push(msg);
  });
  const send = (m, p = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method: m, params: p })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); j(new Error('timeout ' + m)); } }, 60000); });
  const evaluate = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; };
  const shot = async (out) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.mkdirSync(require('path').dirname(require('path').resolve(out)), { recursive: true }); fs.writeFileSync(out, Buffer.from(r.data, 'base64')); console.log('  shot', out); };

  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await send('Page.navigate', { url: BASE + '/login' }); await sleep(3000);
  await evaluate(`localStorage.setItem('access_token',${JSON.stringify(AT)});localStorage.setItem('refresh_token',${JSON.stringify(RT)});localStorage.setItem('user',JSON.stringify({fullName:'Admin',email:'admin@beautysalon.com',role:'ADMIN'}));'ok'`);

  // 1) hard navigations across all routes, re-measuring each time
  const routes = ['/', '/salons', '/users', '/appointments', '/reviews', '/categories', '/settings'];
  for (const r of routes) {
    ev.length = 0;
    await send('Page.navigate', { url: BASE + r }); await sleep(4500);
    const m = await evaluate(MEASURE);
    const navs = ev.filter((e) => e.method === 'Page.frameNavigated').map((e) => e.params.frame.url);
    console.log(`HARD ${r.padEnd(14)} -> landed=${m.url}  avatar=${m.avatar ? m.avatar.w + 'x' + m.avatar.h + ' (shrink ' + m.avatar.shrink + ')' : 'n/a'}  logo=${m.logo ? m.logo.w + 'x' + m.logo.h : 'n/a'}  overflowX=${m.pageOverflowX}  navs=${navs.length}`);
  }

  // 2) real click on the sidebar "Ayarlar" link, 3 times back and forth
  for (let i = 0; i < 3; i++) {
    await send('Page.navigate', { url: BASE + '/appointments' }); await sleep(4000);
    const box = await evaluate(`(()=>{const a=[...document.querySelectorAll('aside a')].find(x=>x.getAttribute('href')==='/settings');if(!a)return null;const r=a.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()`);
    if (!box) { console.log(`CLICK ${i + 1}: sidebar link not found`); continue; }
    const { x, y } = JSON.parse(box);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 }); await sleep(60);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 1 }); await sleep(4000);
    console.log(`CLICK ${i + 1}: appointments -> click(${x},${y}) -> ${await evaluate('location.href')}`);
  }

  // 3) visual proof
  await send('Page.navigate', { url: BASE + '/' }); await sleep(4500);
  await shot('screenshots/admin_panel/sidebar_after.png');
  await evaluate(`window.scrollTo(0, document.body.scrollHeight)`); await sleep(500);
  await send('Page.navigate', { url: BASE + '/users' }); await sleep(4500);
  await shot('screenshots/admin_panel/users_after.png');

  const errs = ev.filter((e) => e.method === 'Log.entryAdded' && e.params.entry.level === 'error').map((e) => e.params.entry.text.slice(0, 200));
  console.log('errors:', errs.length ? errs : 'none');
  ws.close(); await sleep(300); process.exit(0);
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
