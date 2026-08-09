/** Lớp gọi API dùng chung. Mọi lỗi đều đi qua đây nên không chỗ nào quên xử lý. */

export async function api(path, options) {
  let res;
  try {
    res = await fetch(path, options);
  } catch (err) {
    throw new Error(`Không kết nối được máy chủ: ${err.message}`);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Máy chủ trả về dữ liệu không phải JSON (mã ${res.status}).`);
  }

  if (!res.ok) {
    const detail = data?.error?.details?.length ? ` (${data.error.details.join('; ')})` : '';
    throw new Error((data?.error?.message ?? `Lỗi ${res.status}`) + detail);
  }
  return data;
}

/** Thoát ký tự HTML. Mọi dữ liệu đưa vào innerHTML đều phải qua hàm này. */
export function esc(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** '2026-08-09T15:30:00.000Z' → '09/08 15:30' */
export function shortTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
