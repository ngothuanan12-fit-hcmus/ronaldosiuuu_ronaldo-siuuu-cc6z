/**
 * Không gian làm việc của một dự án.
 *
 * Phiên 1: khối tóm tắt · danh sách ứng viên · kết quả kèm báo cáo giải thích.
 * Phiên 2 sẽ tách thành các tab và thêm trang chốt đội hình.
 *
 * Cập nhật động: mọi thay đổi đều gọi lại POST /api/solve và vẽ lại toàn bộ
 * khối kết quả. Không cache, nên kết quả cũ đã hết hợp lệ không thể sót lại.
 * Thay đổi về khả dụng / bắt buộc / loại trừ được lưu lên máy chủ bằng PATCH.
 */

import { api, esc, debounce } from '../lib/api.js';

const s = {
  project: null,
  candidates: [],
  disabled: new Set(),
  mustInclude: new Set(),
  mustExclude: new Set(),
  filterText: '',
  filterSkill: '',
  activePlan: 0,
  lastResult: null,
  requestId: 0,
};

export function renderWorkspace(project, candidates) {
  s.project = project;
  s.candidates = candidates;
  s.disabled = new Set(project.disabledCandidates ?? []);
  s.mustInclude = new Set(project.constraints.mustInclude ?? []);
  s.mustExclude = new Set(project.constraints.mustExclude ?? []);
  s.activePlan = 0;
  s.lastResult = null;

  const skills = project.requiredSkills.length
    ? project.requiredSkills.map((r) => `<span class="chip chip--req">${esc(r.skill)} ≥${r.minLevel}</span>`).join('')
    : '<span class="chip">chưa khai báo năng lực bắt buộc</span>';

  const skillOptions = [...new Set(candidates.flatMap((c) => c.skills.map((x) => x.skill)))].sort();

  return `<div class="page">
    <div class="page__head">
      <div>
        <p class="crumbs"><a href="#/">Dự án</a> <span>/</span> ${esc(project.name)}</p>
        <h1>${esc(project.name)}</h1>
        ${project.description ? `<p class="page__sub">${esc(project.description)}</p>` : ''}
        <div class="cand__skills" style="margin-top:.5rem">${skills}</div>
        <div class="card__meta">
          <span>${project.teamSize.min}–${project.teamSize.max} người</span>
          <span>≥ ${project.constraints.minTotalHours}h/tuần</span>
          <span>≥ ${project.constraints.minPresenters} người trình bày</span>
        </div>
      </div>
      <div class="card__actions">
        <a class="btn btn--ghost btn--sm" href="#/du-an/${encodeURIComponent(project.id)}/sua">Sửa yêu cầu</a>
      </div>
    </div>

    <div class="split">
      <section class="panel">
        <div class="panel__head">
          <h2>Kho ứng viên</h2>
          <span class="badge" id="pool-count">—</span>
        </div>
        <div class="panel__body panel__body--tight">
          <div class="filters">
            <input type="search" id="search" class="input input--sm" placeholder="Tìm theo tên…"
              aria-label="Tìm ứng viên theo tên" />
            <select id="filter-skill" class="input input--sm" aria-label="Lọc theo kỹ năng">
              <option value="">Mọi kỹ năng</option>
              ${skillOptions.map((k) => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}
            </select>
            <button type="button" class="btn btn--sm btn--ghost" id="btn-reset">Bật lại tất cả</button>
          </div>
          <p class="hint">Bỏ tick để tạm loại một người. Nhấn vào tên để đổi giữa
             <em>bắt buộc có</em> → <em>loại trừ</em> → bình thường.</p>
          <ul class="cand-list" id="cand-list"></ul>
          <p class="empty" id="cand-empty" hidden>Không có ứng viên nào khớp bộ lọc.</p>
        </div>
      </section>

      <section class="panel">
        <div class="panel__head">
          <h2>Đội hình đề xuất</h2>
          <span class="badge badge--muted" id="solve-meta">—</span>
        </div>
        <div class="panel__body" id="result-body">
          <p class="empty">Đang tính…</p>
        </div>
      </section>
    </div>
  </div>`;
}

/* ══════════════════ Kho ứng viên ══════════════════ */

