import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4173;
const DIST_DIR = path.resolve('dist');

// Parser basique de netlify.toml pour simuler le comportement Netlify en local
function parseNetlifyConfig() {
  const tomlPath = path.resolve('netlify.toml');
  const redirects = [];
  const headers = [];

  if (fs.existsSync(tomlPath)) {
    const content = fs.readFileSync(tomlPath, 'utf8');

    // Redirects
    const redirectBlocks = content.split('[[redirects]]').slice(1);
    for (const b of redirectBlocks) {
      const from = b.match(/from\s*=\s*["']([^"']+)["']/)?.[1];
      const to = b.match(/to\s*=\s*["']([^"']+)["']/)?.[1];
      const status = parseInt(b.match(/status\s*=\s*(\d+)/)?.[1] || '301', 10);
      const force = b.includes('force = true');
      if (from && to) redirects.push({ from, to, status, force });
    }

    // Headers
    const headerBlocks = content.split('[[headers]]').slice(1);
    for (const b of headerBlocks) {
      const forPattern = b.match(/for\s*=\s*["']([^"']+)["']/)?.[1];
      const values = {};
      const lines = b.split('\n');
      for (const line of lines) {
        const m = line.match(/^\s*([A-Za-z0-9-]+)\s*=\s*["']([^"']+)["']/);
        if (m) values[m[1]] = m[2];
      }
      if (forPattern) headers.push({ forPattern, values });
    }
  }

  return { redirects, headers };
}

const { redirects, headers } = parseNetlifyConfig();

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
