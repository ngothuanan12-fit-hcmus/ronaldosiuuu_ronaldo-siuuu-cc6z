/**
 * Giao diện SquadFit.
 *
 * KHÔNG chứa logic nghiệp vụ. Mọi việc tính toán đều do backend làm qua
 * POST /api/solve. Tệp này chỉ: dựng trạng thái UI, gửi yêu cầu, và vẽ kết quả.
 *
 * Cập nhật động: mọi thay đổi đều gọi lại API từ đầu và vẽ lại toàn bộ khối
 * kết quả. Không có cache, nên không thể còn sót kết quả cũ đã hết hợp lệ.
 */

const $ = (id) => document.getElementById(id);

const state = {
  candidates: [],
  skills: [],
  scenarios: [],
  scenarioId: null,
  project: null,
  disabled: new Set(), // id ứng viên đang bị tắt khả dụng
  mustInclude: new Set(),
  mustExclude: new Set(),
  filterText: '',
  filterSkill: '',
  activePlan: 0,
  lastResult: null,
  requestId: 0,
};

/* ══════════════════ Tiện ích ══════════════════ */

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Mọi lời gọi API đều đi qua đây, để không chỗ nào quên xử lý lỗi. */
async function api(path, options) {
  const res = await fetch(path, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Máy chủ trả về dữ liệu không phải JSON (mã ${res.status}).`);
  }
  if (!res.ok) {
    const detail = data?.error?.details?.length ? ` (${data.error.details.join('; ')})` : '';
    throw new Error((data?.error?.message ?? `Lỗi ${res.status}`) + detail);
  }
  return data;
}

/* ══════════════════ Khởi động ══════════════════ */

async function init() {
  try {
    const [pool, scen] = await Promise.all([api('/api/candidates'), api('/api/scenarios')]);

    state.candidates = pool.candidates;
    state.skills = pool.skills;
    state.scenarios = scen.scenarios;

    const first = scen.scenarios.find((s) => s.id === scen.defaultScenarioId) ?? scen.scenarios[0];
    loadScenario(first.id, { silent: true });

    fillSkillSelects();
    renderScenarios();
    bindEvents();
    renderProject();
    renderCandidates();
    $('engine-note').textContent = `Thuật toán chạy trên máy chủ · ${pool.total} hồ sơ · ${pool.skills.length} kỹ năng`;
    solve();
  } catch (err) {
    $('result-body').innerHTML = `<div class="alert alert--bad"><strong>Không tải được dữ liệu.</strong><br />${esc(err.message)}<br /><br />Kiểm tra máy chủ đã chạy chưa: <code>npm start</code></div>`;
  }
}

function loadScenario(id, { silent = false } = {}) {
  const scenario = state.scenarios.find((s) => s.id === id);
  if (!scenario) return;
  state.scenarioId = id;
  // Sao chép sâu để chỉnh sửa trên UI không làm bẩn kịch bản gốc.
  state.project = JSON.parse(JSON.stringify(scenario.project));
  state.mustInclude = new Set(state.project.constraints.mustInclude ?? []);
  state.mustExclude = new Set(state.project.constraints.mustExclude ?? []);
  state.activePlan = 0;
  if (!silent) {
    renderProject();
    renderCandidates();
    solve();
  }
}

function fillSkillSelects() {
  const options = state.skills.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  $('add-skill').innerHTML = options;
  $('filter-skill').innerHTML = `<option value="">Mọi kỹ năng</option>${options}`;
}

/* ══════════════════ Vẽ cột trái ══════════════════ */

function renderScenarios() {
  $('scenario-list').innerHTML = state.scenarios
    .map(
      (s) => `<button type="button" class="scenario" data-scenario="${esc(s.id)}"
        aria-pressed="${s.id === state.scenarioId}">
        <b>${esc(s.label)}</b><span>${esc(s.hint)}</span></button>`
    )
    .join('');
}

function renderProject() {
  const p = state.project;
  $('project-name').value = p.name;
  $('size-min').value = p.teamSize.min;
  $('size-max').value = p.teamSize.max;
  $('min-hours').value = p.constraints.minTotalHours;
  $('min-presenters').value = p.constraints.minPresenters;
  $('skill-count').textContent = `(${p.requiredSkills.length})`;

  $('req-list').innerHTML =
    p.requiredSkills.length === 0
      ? '<li class="hint">Chưa có năng lực bắt buộc nào — mọi đội hình đều được coi là phủ đủ.</li>'
      : p.requiredSkills
          .map(
            (r, i) => `<li class="req-item">
              <span class="req-item__name">${esc(r.skill)}</span>
              <span class="req-item__lvl">≥ ${r.minLevel}</span>
              <button type="button" class="btn btn--danger" data-remove-skill="${i}"
                aria-label="Bỏ ${esc(r.skill)}">✕</button>
            </li>`
          )
          .join('');

  const must = [...state.mustInclude].length;
  const excl = [...state.mustExclude].length;
  $('must-hint').textContent =
    must + excl === 0
      ? 'Nhấn vào tên một ứng viên để bắt buộc có mặt, nhấn lần nữa để loại trừ.'
      : `Bắt buộc có: ${must} người · Loại trừ: ${excl} người. Nhấn tên để đổi.`;

  document.querySelectorAll('[data-scenario]').forEach((el) => {
    el.setAttribute('aria-pressed', String(el.dataset.scenario === state.scenarioId));
  });
}

/* ══════════════════ Vẽ cột giữa ══════════════════ */

function renderCandidates() {
  const reqSkills = new Set(state.project.requiredSkills.map((r) => r.skill));
  const text = state.filterText.trim().toLowerCase();

  const shown = state.candidates.filter((c) => {
    if (text && !c.name.toLowerCase().includes(text)) return false;
    if (state.filterSkill && !c.skills.some((s) => s.skill === state.filterSkill)) return false;
    return true;
  });

  const activeCount = state.candidates.filter((c) => !state.disabled.has(c.id)).length;
  $('pool-count').textContent = `${activeCount}/${state.candidates.length} khả dụng`;
  $('cand-empty').hidden = shown.length > 0;

  $('cand-list').innerHTML = shown
    .map((c) => {
      const off = state.disabled.has(c.id);
      const picked = state.mustInclude.has(c.id);
      const banned = state.mustExclude.has(c.id);
      const flag = picked
        ? '<span class="pill pill--ok">bắt buộc</span>'
        : banned
          ? '<span class="pill pill--bad">loại trừ</span>'
          : '';
      return `<li class="cand${off ? ' cand--off' : ''}${picked ? ' cand--picked' : ''}">
        <input type="checkbox" class="cand__toggle" data-toggle="${esc(c.id)}"
          ${off ? '' : 'checked'} aria-label="Khả dụng: ${esc(c.name)}" />
        <div>
          <div class="cand__name">
            <button type="button" class="btn btn--danger" style="color:inherit;font-weight:inherit"
              data-must="${esc(c.id)}">${esc(c.name)}</button> ${flag}
          </div>
          <div class="cand__meta">Năm ${c.year} · ${esc(c.note)}</div>
          <div class="cand__skills">${c.skills
            .map(
              (s) =>
                `<span class="chip${reqSkills.has(s.skill) ? ' chip--req' : ''}">${esc(s.skill)} ${s.level}</span>`
            )
            .join('')}</div>
        </div>
        <div class="cand__hours">${c.hoursPerWeek}h</div>
      </li>`;
    })
    .join('');
}

/* ══════════════════ Gọi máy chủ ══════════════════ */

function buildPayload() {
  const project = JSON.parse(JSON.stringify(state.project));
  project.constraints.mustInclude = [...state.mustInclude];
  project.constraints.mustExclude = [...state.mustExclude];

  const candidates = state.candidates.map((c) => ({ ...c, available: !state.disabled.has(c.id) }));
  return { project, candidates };
}

async function solve() {
  const id = ++state.requestId;
  $('solve-meta').textContent = 'đang tính…';

  try {
    const result = await api('/api/solve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    });

    // Bỏ qua phản hồi cũ đến muộn — luôn chỉ vẽ kết quả của yêu cầu mới nhất.
    if (id !== state.requestId) return;

    state.lastResult = result;
    if (state.activePlan >= (result.plans?.length ?? 0)) state.activePlan = 0;
    renderResult(result);
  } catch (err) {
    if (id !== state.requestId) return;
    state.lastResult = null;
    $('solve-meta').textContent = 'lỗi';
    $('result-body').innerHTML = `<div class="alert alert--bad"><strong>Không tính được đội hình.</strong><br />${esc(err.message)}</div>`;
  }
}

const solveSoon = debounce(solve, 180);

/* ══════════════════ Vẽ cột phải ══════════════════ */

function renderResult(result) {
  const m = result.meta;
  $('solve-meta').textContent =
    `${m.poolSize} ứng viên · ${m.combinationsChecked.toLocaleString('vi-VN')} tổ hợp · ${m.elapsedMs}ms`;

  const warnings = (result.warnings ?? [])
    .map((w) => `<div class="alert alert--warn">${esc(w)}</div>`)
    .join('');

  $('result-body').innerHTML = result.ok
    ? warnings + renderPlans(result)
    : warnings + renderDiagnosis(result.diagnosis);
}

function renderPlans(result) {
  const plans = result.plans;
  const plan = plans[state.activePlan] ?? plans[0];

  const tabs = plans
    .map(
      (p, i) => `<button type="button" class="tab" data-plan="${i}" role="tab"
        aria-selected="${i === state.activePlan}">Phương án #${p.rank} · <b>${p.score}</b> điểm</button>`
    )
    .join('');

  const stats = `<div class="summary">
    <span class="stat"><b>${plan.members.length}</b> thành viên</span>
    <span class="stat"><b>${plan.totalHours}</b> giờ/tuần</span>
    <span class="stat"><b>${plan.presenters}</b> người trình bày được</span>
    <span class="stat">Tổng cộng <b>${result.meta.validPlans.toLocaleString('vi-VN')}</b> đội hình hợp lệ</span>
  </div>`;

  return `
    <div class="tabs" role="tablist">${tabs}</div>
    ${stats}
    ${blockCoverage(plan)}
    ${blockMembers(plan)}
    ${blockWhy(plan, result)}
  `;
}

