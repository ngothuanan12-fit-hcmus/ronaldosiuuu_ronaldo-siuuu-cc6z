#!/usr/bin/env node
/**
 * Kiểm thử tầng API bằng cách tự khởi động máy chủ trong tiến trình con,
 * gọi lần lượt các endpoint, rồi tắt máy chủ.
 *
 * Chạy:  node scripts/try-api.js
 * Mã thoát khác 0 nếu có ca nào không đạt.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 3111;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;

function check(name, condition, extra = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${name}${extra ? '  → ' + extra : ''}`);
    failed++;
  }
}

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

/** Đợi máy chủ sẵn sàng, tối đa 5 giây. Không bao giờ chờ vô hạn. */
async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE + '/api/health');
      if (res.ok) return true;
    } catch {
      /* chưa lên, thử lại */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

const child = spawn(process.execPath, [join(ROOT, 'source', 'server.js')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

const serverLog = [];
child.stdout.on('data', (d) => serverLog.push(String(d)));
child.stderr.on('data', (d) => serverLog.push(String(d)));

try {
  console.log(`Khởi động máy chủ ở cổng ${PORT}…\n`);
  if (!(await waitForServer())) {
    console.error('Máy chủ không lên sau 5 giây. Log:\n' + serverLog.join(''));
    process.exit(1);
  }

  console.log('GET /api/health');
  {
    const r = await call('GET', '/api/health');
    check('trả 200', r.status === 200, `nhận ${r.status}`);
    check('có ok: true', r.json?.ok === true);
  }

  console.log('\nGET /api/candidates');
  {
    const r = await call('GET', '/api/candidates');
    check('trả 200', r.status === 200, `nhận ${r.status}`);
    check('đúng 24 ứng viên', r.json?.candidates?.length === 24, `nhận ${r.json?.candidates?.length}`);
    check('có đủ 12 kỹ năng', r.json?.skills?.length === 12);
  }

  console.log('\nGET /api/scenarios');
  {
    const r = await call('GET', '/api/scenarios');
    check('trả 200', r.status === 200, `nhận ${r.status}`);
    check('có 3 kịch bản', r.json?.scenarios?.length === 3);
    check('có kịch bản mặc định', typeof r.json?.defaultScenarioId === 'string');
  }

  console.log('\nPOST /api/solve — yêu cầu hợp lệ');
  {
    const { scenarios } = await import('../source/data/scenarios.js');
    const r = await call('POST', '/api/solve', { project: scenarios[0].project });
    check('trả 200', r.status === 200, `nhận ${r.status}`);
    check('ok === true', r.json?.ok === true);
    check('có tối đa 3 phương án', (r.json?.plans?.length ?? 0) > 0 && r.json.plans.length <= 3);
    check('phương án đầu có phân vai', Array.isArray(r.json?.plans?.[0]?.assignments));
    check('có meta.elapsedMs', typeof r.json?.meta?.elapsedMs === 'number');
    check('không có undefined trong phản hồi', !JSON.stringify(r.json).includes('undefined'));
  }

  console.log('\nPOST /api/solve — kịch bản vô nghiệm');
  {
    const { scenarios } = await import('../source/data/scenarios.js');
    const voNghiem = scenarios.find((s) => s.id === 'vo-nghiem');
    const r = await call('POST', '/api/solve', { project: voNghiem.project });
    check('trả 200 (vô nghiệm không phải lỗi máy chủ)', r.status === 200, `nhận ${r.status}`);
    check('ok === false', r.json?.ok === false);
    check('có diagnosis', r.json?.diagnosis !== null && r.json?.diagnosis !== undefined);
    check('chỉ rõ kỹ năng thiếu', (r.json?.diagnosis?.uncoveredSkills?.length ?? 0) > 0);
  }

  console.log('\nCác trường hợp đầu vào sai');
  {
    let r = await call('POST', '/api/solve', {});
    check('thiếu project → 400', r.status === 400, `nhận ${r.status}`);
    check('  có thông báo tiếng Việt', typeof r.json?.error?.message === 'string' && r.json.error.message.length > 0);

    r = await call('POST', '/api/solve', { project: 'không phải object' });
    check('project sai kiểu → 400', r.status === 400, `nhận ${r.status}`);

    r = await call('POST', '/api/solve', { project: { requiredSkills: [{ skill: 'Bịa Kỹ Năng', minLevel: 2 }] } });
    check('kỹ năng không tồn tại → 400', r.status === 400, `nhận ${r.status}`);
    check('  nêu rõ trường sai', (r.json?.error?.details?.length ?? 0) > 0);

    r = await call('POST', '/api/solve', '{ hỏng json');
    check('JSON hỏng → 400', r.status === 400, `nhận ${r.status}`);

    r = await call('POST', '/api/solve', undefined);
    check('body rỗng → 400', r.status === 400, `nhận ${r.status}`);

    r = await call('POST', '/api/solve', { project: {}, candidates: [{ id: 'x' }, { id: 'x' }] });
    check('id ứng viên trùng → 400', r.status === 400, `nhận ${r.status}`);

    r = await call('GET', '/api/solve');
    check('sai method → 405', r.status === 405, `nhận ${r.status}`);

    r = await call('GET', '/api/khong-ton-tai');
    check('endpoint không tồn tại → 404', r.status === 404, `nhận ${r.status}`);
  }

  console.log('\n/api/projects — vòng đời một dự án');
  {
    let r = await call('GET', '/api/projects');
    check('danh sách khởi tạo RỖNG', r.status === 200 && r.json?.total === 0, `nhận total=${r.json?.total}`);

    r = await call('GET', '/api/templates');
    check('endpoint mẫu đã gỡ bỏ → 404', r.status === 404, `nhận ${r.status}`);

    r = await call('POST', '/api/projects', { project: { name: '' } });
    check('tạo dự án không tên → 400', r.status === 400, `nhận ${r.status}`);

    r = await call('POST', '/api/projects', {
      project: {
        name: 'Dự án kiểm thử',
        requiredSkills: [{ skill: 'Frontend', minLevel: 2 }],
        teamSize: { min: 3, max: 5 },
        constraints: { minTotalHours: 40, minPresenters: 0, mustInclude: [], mustExclude: [] },
      },
    });
    check('tạo dự án hợp lệ → 201', r.status === 201, `nhận ${r.status}`);
    const id = r.json?.project?.id;
    check('có id và mốc thời gian', typeof id === 'string' && typeof r.json?.project?.createdAt === 'string');

    r = await call('GET', '/api/projects');
    check('danh sách còn 1 dự án', r.json?.total === 1, `nhận ${r.json?.total}`);

    r = await call('GET', `/api/projects/${id}`);
    check('đọc lại theo id → 200', r.status === 200, `nhận ${r.status}`);

    r = await call('PATCH', `/api/projects/${id}`, { project: { name: 'Đã đổi tên' } });
    check('sửa dự án → 200', r.status === 200, `nhận ${r.status}`);
    check('  tên đã đổi', r.json?.project?.name === 'Đã đổi tên');
    check('  updatedAt thay đổi', r.json?.project?.updatedAt >= r.json?.project?.createdAt);

    r = await call('PATCH', `/api/projects/${id}`, { project: { requiredSkills: [{ skill: 'Bịa', minLevel: 1 }] } });
    check('sửa bằng kỹ năng không tồn tại → 400', r.status === 400, `nhận ${r.status}`);

    r = await call('GET', '/api/projects/khong-ton-tai');
    check('đọc id không tồn tại → 404', r.status === 404, `nhận ${r.status}`);

    r = await call('DELETE', `/api/projects/${id}`);
    check('xoá dự án → 200', r.status === 200, `nhận ${r.status}`);

    r = await call('GET', '/api/projects');
    check('danh sách rỗng trở lại', r.json?.total === 0, `nhận ${r.json?.total}`);

    r = await call('DELETE', `/api/projects/${id}`);
    check('xoá lần hai → 404', r.status === 404, `nhận ${r.status}`);
  }

  console.log('\nTệp tĩnh');
  {
    const r = await fetch(BASE + '/');
    check('GET / trả 200', r.status === 200, `nhận ${r.status}`);
    const rr = await fetch(BASE + '/../package.json');
    check('không thoát ra ngoài source/public', rr.status === 404 || rr.status === 403, `nhận ${rr.status}`);
  }

  console.log(`\n${'═'.repeat(52)}`);
  console.log(`  PASS ${passed}  ·  FAIL ${failed}`);
  console.log('═'.repeat(52));
} finally {
  child.kill();
}

process.exit(failed === 0 ? 0 : 1);
