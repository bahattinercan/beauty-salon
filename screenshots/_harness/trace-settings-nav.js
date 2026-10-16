// Trace navigations for 127.0.0.1:3001/settings after visiting /appointments
const fs = require('fs');
const P = process.env.TEMP;
const AT = fs.readFileSync(P + '/admin_at.txt', 'utf8').trim();
const RT = fs.readFileSync(P + '/admin_rt.txt', 'utf8').trim();
const PORT = 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); j(new Error('timeout ' + method)); } }, 60000); });
  const evaluate = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;

  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');

  await send('Page.navigate', { url: 'http://127.0.0.1:3001/login' }); await sleep(3000);
  await evaluate(`localStorage.setItem('access_token', ${JSON.stringify(AT)}); localStorage.setItem('refresh_token', ${JSON.stringify(RT)}); localStorage.setItem('user', JSON.stringify({fullName:'Admin',email:'admin@beautysalon.com',role:'ADMIN'})); 'ok'`);
  await send('Page.navigate', { url: 'http://127.0.0.1:3001/appointments' }); await sleep(6000);
  console.log('appointments href:', await evaluate('location.href'));

  ev.length = 0;
  await send('Page.navigate', { url: 'http://127.0.0.1:3001/settings' }); await sleep(7000);
  console.log('settings href:', await evaluate('location.href'));
  console.log('--- frameNavigated / requests during /settings ---');
  for (const e of ev) {
    if (e.method === 'Page.frameNavigated') console.log('NAV', (e.params.frame.parentId ? '  iframe ' : '  main   ') + e.params.frame.url);
    else if (e.method === 'Network.requestWillBeSent') {
      const u = e.params.request.url;
      if (/127\.0\.0\.1:3001|localhost:3000/.test(u)) console.log('REQ', e.params.type || '', u.slice(0, 110), e.params.redirectResponse ? '<<REDIR ' + e.params.redirectResponse.status : '');
    } else if (e.method === 'Network.responseReceived') {
      const u = e.params.response.url;
      if (/127\.0\.0\.1:3001/.test(u) && e.params.response.status >= 300) console.log('RESP', e.params.response.status, u.slice(0, 110));
    }
  }
  ws.close(); process.exit(0);
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
