/**
 * Dữ liệu tham chiếu tải một lần lúc khởi động: kho ứng viên và bộ kỹ năng.
 *
 * Đây KHÔNG phải trạng thái nghiệp vụ — dự án nằm trên máy chủ, kết quả tính
 * toán không bao giờ được lưu. Chỗ này chỉ tránh gọi lại /api/candidates ở mỗi
 * lần chuyển trang.
 */
export const store = {
  candidates: [],
  skills: [],
  levels: [],
};

export function findCandidate(id) {
  return store.candidates.find((c) => c.id === id);
}
