/** Form tạo và sửa dự án. Kiểm tra hợp lệ tại chỗ trước khi gửi lên máy chủ. */

import { api, esc } from '../lib/api.js';

/** Bản nháp đang chỉnh, tách khỏi dữ liệu gốc để bấm Huỷ là mất sạch. */
let draft = null;

function blank() {
  return {
    name: '',
    description: '',
    requiredSkills: [],
    teamSize: { min: 3, max: 5 },
    constraints: { minTotalHours: 0, minPresenters: 0, mustInclude: [], mustExclude: [] },
    disabledCandidates: [],
  };
}

export function renderProjectForm({ project, skills }) {
  const isEdit = Boolean(project);
  draft = project ? JSON.parse(JSON.stringify(project)) : blank();

  const backHref = isEdit ? `#/du-an/${encodeURIComponent(project.id)}` : '#/';
  const icon = (paths) =>
    `<svg class="card-icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;

  return `<div class="page page--form">
    <a class="backlink" href="${backHref}">
      <svg class="backlink__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      ${isEdit ? 'Quay lại dự án' : 'Quay lại danh sách'}
    </a>
    <div>
      <h2 class="form-title">${isEdit ? 'Sửa dự án' : 'Tạo dự án mới'}</h2>
      <p class="page__sub">Thiết lập thông tin và yêu cầu nhân sự cho dự án hackathon.</p>
    </div>

    <form id="project-form" novalidate>
      <section class="fcard fcard--info">
        <h3 class="fcard__head">
          ${icon('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>')}
          Thông tin đề bài
        </h3>
        <div class="fcard__body">
          <label class="fgroup">
            <span class="flabel">Tên dự án <em>*</em></span>
            <input type="text" id="f-name" class="input input--lg" required maxlength="120"
              placeholder="Nhập tên dự án (VD: Nền tảng đặt lịch khám bệnh)" />
          </label>
          <label class="fgroup">
            <span class="flabel">Mô tả chi tiết</span>
            <textarea id="f-desc" class="input input--lg" rows="4"
              placeholder="Mô tả mục tiêu, phạm vi và công nghệ dự kiến sử dụng…"></textarea>
          </label>
        </div>
      </section>

      <section class="fcard fcard--skill">
        <h3 class="fcard__head">
          ${icon('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>')}
          Năng lực bắt buộc
          <span class="badge" id="f-skill-count">0</span>
        </h3>
        <div class="fcard__body">
          <ul class="req-list" id="f-req-list"></ul>
          <div class="req-add">
            <span class="flabel req-add__label">Thêm kỹ năng yêu cầu</span>
            <select id="f-add-skill" class="input" aria-label="Chọn kỹ năng">
              ${skills.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
            </select>
            <select id="f-add-level" class="input" aria-label="Mức tối thiểu">
              <option value="1">Mức 1 · Biết cơ bản</option>
              <option value="2" selected>Mức 2 · Thành thạo</option>
              <option value="3">Mức 3 · Chuyên sâu</option>
            </select>
            <button type="button" class="btn" id="f-add-btn">+ Thêm</button>
          </div>
          <p class="hint">Đội hình hợp lệ phải phủ <strong>100%</strong> các năng lực này. Thiếu một mục là loại.</p>
        </div>
      </section>

      <section class="fcard fcard--team">
        <h3 class="fcard__head">
          ${icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>')}
          Quân số và ràng buộc
        </h3>
        <div class="fcard__body">
          <div class="fgrid">
            <label class="fgroup">
              <span class="flabel">Số lượng tối thiểu</span>
              <input type="number" id="f-min" class="input input--lg" min="1" max="8" placeholder="VD: 3" />
            </label>
            <label class="fgroup">
              <span class="flabel">Số lượng tối đa</span>
              <input type="number" id="f-max" class="input input--lg" min="1" max="8" placeholder="VD: 5" />
            </label>
            <label class="fgroup">
              <span class="flabel">Tổng giờ/tuần yêu cầu</span>
              <input type="number" id="f-hours" class="input input--lg" min="0" step="5" placeholder="VD: 40" />
            </label>
            <label class="fgroup">
              <span class="flabel">Số người trình bày</span>
              <input type="number" id="f-present" class="input input--lg" min="0" max="8" placeholder="VD: 1" />
            </label>
          </div>
          <p class="hint">Quân số tối đa bị giới hạn ở 8 người để không gian tìm kiếm luôn hữu hạn.</p>
        </div>
      </section>

      <div id="f-errors" hidden></div>

      <div class="form-actions">
        <a class="btn btn--ghost" href="${backHref}">Huỷ</a>
        <button type="submit" class="btn" id="f-submit">${isEdit ? 'Lưu thay đổi' : 'Tạo dự án'}</button>
      </div>
    </form>
  </div>`;
}

function paintForm(root) {
  root.querySelector('#f-name').value = draft.name;
  root.querySelector('#f-desc').value = draft.description;
  root.querySelector('#f-min').value = draft.teamSize.min;
  root.querySelector('#f-max').value = draft.teamSize.max;
  root.querySelector('#f-hours').value = draft.constraints.minTotalHours;
  root.querySelector('#f-present').value = draft.constraints.minPresenters;
  root.querySelector('#f-skill-count').textContent = String(draft.requiredSkills.length);

  root.querySelector('#f-req-list').innerHTML = draft.requiredSkills.length
    ? draft.requiredSkills
        .map(
          (r, i) => `<li class="req-item">
            <span class="req-item__dot" aria-hidden="true"></span>
            <span class="req-item__name">${esc(r.skill)}</span>
            <span class="req-item__lvl">Mức ${r.minLevel}</span>
            <button type="button" class="btn btn--danger" data-remove="${i}"
              aria-label="Bỏ ${esc(r.skill)}">✕</button>
          </li>`
        )
        .join('')
    : '<li class="req-empty">Chưa có năng lực nào. Không khai báo thì mọi đội hình đều được coi là phủ đủ.</li>';
}

function showErrors(root, list) {
  const box = root.querySelector('#f-errors');
  if (list.length === 0) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.hidden = false;
  box.innerHTML = `<div class="alert alert--bad">
    <strong>Chưa lưu được.</strong>
    <ul>${list.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
  </div>`;
  box.scrollIntoView({ block: 'nearest' });
}

export function bindProjectForm(root, { project }) {
  paintForm(root);

  root.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      draft.requiredSkills.splice(Number(rm.dataset.remove), 1);
      paintForm(root);
    }
  });

  root.querySelector('#f-add-btn').addEventListener('click', () => {
    const skill = root.querySelector('#f-add-skill').value;
    const minLevel = Number(root.querySelector('#f-add-level').value);
    const existing = draft.requiredSkills.find((r) => r.skill === skill);
    if (existing) existing.minLevel = minLevel;
    else draft.requiredSkills.push({ skill, minLevel });
    paintForm(root);
  });

  const bindValue = (sel, apply) => {
    root.querySelector(sel).addEventListener('input', (e) => apply(e.target.value));
  };
  bindValue('#f-name', (v) => (draft.name = v));
  bindValue('#f-desc', (v) => (draft.description = v));
  bindValue('#f-min', (v) => (draft.teamSize.min = Number(v) || 1));
  bindValue('#f-max', (v) => (draft.teamSize.max = Number(v) || 1));
  bindValue('#f-hours', (v) => (draft.constraints.minTotalHours = Number(v) || 0));
  bindValue('#f-present', (v) => (draft.constraints.minPresenters = Number(v) || 0));

  root.querySelector('#project-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Kiểm tra tại chỗ trước, để người dùng không phải chờ vòng gọi máy chủ.
    const local = [];
    if (draft.name.trim() === '') local.push('Dự án phải có tên.');
    if (draft.teamSize.min > draft.teamSize.max) {
      local.push(`Quân số tối thiểu (${draft.teamSize.min}) không được lớn hơn tối đa (${draft.teamSize.max}).`);
    }
    if (draft.teamSize.max > 8) local.push('Quân số tối đa không được vượt quá 8.');
    if (local.length) return showErrors(root, local);

    const btn = root.querySelector('#f-submit');
    btn.disabled = true;
    btn.textContent = 'Đang lưu…';

    try {
      const isEdit = Boolean(project);
      const res = await api(isEdit ? `/api/projects/${encodeURIComponent(project.id)}` : '/api/projects', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ project: draft }),
      });
      location.hash = `/du-an/${encodeURIComponent(res.project.id)}`;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = project ? 'Lưu thay đổi' : 'Tạo dự án';
      showErrors(root, [err.message]);
    }
  });
}
