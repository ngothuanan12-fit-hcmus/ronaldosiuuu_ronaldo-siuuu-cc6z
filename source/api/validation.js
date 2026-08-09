/**
 * Kiểm tra hình dạng dữ liệu gửi lên. Dùng chung cho /api/solve và /api/projects.
 *
 * Mỗi hàm trả về MẢNG thông báo lỗi tiếng Việt; mảng rỗng nghĩa là hợp lệ.
 * Không ném lỗi ở đây — nơi gọi quyết định biến chúng thành 400 hay không.
 */

import { SKILLS } from '../data/skills.js';

export function validateProject(project) {
  const errors = [];

  if (project === undefined || project === null) return ['Thiếu trường "project".'];
  if (typeof project !== 'object' || Array.isArray(project)) return ['Trường "project" phải là một object.'];

  if (project.name !== undefined && typeof project.name !== 'string') {
    errors.push('project.name phải là một chuỗi.');
  }
  if (typeof project.name === 'string' && project.name.trim() === '') {
    errors.push('project.name không được để trống.');
  }

  if (project.requiredSkills !== undefined && !Array.isArray(project.requiredSkills)) {
    errors.push('Trường "project.requiredSkills" phải là một mảng.');
  } else {
    const seen = new Set();
    for (const [i, req] of (project.requiredSkills ?? []).entries()) {
      if (typeof req !== 'object' || req === null) {
        errors.push(`requiredSkills[${i}] phải là một object.`);
        continue;
      }
      if (typeof req.skill !== 'string' || req.skill.trim() === '') {
        errors.push(`requiredSkills[${i}].skill phải là một chuỗi không rỗng.`);
      } else if (!SKILLS.includes(req.skill)) {
        errors.push(`requiredSkills[${i}].skill là "${req.skill}", không nằm trong bộ ${SKILLS.length} kỹ năng.`);
      } else if (seen.has(req.skill)) {
        errors.push(`Kỹ năng "${req.skill}" bị khai báo trùng.`);
      } else {
        seen.add(req.skill);
      }
      if (req.minLevel !== undefined && !Number.isFinite(Number(req.minLevel))) {
        errors.push(`requiredSkills[${i}].minLevel phải là một số.`);
      }
    }
  }

  if (project.teamSize !== undefined) {
    if (typeof project.teamSize !== 'object' || project.teamSize === null) {
      errors.push('Trường "project.teamSize" phải là object dạng {min, max}.');
    } else {
      for (const key of ['min', 'max']) {
        const v = project.teamSize[key];
        if (v !== undefined && !Number.isFinite(Number(v))) {
          errors.push(`project.teamSize.${key} phải là một số.`);
        }
      }
    }
  }

  const c = project.constraints;
  if (c !== undefined) {
    if (typeof c !== 'object' || c === null || Array.isArray(c)) {
      errors.push('Trường "project.constraints" phải là một object.');
    } else {
      for (const key of ['minTotalHours', 'minPresenters']) {
        if (c[key] !== undefined && !Number.isFinite(Number(c[key]))) {
          errors.push(`project.constraints.${key} phải là một số.`);
        }
      }
      for (const key of ['mustInclude', 'mustExclude']) {
        if (c[key] !== undefined && !Array.isArray(c[key])) {
          errors.push(`project.constraints.${key} phải là một mảng id.`);
        }
      }
    }
  }

  return errors;
}

export function validateCandidates(list) {
  const errors = [];
  if (!Array.isArray(list)) return ['Trường "candidates" phải là một mảng.'];

  const seen = new Set();
  for (const [i, c] of list.entries()) {
    if (typeof c !== 'object' || c === null) {
      errors.push(`candidates[${i}] phải là một object.`);
      continue;
    }
    if (typeof c.id !== 'string' || c.id.trim() === '') {
      errors.push(`candidates[${i}].id phải là một chuỗi không rỗng.`);
    } else if (seen.has(c.id)) {
      errors.push(`candidates[${i}].id trùng với một ứng viên khác: "${c.id}".`);
    } else {
      seen.add(c.id);
    }
    if (!Array.isArray(c.skills)) {
      errors.push(`candidates[${i}].skills phải là một mảng.`);
    }
    if (c.hoursPerWeek !== undefined && !Number.isFinite(Number(c.hoursPerWeek))) {
      errors.push(`candidates[${i}].hoursPerWeek phải là một số.`);
    }
  }
  return errors;
}
