/**
 * Lõi thuật toán ghép đội — duyệt tổ hợp có cắt tỉa.
 *
 * Vì sao không dùng greedy: greedy không đảm bảo tối ưu và không giải thích
 * được vì sao một phương án khác thua. Duyệt tổ hợp cho ta cả hai.
 *
 * BỐN ĐIỀU KIỆN HỢP LỆ (mục 3.2 đề bài), kiểm tra đúng thứ tự này:
 *   1. Không trùng người      — đảm bảo bởi cách sinh tổ hợp
 *   2. Quân số trong khoảng   — teamSize.min ≤ n ≤ teamSize.max
 *   3. Phủ 100% năng lực      — mọi requiredSkill có người ở mức ≥ minLevel
 *   4. Ràng buộc bổ sung      — minTotalHours, mustInclude, mustExclude, minPresenters
 * Vi phạm bất kỳ điều nào → loại. Không có "gần đúng", không cho điểm một phần.
 *
 * AN TOÀN: có chặn cứng số tổ hợp và giới hạn quân số tối đa, nên hàm này
 * KHÔNG BAO GIỜ treo dù dữ liệu đầu vào thế nào.
 */

import { meetsRequirement, totalHours, countPresenters, levelOf } from './candidate-utils.js';
import { assignRoles, skillsAssignedTo } from './assignment.js';
import { scorePlan, explainDifference } from './scoring.js';
import { buildDiagnosis, unmetConditions } from './diagnosis.js';

/** Chặn cứng: không bao giờ duyệt quá số tổ hợp này. */
export const MAX_COMBINATIONS = 200_000;

/** Chặn cứng: quân số tối đa cho phép, để không gian tìm kiếm luôn hữu hạn. */
export const MAX_TEAM_SIZE = 8;

/** Số phương án trả về. */
export const MAX_PLANS = 3;

/**
 * Chuẩn hoá mục tiêu dự án, điền giá trị mặc định và kẹp về khoảng an toàn.
 * Trả về cả danh sách cảnh báo để tầng API báo lại cho người dùng.
 */
export function normalizeProject(input) {
  const warnings = [];
  const project = {
    name: input?.name ?? 'Dự án chưa đặt tên',
    description: input?.description ?? '',
    requiredSkills: [],
    teamSize: { min: 1, max: 5 },
    constraints: {
      minTotalHours: 0,
      mustInclude: [],
      mustExclude: [],
      minPresenters: 0,
    },
  };

  for (const req of input?.requiredSkills ?? []) {
    if (!req?.skill) continue;
    const minLevel = Number(req.minLevel);
    project.requiredSkills.push({
      skill: String(req.skill),
      minLevel: Number.isFinite(minLevel) ? Math.min(3, Math.max(1, Math.trunc(minLevel))) : 1,
    });
  }

  const rawMin = Number(input?.teamSize?.min);
  const rawMax = Number(input?.teamSize?.max);
  let min = Number.isFinite(rawMin) ? Math.trunc(rawMin) : 1;
  let max = Number.isFinite(rawMax) ? Math.trunc(rawMax) : 5;

  min = Math.max(1, min);
  max = Math.max(1, max);
  if (max > MAX_TEAM_SIZE) {
    warnings.push(`Quân số tối đa ${max} vượt giới hạn an toàn, đã kẹp về ${MAX_TEAM_SIZE}.`);
    max = MAX_TEAM_SIZE;
  }
  if (min > max) {
    warnings.push(`Quân số tối thiểu ${min} lớn hơn tối đa ${max}; đã dùng ${max} cho cả hai.`);
    min = max;
  }
  project.teamSize = { min, max };

  const c = input?.constraints ?? {};
  const hours = Number(c.minTotalHours);
  project.constraints.minTotalHours = Number.isFinite(hours) ? Math.max(0, hours) : 0;
  const presenters = Number(c.minPresenters);
  project.constraints.minPresenters = Number.isFinite(presenters) ? Math.max(0, Math.trunc(presenters)) : 0;
  project.constraints.mustInclude = Array.isArray(c.mustInclude) ? c.mustInclude.map(String) : [];
  project.constraints.mustExclude = Array.isArray(c.mustExclude) ? c.mustExclude.map(String) : [];

  return { project, warnings };
}

/** Điều kiện 4 — ràng buộc bổ sung. Trả về true nếu thỏa mãn tuyệt đối. */
function satisfiesConstraints(members, project) {
  const c = project.constraints;
  if (totalHours(members) < c.minTotalHours) return false;
  if (countPresenters(members) < c.minPresenters) return false;
  for (const id of c.mustInclude) {
    if (!members.some((m) => m.id === id)) return false;
  }
  // mustExclude đã bị loại khỏi pool từ bước lọc sơ bộ, kiểm tra lại cho chắc.
  for (const id of c.mustExclude) {
    if (members.some((m) => m.id === id)) return false;
  }
  return true;
}

