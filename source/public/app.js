const statusEl = document.getElementById('status');

try {
  const res = await fetch('/api/health');
  const data = await res.json();
  if (data.ok) {
    statusEl.textContent = `Server hoạt động · uptime ${data.uptime.toFixed(1)}s`;
    statusEl.classList.add('ok');
  } else {
    statusEl.textContent = 'Server trả về trạng thái không hợp lệ';
  }
} catch (err) {
  statusEl.textContent = `Không kết nối được server: ${err.message}`;
}
