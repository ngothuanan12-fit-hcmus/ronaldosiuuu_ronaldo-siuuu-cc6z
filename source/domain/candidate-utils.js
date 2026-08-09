/**
 * Hàm tiện ích thuần cho tầng domain.
 *
 * Tầng domain KHÔNG import bất cứ thứ gì từ node:http hay từ tầng api.
 * Mọi hàm ở đây nhận object vào, trả giá trị ra, không có tác dụng phụ.
 */

/** Kỹ năng dùng để đếm số người trình bày được. */
export const PRESENTER_SKILL = 'Thuyết trình';

/** Mức thành thạo của một ứng viên ở một kỹ năng; 0 nghĩa là không có kỹ năng đó. */
export function levelOf(candidate, skill) {
  const found = candidate.skills?.find((s) => s.skill === skill);
  return found ? found.level : 0;
}

/** Ứng viên có đáp ứng một yêu cầu kỹ năng ở mức tối thiểu không. */
export function meetsRequirement(candidate, requirement) {
  return levelOf(candidate, requirement.skill) >= requirement.minLevel;
}

/** Tổng giờ cam kết của một nhóm. */
export function totalHours(members) {
  return members.reduce((sum, m) => sum + (m.hoursPerWeek ?? 0), 0);
}

/** Số thành viên có kỹ năng trình bày. */
export function countPresenters(members) {
  return members.filter((m) => levelOf(m, PRESENTER_SKILL) > 0).length;
}

/** Danh sách thành viên đáp ứng một yêu cầu, giữ nguyên thứ tự đầu vào. */
export function qualifiedFor(members, requirement) {
  return members.filter((m) => meetsRequirement(m, requirement));
}
