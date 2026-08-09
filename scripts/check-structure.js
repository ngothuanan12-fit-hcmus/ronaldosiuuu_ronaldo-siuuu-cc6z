#!/usr/bin/env node
/**
 * Kiểm tra toàn bộ điều kiện pass/fail của hệ thống chấm SPD Challenge 2026.
 *
 * Chạy:  node scripts/check-structure.js
 *        node scripts/check-structure.js <đường-dẫn-thư-mục-gốc>   (tuỳ chọn)
 *
 * Mã thoát: 0 nếu tất cả PASS, 1 nếu có bất kỳ FAIL nào.
 */

import { readFileSync, readdirSync, statSync, lstatSync, existsSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// ===================================================================
// CẤU HÌNH — sửa ở đây nếu ban tổ chức công bố giá trị khác
// ===================================================================

/** ⚠️ CẦN XÁC NHẬN: giá trị schema_version mà ban tổ chức yêu cầu. */
const EXPECTED_SCHEMA_VERSION = '1.0';

/** Bốn tệp bắt buộc phải nằm trực tiếp tại thư mục gốc. */
const REQUIRED_FILES = ['README.md', 'chatlog.md', 'submission.json', '.gitignore'];

/** Các trường bắt buộc trong submission.json. */
const REQUIRED_JSON_FIELDS = [
  'schema_version',
  'team_name',
  'login',
  'source_paths',
  'dependency_files',
];

/** Bảy mục bắt buộc của README.md, mỗi mục là một nhóm từ khoá thay thế nhau. */
const README_SECTIONS = [
  { id: 1, name: 'Tên và mô tả ngắn của sản phẩm', keywords: ['mô tả', 'giới thiệu', 'sản phẩm là', 'là công cụ', 'là hệ thống', 'overview'] },
  { id: 2, name: 'Bài toán mà sản phẩm giải quyết', keywords: ['bài toán', 'vấn đề', 'giải quyết', 'problem'] },
  { id: 3, name: 'Danh sách tính năng chính', keywords: ['tính năng', 'chức năng', 'feature'] },
  { id: 4, name: 'Công nghệ và các phụ thuộc', keywords: ['công nghệ', 'phụ thuộc', 'dependencies', 'tech stack', 'thư viện'] },
  { id: 5, name: 'Hướng dẫn cài đặt và chạy', keywords: ['cài đặt', 'hướng dẫn chạy', 'chạy dự án', 'install', 'getting started'] },
  { id: 6, name: 'Mô tả cấu trúc thư mục', keywords: ['cấu trúc thư mục', 'cấu trúc dự án', 'cây thư mục', 'project structure'] },
  { id: 7, name: 'Tên đội và vai trò thành viên', keywords: ['tên đội', 'đội thi', 'thành viên', 'vai trò', 'team'] },
];

/** Nhóm quy tắc .gitignore bắt buộc phải có. */
const GITIGNORE_GROUPS = [
  { name: 'tệp biến môi trường', patterns: ['.env', '*.env'] },
  { name: 'thư mục phụ thuộc', patterns: ['node_modules', 'vendor/', '.venv', 'venv/'] },
  { name: 'build output', patterns: ['dist', 'build', 'out/', '.next', '.vite', 'target/'] },
];

/** Thư mục bỏ qua khi quét tìm tệp nhạy cảm. */
const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'bower_components', 'jspm_packages', '.pnpm-store',
  'vendor', 'venv', '.venv', '__pycache__', 'dist', 'build', 'out',
  '.next', '.nuxt', '.svelte-kit', '.vite', '.turbo', '.cache', 'coverage',
]);

/** Tệp môi trường MẪU — được phép tồn tại, không tính là rò rỉ. */
const ENV_EXAMPLE_RE = /^(\.env\.(example|sample|template|defaults)|(example|sample)\.env|\.env\.[a-z0-9-]+\.example)$/i;

