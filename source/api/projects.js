/**
 * Quản lý dự án — tầng CÓ TRẠNG THÁI của máy chủ.
 *
 * QUYẾT ĐỊNH KIẾN TRÚC (xem chatlog lượt #24):
 *   /api/projects  CÓ trạng thái — dữ liệu người dùng nhập cần bền qua nhiều
 *                  lần tải trang, nhiều tab, nhiều thao tác.
 *   /api/solve     KHÔNG trạng thái — kết quả tính toán không bao giờ được lưu,
 *                  vì lưu chính là nguồn gốc của việc hiển thị kết quả cũ đã
 *                  hết hợp lệ (điều mục 3.4 đề bài cấm).
 *
 * Lưu trong bộ nhớ tiến trình, KHÔNG ghi xuống đĩa. Khởi động lại máy chủ là
 * mất sạch — đây là chủ ý cho prototype, đã ghi rõ trong README.
 *
 * Danh sách khởi tạo RỖNG theo yêu cầu của thí sinh. Ba mẫu dựng sẵn nằm ở
 * `templates` và chỉ được dùng khi người dùng chủ động chọn trong form tạo mới.
 */

import { randomUUID } from 'node:crypto';

import { sendJson, readJsonBody } from './router.js';
import { badRequest, notFound } from './http-error.js';
import { validateProject } from './validation.js';

/** Kho dự án trong bộ nhớ. Bắt đầu rỗng. */
const store = new Map();

/** Giá trị mặc định cho một dự án mới hoàn toàn. */
export function emptyProject() {
  return {
    name: '',
    description: '',
    requiredSkills: [],
    teamSize: { min: 3, max: 5 },
    constraints: { minTotalHours: 0, mustInclude: [], mustExclude: [], minPresenters: 0 },
  };
}

/** Chỉ giữ lại các trường hợp lệ, bỏ mọi trường lạ client gửi kèm. */
function sanitize(input) {
  const base = emptyProject();
  return {
    name: typeof input.name === 'string' ? input.name.trim() : base.name,
    description: typeof input.description === 'string' ? input.description.trim() : base.description,
    requiredSkills: Array.isArray(input.requiredSkills)
      ? input.requiredSkills.map((r) => ({ skill: String(r.skill), minLevel: Number(r.minLevel) || 1 }))
      : base.requiredSkills,
    teamSize: {
      min: Number(input.teamSize?.min ?? base.teamSize.min),
      max: Number(input.teamSize?.max ?? base.teamSize.max),
    },
    constraints: {
      minTotalHours: Number(input.constraints?.minTotalHours ?? 0),
      minPresenters: Number(input.constraints?.minPresenters ?? 0),
      mustInclude: Array.isArray(input.constraints?.mustInclude) ? input.constraints.mustInclude.map(String) : [],
      mustExclude: Array.isArray(input.constraints?.mustExclude) ? input.constraints.mustExclude.map(String) : [],
    },
    // Trạng thái khả dụng của ứng viên thuộc về từng dự án, không phải toàn cục.
    disabledCandidates: Array.isArray(input.disabledCandidates) ? input.disabledCandidates.map(String) : [],
  };
}

function requireProject(id) {
  const found = store.get(id);
  if (!found) throw notFound(`Không tìm thấy dự án có mã "${id}".`);
  return found;
}

/* ══════════════════ Handlers ══════════════════ */

export function listProjects(req, res) {
  const items = [...store.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  sendJson(res, 200, { projects: items, total: items.length });
}

export async function createProject(req, res) {
  const body = await readJsonBody(req);
  const input = body.project ?? body;

  const errors = validateProject(input);
  if (typeof input?.name !== 'string' || input.name.trim() === '') {
    if (!errors.some((e) => e.includes('name'))) errors.push('Dự án phải có tên.');
  }
  if (errors.length > 0) {
    throw badRequest(errors.length === 1 ? errors[0] : `Dữ liệu dự án có ${errors.length} lỗi.`, errors);
  }

  const now = new Date().toISOString();
  const project = { id: randomUUID(), ...sanitize(input), createdAt: now, updatedAt: now };
  store.set(project.id, project);
  sendJson(res, 201, { project });
}

export function getProject(req, res, params) {
  sendJson(res, 200, { project: requireProject(params.id) });
}

export async function updateProject(req, res, params) {
  const existing = requireProject(params.id);
  const body = await readJsonBody(req);
  const input = { ...existing, ...(body.project ?? body) };

  const errors = validateProject(input);
  if (errors.length > 0) {
    throw badRequest(errors.length === 1 ? errors[0] : `Dữ liệu dự án có ${errors.length} lỗi.`, errors);
  }

  const updated = {
    ...existing,
    ...sanitize(input),
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  store.set(updated.id, updated);
  sendJson(res, 200, { project: updated });
}

export function deleteProject(req, res, params) {
  requireProject(params.id);
  store.delete(params.id);
  sendJson(res, 200, { deleted: params.id });
}

export const projectRoutes = [
  { method: 'GET', path: '/api/projects', handler: listProjects },
  { method: 'POST', path: '/api/projects', handler: createProject },
  { method: 'GET', path: '/api/projects/:id', handler: getProject },
  { method: 'PUT', path: '/api/projects/:id', handler: updateProject },
  { method: 'PATCH', path: '/api/projects/:id', handler: updateProject },
  { method: 'DELETE', path: '/api/projects/:id', handler: deleteProject },
];

/** Dùng trong kiểm thử để đưa kho về trạng thái rỗng ban đầu. */
export function _resetStore() {
  store.clear();
}
