// Local stand-in for Vercel: serves public/ and routes /api/<name> to the
// POST/GET export of api/<name>.js.
//
//   node scripts/dev-server.mjs            (port 5173)
//   DRY_RUN=1 node scripts/dev-server.mjs  (print Telegram messages instead of sending)

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = join(root, 'public');
const port = Number(process.env.PORT) || 5173;

// Load .env.local if present (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID).
try {
  const env = await readFile(join(root, '.env.local'), 'utf8');
  for (const row of env.split(/\r?\n/)) {
    const m = row.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

async function api(req, res, name) {
  const mod = await import(pathToFileURL(join(root, 'api', `${name}.js`)).href + `?t=${Date.now()}`);
  const handler = mod[req.method];
  if (!handler) {
    res.writeHead(405).end();
    return;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
  });
  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    const m = url.pathname.match(/^\/api\/([a-z-]+)$/);
    if (m) return await api(req, res, m[1]);
    if (url.pathname === '/__maps') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(await readFile(join(root, 'scripts', '.maps-preview.html')));
    }

    let path = normalize(decodeURIComponent(url.pathname)).replace(/^([\\/])+/, '');
    if (path.startsWith('..')) return res.writeHead(403).end();
    let file = join(pub, path);
    const s = await stat(file).catch(() => null);
    if (!s) return res.writeHead(404).end('not found');
    if (s.isDirectory()) file = join(file, 'index.html');
    const data = await readFile(file);
    const type = TYPES[extname(file)] || 'application/octet-stream';

    // Byte ranges, so audio seeking behaves like it will on Vercel.
    const range = req.headers.range && req.headers.range.match(/bytes=(\d*)-(\d*)/);
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : data.length - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${data.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      });
      return res.end(data.subarray(start, end + 1));
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch (err) {
    console.error(err);
    res.writeHead(500).end(String(err?.stack || err));
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
