/**
 * SquadFit — ứng dụng một trang, điều hướng bằng hash.
 *
 * KHÔNG chứa logic nghiệp vụ. Mọi tính toán do backend làm:
 *   /api/projects   quản lý dự án (có trạng thái trên máy chủ)
 *   /api/solve      tính đội hình (không trạng thái, gọi lại mỗi lần thay đổi)
 *
 * Tuyến đường:
 *   #/                bảng điều khiển — danh sách dự án
 *   #/du-an/moi       tạo dự án mới
 *   #/du-an/:id       không gian làm việc của một dự án
 *   #/du-an/:id/sua   sửa thông tin dự án
 */

import { renderDashboard, bindDashboard } from './views/dashboard.js';
import { renderProjectForm, bindProjectForm } from './views/project-form.js';
import { renderWorkspace, bindWorkspace } from './views/workspace.js';
import { api, esc } from './lib/api.js';
import { store } from './lib/store.js';

let view = document.getElementById('view');

/**
 * Trả về một phần tử `#view` sạch, không còn trình lắng nghe nào của lần render trước.
 *
 * Vì sao cần: `#view` là phần tử cố định, chuyển trang chỉ ghi đè `innerHTML`. Các hàm `bind*`
 * gắn sự kiện lên CHÍNH phần tử này (uỷ quyền sự kiện cho con), nên mỗi lần render lại là thêm
 * một trình lắng nghe nữa mà không cái nào bị gỡ. Hậu quả: một cú nhấp "Xoá" chạy N lần — hộp
 * xác nhận bật N lần rồi N yêu cầu DELETE cùng bay đi, cái đầu được 200, các cái sau 404 và báo
 * "Không xoá được" dù dự án đã bị xoá thật.
 *
 * Thay nguyên phần tử bằng một bản sao rỗng là cách rẻ nhất để bỏ sạch trình lắng nghe: bản sao
 * giữ nguyên thuộc tính (id, class, aria-live) nhưng không mang theo sự kiện nào.
 */
function resetView() {
  const fresh = view.cloneNode(false);
  view.replaceWith(fresh);
  view = fresh;
  return fresh;
}

/* ══════════════════ Điều hướng ══════════════════ */

const ROUTES = [
  { pattern: /^\/?$/, view: 'dashboard' },
  { pattern: /^\/du-an\/moi$/, view: 'create' },
  { pattern: /^\/du-an\/([^/]+)\/sua$/, view: 'edit', param: 'id' },
  { pattern: /^\/du-an\/([^/]+)$/, view: 'workspace', param: 'id' },
];

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  for (const route of ROUTES) {
    const m = route.pattern.exec(raw);
    if (m) return { view: route.view, id: route.param ? decodeURIComponent(m[1]) : null };
  }
  return { view: 'notfound', id: null };
}

export function go(path) {
  location.hash = path;
}

function showError(message, hint) {
  view.innerHTML = `<div class="page">
    <div class="alert alert--bad">
      <strong>${esc(message)}</strong>
      ${hint ? `<br />${esc(hint)}` : ''}
    </div>
    <p><a class="btn btn--ghost btn--sm" href="#/">← Về bảng điều khiển</a></p>
  </div>`;
}

const APPBAR_TITLES = {
  dashboard: { eyebrow: 'Tổng quan', heading: 'Dự án của bạn' },
  create: { eyebrow: 'Bước 1', heading: 'Tạo dự án mới' },
  edit: { eyebrow: 'Chỉnh sửa', heading: 'Sửa yêu cầu dự án' },
  workspace: { eyebrow: 'Không gian làm việc', heading: 'Ghép đội' },
  notfound: { eyebrow: 'Lỗi', heading: 'Không tìm thấy trang' },
};

/** Cập nhật header theo trang đang mở. */
function setAppbar(viewName, status) {
  const t = APPBAR_TITLES[viewName] ?? APPBAR_TITLES.dashboard;
  document.getElementById('appbar-eyebrow').textContent = t.eyebrow;
  document.getElementById('appbar-heading').textContent = t.heading;
  document.getElementById('appbar-status').textContent = status ?? '—';
}

/** Đánh dấu mục điều hướng đang mở. 'edit' và 'workspace' đều thuộc nhóm Dự án. */
function markNav(viewName) {
  const group = viewName === 'create' ? 'create' : 'dashboard';
  for (const el of document.querySelectorAll('[data-nav]')) {
    const active = el.dataset.nav === group;
    el.classList.toggle('nav-item--active', active);
    if (el.tagName === 'A') {
      if (active) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    }
  }
}

async function render() {
  const { view: name, id } = parseHash();
  markNav(name);
  setAppbar(name);
  resetView();
  view.innerHTML = '<p class="empty">Đang tải…</p>';

  try {
    if (name === 'dashboard') {
      const { projects } = await api('/api/projects');
      setAppbar(name, projects.length === 0 ? 'chưa có dự án' : `${projects.length} dự án`);
      view.innerHTML = renderDashboard(projects);
      bindDashboard(view, render);
      return;
    }

    if (name === 'create' || name === 'edit') {
      const project = name === 'edit' ? (await api(`/api/projects/${encodeURIComponent(id)}`)).project : null;
      view.innerHTML = renderProjectForm({ project, skills: store.skills });
      bindProjectForm(view, { project });
      return;
    }

    if (name === 'workspace') {
      const { project } = await api(`/api/projects/${encodeURIComponent(id)}`);
      setAppbar(name, project.name);
      view.innerHTML = renderWorkspace(project, store.candidates);
      bindWorkspace(view, project, store.candidates);
      return;
    }

    showError('Không có trang này.', location.hash);
  } catch (err) {
    showError('Không tải được trang.', err.message);
  }
}

/* ══════════════════ Khởi động ══════════════════ */

async function init() {
  window.addEventListener('hashchange', render);

  try {
    const pool = await api('/api/candidates');
    store.candidates = pool.candidates;
    store.skills = pool.skills;
    store.levels = pool.levels;
    document.getElementById('engine-note').textContent =
      `Thuật toán chạy trên máy chủ · ${pool.total} hồ sơ · ${pool.skills.length} kỹ năng`;
  } catch (err) {
    showError('Không kết nối được máy chủ.', `${err.message} — kiểm tra đã chạy "npm start" chưa.`);
    return;
  }

  await render();
}

init();