/** Điều kiện 3 — phủ 100% năng lực yêu cầu. */
function coversAllSkills(members, project) {
  return project.requiredSkills.every((req) => members.some((m) => meetsRequirement(m, req)));
}

/**
 * Chuẩn bị dữ liệu cắt tỉa cho hậu tố của pool.
 * suffixBest[i][skill] = mức cao nhất đạt được nếu chỉ chọn từ pool[i..]
 * suffixHours[i][k]    = tổng giờ lớn nhất khi lấy k người từ pool[i..]
 */
function buildSuffixTables(pool, maxSize) {
  const n = pool.length;
  const suffixBest = Array.from({ length: n + 1 }, () => new Map());
  for (let i = n - 1; i >= 0; i--) {
    const map = new Map(suffixBest[i + 1]);
    for (const s of pool[i].skills ?? []) {
      map.set(s.skill, Math.max(map.get(s.skill) ?? 0, s.level));
    }
    suffixBest[i] = map;
  }

  const suffixHours = Array.from({ length: n + 1 }, () => [0]);
  for (let i = n - 1; i >= 0; i--) {
    const hours = pool.slice(i).map((p) => p.hoursPerWeek ?? 0).sort((a, b) => b - a);
    const prefix = [0];
    for (let k = 0; k < Math.min(maxSize, hours.length); k++) {
      prefix.push(prefix[k] + hours[k]);
    }
    suffixHours[i] = prefix;
  }

  return { suffixBest, suffixHours };
}

/** Tổng giờ lớn nhất khi lấy đúng `k` người từ pool[i..]; thiếu người thì trả -1. */
function maxHoursFrom(suffixHours, i, k) {
  const table = suffixHours[i];
  if (k >= table.length) return -1;
  return table[k];
}

/**
 * Giải bài toán ghép đội.
 *
 * @param {Object} rawProject mục tiêu dự án (chưa chuẩn hoá)
 * @param {Array}  allCandidates toàn bộ kho ứng viên
 * @returns {{ok: boolean, plans: Array, diagnosis: Object|null, meta: Object, warnings: Array}}
 */
