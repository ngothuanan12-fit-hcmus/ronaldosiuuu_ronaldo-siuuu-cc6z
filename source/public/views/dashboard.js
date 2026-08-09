/** Bảng điều khiển — danh sách dự án. Khởi tạo RỖNG, không có dự án dựng sẵn. */

import { api, esc, shortTime } from '../lib/api.js';

export function renderDashboard(projects) {
  if (projects.length === 0) {
    return `<div class="page">
      <p class="page__sub">Mỗi dự án là một đề bài kèm yêu cầu năng lực và ràng buộc riêng.</p>

      <div class="blank">
        <div class="blank__icon" aria-hidden="true">◇</div>
        <h2>Chưa có dự án nào</h2>
        <p>Tạo dự án đầu tiên để bắt đầu ghép đội. Bạn khai báo năng lực bắt buộc,
           giới hạn quân số và các ràng buộc — SquadFit lo phần còn lại.</p>
        <a class="btn" href="#/du-an/moi">+ Tạo dự án đầu tiên</a>
        <p class="hint">Trong form tạo mới có sẵn vài mẫu dựng sẵn nếu bạn muốn xuất phát nhanh.</p>
      </div>
    </div>`;
  }

  const cards = projects
    .map((p) => {
      const skills = p.requiredSkills.length
        ? p.requiredSkills.map((r) => `<span class="chip chip--req">${esc(r.skill)} ≥${r.minLevel}</span>`).join('')
        : '<span class="chip">chưa khai báo năng lực</span>';
      return `<article class="card">
        <a class="card__main" href="#/du-an/${encodeURIComponent(p.id)}">
          <h2 class="card__title">${esc(p.name)}</h2>
          ${p.description ? `<p class="card__desc">${esc(p.description)}</p>` : ''}
          <div class="cand__skills">${skills}</div>
          <div class="card__meta">
            <span>${p.teamSize.min}–${p.teamSize.max} người</span>
            <span>≥ ${p.constraints.minTotalHours}h/tuần</span>
            ${p.constraints.minPresenters > 0 ? `<span>≥ ${p.constraints.minPresenters} người trình bày</span>` : ''}
            ${p.disabledCandidates?.length ? `<span>${p.disabledCandidates.length} ứng viên đã tắt</span>` : ''}
          </div>
        </a>
        <div class="card__foot">
          <span class="hint">Sửa lần cuối ${esc(shortTime(p.updatedAt))}</span>
          <span class="card__actions">
            <a class="btn btn--ghost btn--sm" href="#/du-an/${encodeURIComponent(p.id)}/sua">Sửa</a>
            <button type="button" class="btn btn--ghost btn--sm btn--warn-text"
              data-delete="${esc(p.id)}" data-name="${esc(p.name)}">Xoá</button>
          </span>
        </div>
      </article>`;
    })
    .join('');

  // Tiêu đề và nút "Dự án mới" đã nằm ở header phía trên, không lặp lại ở đây.
  return `<div class="page">
    <p class="page__sub">${projects.length} dự án. Nhấn vào một dự án để xem đội hình đề xuất.</p>
    <div class="card-grid">${cards}</div>
  </div>`;
}

export function bindDashboard(root, rerender) {
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;

    // Xác nhận trước khi xoá — thao tác này không hoàn tác được.
    if (!confirm(`Xoá dự án "${btn.dataset.name}"? Thao tác này không hoàn tác được.`)) return;

    btn.disabled = true;
    btn.textContent = 'Đang xoá…';
    try {
      await api(`/api/projects/${encodeURIComponent(btn.dataset.delete)}`, { method: 'DELETE' });
      await rerender();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Xoá';
      alert(`Không xoá được: ${err.message}`);
    }
  });
}
