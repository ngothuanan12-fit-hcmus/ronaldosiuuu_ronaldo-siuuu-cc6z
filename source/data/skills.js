/**
 * Bộ kỹ năng cố định và thang mức thành thạo của SquadFit.
 *
 * Không có và không được phép có bất kỳ thuộc tính nhạy cảm nào
 * (dân tộc, tôn giáo, quan điểm chính trị, giới tính) — theo mục 3.1 đề bài.
 */

/** 12 kỹ năng cố định. Mọi nơi khác phải tham chiếu về danh sách này. */
export const SKILLS = [
  'Frontend',
  'Backend',
  'Mobile',
  'Database',
  'DevOps',
  'UI/UX Design',
  'Data/ML',
  'QA & Testing',
  'Product/BA',
  'Security',
  'Thuyết trình',
  'Quản lý dự án',
];

/** Thang mức thành thạo: 1 → 3. */
export const LEVELS = [
  { level: 1, label: 'Biết cơ bản' },
  { level: 2, label: 'Thành thạo' },
  { level: 3, label: 'Chuyên sâu' },
];

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 3;

/** Trả về nhãn của một mức, hoặc chuỗi rỗng nếu mức không hợp lệ. */
export function levelLabel(level) {
  return LEVELS.find((l) => l.level === level)?.label ?? '';
}

/** Kiểm tra một tên kỹ năng có nằm trong bộ 12 kỹ năng không. */
export function isKnownSkill(skill) {
  return SKILLS.includes(skill);
}