export function solve(rawProject, allCandidates) {
  const startedAt = performance.now();
  const { project, warnings } = normalizeProject(rawProject);
  const candidates = Array.isArray(allCandidates) ? allCandidates : [];

  // ---- Bước 1: lọc sơ bộ -------------------------------------------------
  const availableCandidates = candidates.filter((c) => c.available !== false);
  const mustInclude = new Set(project.constraints.mustInclude);
  const mustExclude = new Set(project.constraints.mustExclude);

  const pool = availableCandidates
    .filter((c) => !mustExclude.has(c.id))
    .filter((c) => {
      if (mustInclude.has(c.id)) return true;
      // Chưa khai báo năng lực nào thì không có căn cứ để loại ai.
      if (project.requiredSkills.length === 0) return true;
      // Bỏ người không đóng góp kỹ năng nào trong yêu cầu — trừ khi cần họ để
      // đủ giờ cam kết hoặc đủ người trình bày.
      if (project.requiredSkills.some((req) => meetsRequirement(c, req))) return true;
      if (project.constraints.minPresenters > 0 && levelOf(c, 'Thuyết trình') > 0) return true;
      return false;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const meta = {
    totalCandidates: candidates.length,
    availableCandidates: availableCandidates.length,
    poolSize: pool.length,
    combinationsChecked: 0,
    validPlans: 0,
    truncated: false,
    maxCombinations: MAX_COMBINATIONS,
    elapsedMs: 0,
    generatedAt: new Date().toISOString(),
  };

  const finish = (result) => {
    meta.elapsedMs = Number((performance.now() - startedAt).toFixed(3));
    return { ...result, meta, warnings };
  };

  let nearMiss = null;
  const trackNearMiss = (members) => {
    const unmet = unmetConditions(members, project);
    if (unmet.length === 0) return;
    if (nearMiss === null || unmet.length < nearMiss.unmet.length) {
      nearMiss = {
        members: members.map((m) => ({ id: m.id, name: m.name, hoursPerWeek: m.hoursPerWeek })),
        totalHours: totalHours(members),
        unmet,
      };
    }
  };

  const bail = () =>
    finish({
      ok: false,
      plans: [],
      diagnosis: buildDiagnosis({ project, pool, allCandidates: candidates, availableCandidates, nearMiss }),
    });

  // ---- Bước 2: kiểm tra khả thi sớm --------------------------------------
  if (project.requiredSkills.length === 0) {
    warnings.push('Chưa khai báo năng lực bắt buộc nào, mọi đội hình đều được coi là phủ đủ.');
  }
  if (pool.length < project.teamSize.min) return bail();
  if (!coversAllSkills(pool, project)) return bail();

  // ---- Bước 3: duyệt tổ hợp có cắt tỉa -----------------------------------
  const { suffixBest, suffixHours } = buildSuffixTables(pool, project.teamSize.max);
  const validPlans = [];

  const search = (size) => {
    const chosen = [];

    const recurse = (startIdx) => {
      if (meta.combinationsChecked >= MAX_COMBINATIONS) return;

      const remaining = size - chosen.length;

      if (remaining === 0) {
        meta.combinationsChecked += 1;
        const members = [...chosen];
        if (coversAllSkills(members, project) && satisfiesConstraints(members, project)) {
          validPlans.push(members);
        } else {
          trackNearMiss(members);
        }
        return;
      }

      // Cắt tỉa 1: không còn đủ người để lấp đầy đội.
      if (pool.length - startIdx < remaining) return;

      // Cắt tỉa 2: kỹ năng còn thiếu không thể tìm được trong phần hậu tố.
      for (const req of project.requiredSkills) {
        if (chosen.some((m) => meetsRequirement(m, req))) continue;
        if ((suffixBest[startIdx].get(req.skill) ?? 0) < req.minLevel) return;
      }

      // Cắt tỉa 3: người bắt buộc đã nằm ngoài phần hậu tố.
      let missingMustInclude = 0;
      for (const id of mustInclude) {
        if (chosen.some((m) => m.id === id)) continue;
        const idx = pool.findIndex((p) => p.id === id);
        if (idx < startIdx) return;
        missingMustInclude += 1;
      }
      if (missingMustInclude > remaining) return;

      // Cắt tỉa 4: dù lấy những người rảnh nhất còn lại cũng không đủ giờ.
      if (project.constraints.minTotalHours > 0) {
        const best = maxHoursFrom(suffixHours, startIdx, remaining);
        if (best < 0) return;
        if (totalHours(chosen) + best < project.constraints.minTotalHours) return;
      }

      for (let i = startIdx; i < pool.length; i++) {
        chosen.push(pool[i]);
        recurse(i + 1);
        chosen.pop();
        if (meta.combinationsChecked >= MAX_COMBINATIONS) return;
      }
    };

    recurse(0);
  };

  for (let size = project.teamSize.min; size <= project.teamSize.max; size++) {
    search(size);
    if (meta.combinationsChecked >= MAX_COMBINATIONS) {
      meta.truncated = true;
      warnings.push(
        `Đã chạm giới hạn ${MAX_COMBINATIONS.toLocaleString('vi-VN')} tổ hợp và dừng sớm để không treo. Kết quả là tốt nhất trong phần đã duyệt.`
      );
      break;
    }
  }

  meta.validPlans = validPlans.length;
  if (validPlans.length === 0) return bail();

  // ---- Bước 4: chấm điểm, xếp hạng, trả top 3 ----------------------------
  const scored = validPlans.map((members) => {
    const { total, breakdown, assignment } = scorePlan(members, project);
    return { members, score: total, breakdown, assignment };
  });

  // Xếp hạng. Khi bằng điểm, phân định bằng các tiêu chí phụ có ý nghĩa thật:
  // đội ít người hơn trước, rồi đội có tổng giờ cam kết lớn hơn (nhiều dư địa
  // hơn khi dự án phát sinh), cuối cùng là thứ tự mã ứng viên để kết quả luôn
  // ổn định giữa các lần chạy.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.members.length !== b.members.length) return a.members.length - b.members.length;
    const hoursDiff = totalHours(b.members) - totalHours(a.members);
    if (hoursDiff !== 0) return hoursDiff;
    return a.members.map((m) => m.id).join().localeCompare(b.members.map((m) => m.id).join());
  });

  const plans = scored.slice(0, MAX_PLANS).map((plan, index) => ({
    rank: index + 1,
    score: plan.score,
    breakdown: plan.breakdown,
    totalHours: totalHours(plan.members),
    presenters: countPresenters(plan.members),
    members: plan.members.map((m) => ({
      id: m.id,
      name: m.name,
      year: m.year,
      hoursPerWeek: m.hoursPerWeek,
      preferredRoles: m.preferredRoles ?? [],
      note: m.note ?? '',
      assignedSkills: skillsAssignedTo(m.id, plan.assignment.assignments),
    })),
    assignments: plan.assignment.assignments,
  }));

  // So sánh phương án đứng đầu với các phương án còn lại.
  const comparisons = plans
    .slice(1)
    .map((other) => ({ againstRank: other.rank, text: explainDifference(plans[0], other) }));

  return finish({ ok: true, plans, comparisons, diagnosis: null });
}
