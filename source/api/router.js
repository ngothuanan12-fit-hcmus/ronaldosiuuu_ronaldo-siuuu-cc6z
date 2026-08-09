/**
 * Bộ định tuyến tối giản trên node:http.
 *
 * Trách nhiệm: khớp method + đường dẫn, đọc và parse body JSON, gửi phản hồi,
 * và bắt MỌI lỗi để không bao giờ có yêu cầu nào bị treo hoặc trả về stack trace.
 */

import { HttpError, badRequest, methodNotAllowed, notFound, payloadTooLarge } from './http-error.js';

/** Giới hạn kích thước body, chặn yêu cầu cố tình gửi dữ liệu khổng lồ. */
export const MAX_BODY_BYTES = 1_000_000;

/** Gửi phản hồi JSON kèm content-length chính xác. */
export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

/** Đọc toàn bộ body và parse JSON. Ném HttpError nếu quá lớn hoặc sai cú pháp. */
export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(payloadTooLarge(`Dữ liệu gửi lên vượt quá ${MAX_BODY_BYTES.toLocaleString('vi-VN')} byte.`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('error', (err) => reject(new HttpError(400, 'REQUEST_ERROR', `Lỗi khi đọc dữ liệu gửi lên: ${err.message}`)));

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (raw === '') {
        reject(badRequest('Yêu cầu không có nội dung. Cần gửi một JSON object.'));
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(badRequest('Nội dung gửi lên phải là một JSON object.'));
          return;
        }
        resolve(parsed);
      } catch (err) {
        reject(badRequest(`JSON không hợp lệ: ${err.message}`));
      }
    });
  });
}

/**
 * Tạo bộ định tuyến.
 *
 * @param {Array<{method: string, path: string, handler: Function}>} routes
 * @param {Function} [fallback] xử lý khi không khớp route API nào (phục vụ tệp tĩnh)
 */
/**
 * Biên dịch một mẫu đường dẫn thành biểu thức chính quy.
 * '/api/projects/:id' → khớp '/api/projects/abc' và cho params = { id: 'abc' }
 */
function compilePath(pattern) {
  const names = [];
  const source = pattern
    .split('/')
    .map((segment) => {
      if (!segment.startsWith(':')) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      names.push(segment.slice(1));
      return '([^/]+)';
    })
    .join('/');
  return { regex: new RegExp(`^${source}$`), names };
}

export function createRouter(routes, fallback) {
  const compiled = routes.map((r) => ({ ...r, ...compilePath(r.path) }));

  /** Tìm route khớp. Trả về {handler, params} hoặc lý do không khớp. */
  function match(method, pathname) {
    let pathExists = false;
    for (const route of compiled) {
      const m = route.regex.exec(pathname);
      if (!m) continue;
      pathExists = true;
      if (route.method !== method) continue;
      const params = Object.fromEntries(route.names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
      return { handler: route.handler, params };
    }
    return { handler: null, params: {}, pathExists };
  }

  return async function handle(req, res) {
    let pathname;
    try {
      pathname = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`).pathname;
    } catch {
      sendJson(res, 400, { error: { code: 'BAD_URL', message: 'Đường dẫn không hợp lệ.' } });
      return;
    }

    // Không phải đường dẫn API → nhường cho tệp tĩnh.
    if (!pathname.startsWith('/api/')) {
      await fallback(req, res, pathname);
      return;
    }

    const { handler, params, pathExists } = match(req.method, pathname);

    try {
      if (!handler) {
        throw pathExists
          ? methodNotAllowed(`Đường dẫn ${pathname} không nhận phương thức ${req.method}.`)
          : notFound(`Không có endpoint ${pathname}.`);
      }
      await handler(req, res, params);
    } catch (err) {
      if (err instanceof HttpError) {
        sendJson(res, err.status, {
          error: { code: err.code, message: err.message, details: err.details },
        });
        return;
      }
      // Lỗi ngoài dự kiến: ghi log phía máy chủ, KHÔNG lộ stack trace ra ngoài.
      console.error(`[${new Date().toISOString()}] Lỗi không xử lý được tại ${req.method} ${pathname}:`, err);
      sendJson(res, 500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Máy chủ gặp lỗi không xử lý được. Vui lòng thử lại.',
          details: [],
        },
      });
    }
  };
}
