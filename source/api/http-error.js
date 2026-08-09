/**
 * Lỗi có mã trạng thái HTTP kèm thông báo tiếng Việt cho người dùng cuối.
 *
 * Tầng domain không bao giờ ném lỗi loại này — domain không biết HTTP tồn tại.
 * Chỉ tầng api dùng, để mọi lỗi đi ra ngoài đều có cùng một hình dạng.
 */
export class HttpError extends Error {
  /**
   * @param {number} status mã trạng thái HTTP
   * @param {string} code mã lỗi ổn định cho máy đọc, ví dụ 'INVALID_BODY'
   * @param {string} message thông báo tiếng Việt cho người dùng
   * @param {Array<string>} [details] danh sách lỗi chi tiết từng trường
   */
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, 'INVALID_BODY', message, details);
export const notFound = (message) => new HttpError(404, 'NOT_FOUND', message);
export const methodNotAllowed = (message) => new HttpError(405, 'METHOD_NOT_ALLOWED', message);
export const payloadTooLarge = (message) => new HttpError(413, 'PAYLOAD_TOO_LARGE', message);
