/**
 * Chấm điểm một phương án hợp lệ, thang 100.
 *
 * QUAN TRỌNG: điểm CHỈ dùng để xếp hạng giữa các phương án ĐÃ hợp lệ.
 * Không bao giờ dùng để nới lỏng 4 điều kiện hợp lệ ở solver.js.
 *
 *   Độ dư thừa phủ kỹ năng    35  mỗi kỹ năng bắt buộc có người dự phòng
 *   Mức thành thạo vượt yêu cầu 25  trung bình (level - minLevel)
 *   Khớp vai trò ưa thích     20  tỉ lệ người được giao đúng preferredRoles
 *   Cân bằng tải              10  chênh lệch số kỹ năng phụ trách giữa các thành viên
 *   Đội gọn                   10  cùng năng lực thì đội ít người hơn thắng
 */

import { levelOf, qualifiedFor } from './candidate-utils.js';
import { assignRoles } from './assignment.js';

export const WEIGHTS = {
  redundancy: 35,
  proficiency: 25,
  roleFit: 20,
  balance: 10,
  compactness: 10,
};

export const COMPONENT_LABELS = {
  redundancy: 'Độ dư thừa phủ kỹ năng',
  proficiency: 'Mức thành thạo vượt yêu cầu',
  roleFit: 'Khớp vai trò ưa thích',
  balance: 'Cân bằng tải',
  compactness: 'Đội gọn',
};

/** Giới hạn một giá trị về khoảng [0, 1]. */
function clamp01(x) {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/**
 * @param {Array} members thành viên của phương án (đã hợp lệ)
 * @param {Object} project mục tiêu dự án
 * @param {Object} [precomputed] kết quả assignRoles nếu đã tính sẵn
 * @returns {{total: number, breakdown: Array, assignment: Object}}
 */
export function scorePlan(members, project, precomputed) {
  const requirements = project.requiredSkills ?? [];
  const assignment = precomputed ?? assignRoles(members, project);

  // --- 1. Độ dư thừa: số người dự phòng cho mỗi kỹ năng ---
  // Thang 0 / 0.8 / 1.0 — có bước nhảy lớn khi xuất hiện người dự phòng ĐẦU
  // TIÊN, rồi tăng nhẹ với người thứ hai. Nhờ vậy phủ đều mọi kỹ năng luôn
  // thắng dồn nhiều dự phòng vào một kỹ năng, mà hai phương án khác nhau vẫn
  // hiếm khi bằng điểm.
  const redundancy = requirements.length === 0
    ? 1
    : requirements.reduce((sum, req) => {
        const count = qualifiedFor(members, req).length;
        if (count <= 1) return sum;
        return sum + (count === 2 ? 0.8 : 1);
      }, 0) / requirements.length;

  // --- 2. Mức thành thạo vượt yêu cầu ---
  // Lấy trung bình HAI mức cao nhất, không phải chỉ mức cao nhất: một đội có
  // người dự phòng giỏi thực sự mạnh hơn đội có người dự phòng biết sơ sơ.
  const proficiency = requirements.length === 0
    ? 1
    : requirements.reduce((sum, req) => {
        const levels = members
          .map((m) => levelOf(m, req.skill))
          .filter((l) => l >= req.minLevel)
          .sort((a, b) => b - a);
        if (levels.length === 0) return sum;
        const topTwo = levels.slice(0, 2);
        const avg = topTwo.reduce((a, b) => a + b, 0) / topTwo.length;
        return sum + clamp01((avg - req.minLevel) / 2);
      }, 0) / requirements.length;

  // --- 3. Khớp vai trò: tỉ lệ kỹ năng được giao cho đúng người thích vai trò đó ---
  const roleFit = assignment.assignments.length === 0
    ? 1
    : assignment.assignments.filter((a) => a.primary.matchesPreferredRole).length /
      assignment.assignments.length;

  // --- 4. Cân bằng tải: phương sai số kỹ năng phụ trách, càng thấp càng tốt ---
  const loads = members.map((m) => assignment.load[m.id] ?? 0);
  const mean = loads.reduce((a, b) => a + b, 0) / (loads.length || 1);
  const variance = loads.reduce((a, l) => a + (l - mean) ** 2, 0) / (loads.length || 1);
  // Phương sai 0 → 1 điểm; phương sai từ 2 trở lên → 0 điểm.
  const balance = clamp01(1 - variance / 2);

  // --- 5. Đội gọn: cùng năng lực thì ít người hơn được ưu tiên ---
  const { min: sizeMin, max: sizeMax } = project.teamSize;
  const compactness = sizeMax === sizeMin
    ? 1
    : clamp01((sizeMax - members.length) / (sizeMax - sizeMin));

  const raw = { redundancy, proficiency, roleFit, balance, compactness };

  const breakdown = Object.keys(WEIGHTS).map((key) => ({
    key,
    label: COMPONENT_LABELS[key],
    ratio: Number(raw[key].toFixed(4)),
    weight: WEIGHTS[key],
    points: Number((raw[key] * WEIGHTS[key]).toFixed(2)),
  }));

  const total = Number(breakdown.reduce((sum, c) => sum + c.points, 0).toFixed(2));

  return { total, breakdown, assignment };
}

/**
 * Sinh câu giải thích vì sao phương án A hơn phương án B.
 * Trả về chuỗi tiếng Việt đọc được, không phải dữ liệu thô.
 */
export function explainDifference(planA, planB) {
  const gap = Number((planA.score - planB.score).toFixed(2));

  if (gap === 0) {
    if (planA.members.length !== planB.members.length) {
      return `Hai phương án bằng điểm nhau (${planA.score}). Phương án #${planA.rank} được xếp trên vì gọn hơn: ${planA.members.length} người so với ${planB.members.length}.`;
    }
    if (planA.totalHours !== planB.totalHours) {
      return `Hai phương án bằng điểm nhau (${planA.score}) và cùng ${planA.members.length} người. Phương án #${planA.rank} được xếp trên vì tổng giờ cam kết cao hơn: ${planA.totalHours}h so với ${planB.totalHours}h, tức nhiều dư địa hơn khi dự án phát sinh.`;
    }
    return `Hai phương án tương đương hoàn toàn trên mọi tiêu chí (${planA.score} điểm, ${planA.members.length} người, ${planA.totalHours}h). Phương án #${planA.rank} được xếp trên theo thứ tự mã ứng viên, để kết quả ổn định giữa các lần chạy.`;
  }

  const diffs = planA.breakdown
    .map((c, i) => ({ label: c.label, delta: Number((c.points - planB.breakdown[i].points).toFixed(2)) }))
    .filter((d) => Math.abs(d.delta) >= 0.01)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  if (diffs.length === 0) {
    return `Phương án #${planA.rank} hơn #${planB.rank} ${gap} điểm.`;
  }

  const top = diffs.slice(0, 2).map((d) => {
    const verb = d.delta > 0 ? 'hơn' : 'kém';
    return `${verb} ${Math.abs(d.delta)} điểm ở "${d.label}"`;
  });

  return `Phương án #${planA.rank} hơn #${planB.rank} tổng cộng ${gap} điểm: ${top.join(', ')}.`;
}