/** Tệp bị coi là nhạy cảm (khớp tên hoặc phần mở rộng). */
const SECRET_RULES = [
  { label: 'tệp biến môi trường thật', test: (n) => /^\.env($|\.)/i.test(n) && !ENV_EXAMPLE_RE.test(n) },
  { label: 'tệp biến môi trường thật', test: (n) => /\.env$/i.test(n) && !ENV_EXAMPLE_RE.test(n) && n !== '.env' },
  { label: 'khoá riêng tư / chứng chỉ', test: (n) => /\.(pem|key|p8|p12|pfx|jks|keystore|crt|cer|der|csr|ppk|kdbx|asc|gpg|pgp)$/i.test(n) },
  { label: 'khoá SSH', test: (n) => /^(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.|$)/i.test(n) || /_(rsa|dsa|ed25519)$/i.test(n) },
  { label: 'tệp thông tin xác thực', test: (n) => /^(credentials|token|tokens|auth|secrets)\.(json|ya?ml)$/i.test(n) },
  { label: 'tệp thông tin xác thực', test: (n) => /(client_secret|service-?account|serviceAccountKey|credential)[^/]*\.json$/i.test(n) },
  { label: 'tệp cấu hình chứa token', test: (n) => /^(\.npmrc|\.pypirc|\.netrc|_netrc|\.htpasswd)$/i.test(n) },
  { label: 'tệp trạng thái Terraform (có thể chứa bí mật)', test: (n) => /\.tfstate($|\.)/i.test(n) },
];

// ===================================================================
// HẠ TẦNG BÁO CÁO
// ===================================================================

const results = [];
let currentSection = null;

function section(title) {
  currentSection = title;
  console.log(`\n${title}`);
  console.log('─'.repeat(Math.max(title.length, 40)));
}

function record(passed, message, path) {
  results.push({ passed, section: currentSection, message, path });
  const tag = passed ? 'PASS' : 'FAIL';
  const where = path ? `  →  ${path}` : '';
  console.log(`  [${tag}] ${message}${where}`);
}

const pass = (msg, path) => record(true, msg, path);
const fail = (msg, path) => record(false, msg, path);

// ===================================================================
// TIỆN ÍCH
// ===================================================================

const ROOT = resolve(process.argv[2] ?? join(fileURLToPath(new URL('.', import.meta.url)), '..'));

function readTextOrNull(absPath) {
  try {
    const buf = readFileSync(absPath);
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return null;
  }
}

/** Duyệt đệ quy, bỏ qua SKIP_DIRS. Trả về danh sách đường dẫn tương đối. */
function walk(dir, acc = [], depth = 0) {
  if (depth > 25) return acc;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      acc.push({ rel: relative(ROOT, abs), abs, kind: 'symlink', name: entry.name });
      continue;
    }
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(abs, acc, depth + 1);
    } else if (entry.isFile()) {
      acc.push({ rel: relative(ROOT, abs), abs, kind: 'file', name: entry.name });
    }
  }
  return acc;
}

/** Đường dẫn con có nằm trong ROOT không (chặn ../ và symlink thoát ra). */
function isInsideRoot(absPath) {
  const rel = relative(ROOT, absPath);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

// ===================================================================
// BẮT ĐẦU
// ===================================================================

console.log('═'.repeat(64));
console.log('  KIỂM TRA CẤU TRÚC BÀI NỘP — SPD Challenge 2026');
console.log('═'.repeat(64));
console.log(`Thư mục gốc: ${ROOT}`);

if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) {
  console.error(`\nLỖI: không tìm thấy thư mục gốc: ${ROOT}`);
  process.exit(1);
}

// -------------------------------------------------------------------
// 1. Tên thư mục gốc
// -------------------------------------------------------------------
section('1. Tên thư mục gốc');

const rootName = basename(ROOT);
console.log(`  Tên đang kiểm tra: "${rootName}"`);

if (/\s/.test(rootName)) {
  fail('Tên thư mục gốc chứa khoảng trắng', rootName);
} else {
  pass('Tên thư mục gốc không chứa khoảng trắng');
}

