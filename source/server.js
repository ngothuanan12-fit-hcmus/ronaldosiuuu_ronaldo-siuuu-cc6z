import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function serveStatic(res, urlPath) {
  // normalize + strip leading separators so "../" cannot escape PUBLIC_DIR
  const rel = normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^([/\\])+/, '');
  const filePath = join(PUBLIC_DIR, rel);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return json(res, 403, { error: 'forbidden' });
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    json(res, 404, { error: 'not found', path: urlPath });
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === '/api/health') {
    return json(res, 200, { ok: true, uptime: process.uptime() });
  }

  // TODO: các route API của sản phẩm sẽ được thêm ở đây

  if (req.method !== 'GET') {
    return json(res, 405, { error: 'method not allowed' });
  }
  await serveStatic(res, pathname);
});

server.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
