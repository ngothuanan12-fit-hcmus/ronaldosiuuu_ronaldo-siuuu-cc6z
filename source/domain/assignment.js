/**
 * Phân bổ vai trò: mỗi kỹ năng bắt buộc được giao cho ĐÚNG MỘT người phụ trách
 * chính; những người còn lại đáp ứng kỹ năng đó được ghi là dự phòng.
 *
 * Thứ tự ưu tiên khi chọn người phụ trách chính:
 *   1. Mức thành thạo cao nhất
 *   2. Kỹ năng nằm trong preferredRoles của người đó
 *   3. Người đang gánh ít việc nhất
 *   4. id nhỏ hơn  (để kết quả luôn ổn định, không phụ thuộc thứ tự duyệt)
 *
 * Các kỹ năng khan hiếm (ít người đáp ứng) được phân trước, tránh tình trạng
 * người duy nhất đáp ứng một kỹ năng lại bị chiếm mất bởi kỹ năng phổ biến.
 */

import { levelOf, qualifiedFor } from './candidate-utils.js';

/**
 * @param {Array} members danh sách thành viên của một phương án
 * @param {Object} project mục tiêu dự án
 * @returns {{assignments: Array, load: Object, unassigned: Array}}
 */
export function assignRoles(members, project) {
  const requirements = project.requiredSkills ?? [];

  // Phân kỹ năng khan hiếm trước.
  const ordered = [...requirements].sort((a, b) => {
    const na = qualifiedFor(members, a).length;
    const nb = qualifiedFor(members, b).length;
    if (na !== nb) return na - nb;
    return a.skill.localeCompare(b.skill);
  });

  /** @type {Object<string, number>} số kỹ năng mỗi người đang phụ trách chính */
  const load = Object.fromEntries(members.map((m) => [m.id, 0]));
  const assignments = [];
  const unassigned = [];

  for (const req of ordered) {
    const qualified = qualifiedFor(members, req);

    if (qualified.length === 0) {
      unassigned.push({ skill: req.skill, minLevel: req.minLevel });
      continue;
    }

    const primary = [...qualified].sort((a, b) => {
      const levelDiff = levelOf(b, req.skill) - levelOf(a, req.skill);
      if (levelDiff !== 0) return levelDiff;

      const aPref = a.preferredRoles?.includes(req.skill) ? 0 : 1;
      const bPref = b.preferredRoles?.includes(req.skill) ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;

      if (load[a.id] !== load[b.id]) return load[a.id] - load[b.id];
      return a.id.localeCompare(b.id);
    })[0];

    load[primary.id] += 1;

    assignments.push({
      skill: req.skill,
      minLevel: req.minLevel,
      primary: {
        id: primary.id,
        name: primary.name,
        level: levelOf(primary, req.skill),
        matchesPreferredRole: primary.preferredRoles?.includes(req.skill) ?? false,
      },
      backups: qualified
        .filter((m) => m.id !== primary.id)
        .map((m) => ({ id: m.id, name: m.name, level: levelOf(m, req.skill) })),
    });
  }

  // Trả về theo đúng thứ tự requiredSkills gốc để giao diện hiển thị ổn định.
  const bySkill = new Map(assignments.map((a) => [a.skill, a]));
  const inOriginalOrder = requirements.map((r) => bySkill.get(r.skill)).filter(Boolean);

  return { assignments: inOriginalOrder, load, unassigned };
}

/** Số kỹ năng mà một thành viên phụ trách chính, dùng cho thẻ thành viên trên UI. */
export function skillsAssignedTo(memberId, assignments) {
  return assignments.filter((a) => a.primary.id === memberId).map((a) => a.skill);
}
