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
import { validateProject, validateCandidates } from './validation.js';
import { projectRoutes } from './projects.js';

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
  ...projectRoutes,
];
