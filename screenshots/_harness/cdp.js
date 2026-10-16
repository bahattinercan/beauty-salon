// Minimal zero-dep CDP driver (Node >= 22 global WebSocket).
//
//   node cdp.js target                       -> print current page url/title
//   node cdp.js viewport <w> <h> [dsf]       -> set device metrics (mobile:false so clicks work)
//   node cdp.js goto <url> <waitMs>          -> navigate + wait
//   node cdp.js click <x> <y> <waitMs>       -> mouse click at css px
//   node cdp.js type <text>                  -> insert text into focused field
//   node cdp.js key <keyName>                -> dispatch a raw key (e.g. Tab, Enter)
//   node cdp.js shot <out.png>               -> screenshot (full viewport)
//   node cdp.js seed <accessToken> <refreshToken>  -> write flutter_secure_storage keys into localStorage
//   node cdp.js diag                         -> print collected console/network diagnostics (window.__diag)
//   node cdp.js eval <js>                    -> evaluate expression, print JSON result
//   node cdp.js scroll <y> <waitMs>          -> scroll page/canvas by y px via mouse wheel
//
// Env: CDP_PORT (default 9222)
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.CDP_PORT || 9222);

async function pageTarget() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const list = await res.json();
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');
  return page;
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
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

async function connect() {
  const t = await pageTarget();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  return cdp;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DIAG_HOOK = `
(() => {
  if (window.__diag) return;
  const d = { errors: [], warns: [], net: [], pageErrors: [] };
  window.__diag = d;
  const s = (a) => a.map((v) => { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch (e) { return String(v); } }).join(' ');
  const ce = console.error.bind(console), cw = console.warn.bind(console);
  console.error = (...a) => { d.errors.push(s(a)); ce(...a); };
  console.warn = (...a) => { d.warns.push(s(a)); cw(...a); };
  window.addEventListener('error', (e) => d.pageErrors.push(String(e.message || e.error)));
  window.addEventListener('unhandledrejection', (e) => d.pageErrors.push('unhandled: ' + String((e.reason && e.reason.message) || e.reason)));
  const of = window.fetch;
  window.fetch = async (...a) => {
    const url = typeof a[0] === 'string' ? a[0] : (a[0] && a[0].url) || '?';
    try {
      const r = await of(...a);
      if (!r.ok) d.net.push(r.status + ' ' + url);
      return r;
    } catch (e) { d.net.push('FETCH_FAIL ' + url + ' ' + e.message); throw e; }
  };
  const oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u, ...rest) { this.__u = u; return oo.call(this, m, u, ...rest); };
  XMLHttpRequest.prototype.send = function (...a) {
    this.addEventListener('loadend', () => { if (this.status >= 400) d.net.push(this.status + ' ' + this.__u); });
    return os.apply(this, a);
  };
})();
`;

function b64ToBin(b64) {
  return Buffer.from(b64, 'base64').toString('binary');
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const cdp = await connect();
  const evalJs = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const shot = async (out) => {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const p = path.resolve(out);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, Buffer.from(r.data, 'base64'));
    const md5 = require('crypto').createHash('md5').update(Buffer.from(r.data, 'base64')).digest('hex');
    console.log(`${out} md5=${md5} bytes=${Buffer.from(r.data, 'base64').length}`);
  };

  switch (cmd) {
    case 'target': {
      const t = await pageTarget();
      console.log(t.url);
      console.log(await evalJs('document.title'));
      break;
    }
    case 'viewport': {
      const w = Number(rest[0]), h = Number(rest[1]), dsf = Number(rest[2] || 2);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: w, height: h, deviceScaleFactor: dsf, mobile: false,
      });
      console.log(`viewport ${w}x${h}@${dsf}`);
      break;
    }
    case 'goto': {
      await cdp.send('Page.navigate', { url: rest[0] });
      await sleep(Number(rest[1] || 7000));
      console.log('url:', await evalJs('location.href'));
      break;
    }
    case 'click': {
      const x = Number(rest[0]), y = Number(rest[1]);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
      await sleep(60);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 1 });
      await sleep(Number(rest[2] || 2500));
      console.log(`clicked ${x},${y}`);
      break;
    }
    case 'scroll': {
      const y = Number(rest[0]);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 195, y: 400, deltaX: 0, deltaY: y });
      await sleep(Number(rest[1] || 1500));
      console.log(`scrolled ${y}`);
      break;
    }
    case 'type': {
      await cdp.send('Input.insertText', { text: rest[0] });
      await sleep(300);
      console.log('typed');
      break;
    }
    case 'key': {
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: rest[0], code: rest[0] === 'Enter' ? 'Enter' : rest[0], windowsVirtualKeyCode: rest[0] === 'Enter' ? 13 : 9 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: rest[0], code: rest[0] === 'Enter' ? 'Enter' : rest[0], windowsVirtualKeyCode: rest[0] === 'Enter' ? 13 : 9 });
      await sleep(Number(rest[1] || 1500));
      console.log('key sent');
      break;
    }
    case 'shot': {
      await shot(rest[0]);
      break;
    }
    case 'seed': {
      await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: DIAG_HOOK });
      const [access, refresh] = rest;
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
        await put('access_token', ${JSON.stringify(access)});
        await put('refresh_token', ${JSON.stringify(refresh)});
        return Object.keys(localStorage).join(',');
      })()`);
      console.log('localStorage:', res);
      break;
    }
    case 'diag': {
      const v = await evalJs('JSON.stringify(window.__diag || null)');
      console.log(v);
      break;
    }
    case 'eval': {
      const v = await evalJs(rest.join(' '));
      console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 1));
      break;
    }
    default:
      console.log('unknown command: ' + cmd);
      process.exitCode = 1;
  }
  cdp.ws.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR', e.message);
  process.exit(1);
});