if (/^[A-Za-z0-9._-]+$/.test(rootName)) {
  pass('Tên thư mục gốc chỉ gồm ký tự hợp lệ (chữ, số, dấu chấm, gạch ngang, gạch dưới)');
} else {
  fail('Tên thư mục gốc chứa ký tự không hợp lệ', rootName);
}

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]*_[A-Za-z0-9][A-Za-z0-9.-]*$/;
if (NAME_PATTERN.test(rootName)) {
  pass('Tên thư mục gốc đúng mẫu [TênĐội]_[TênĐăngNhập]');
} else {
  fail('Tên thư mục gốc KHÔNG đúng mẫu [TênĐội]_[TênĐăngNhập]', rootName);
}

// -------------------------------------------------------------------
// 2. Bốn tệp bắt buộc
// -------------------------------------------------------------------
section('2. Bốn tệp bắt buộc tại thư mục gốc');

for (const name of REQUIRED_FILES) {
  const abs = join(ROOT, name);
  if (!existsSync(abs)) {
    fail(`Thiếu tệp bắt buộc: ${name}`, abs);
    continue;
  }
  const st = lstatSync(abs);
  if (st.isSymbolicLink()) {
    fail(`${name} là symbolic link, phải là tệp thông thường`, abs);
    continue;
  }
  if (!st.isFile()) {
    fail(`${name} không phải tệp thông thường`, abs);
    continue;
  }
  const text = readTextOrNull(abs);
  if (text === null) {
    fail(`${name} không đọc được dưới dạng UTF-8`, abs);
  } else if (text.trim().length === 0) {
    fail(`${name} rỗng (không có ký tự khác khoảng trắng)`, abs);
  } else {
    pass(`${name} tồn tại, là tệp thông thường, không rỗng (${st.size} B)`);
  }
}

// -------------------------------------------------------------------
// 3. submission.json — JSON hợp lệ, đủ trường, schema_version đúng
// -------------------------------------------------------------------
section('3. submission.json');

const submissionPath = join(ROOT, 'submission.json');
let submission = null;

const submissionText = readTextOrNull(submissionPath);
if (submissionText === null) {
  fail('Không đọc được submission.json', submissionPath);
} else {
  try {
    submission = JSON.parse(submissionText);
    pass('submission.json là JSON hợp lệ');
  } catch (err) {
    fail(`submission.json không parse được: ${err.message}`, submissionPath);
  }
}

if (submission !== null) {
  if (typeof submission === 'object' && !Array.isArray(submission)) {
    pass('Giá trị cấp cao nhất là một JSON object');
  } else {
    fail('Giá trị cấp cao nhất KHÔNG phải JSON object', submissionPath);
    submission = null;
  }
}

if (submission) {
  for (const field of REQUIRED_JSON_FIELDS) {
    if (!(field in submission)) {
      fail(`Thiếu trường bắt buộc: "${field}"`, submissionPath);
    } else if (submission[field] === null || submission[field] === '') {
      fail(`Trường "${field}" tồn tại nhưng rỗng`, submissionPath);
    } else {
      pass(`Có trường "${field}"`);
    }
  }

  if ('schema_version' in submission) {
    const v = String(submission.schema_version);
    if (v === EXPECTED_SCHEMA_VERSION) {
      pass(`schema_version đúng: "${v}"`);
    } else {
      fail(`schema_version là "${v}", mong đợi "${EXPECTED_SCHEMA_VERSION}"`, submissionPath);
    }
  }

  for (const field of ['source_paths', 'dependency_files']) {
    if (field in submission && !Array.isArray(submission[field])) {
      fail(`Trường "${field}" phải là một mảng`, submissionPath);
    }
  }
}

// -------------------------------------------------------------------
// 4. Tên thư mục gốc khớp team_name + "_" + login
// -------------------------------------------------------------------
section('4. Tên thư mục gốc khớp submission.json');