function paintCandidates(root) {
  const reqSkills = new Set(s.project.requiredSkills.map((r) => r.skill));
  const text = s.filterText.trim().toLowerCase();

  const shown = s.candidates.filter((c) => {
    if (text && !c.name.toLowerCase().includes(text)) return false;
    if (s.filterSkill && !c.skills.some((x) => x.skill === s.filterSkill)) return false;
    return true;
  });

  const active = s.candidates.filter((c) => !s.disabled.has(c.id)).length;
  root.querySelector('#pool-count').textContent = `${active}/${s.candidates.length} khả dụng`;
  root.querySelector('#cand-empty').hidden = shown.length > 0;

  root.querySelector('#cand-list').innerHTML = shown
    .map((c) => {
      const off = s.disabled.has(c.id);
      const must = s.mustInclude.has(c.id);
      const ban = s.mustExclude.has(c.id);
      const flag = must
        ? '<span class="pill pill--ok">bắt buộc</span>'
        : ban
          ? '<span class="pill pill--bad">loại trừ</span>'
          : '';
      return `<li class="cand${off ? ' cand--off' : ''}${must ? ' cand--picked' : ''}">
        <input type="checkbox" class="cand__toggle" data-toggle="${esc(c.id)}"
          ${off ? '' : 'checked'} aria-label="Khả dụng: ${esc(c.name)}" />
        <div>
          <div class="cand__name">
            <button type="button" class="linklike" data-must="${esc(c.id)}">${esc(c.name)}</button> ${flag}
          </div>
          <div class="cand__meta">Năm ${c.year} · ${esc(c.note)}</div>
          <div class="cand__skills">${c.skills
            .map((x) => `<span class="chip${reqSkills.has(x.skill) ? ' chip--req' : ''}">${esc(x.skill)} ${x.level}</span>`)
            .join('')}</div>
        </div>
        <div class="cand__hours">${c.hoursPerWeek}h</div>
      </li>`;
    })
    .join('');
}

/* ══════════════════ Gọi máy chủ ══════════════════ */

async function solve(root) {
  const id = ++s.requestId;
  root.querySelector('#solve-meta').textContent = 'đang tính…';

  const project = JSON.parse(JSON.stringify(s.project));
  project.constraints.mustInclude = [...s.mustInclude];
  project.constraints.mustExclude = [...s.mustExclude];
  const candidates = s.candidates.map((c) => ({ ...c, available: !s.disabled.has(c.id) }));

  try {
    const result = await api('/api/solve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ project, candidates }),
    });
    if (id !== s.requestId) return; // phản hồi cũ đến muộn, bỏ qua
    s.lastResult = result;
    if (s.activePlan >= (result.plans?.length ?? 0)) s.activePlan = 0;
    paintResult(root, result);
  } catch (err) {
    if (id !== s.requestId) return;
    s.lastResult = null;
    root.querySelector('#solve-meta').textContent = 'lỗi';
    root.querySelector('#result-body').innerHTML =
      `<div class="alert alert--bad"><strong>Không tính được đội hình.</strong><br />${esc(err.message)}</div>`;
  }
}

