/**
 * Ba kịch bản mẫu — bấm một nút là nạp, để quay video không phải gõ tay.
 * Ánh xạ thẳng vào các checkpoint của video demo:
 *   'de'        → CP1, CP2, CP3, CP4
 *   'kho'       → CP3 (cho thấy ràng buộc chặt vẫn ra được phương án)
 *   'vo-nghiem' → CP5
 */

export const scenarios = [
  {
    id: 'de',
    label: 'Dễ — nhiều phương án',
    hint: 'Ràng buộc thoáng, hệ thống trả về nhiều đội hình hợp lệ để so sánh.',
    project: {
      name: 'Đề bài: Nền tảng đặt lịch khám bệnh',
      description:
        'Ứng dụng web cho phép bệnh nhân tìm phòng khám, xem lịch trống và đặt hẹn trực tuyến. Cần giao diện rõ ràng cho người lớn tuổi.',
      requiredSkills: [
        { skill: 'Frontend', minLevel: 2 },
        { skill: 'Backend', minLevel: 2 },
        { skill: 'UI/UX Design', minLevel: 1 },
      ],
      teamSize: { min: 3, max: 5 },
      constraints: {
        minTotalHours: 50,
        mustInclude: [],
        mustExclude: [],
        minPresenters: 0,
      },
    },
  },
  {
    id: 'kho',
    label: 'Khó — rất ít phương án',
    hint: 'Yêu cầu Mobile chuyên sâu và Security, mà kho chỉ có 2 người biết Mobile và 1 người biết Security.',
    project: {
      name: 'Đề bài: Ứng dụng di động cảnh báo an toàn cho sinh viên',
      description:
        'Ứng dụng di động gửi cảnh báo khẩn cấp và chia sẻ vị trí. Dữ liệu vị trí nhạy cảm nên bắt buộc phải có người phụ trách bảo mật.',
      requiredSkills: [
        { skill: 'Mobile', minLevel: 3 },
        { skill: 'Security', minLevel: 2 },
        { skill: 'Backend', minLevel: 3 },
        { skill: 'Thuyết trình', minLevel: 2 },
      ],
      teamSize: { min: 3, max: 4 },
      constraints: {
        minTotalHours: 80,
        mustInclude: [],
        mustExclude: [],
        minPresenters: 1,
      },
    },
  },
  {
    id: 'vo-nghiem',
    label: 'Vô nghiệm — không có phương án nào',
    hint: 'Yêu cầu Security mức Chuyên sâu, nhưng trong toàn kho không ai đạt mức đó.',
    project: {
      name: 'Đề bài: Hệ thống kiểm toán bảo mật hạ tầng',
      description:
        'Công cụ rà quét cấu hình hạ tầng và phát hiện lỗ hổng. Bắt buộc phải có chuyên gia bảo mật ở mức chuyên sâu.',
      requiredSkills: [
        { skill: 'Security', minLevel: 3 },
        { skill: 'DevOps', minLevel: 2 },
        { skill: 'Backend', minLevel: 2 },
      ],
      teamSize: { min: 3, max: 5 },
      constraints: {
        minTotalHours: 50,
        mustInclude: [],
        mustExclude: [],
        minPresenters: 0,
      },
    },
  },
];

/** Kịch bản nạp sẵn khi mở ứng dụng lần đầu. */
export const defaultScenarioId = 'de';

/** Tìm một kịch bản theo id. Trả về undefined nếu không có. */
export function findScenario(id) {
  return scenarios.find((s) => s.id === id);
}
