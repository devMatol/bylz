import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4173;
const DIST_DIR = path.resolve('dist');

// Parser pour _redirects et _headers (priorité dist/, sinon public/)
function parseRedirectsAndHeaders() {
  const redirects = [];
  const headers = [];

  const redirectsPath = fs.existsSync(path.join(DIST_DIR, '_redirects'))
    ? path.join(DIST_DIR, '_redirects')
    : path.resolve('public/_redirects');

  if (fs.existsSync(redirectsPath)) {
    const lines = fs.readFileSync(redirectsPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const from = parts[0];
        const to = parts[1];
        const statusRaw = parts[2] || '301';
        const status = parseInt(statusRaw.replace('!', ''), 10);
        const force = statusRaw.includes('!');
        redirects.push({ from, to, status, force });
      }
    }
  }

  const headersPath = fs.existsSync(path.join(DIST_DIR, '_headers'))
    ? path.join(DIST_DIR, '_headers')
    : path.resolve('public/_headers');

  if (fs.existsSync(headersPath)) {
    const lines = fs.readFileSync(headersPath, 'utf8').split('\n');
    let currentBlock = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (!line.startsWith(' ') && !line.startsWith('\t')) {
        currentBlock = { forPattern: trimmed, values: {} };
        headers.push(currentBlock);
      } else if (currentBlock && trimmed.includes(':')) {
        const idx = trimmed.indexOf(':');
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        currentBlock.values[k] = v;
      }
    }
  }

  return { redirects, headers };
}

const { redirects, headers } = parseRedirectsAndHeaders();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // 1. Appliquer les en-têtes configurés
  for (const h of headers) {
    if (h.forPattern === '/v/*' && urlPath.startsWith('/v/')) {
      for (const [k, v] of Object.entries(h.values)) {
        res.setHeader(k, v);
      }
    }
  }

  // 2. Vérifier les redirections forcées (301)
  const redirect = redirects.find(r => r.from === urlPath && r.force);
  if (redirect) {
    res.writeHead(redirect.status, { Location: redirect.to });
    res.end();
    return;
  }

  // 3. Tenter de servir le fichier statique
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(DIST_DIR, urlPath, 'index.html'))) {
    filePath = path.join(DIST_DIR, urlPath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // 4. Fallback SPA (app.html) pour les routes dynamiques comme /v/test-token
  const spaFallback = path.join(DIST_DIR, 'app.html');
  if (fs.existsSync(spaFallback)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(spaFallback).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Local test server listening on http://localhost:${PORT}`);
});
