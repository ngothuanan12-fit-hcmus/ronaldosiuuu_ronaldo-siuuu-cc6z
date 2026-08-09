/**
 * Ba endpoint của SquadFit.
 *
 *   GET  /api/candidates  kho ứng viên + bộ kỹ năng
 *   GET  /api/scenarios   3 kịch bản mẫu
 *   POST /api/solve       nhận {project, candidates?} → trả {plans, diagnosis, meta}
 *
 * Tầng này CHỈ làm ba việc: kiểm tra đầu vào, gọi domain, đóng gói phản hồi.
 * Không có một dòng logic nghiệp vụ nào ở đây.
 */

import { candidates as candidateStore } from '../data/candidates.js';
import { SKILLS, LEVELS } from '../data/skills.js';
import { scenarios, defaultScenarioId } from '../data/scenarios.js';
import { solve, MAX_COMBINATIONS, MAX_TEAM_SIZE } from '../domain/solver.js';
import { WEIGHTS, COMPONENT_LABELS } from '../domain/scoring.js';
import { sendJson, readJsonBody } from './router.js';
import { badRequest } from './http-error.js';

export function getCandidates(req, res) {
  sendJson(res, 200, {
    candidates: candidateStore,
    skills: SKILLS,
    levels: LEVELS,
    total: candidateStore.length,
  });
}

export function getScenarios(req, res) {
  sendJson(res, 200, { scenarios, defaultScenarioId });
}

export function getMeta(req, res) {
  sendJson(res, 200, {
    weights: WEIGHTS,
    componentLabels: COMPONENT_LABELS,
    limits: { maxCombinations: MAX_COMBINATIONS, maxTeamSize: MAX_TEAM_SIZE },
  });
}

/** Kiểm tra hình dạng của `project`. Trả về danh sách lỗi, rỗng nghĩa là hợp lệ. */
function validateProject(project) {
  const errors = [];

  if (project === undefined || project === null) {
    return ['Thiếu trường "project".'];
  }
  if (typeof project !== 'object' || Array.isArray(project)) {
    return ['Trường "project" phải là một object.'];
  }

  if (project.requiredSkills !== undefined && !Array.isArray(project.requiredSkills)) {
    errors.push('Trường "project.requiredSkills" phải là một mảng.');
  } else {
    for (const [i, req] of (project.requiredSkills ?? []).entries()) {
      if (typeof req !== 'object' || req === null) {
        errors.push(`requiredSkills[${i}] phải là một object.`);
        continue;
      }
      if (typeof req.skill !== 'string' || req.skill.trim() === '') {
        errors.push(`requiredSkills[${i}].skill phải là một chuỗi không rỗng.`);
      } else if (!SKILLS.includes(req.skill)) {
        errors.push(`requiredSkills[${i}].skill là "${req.skill}", không nằm trong bộ ${SKILLS.length} kỹ năng.`);
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

/** Kiểm tra danh sách ứng viên do client gửi lên. */
function validateCandidates(list) {
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

export async function postSolve(req, res) {
  const body = await readJsonBody(req);

  const errors = validateProject(body.project);
  if (body.candidates !== undefined) {
    errors.push(...validateCandidates(body.candidates));
  }

  if (errors.length > 0) {
    throw badRequest(
      errors.length === 1 ? errors[0] : `Dữ liệu gửi lên có ${errors.length} lỗi.`,
      errors
    );
  }

  // Không truyền candidates thì dùng kho mặc định của máy chủ.
  const people = body.candidates ?? candidateStore;

  const result = solve(body.project, people);
  sendJson(res, 200, result);
}

export const routes = [
  { method: 'GET', path: '/api/candidates', handler: getCandidates },
  { method: 'GET', path: '/api/scenarios', handler: getScenarios },
  { method: 'GET', path: '/api/meta', handler: getMeta },
  { method: 'POST', path: '/api/solve', handler: postSolve },
];