function blockCoverage(plan) {
  const rows = plan.assignments
    .map((a) => {
      const backups = a.backups.length
        ? a.backups.map((b) => `${esc(b.name)} (${b.level})`).join(', ')
        : '<span class="pill pill--warn">không có dự phòng</span>';
      return `<tr>
        <td><span class="pill pill--ok">đạt</span></td>
        <td>${esc(a.skill)} <span class="req-item__lvl">≥ ${a.minLevel}</span></td>
        <td>${esc(a.primary.name)} <span class="req-item__lvl">mức ${a.primary.level}</span>
            ${a.primary.matchesPreferredRole ? '<span class="pill pill--ok">đúng vai trò mong muốn</span>' : ''}</td>
        <td>${backups}</td>
      </tr>`;
    })
    .join('');

  return `<div class="block">
    <h3 class="block__title">Yêu cầu đã được đáp ứng</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Trạng thái</th><th>Năng lực</th><th>Phụ trách chính</th><th>Dự phòng</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

function blockMembers(plan) {
  const cards = plan.members
    .map((m) => {
      const roles = m.assignedSkills.length
        ? m.assignedSkills.map((s) => `<span class="chip chip--req">${esc(s)}</span>`).join(' ')
        : '<span class="chip">dự phòng, không phụ trách chính</span>';
      return `<div class="member${m.assignedSkills.length ? '' : ' member--idle'}">
        <div class="member__name">${esc(m.name)}</div>
        <div class="member__meta">Năm ${m.year} · ${m.hoursPerWeek}h/tuần</div>
        <div class="cand__skills">${roles}</div>
      </div>`;
    })
    .join('');

  return `<div class="block">
    <h3 class="block__title">Phân bổ vai trò</h3>
    <div class="member-grid">${cards}</div>
  </div>`;
}

function blockWhy(plan, result) {
  const rows = plan.breakdown
    .map(
      (c) => `<tr>
        <td>${esc(c.label)}</td>
        <td style="width:35%"><span class="bar"><i style="width:${Math.round(c.ratio * 100)}%"></i></span></td>
        <td class="num">${c.points} / ${c.weight}</td>
      </tr>`
    )
    .join('');

  const comparisons =
    state.activePlan === 0 && result.comparisons?.length
      ? `<ul class="why">${result.comparisons.map((c) => `<li>${esc(c.text)}</li>`).join('')}</ul>`
      : state.activePlan === 0
        ? '<p class="hint">Chỉ có một phương án hợp lệ, không có phương án nào để so sánh.</p>'
        : '<p class="hint">Bảng so sánh chỉ hiển thị cho phương án đứng đầu. Chọn lại tab #1 để xem.</p>';

  return `<div class="block">
    <h3 class="block__title">Vì sao phương án này tối ưu</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Tiêu chí</th><th>Mức đạt</th><th class="num">Điểm</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th>Tổng</th><th></th><th class="num">${plan.score} / 100</th></tr></tfoot>
    </table></div>
    ${comparisons}
  </div>`;
}

function renderDiagnosis(d) {
  if (!d) {
    return '<div class="alert alert--bad"><strong>Không có phương án nào.</strong> Máy chủ không trả về chẩn đoán.</div>';
  }

  const uncovered = d.uncoveredSkills?.length
    ? `<div class="block"><h3 class="block__title">Năng lực không đáp ứng được</h3>
        <ul class="why">${d.uncoveredSkills.map((u) => `<li>${esc(u.message)}</li>`).join('')}</ul></div>`
    : '';

  const constraints = d.constraintIssues?.length
    ? `<div class="block"><h3 class="block__title">Ràng buộc không thỏa mãn</h3>
        <ul class="why">${d.constraintIssues.map((i) => `<li>${esc(i.message)}</li>`).join('')}</ul></div>`
    : '';

  const near = d.nearMiss
    ? `<div class="block"><h3 class="block__title">Tổ hợp gần nhất</h3>
        <p class="hint">${esc(d.nearMiss.members.map((m) => m.name).join(', '))} — tổng ${d.nearMiss.totalHours}h. Còn thiếu:</p>
        <ul class="why">${d.nearMiss.unmet.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></div>`
    : '';

  const hint = d.onlyUnavailablePeopleCanCover
    ? '<p class="hint">Gợi ý: bật lại khả dụng cho những người đang bị tắt ở cột giữa.</p>'
    : '<p class="hint">Gợi ý: hạ mức yêu cầu, nới quân số, hoặc giảm tổng giờ cam kết tối thiểu.</p>';

  return `<div class="alert alert--bad"><strong>Không có đội hình nào thỏa mãn toàn bộ điều kiện.</strong><br />${esc(d.summary)}</div>
    ${uncovered}${constraints}${near}${hint}`;
}

/* ══════════════════ Sự kiện ══════════════════ */

function bindEvents() {
  $('btn-context').addEventListener('click', (e) => {
    const box = $('context');
    box.hidden = !box.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!box.hidden));
  });

  $('scenario-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-scenario]');
    if (btn) loadScenario(btn.dataset.scenario);
  });

  $('project-name').addEventListener('input', (e) => {
    state.project.name = e.target.value;
  });

  $('req-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-skill]');
    if (!btn) return;
    state.project.requiredSkills.splice(Number(btn.dataset.removeSkill), 1);
    renderProject();
    renderCandidates();
    solve();
  });

  $('btn-add-skill').addEventListener('click', () => {
    const skill = $('add-skill').value;
    const minLevel = Number($('add-level').value);
    const existing = state.project.requiredSkills.find((r) => r.skill === skill);
    if (existing) existing.minLevel = minLevel;
    else state.project.requiredSkills.push({ skill, minLevel });
    renderProject();
    renderCandidates();
    solve();
  });

  for (const [id, apply] of [
    ['size-min', (v) => (state.project.teamSize.min = v)],
    ['size-max', (v) => (state.project.teamSize.max = v)],
    ['min-hours', (v) => (state.project.constraints.minTotalHours = v)],
    ['min-presenters', (v) => (state.project.constraints.minPresenters = v)],
  ]) {
    $(id).addEventListener('input', (e) => {
      const n = Number(e.target.value);
      apply(Number.isFinite(n) ? n : 0);
      solveSoon();
    });
  }

  $('search').addEventListener('input', (e) => {
    state.filterText = e.target.value;
    renderCandidates();
  });

  $('filter-skill').addEventListener('change', (e) => {
    state.filterSkill = e.target.value;
    renderCandidates();
  });

  $('btn-reset-pool').addEventListener('click', () => {
    state.disabled.clear();
    renderCandidates();
    solve();
  });

  $('cand-list').addEventListener('change', (e) => {
    const box = e.target.closest('[data-toggle]');
    if (!box) return;
    const id = box.dataset.toggle;
    if (box.checked) state.disabled.delete(id);
    else state.disabled.add(id);
    renderCandidates();
    solve();
  });

  // Nhấn tên ứng viên: bình thường → bắt buộc → loại trừ → bình thường
  $('cand-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-must]');
    if (!btn) return;
    const id = btn.dataset.must;
    if (state.mustInclude.has(id)) {
      state.mustInclude.delete(id);
      state.mustExclude.add(id);
    } else if (state.mustExclude.has(id)) {
      state.mustExclude.delete(id);
    } else {
      state.mustInclude.add(id);
    }
    renderProject();
    renderCandidates();
    solve();
  });

  $('result-body').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-plan]');
    if (!tab || !state.lastResult) return;
    state.activePlan = Number(tab.dataset.plan);
    renderResult(state.lastResult);
  });
}

init();
