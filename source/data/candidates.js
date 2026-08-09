/**
 * Kho hồ sơ ứng viên giả lập — 24 người.
 *
 * Nguyên tắc dữ liệu (mục 3.1 đề bài):
 * - Mỗi ứng viên có 2–5 kỹ năng. KHÔNG giả định quan hệ 1-1 giữa người và kỹ năng.
 * - Dữ liệu hoàn toàn giả lập, minh bạch, không lấy từ người thật.
 * - Không có trường dân tộc, tôn giáo, quan điểm chính trị, giới tính —
 *   do đó không thể tồn tại bộ lọc nào dựa trên chúng.
 *
 * Phân bố kỹ năng có chủ đích để dựng được cả ba kịch bản demo:
 *   Security      : 1 người   (c04)          → dễ tạo tình huống vô nghiệm
 *   Mobile        : 2 người   (c08, c10)     → ràng buộc rất chặt
 *   Data/ML       : 3 người
 *   Quản lý dự án : 3 người
 *   Frontend      : 9 người                  → nhiều phương án để so sánh
 *   Backend       : 9 người
 */

export const candidates = [
  {
    id: 'c01',
    name: 'Nguyễn Minh Anh',
    year: 3,
    skills: [
      { skill: 'Frontend', level: 3 },
      { skill: 'UI/UX Design', level: 2 },
      { skill: 'Thuyết trình', level: 1 },
    ],
    preferredRoles: ['Frontend'],
    hoursPerWeek: 20,
    available: true,
    note: 'Đã làm 3 dự án web cho câu lạc bộ',
  },
  {
    id: 'c02',
    name: 'Trần Quốc Bảo',
    year: 4,
    skills: [
      { skill: 'Backend', level: 3 },
      { skill: 'Database', level: 2 },
      { skill: 'DevOps', level: 2 },
    ],
    preferredRoles: ['Backend', 'DevOps'],
    hoursPerWeek: 25,
    available: true,
    note: 'Thực tập backend 6 tháng',
  },
  {
    id: 'c03',
    name: 'Lê Thị Cẩm',
    year: 2,
    skills: [
      { skill: 'UI/UX Design', level: 3 },
      { skill: 'Frontend', level: 1 },
    ],
    preferredRoles: ['UI/UX Design'],
    hoursPerWeek: 15,
    available: true,
    note: 'Thành thạo Figma, có portfolio riêng',
  },
  {
    id: 'c04',
    name: 'Phạm Đức Duy',
    year: 4,
    skills: [
      { skill: 'DevOps', level: 3 },
      { skill: 'Backend', level: 2 },
      { skill: 'Security', level: 2 },
    ],
    preferredRoles: ['DevOps'],
    hoursPerWeek: 18,
    available: true,
    note: 'Người duy nhất trong kho có kỹ năng Security',
  },
  {
    id: 'c05',
    name: 'Hoàng Thu Hà',
    year: 3,
    skills: [
      { skill: 'Data/ML', level: 3 },
      { skill: 'Database', level: 2 },
      { skill: 'Backend', level: 1 },
    ],
    preferredRoles: ['Data/ML'],
    hoursPerWeek: 22,
    available: true,
    note: 'Nghiên cứu học máy tại phòng lab',
  },
  {
    id: 'c06',
    name: 'Vũ Gia Huy',
    year: 1,
    skills: [
      { skill: 'Frontend', level: 2 },
      { skill: 'QA & Testing', level: 1 },
    ],
    preferredRoles: ['Frontend'],
    hoursPerWeek: 12,
    available: true,
    note: 'Năm nhất, học nhanh, thời gian hạn chế',
  },
  {
    id: 'c07',
    name: 'Đặng Khánh Linh',
    year: 3,
    skills: [
      { skill: 'Product/BA', level: 3 },
      { skill: 'Thuyết trình', level: 3 },
      { skill: 'Quản lý dự án', level: 2 },
    ],
    preferredRoles: ['Product/BA'],
    hoursPerWeek: 20,
    available: true,
    note: 'Từng dẫn dắt đội thi khởi nghiệp',
  },
  {
    id: 'c08',
    name: 'Bùi Tuấn Kiệt',
    year: 2,
    skills: [
      { skill: 'Mobile', level: 3 },
      { skill: 'Frontend', level: 2 },
    ],
    preferredRoles: ['Mobile'],
    hoursPerWeek: 16,
    available: true,
    note: 'Đã phát hành 2 ứng dụng Android',
  },
  {
    id: 'c09',
    name: 'Ngô Phương Mai',
    year: 4,
    skills: [
      { skill: 'Backend', level: 3 },
      { skill: 'QA & Testing', level: 2 },
      { skill: 'Database', level: 1 },
    ],
    preferredRoles: ['Backend'],
    hoursPerWeek: 24,
    available: true,
    note: 'Cẩn thận, thích viết kiểm thử',
  },
  {
    id: 'c10',
    name: 'Đỗ Nhật Nam',
    year: 2,
    skills: [
      { skill: 'Frontend', level: 3 },
      { skill: 'Mobile', level: 1 },
    ],
    preferredRoles: ['Frontend'],
    hoursPerWeek: 14,
    available: true,
    note: 'Mạnh về hiệu năng giao diện',
  },
  {
    id: 'c11',
    name: 'Trịnh Bảo Ngọc',
    year: 3,
    skills: [
      { skill: 'QA & Testing', level: 3 },
      { skill: 'Database', level: 2 },
      { skill: 'Thuyết trình', level: 1 },
    ],
    preferredRoles: ['QA & Testing'],
    hoursPerWeek: 18,
    available: true,
    note: 'Chuyên tìm lỗi biên',
  },
  {
    id: 'c12',
    name: 'Lý Thanh Phong',
    year: 4,
    skills: [
      { skill: 'Quản lý dự án', level: 3 },
      { skill: 'Product/BA', level: 2 },
      { skill: 'Thuyết trình', level: 2 },
    ],
    preferredRoles: ['Quản lý dự án'],
    hoursPerWeek: 20,
    available: true,
    note: 'Quen làm việc theo sprint',
  },
  {
    id: 'c13',
    name: 'Cao Minh Quân',
    year: 1,
    skills: [
      { skill: 'Backend', level: 2 },
      { skill: 'Database', level: 1 },
    ],
    preferredRoles: ['Backend'],
    hoursPerWeek: 10,
    available: true,
    note: 'Năm nhất, quỹ thời gian thấp nhất kho',
  },
  {
    id: 'c14',
    name: 'Dương Thuỳ Trang',
    year: 3,
    skills: [
      { skill: 'UI/UX Design', level: 3 },
      { skill: 'Thuyết trình', level: 2 },
      { skill: 'Product/BA', level: 1 },
    ],
    preferredRoles: ['UI/UX Design', 'Thuyết trình'],
    hoursPerWeek: 19,
    available: true,
    note: 'Vừa thiết kế vừa trình bày được',
  },
  {
    id: 'c15',
    name: 'Phan Anh Tú',
    year: 2,
    skills: [
      { skill: 'DevOps', level: 2 },
      { skill: 'Backend', level: 1 },
      { skill: 'QA & Testing', level: 1 },
    ],
    preferredRoles: ['DevOps'],
    hoursPerWeek: 15,
    available: true,
    note: 'Tự dựng máy chủ cá nhân',
  },
  {
    id: 'c16',
    name: 'Hồ Bích Vân',
    year: 4,
    skills: [
      { skill: 'Data/ML', level: 3 },
      { skill: 'Database', level: 3 },
      { skill: 'Backend', level: 2 },
    ],
    preferredRoles: ['Data/ML', 'Database'],
    hoursPerWeek: 26,
    available: true,
    note: 'Quỹ thời gian cao nhất kho',
  },
  {
    id: 'c17',
    name: 'Mai Hoàng Sơn',
    year: 3,
    skills: [
      { skill: 'Frontend', level: 3 },
      { skill: 'QA & Testing', level: 2 },
      { skill: 'UI/UX Design', level: 1 },
    ],
    preferredRoles: ['Frontend'],
    hoursPerWeek: 21,
    available: true,
    note: 'Làm được cả kiểm thử giao diện',
  },
  {
    id: 'c18',
    name: 'Tạ Diệu Linh',
    year: 2,
    skills: [
      { skill: 'Thuyết trình', level: 3 },
      { skill: 'Product/BA', level: 2 },
    ],
    preferredRoles: ['Thuyết trình'],
    hoursPerWeek: 13,
    available: true,
    note: 'Giải nhất cuộc thi hùng biện cấp trường',
  },
  {
    id: 'c19',
    name: 'Chu Văn Hùng',
    year: 4,
    skills: [
      { skill: 'Database', level: 3 },
      { skill: 'Backend', level: 2 },
      { skill: 'DevOps', level: 1 },
    ],
    preferredRoles: ['Database'],
    hoursPerWeek: 23,
    available: true,
    note: 'Tối ưu truy vấn tốt',
  },
  {
    id: 'c20',
    name: 'Lâm Khả Ái',
    year: 1,
    skills: [
      { skill: 'UI/UX Design', level: 2 },
      { skill: 'Frontend', level: 1 },
    ],
    preferredRoles: ['UI/UX Design'],
    hoursPerWeek: 11,
    available: true,
    note: 'Năm nhất, đang học thiết kế',
  },
  {
    id: 'c21',
    name: 'Đinh Trọng Nghĩa',
    year: 3,
    skills: [
      { skill: 'Quản lý dự án', level: 2 },
      { skill: 'Thuyết trình', level: 2 },
      { skill: 'Product/BA', level: 1 },
    ],
    preferredRoles: ['Quản lý dự án'],
    hoursPerWeek: 17,
    available: true,
    note: 'Điều phối tốt, không code',
  },
  {
    id: 'c22',
    name: 'Nguyễn Hải Yến',
    year: 2,
    skills: [
      { skill: 'QA & Testing', level: 2 },
      { skill: 'Frontend', level: 1 },
      { skill: 'Database', level: 1 },
    ],
    preferredRoles: ['QA & Testing'],
    hoursPerWeek: 14,
    available: true,
    note: 'Viết tài liệu kiểm thử rõ ràng',
  },
  {
    id: 'c23',
    name: 'Võ Thành Đạt',
    year: 4,
    skills: [
      { skill: 'Backend', level: 3 },
      { skill: 'DevOps', level: 2 },
      { skill: 'Data/ML', level: 2 },
    ],
    preferredRoles: ['Backend'],
    hoursPerWeek: 27,
    available: true,
    note: 'Toàn diện phía máy chủ',
  },
  {
    id: 'c24',
    name: 'Trương Mỹ Duyên',
    year: 1,
    skills: [
      { skill: 'Frontend', level: 2 },
      { skill: 'Thuyết trình', level: 1 },
    ],
    preferredRoles: ['Frontend'],
    hoursPerWeek: 12,
    available: true,
    note: 'Năm nhất, nhiệt tình',
  },
];

/** Tìm một ứng viên theo id. Trả về undefined nếu không có. */
export function findCandidate(id) {
  return candidates.find((c) => c.id === id);
}

/** Mức thành thạo của một ứng viên ở một kỹ năng; 0 nghĩa là không có kỹ năng đó. */
export function levelOf(candidate, skill) {
  return candidate.skills.find((s) => s.skill === skill)?.level ?? 0;
}