if (!submission || !submission.team_name || !submission.login) {
  fail('Không kiểm tra được vì submission.json thiếu team_name hoặc login', submissionPath);
} else {
  const expected = `${submission.team_name}_${submission.login}`;
  if (expected === rootName) {
    pass(`Khớp chính xác: "${expected}"`);
  } else {
    fail(`Thư mục gốc là "${rootName}" nhưng submission.json ghép ra "${expected}"`, ROOT);
  }
}

// -------------------------------------------------------------------
// 5. source_paths và dependency_files
// -------------------------------------------------------------------
section('5. Đường dẫn trong source_paths và dependency_files');

function checkDeclaredPath(field, value, mustBeDirWithFiles) {
  const label = `${field}[${JSON.stringify(value)}]`;

  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label}: không phải chuỗi hợp lệ`);
    return;
  }
  if (isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)) {
    fail(`${label}: là đường dẫn tuyệt đối, phải dùng đường dẫn tương đối`, value);
    return;
  }
  if (value.split(/[\\/]/).includes('..')) {
    fail(`${label}: đi lên thư mục cha bằng ".."`, value);
    return;
  }

  const abs = resolve(ROOT, value);
  if (!isInsideRoot(abs)) {
    fail(`${label}: nằm ngoài thư mục gốc`, abs);
    return;
  }
  if (!existsSync(abs)) {
    fail(`${label}: không tồn tại`, abs);
    return;
  }
  if (lstatSync(abs).isSymbolicLink()) {
    fail(`${label}: là symbolic link`, abs);
    return;
  }

  const st = statSync(abs);
  if (mustBeDirWithFiles) {
    if (!st.isDirectory()) {
      fail(`${label}: phải là thư mục, nhưng đây là tệp`, abs);
      return;
    }
    const files = walk(abs).filter(
      (e) => e.kind === 'file' && !['.gitkeep', '.keep', '.DS_Store'].includes(e.name)
    );
    if (files.length === 0) {
      fail(`${label}: là thư mục rỗng, không có tệp mã nguồn nào`, abs);
    } else {
      pass(`${label}: thư mục hợp lệ, chứa ${files.length} tệp`);
    }
  } else {
    if (!st.isFile()) {
      fail(`${label}: phải là tệp, nhưng đây là thư mục`, abs);
    } else if (st.size === 0) {
      fail(`${label}: tệp rỗng`, abs);
    } else {
      pass(`${label}: tệp hợp lệ (${st.size} B)`);
    }
  }
}

if (!submission) {
  fail('Không kiểm tra được vì submission.json không hợp lệ', submissionPath);
} else {
  const sourcePaths = Array.isArray(submission.source_paths) ? submission.source_paths : [];
  const depFiles = Array.isArray(submission.dependency_files) ? submission.dependency_files : [];

  if (sourcePaths.length === 0) {
    fail('source_paths rỗng hoặc không phải mảng', submissionPath);
  }
  if (depFiles.length === 0) {
    fail('dependency_files rỗng hoặc không phải mảng', submissionPath);
  }
  for (const p of sourcePaths) checkDeclaredPath('source_paths', p, true);
  for (const p of depFiles) checkDeclaredPath('dependency_files', p, false);
}

// -------------------------------------------------------------------
// 6. README.md đủ bảy mục
// -------------------------------------------------------------------
section('6. Bảy mục bắt buộc trong README.md');

const readmeText = readTextOrNull(join(ROOT, 'README.md'));
if (readmeText === null) {
  fail('Không đọc được README.md', join(ROOT, 'README.md'));
} else {
  const haystack = readmeText.toLowerCase();
  for (const s of README_SECTIONS) {
    const hit = s.keywords.find((k) => haystack.includes(k.toLowerCase()));
    if (hit) {
      pass(`Mục ${s.id} — ${s.name}  (khớp từ khoá "${hit}")`);
    } else {
      fail(`Mục ${s.id} — ${s.name}  (không tìm thấy từ khoá nào: ${s.keywords.join(', ')})`, join(ROOT, 'README.md'));
    }
  }
}

// -------------------------------------------------------------------
// 7. chatlog.md
// -------------------------------------------------------------------
section('7. chatlog.md');

const chatlogPath = join(ROOT, 'chatlog.md');
if (!existsSync(chatlogPath)) {
  fail('Không tìm thấy chatlog.md', chatlogPath);
} else {
  let raw;
  try {
    raw = readFileSync(chatlogPath);
  } catch (err) {
    raw = null;
    fail(`Không đọc được chatlog.md: ${err.message}`, chatlogPath);
  }
  if (raw) {
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(raw);
      pass('chatlog.md là UTF-8 hợp lệ');
      if (text.trim().length === 0) {
        fail('chatlog.md rỗng', chatlogPath);
      } else {
        pass(`chatlog.md không rỗng (${raw.length} B, ${text.split('\n').length} dòng)`);
      }
    } catch {
      fail('chatlog.md KHÔNG phải UTF-8 hợp lệ', chatlogPath);
    }
  }
}

// -------------------------------------------------------------------
// 8. .gitignore
// -------------------------------------------------------------------
section('8. Nội dung .gitignore');

const gitignorePath = join(ROOT, '.gitignore');
const gitignoreText = readTextOrNull(gitignorePath);
if (gitignoreText === null) {
  fail('Không đọc được .gitignore', gitignorePath);
} else {
  const lines = gitignoreText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#') && !l.startsWith('!'));

  for (const group of GITIGNORE_GROUPS) {
    const hit = group.patterns.find((p) => lines.some((l) => l.includes(p)));
    if (hit) {
      pass(`Đã loại trừ ${group.name}  (quy tắc chứa "${hit}")`);
    } else {
      fail(`CHƯA loại trừ ${group.name}  (cần một trong: ${group.patterns.join(', ')})`, gitignorePath);
    }
  }
}

// -------------------------------------------------------------------
// 9. Quét tệp nhạy cảm
// -------------------------------------------------------------------
section('9. Quét tệp nhạy cảm trong toàn bộ thư mục');

const allEntries = walk(ROOT);
const leaks = [];

for (const entry of allEntries) {
  if (ENV_EXAMPLE_RE.test(entry.name)) continue;
  for (const rule of SECRET_RULES) {
    if (rule.test(entry.name)) {
      leaks.push({ ...entry, label: rule.label });
      break;
    }
  }
}

console.log(`  Đã quét ${allEntries.length} tệp (bỏ qua .git và thư mục phụ thuộc).`);

if (leaks.length === 0) {
  pass('Không tìm thấy tệp môi trường thật, tệp khoá, chứng chỉ hay thông tin xác thực');
} else {
  for (const leak of leaks) {
    fail(`Phát hiện ${leak.label}`, leak.rel);
  }
}

const symlinks = allEntries.filter((e) => e.kind === 'symlink');
if (symlinks.length > 0) {
  for (const s of symlinks) {
    fail('Symbolic link trong bài nộp (bộ chấm có thể từ chối)', s.rel);
  }
} else {
  pass('Không có symbolic link');
}

// ===================================================================
// TỔNG KẾT
// ===================================================================

const failed = results.filter((r) => !r.passed);
const passed = results.length - failed.length;

console.log(`\n${'═'.repeat(64)}`);
console.log('  TỔNG KẾT');
console.log('═'.repeat(64));
console.log(`  Tổng số điều kiện kiểm tra : ${results.length}`);
console.log(`  Đạt (PASS)                 : ${passed}`);
console.log(`  Không đạt (FAIL)           : ${failed.length}`);

if (failed.length > 0) {
  console.log('\n  Danh sách điều kiện KHÔNG ĐẠT:');
  for (const f of failed) {
    console.log(`   • [${f.section}] ${f.message}`);
    if (f.path) console.log(`       → ${f.path}`);
  }
  console.log('\n  KẾT LUẬN: FAIL — bài nộp chưa đạt yêu cầu cấu trúc.');
  console.log('═'.repeat(64));
  process.exit(1);
}

console.log('\n  KẾT LUẬN: PASS — bài nộp đạt toàn bộ điều kiện cấu trúc.');
console.log('═'.repeat(64));
process.exit(0);
