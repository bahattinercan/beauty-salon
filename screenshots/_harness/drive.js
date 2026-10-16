// Single-session CDP driver: runs a whole screenshot plan over ONE websocket so
// addScriptToEvaluateOnNewDocument (diagnostics hook) survives navigations.
//
//   node drive.js <planFile.js>
//
// Plan file: module.exports = [ {type:'viewport',w,h,dsf}, {type:'goto',url,wait},
//   {type:'click',x,y,wait}, {type:'scroll',dy,wait}, {type:'type',text},
//   {type:'key',key,wait}, {type:'shot',out}, {type:'wait',ms},
//   {type:'eval',js,label}, {type:'diag'}, {type:'seed',access,refresh} ]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.CDP_PORT || 9222);

const DIAG_HOOK = `
(() => {
  if (window.__diag) return;
  const d = { errors: [], warns: [], net: [], pageErrors: [] };
  window.__diag = d;
  const s = (a) => a.map((v) => { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch (e) { return String(v); } }).join(' ');
  const ce = console.error.bind(console), cw = console.warn.bind(console);
  console.error = (...a) => { d.errors.push(s(a)); ce(...a); };
  console.warn = (...a) => { d.warns.push(s(a)); cw(...a); };
  window.addEventListener('error', (e) => d.pageErrors.push(String((e && (e.message || e.error)) || e)));
  window.addEventListener('unhandledrejection', (e) => d.pageErrors.push('unhandled: ' + String((e.reason && e.reason.message) || e.reason)));
  const of = window.fetch;
  window.fetch = async (...a) => {
    const url = typeof a[0] === 'string' ? a[0] : (a[0] && a[0].url) || '?';
    try { const r = await of(...a); if (!r.ok) d.net.push(r.status + ' ' + url); return r; }
    catch (e) { d.net.push('FETCH_FAIL ' + url + ' ' + e.message); throw e; }
  };
  const oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u, ...rest) { this.__u = u; return oo.call(this, m, u, ...rest); };
  XMLHttpRequest.prototype.send = function (...a) {
    this.addEventListener('loadend', () => { if (this.status >= 400) d.net.push(this.status + ' ' + this.__u); });
    return os.apply(this, a);
  };
})();
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageTarget() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const list = await res.json();
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target on port ' + PORT);
  return page;
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
        return;
      }
      if (msg.method) this.events.push(msg);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 120000);
    });
  }
}

async function main() {
  const planFile = process.argv[2];
  const plan = require(path.resolve(planFile));
  const t = await pageTarget();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: DIAG_HOOK });

  const evalJs = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result.value;
  };
  const shot = async (out) => {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const buf = Buffer.from(r.data, 'base64');
    const p = path.resolve(out);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, buf);
    console.log(`  shot ${out} md5=${crypto.createHash('md5').update(buf).digest('hex').slice(0, 8)} ${buf.length}B`);
  };

  for (const [i, step] of plan.entries()) {
    const tag = `[${i + 1}/${plan.length}] ${step.type}${step.label ? ' ' + step.label : ''}`;
    switch (step.type) {
      case 'viewport':
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: step.w, height: step.h, deviceScaleFactor: step.dsf || 2, mobile: false,
        });
        console.log(`${tag} ${step.w}x${step.h}@${step.dsf || 2}`);
        break;
      case 'emulate': {
        // {type:'emulate', features:[{name:'prefers-color-scheme',value:'dark'}]}
        await cdp.send('Emulation.setEmulatedMedia', {
          media: step.media || '',
          features: step.features || [],
        });
        console.log(`${tag} ${JSON.stringify(step.features || [])}`);
        break;
      }
      case 'goto':
        await cdp.send('Page.navigate', { url: step.url });
        await sleep(step.wait || 8000);
        console.log(`${tag} -> ${await evalJs('location.href')}`);
        break;
      case 'click':
        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: step.x, y: step.y, button: 'left', clickCount: 1, buttons: 1 });
        await sleep(70);
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: step.x, y: step.y, button: 'left', clickCount: 1, buttons: 1 });
        await sleep(step.wait || 2500);
        console.log(`${tag} ${step.x},${step.y}`);
        break;
      case 'scroll':
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: step.x || 195, y: step.y || 400, deltaX: 0, deltaY: step.dy });
        await sleep(step.wait || 1500);
        console.log(`${tag} dy=${step.dy}`);
        break;
      case 'type':
        await cdp.send('Input.insertText', { text: step.text });
        await sleep(step.wait || 400);
        console.log(`${tag} "${step.text.slice(0, 30)}"`);
        break;
      case 'key': {
        const vk = { Enter: 13, Tab: 9, Escape: 27 }[step.key] || 0;
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: step.key, code: step.key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: step.key, code: step.key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
        await sleep(step.wait || 1500);
        console.log(`${tag} ${step.key}`);
        break;
      }
      case 'geo': {
        await cdp.send('Browser.grantPermissions', {
          origin: step.origin || 'http://127.0.0.1:8899',
          permissions: ['geolocation'],
        });
        await cdp.send('Emulation.setGeolocationOverride', {
          latitude: step.lat || 41.0082, longitude: step.lng || 28.9784, accuracy: 20,
        });
        console.log(`${tag} geolocation granted ${step.lat || 41.0082},${step.lng || 28.9784}`);
        break;
      }
      case 'keys': {
        const vk = { Enter: 13, Tab: 9, Escape: 27, Backspace: 8, ArrowDown: 40 }[step.key] || 0;
        for (let n = 0; n < (step.count || 1); n++) {
          await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: step.key, code: step.key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
          await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: step.key, code: step.key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
          await sleep(45);
        }
        await sleep(step.wait || 500);
        console.log(`${tag} ${step.key} x${step.count || 1}`);
        break;
      }
      case 'wait':
        await sleep(step.ms);
        console.log(`${tag} ${step.ms}ms`);
        break;
      case 'seed': {
        const res = await evalJs(`(async () => {
          const b64 = (bytes) => { let s=''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };
          const raw = crypto.getRandomValues(new Uint8Array(32));
          localStorage.setItem('FlutterSecureStorage', b64(raw));
          const key = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
          const put = async (k, v) => {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(v));
            localStorage.setItem('FlutterSecureStorage.' + k, b64(iv) + '.' + b64(new Uint8Array(ct)));
          };
          for (const [k, v] of Object.entries(${JSON.stringify(step.pairs || {})})) await put(k, v);
          return Object.keys(localStorage).join(',');
        })()`);
        console.log(`${tag} localStorage: ${res}`);
        break;
      }
      case 'shot':
        await shot(step.out);
        break;
      case 'eval': {
        const v = await evalJs(step.js);
        console.log(`${tag} => ${typeof v === 'string' ? v : JSON.stringify(v)}`);
        break;
      }
      case 'diag': {
        const v = await evalJs('JSON.stringify(window.__diag || null)');
        const parsed = v ? JSON.parse(v) : null;
        const con = cdp.events.filter((e) => e.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(e.params.type));
        const logs = cdp.events.filter((e) => e.method === 'Log.entryAdded' && ['error', 'warning'].includes(e.params.entry.level));
        console.log(`${tag} window.__diag=${v ? v.slice(0, 4000) : 'NULL'}`);
        if (con.length) console.log('  console:', con.slice(-10).map((e) => e.params.type + ': ' + e.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300)).join('\n    '));
        if (logs.length) console.log('  log:', logs.slice(-10).map((e) => e.params.entry.level + ': ' + e.params.entry.text.slice(0, 300)).join('\n    '));
        cdp.events = [];
        break;
      }
      default:
        throw new Error('unknown step: ' + step.type);
    }
  }
  ws.close();
  await sleep(200);
  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR', e.message);
  process.exit(1);
});
