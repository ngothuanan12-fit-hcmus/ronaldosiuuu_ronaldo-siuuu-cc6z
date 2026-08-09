/**
 * Điểm khởi động SquadFit.
 *
 * Trách nhiệm duy nhất: dựng HTTP server, nối bộ định tuyến API, và phục vụ
 * tệp tĩnh cho mọi đường dẫn không bắt đầu bằng /api/.
 *
 * Không có logic nghiệp vụ nào trong tệp này.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRouter, sendJson } from './api/router.js';
import { routes } from './api/handlers.js';

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

/** Phục vụ tệp tĩnh từ source/public, chặn mọi đường dẫn thoát ra ngoài thư mục đó. */
async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, {
      error: { code: 'METHOD_NOT_ALLOWED', message: `Tệp tĩnh chỉ nhận GET, không nhận ${req.method}.`, details: [] },
    });
    return;
  }

  const rel = normalize(pathname === '/' ? '/index.html' : pathname).replace(/^([/\\])+/, '');
  const filePath = join(PUBLIC_DIR, rel);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: { code: 'FORBIDDEN', message: 'Đường dẫn không được phép.', details: [] } });
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    sendJson(res, 404, {
      error: { code: 'NOT_FOUND', message: `Không tìm thấy ${pathname}.`, details: [] },
    });
  }
}

const healthRoute = {
  method: 'GET',
  path: '/api/health',
  handler: (req, res) => sendJson(res, 200, { ok: true, uptime: Number(process.uptime().toFixed(3)) }),
};

const handle = createRouter([healthRoute, ...routes], serveStatic);

const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    // Lưới an toàn cuối cùng: không yêu cầu nào được phép treo.
    console.error(`[${new Date().toISOString()}] Lỗi thoát khỏi router:`, err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'Máy chủ gặp lỗi không xử lý được.', details: [] } });
    } else {
      res.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`SquadFit đang chạy tại http://localhost:${PORT}`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/candidates`);
  console.log(`  GET  /api/scenarios`);
  console.log(`  GET  /api/meta`);
  console.log(`  POST /api/solve`);
});
