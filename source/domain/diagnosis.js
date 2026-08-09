/**
 * Chẩn đoán khi không có phương án nào hợp lệ.
 *
 * Theo mục 3.4 đề bài, hệ thống PHẢI chỉ rõ đang thiếu hụt năng lực hoặc điều
 * kiện nào. NGHIÊM CẤM tự tạo dữ liệu giả để lấp chỗ trống.
 *
 * Ba khối thông tin trả về:
 *   uncoveredSkills   kỹ năng không ai trong kho đáp ứng được
 *   constraintIssues  ràng buộc nào loại hết mọi tổ hợp
 *   nearMiss          tổ hợp thiếu ít điều kiện nhất, và thiếu đúng cái gì
 */

import { levelOf, meetsRequirement, totalHours, countPresenters } from './candidate-utils.js';

/**
 * Kỹ năng mà KHÔNG một ai trong danh sách đáp ứng ở mức yêu cầu.
 * `scope` chỉ để diễn đạt cho người đọc: 'toàn kho' hay 'số đang khả dụng'.
 */
export function findUncoveredSkills(requirements, people, scope) {
  return requirements
    .filter((req) => !people.some((p) => meetsRequirement(p, req)))
    .map((req) => {
      const best = people.length === 0 ? 0 : Math.max(0, ...people.map((p) => levelOf(p, req.skill)));
      return {
        skill: req.skill,
        minLevel: req.minLevel,
        bestAvailableLevel: best,
        message: best === 0
          ? `Trong ${scope} không có ai biết "${req.skill}".`
          : `Yêu cầu "${req.skill}" ở mức ${req.minLevel}, nhưng trong ${scope} mức cao nhất chỉ đạt ${best}.`,
      };
    });
}

/**
 * Các ràng buộc bổ sung không thể thỏa mãn dù chọn thế nào.
 * Chỉ báo những điều CHẮC CHẮN sai, không suy đoán.
 */
export function findConstraintIssues(project, pool, allCandidates) {
  const issues = [];
  const c = project.constraints ?? {};
  const { min: sizeMin, max: sizeMax } = project.teamSize;

  if (sizeMin > sizeMax) {
    issues.push({
      kind: 'teamSize',
      message: `Quân số tối thiểu (${sizeMin}) lớn hơn quân số tối đa (${sizeMax}).`,
    });
  }

  if (pool.length < sizeMin) {
    issues.push({
      kind: 'poolSize',
      message: `Chỉ còn ${pool.length} ứng viên khả dụng phù hợp, không đủ quân số tối thiểu ${sizeMin}.`,
    });
  }

  // Tổng giờ tối đa có thể đạt được: lấy sizeMax người rảnh nhiều nhất.
  if (c.minTotalHours > 0 && pool.length > 0) {
    const bestHours = [...pool]
      .sort((a, b) => b.hoursPerWeek - a.hoursPerWeek)
      .slice(0, sizeMax)
      .reduce((s, p) => s + p.hoursPerWeek, 0);
    if (bestHours < c.minTotalHours) {
      issues.push({
        kind: 'minTotalHours',
        message: `Có thể phủ được năng lực, nhưng tổng giờ cam kết tối đa của ${sizeMax} người rảnh nhiều nhất chỉ đạt ${bestHours}h, thiếu ${c.minTotalHours - bestHours}h so với yêu cầu ${c.minTotalHours}h.`,
      });
    }
  }

  if (c.minPresenters > 0) {
    const presenters = countPresenters(pool);
    if (presenters < c.minPresenters) {
      issues.push({
        kind: 'minPresenters',
        message: `Yêu cầu ít nhất ${c.minPresenters} người trình bày được, nhưng chỉ có ${presenters} người trong nhóm ứng viên khả dụng có kỹ năng Thuyết trình.`,
      });
    }
  }

  for (const id of c.mustInclude ?? []) {
    const person = allCandidates.find((p) => p.id === id);
    if (!person) {
      issues.push({ kind: 'mustInclude', message: `Ứng viên bắt buộc "${id}" không tồn tại trong kho.` });
    } else if (!person.available) {
      issues.push({ kind: 'mustInclude', message: `Ứng viên bắt buộc "${person.name}" đang ở trạng thái không khả dụng.` });
    } else if ((c.mustExclude ?? []).includes(id)) {
      issues.push({ kind: 'mustInclude', message: `Ứng viên "${person.name}" vừa nằm trong danh sách bắt buộc vừa nằm trong danh sách loại trừ.` });
    }
  }

  if ((c.mustInclude ?? []).length > sizeMax) {
    issues.push({
      kind: 'mustInclude',
      message: `Có ${c.mustInclude.length} ứng viên bắt buộc nhưng quân số tối đa chỉ ${sizeMax}.`,
    });
  }

  return issues;
}

/**
 * Liệt kê những điều kiện mà một tổ hợp cụ thể KHÔNG thỏa mãn.
 * Dùng cho cả việc lọc lẫn việc tìm tổ hợp gần nhất.
 */
export function unmetConditions(members, project) {
  const unmet = [];
  const c = project.constraints ?? {};

  for (const req of project.requiredSkills ?? []) {
    if (!members.some((m) => meetsRequirement(m, req))) {
      unmet.push(`Chưa phủ "${req.skill}" ở mức ${req.minLevel}`);
    }
  }

  const hours = totalHours(members);
  if (c.minTotalHours > 0 && hours < c.minTotalHours) {
    unmet.push(`Tổng giờ ${hours}h, thiếu ${c.minTotalHours - hours}h so với yêu cầu ${c.minTotalHours}h`);
  }

  if (c.minPresenters > 0) {
    const presenters = countPresenters(members);
    if (presenters < c.minPresenters) {
      unmet.push(`Chỉ có ${presenters} người trình bày được, cần ${c.minPresenters}`);
    }
  }

  for (const id of c.mustInclude ?? []) {
    if (!members.some((m) => m.id === id)) unmet.push(`Thiếu ứng viên bắt buộc "${id}"`);
  }

  return unmet;
}

/** Gói kết quả chẩn đoán thành một object duy nhất cho tầng API. */
export function buildDiagnosis({ project, pool, allCandidates, availableCandidates, nearMiss }) {
  const requirements = project.requiredSkills ?? [];

  const uncoveredInStore = findUncoveredSkills(requirements, allCandidates, 'toàn kho ứng viên');
  const uncoveredInAvailable = findUncoveredSkills(requirements, availableCandidates, 'số ứng viên đang khả dụng');

  const constraintIssues = findConstraintIssues(project, pool, allCandidates);

  const reasons = [];
  if (uncoveredInStore.length > 0) {
    reasons.push('Có năng lực mà không một ai trong kho đáp ứng được.');
  } else if (uncoveredInAvailable.length > 0) {
    reasons.push('Có năng lực chỉ những người đang bị tắt khả dụng mới đáp ứng được.');
  }
  if (constraintIssues.length > 0) {
    reasons.push('Có ràng buộc bổ sung loại hết mọi tổ hợp.');
  }
  if (reasons.length === 0) {
    reasons.push('Từng điều kiện riêng lẻ đều có thể thỏa mãn, nhưng không tổ hợp nào thỏa mãn đồng thời tất cả.');
  }

  return {
    summary: reasons.join(' '),
    uncoveredSkills: uncoveredInStore.length > 0 ? uncoveredInStore : uncoveredInAvailable,
    onlyUnavailablePeopleCanCover: uncoveredInStore.length === 0 && uncoveredInAvailable.length > 0,
    constraintIssues,
    nearMiss,
  };
}
