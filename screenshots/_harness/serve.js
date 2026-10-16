// Static server for a Flutter web build with Cache-Control: no-store.
// Usage: node serve.js <rootDir> <port>
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8899);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.bin': 'application/octet-stream',
  '.map': 'application/json; charset=utf-8',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(root, url);
    if (url === '/' || url.endsWith('/')) file = path.join(root, 'index.html');
    if (!file.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        // SPA fallback for extension-less paths
        if (!path.extname(file)) {
          fs.readFile(path.join(root, 'index.html'), (e2, d2) => {
            if (e2) return res.writeHead(404).end('not found');
            res.writeHead(200, {
              'Content-Type': MIME['.html'],
              'Cache-Control': 'no-store',
            });
            res.end(d2);
          });
          return;
        }
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      });
      res.end(data);
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
