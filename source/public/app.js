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

const view = document.getElementById('view');

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

async function render() {
  const { view: name, id } = parseHash();
  view.innerHTML = '<p class="empty">Đang tải…</p>';

  try {
    if (name === 'dashboard') {
      const { projects } = await api('/api/projects');
      view.innerHTML = renderDashboard(projects);
      bindDashboard(view, render);
      return;
    }

    if (name === 'create' || name === 'edit') {
      const templates = name === 'create' ? (await api('/api/templates')).templates : [];
      const project = name === 'edit' ? (await api(`/api/projects/${encodeURIComponent(id)}`)).project : null;
      view.innerHTML = renderProjectForm({ project, templates, skills: store.skills });
      bindProjectForm(view, { project, templates, skills: store.skills });
      return;
    }

    if (name === 'workspace') {
      const { project } = await api(`/api/projects/${encodeURIComponent(id)}`);
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
  document.getElementById('btn-context').addEventListener('click', (e) => {
    const box = document.getElementById('context');
    box.hidden = !box.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!box.hidden));
  });

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