/** Lưu trạng thái khả dụng / bắt buộc / loại trừ lên máy chủ. */
const persist = debounce(async () => {
  try {
    await api(`/api/projects/${encodeURIComponent(s.project.id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        project: {
          disabledCandidates: [...s.disabled],
          constraints: {
            ...s.project.constraints,
            mustInclude: [...s.mustInclude],
            mustExclude: [...s.mustExclude],
          },
        },
      }),
    });
  } catch {
    // Lưu hỏng không được phép làm hỏng phiên làm việc; kết quả trên màn hình
    // vẫn đúng với dữ liệu vừa gửi đi.
  }
}, 400);

/* ══════════════════ Kết quả ══════════════════ */

function paintResult(root, result) {
  const m = result.meta;
  root.querySelector('#solve-meta').textContent =
    `${m.poolSize} ứng viên · ${m.combinationsChecked.toLocaleString('vi-VN')} tổ hợp · ${m.elapsedMs}ms`;

  const warnings = (result.warnings ?? []).map((w) => `<div class="alert alert--warn">${esc(w)}</div>`).join('');
  root.querySelector('#result-body').innerHTML = result.ok
    ? warnings + plansHtml(result)
    : warnings + diagnosisHtml(result.diagnosis);
}

function plansHtml(result) {
  const plans = result.plans;
  const plan = plans[s.activePlan] ?? plans[0];

  const tabs = plans
    .map(
      (p, i) => `<button type="button" class="tab" data-plan="${i}" role="tab"
        aria-selected="${i === s.activePlan}">Phương án #${p.rank} · <b>${p.score}</b></button>`
    )
    .join('');

  return `
    <div class="tabs" role="tablist">${tabs}</div>
    <div class="summary">
      <span class="stat"><b>${plan.members.length}</b> thành viên</span>
      <span class="stat"><b>${plan.totalHours}</b> giờ/tuần</span>
      <span class="stat"><b>${plan.presenters}</b> trình bày được</span>
      <span class="stat"><b>${result.meta.validPlans.toLocaleString('vi-VN')}</b> đội hình hợp lệ</span>
    </div>
    ${coverageHtml(plan)}
    ${membersHtml(plan)}
    ${whyHtml(plan, result)}`;
}

function coverageHtml(plan) {
  const rows = plan.assignments
    .map(
      (a) => `<tr>
        <td><span class="pill pill--ok">đạt</span></td>
        <td>${esc(a.skill)} <span class="req-item__lvl">≥ ${a.minLevel}</span></td>
        <td>${esc(a.primary.name)} <span class="req-item__lvl">mức ${a.primary.level}</span>
          ${a.primary.matchesPreferredRole ? '<span class="pill pill--ok">đúng vai trò</span>' : ''}</td>
        <td>${
          a.backups.length
            ? a.backups.map((b) => `${esc(b.name)} (${b.level})`).join(', ')
            : '<span class="pill pill--warn">không có dự phòng</span>'
        }</td>
      </tr>`
    )
    .join('');

  return `<div class="block">
    <h3 class="block__title">Yêu cầu đã được đáp ứng</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Trạng thái</th><th>Năng lực</th><th>Phụ trách chính</th><th>Dự phòng</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

function membersHtml(plan) {
  const cards = plan.members
    .map(
      (m) => `<div class="member${m.assignedSkills.length ? '' : ' member--idle'}">
        <div class="member__name">${esc(m.name)}</div>
        <div class="member__meta">Năm ${m.year} · ${m.hoursPerWeek}h/tuần</div>
        <div class="cand__skills">${
          m.assignedSkills.length
            ? m.assignedSkills.map((x) => `<span class="chip chip--req">${esc(x)}</span>`).join('')
            : '<span class="chip">dự phòng, không phụ trách chính</span>'
        }</div>
      </div>`
    )
    .join('');

  return `<div class="block">
    <h3 class="block__title">Phân bổ vai trò</h3>
    <div class="member-grid">${cards}</div>
  </div>`;
}

function whyHtml(plan, result) {
  const rows = plan.breakdown
    .map(
      (c) => `<tr>
        <td>${esc(c.label)}</td>
        <td style="width:34%"><span class="bar"><i style="width:${Math.round(c.ratio * 100)}%"></i></span></td>
        <td class="num">${c.points} / ${c.weight}</td>
      </tr>`
    )
    .join('');

  const compare =
    s.activePlan !== 0
      ? '<p class="hint">Bảng so sánh chỉ hiện cho phương án đứng đầu. Chọn lại tab #1 để xem.</p>'
      : result.comparisons?.length
        ? `<ul class="why">${result.comparisons.map((c) => `<li>${esc(c.text)}</li>`).join('')}</ul>`
        : '<p class="hint">Chỉ có một phương án hợp lệ, không có gì để so sánh.</p>';

  return `<div class="block">
    <h3 class="block__title">Vì sao phương án này tối ưu</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Tiêu chí</th><th>Mức đạt</th><th class="num">Điểm</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th>Tổng</th><th></th><th class="num">${plan.score} / 100</th></tr></tfoot>
    </table></div>
    ${compare}
  </div>`;
}

function diagnosisHtml(d) {
  if (!d) return '<div class="alert alert--bad"><strong>Không có phương án nào.</strong></div>';

  const list = (title, items) =>
    items?.length
      ? `<div class="block"><h3 class="block__title">${title}</h3>
          <ul class="why">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`
      : '';

  const near = d.nearMiss
    ? `<div class="block"><h3 class="block__title">Tổ hợp gần nhất</h3>
        <p class="hint">${esc(d.nearMiss.members.map((m) => m.name).join(', '))} — tổng ${d.nearMiss.totalHours}h. Còn thiếu:</p>
        <ul class="why">${d.nearMiss.unmet.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></div>`
    : '';

  const hint = d.onlyUnavailablePeopleCanCover
    ? 'Gợi ý: bật lại khả dụng cho những người đang bị tắt ở cột bên trái.'
    : 'Gợi ý: hạ mức yêu cầu, nới quân số, hoặc giảm tổng giờ cam kết tối thiểu.';

  return `<div class="alert alert--bad">
      <strong>Không có đội hình nào thoả mãn toàn bộ điều kiện.</strong><br />${esc(d.summary)}
    </div>
    ${list('Năng lực không đáp ứng được', d.uncoveredSkills?.map((u) => u.message))}
    ${list('Ràng buộc không thoả mãn', d.constraintIssues?.map((i) => i.message))}
    ${near}
    <p class="hint">${esc(hint)}</p>`;
}

/* ══════════════════ Sự kiện ══════════════════ */

export function bindWorkspace(root) {
  paintCandidates(root);
  solve(root);

  root.querySelector('#search').addEventListener('input', (e) => {
    s.filterText = e.target.value;
    paintCandidates(root);
  });

  root.querySelector('#filter-skill').addEventListener('change', (e) => {
    s.filterSkill = e.target.value;
    paintCandidates(root);
  });

  root.querySelector('#btn-reset').addEventListener('click', () => {
    s.disabled.clear();
    paintCandidates(root);
    solve(root);
    persist();
  });

  root.querySelector('#cand-list').addEventListener('change', (e) => {
    const box = e.target.closest('[data-toggle]');
    if (!box) return;
    if (box.checked) s.disabled.delete(box.dataset.toggle);
    else s.disabled.add(box.dataset.toggle);
    paintCandidates(root);
    solve(root);
    persist();
  });

  root.querySelector('#cand-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-must]');
    if (!btn) return;
    const id = btn.dataset.must;
    if (s.mustInclude.has(id)) {
      s.mustInclude.delete(id);
      s.mustExclude.add(id);
    } else if (s.mustExclude.has(id)) {
      s.mustExclude.delete(id);
    } else {
      s.mustInclude.add(id);
    }
    paintCandidates(root);
    solve(root);
    persist();
  });

  root.querySelector('#result-body').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-plan]');
    if (!tab || !s.lastResult) return;
    s.activePlan = Number(tab.dataset.plan);
    paintResult(root, s.lastResult);
  });
}
