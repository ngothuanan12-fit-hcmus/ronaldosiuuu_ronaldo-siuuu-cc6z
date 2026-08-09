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

  return `<div class="page page--narrow">
    <div class="page__head">
      <div>
        <h1>${isEdit ? 'Sửa dự án' : 'Tạo dự án mới'}</h1>
        <p class="page__sub">Khai báo đề bài và các điều kiện mà đội hình bắt buộc phải thoả mãn.</p>
      </div>
      <a class="btn btn--ghost btn--sm" href="${isEdit ? `#/du-an/${encodeURIComponent(project.id)}` : '#/'}">Huỷ</a>
    </div>

    <form id="project-form" novalidate>
      <section class="panel">
        <div class="panel__head"><h2>Thông tin đề bài</h2></div>
        <div class="panel__body">
          <label class="field">
            <span class="field__label">Tên đề bài <em>*</em></span>
            <input type="text" id="f-name" class="input" required maxlength="120"
              placeholder="Ví dụ: Nền tảng đặt lịch khám bệnh" />
          </label>
          <label class="field">
            <span class="field__label">Mô tả ngắn</span>
            <textarea id="f-desc" class="input" rows="3"
              placeholder="Sản phẩm làm gì, cho ai, có gì đặc biệt về mặt kỹ thuật"></textarea>
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="panel__head">
          <h2>Năng lực bắt buộc</h2>
          <span class="badge" id="f-skill-count">0</span>
        </div>
        <div class="panel__body">
          <p class="hint">Đội hình hợp lệ phải phủ <strong>100%</strong> các năng lực này. Thiếu một mục là loại.</p>
          <ul class="req-list" id="f-req-list"></ul>
          <div class="req-add">
            <select id="f-add-skill" class="input input--sm" aria-label="Chọn kỹ năng">
              ${skills.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
            </select>
            <select id="f-add-level" class="input input--sm" aria-label="Mức tối thiểu">
              <option value="1">≥ 1 · Biết cơ bản</option>
              <option value="2" selected>≥ 2 · Thành thạo</option>
              <option value="3">≥ 3 · Chuyên sâu</option>
            </select>
            <button type="button" class="btn btn--sm" id="f-add-btn">Thêm</button>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__head"><h2>Quân số và ràng buộc</h2></div>
        <div class="panel__body">
          <div class="row">
            <label class="row__item">
              <span class="field__label">Tối thiểu</span>
              <input type="number" id="f-min" class="input input--sm" min="1" max="8" />
            </label>
            <label class="row__item">
              <span class="field__label">Tối đa</span>
              <input type="number" id="f-max" class="input input--sm" min="1" max="8" />
            </label>
          </div>
          <div class="row">
            <label class="row__item">
              <span class="field__label">Tổng giờ cam kết tối thiểu</span>
              <input type="number" id="f-hours" class="input input--sm" min="0" step="5" />
            </label>
            <label class="row__item">
              <span class="field__label">Số người trình bày tối thiểu</span>
              <input type="number" id="f-present" class="input input--sm" min="0" max="8" />
            </label>
          </div>
          <p class="hint">Quân số tối đa bị giới hạn ở 8 người để không gian tìm kiếm luôn hữu hạn.</p>
        </div>
      </section>

      <div id="f-errors" hidden></div>

      <div class="form-actions">
        <button type="submit" class="btn" id="f-submit">${isEdit ? 'Lưu thay đổi' : 'Tạo dự án'}</button>
        <a class="btn btn--ghost" href="${isEdit ? `#/du-an/${encodeURIComponent(project.id)}` : '#/'}">Huỷ</a>
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
            <span class="req-item__name">${esc(r.skill)}</span>
            <span class="req-item__lvl">≥ ${r.minLevel}</span>
            <button type="button" class="btn btn--danger" data-remove="${i}"
              aria-label="Bỏ ${esc(r.skill)}">✕</button>
          </li>`
        )
        .join('')
    : '<li class="hint">Chưa có năng lực nào. Không khai báo thì mọi đội hình đều được coi là phủ đủ.</li>';
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
