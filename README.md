# SquadFit — Ghép đội hackathon sinh viên theo ràng buộc đa biến

> ⬜ **CẦN ĐIỀN:** tên sản phẩm "SquadFit" là đề xuất tạm. Nếu đội chốt tên khác,
> sửa tiêu đề trên và mọi chỗ xuất hiện tên trong tệp này.

**SquadFit** là công cụ web giúp người tổ chức hackathon sinh viên tự động lập
đội hình tối ưu từ kho hồ sơ ứng viên: khai báo mục tiêu dự án cùng các năng lực
bắt buộc, hệ thống duyệt các tổ hợp hợp lệ, đề xuất phương án tốt nhất và giải
thích rõ vì sao chọn phương án đó — ai đảm nhận yêu cầu nào, yêu cầu nào đã được
phủ, và khi vô nghiệm thì đang thiếu hụt chính xác năng lực gì.

| | |
|---|---|
| **Đội** | ronaldosiuuu |
| **Tên đăng nhập** | ronaldo-siuuu-cc6z |
| **Cuộc thi** | SPD Challenge 2026 — Trường Đại học Khoa học tự nhiên, ĐHQG-HCM |
| **Repository** | ⬜ **CẦN ĐIỀN:** link GitHub công khai sau khi push |
| **Video demo** | ⬜ **CẦN ĐIỀN:** link video demo (tối đa 3 phút) |
| **Ngày thực hiện** | 09/08/2026 |

---

## 1. Bài toán mà sản phẩm giải quyết

Khi thành lập một đội làm dự án — hackathon, đồ án môn học, khóa luận, nhóm
nghiên cứu — điều tồi tệ nhất là đội hình có những nhiệm vụ mà **không thành
viên nào làm được**. Việc ghép đội thủ công thường dựa vào quen biết và cảm
tính, dẫn tới ba vấn đề:

- **Lỗ hổng năng lực không ai phát hiện** cho tới khi dự án đã chạy.
- **Trùng lặp năng lực** — bốn người cùng làm được frontend, không ai làm được
  triển khai.
- **Không giải thích được lựa chọn** — người bị loại không biết vì sao, người tổ
  chức không bảo vệ được quyết định.

Bài toán bản chất là **phủ tập hợp có ràng buộc đa biến**: chọn một nhóm không
trùng người, không vượt quá giới hạn quân số, phủ 100% năng lực yêu cầu, đồng
thời thỏa mãn tuyệt đối các ràng buộc bổ sung (thời gian rảnh, vai trò, mức độ
thành thạo tối thiểu…).

**Bối cảnh cụ thể** SquadFit chọn: ban tổ chức một hackathon sinh viên có kho hồ
sơ đăng ký cá nhân, cần ghép các thí sinh lẻ thành những đội cân bằng năng lực
trước giờ khai mạc.

**Đối tượng người dùng:** ban tổ chức hackathon, trợ giảng phân nhóm đồ án, và
sinh viên tự tìm đồng đội còn thiếu.

**Nguyên tắc dữ liệu:** toàn bộ hồ sơ là dữ liệu giả lập minh bạch. Hệ thống
**không** có và **không** cho phép bộ lọc dựa trên thông tin nhạy cảm (dân tộc,
tôn giáo, quan điểm chính trị, giới tính).

---

## 2. Danh sách tính năng chính

| # | Tính năng | Trạng thái |
|---|---|---|
| 1 | **Khai báo mục tiêu dự án**: tên dự án, danh sách năng lực bắt buộc, giới hạn quân số, các ràng buộc bổ sung | ⬜ chưa làm |
| 2 | **Kho ứng viên**: tối thiểu 20 hồ sơ giả lập, mỗi ứng viên có **nhiều năng lực** kèm mức thành thạo — không giả định quan hệ 1-1 giữa người và kỹ năng | ⬜ chưa làm |
| 3 | **Khám phá & lọc ứng viên**: tìm theo tên, lọc theo năng lực và tình trạng khả dụng | ⬜ chưa làm |
| 4 | **Đề xuất đội hình**: duyệt tổ hợp có cắt tỉa, trả về tối đa 3 phương án hợp lệ được xếp hạng | ⬜ chưa làm |
| 5 | **Báo cáo giải thích**: phủ năng lực theo từng yêu cầu, phân bổ vai trò (ai đảm nhận yêu cầu nào), lý do phương án được xếp trên các phương án còn lại | ⬜ chưa làm |
| 6 | **Cập nhật động**: mọi thay đổi ứng viên hoặc ràng buộc đều tính lại từ đầu; kết quả không còn hợp lệ bị loại bỏ ngay lập tức | ⬜ chưa làm |
| 7 | **Xử lý vô nghiệm**: chỉ rõ năng lực nào không ai đáp ứng và ràng buộc nào loại hết tổ hợp — không tự tạo dữ liệu giả, không lặp thành viên, không treo vô hạn, không màn hình trắng | ⬜ chưa làm |

> ⬜ **CẦN ĐIỀN:** cập nhật cột Trạng thái thành ✅ khi từng tính năng hoàn thành,
> và bổ sung ảnh chụp màn hình nếu kịp.

**Ràng buộc mà một phương án hợp lệ luôn thỏa mãn:**

1. Không lặp lại cùng một cá nhân trong đội.
2. Tổng số nhân sự nằm trong giới hạn quy định.
3. Tập hợp thành viên phủ 100% các năng lực được yêu cầu.
4. Thỏa mãn tuyệt đối các ràng buộc bổ sung.

---

## 3. Công nghệ và các phụ thuộc được sử dụng

| Thành phần | Công nghệ | Lý do chọn |
|---|---|---|
| Backend / static server | **Node.js ≥ 18**, module `node:http` + `node:fs` có sẵn | Không cần cài gì, không có bước build, không phụ thuộc mạng |
| Frontend | **HTML + CSS + JavaScript thuần (ES Modules)** | Chạy trực tiếp trên trình duyệt, không bundler nên không có toolchain để hỏng |
| Lưu trữ dữ liệu | **JSON / JavaScript module tĩnh** (`source/data/`) | Đề bài cho phép dùng JSON hoặc Local Storage thay cho database |
| Thuật toán | Duyệt tổ hợp có cắt tỉa + hàm chấm điểm, viết tay | Đảm bảo tối ưu thật trên quy mô dữ liệu này và giải thích được kết quả |

**Phụ thuộc bên ngoài: KHÔNG CÓ.**

`dependencies` và `devDependencies` trong [`package.json`](./package.json) đều
rỗng — đây là chủ ý, không phải thiếu sót. Dự án chạy được chỉ với Node.js cài
sẵn trên máy, **không cần `npm install`**, không cần kết nối mạng.

**Yêu cầu hệ thống:** Node.js phiên bản 18 trở lên và một trình duyệt hiện đại
(Chrome, Edge, Firefox bản mới). Đã kiểm thử trên Windows 11.
⬜ **CẦN ĐIỀN:** bổ sung phiên bản Node cụ thể đã dùng (`node --version`) và các
trình duyệt đã kiểm thử thật.

---

## 4. Hướng dẫn cài đặt và chạy dự án

### Cài đặt

```bash
git clone <URL-REPOSITORY>
cd ronaldosiuuu_ronaldo-siuuu-cc6z
```

Không có bước cài phụ thuộc. Dự án không dùng thư viện bên ngoài nào.

### Chạy

```bash
npm start
```

hoặc tương đương, không cần npm:

```bash
node source/server.js
```

Sau đó mở trình duyệt tại **http://localhost:3000**.

Đổi cổng bằng biến môi trường `PORT`:

```bash
PORT=8080 node source/server.js        # macOS / Linux / Git Bash
$env:PORT=8080; node source/server.js  # Windows PowerShell
```

> **Lưu ý:** cần chạy qua server, không mở thẳng `index.html` bằng cách nhấp đúp.
> Frontend dùng ES Modules nên trình duyệt sẽ chặn nếu tải qua giao thức `file://`.

### Kiểm tra nhanh hệ thống đang sống

```bash
curl http://localhost:3000/api/health
```

Kết quả mong đợi: `{"ok":true,"uptime":<số giây>}`

### Chạy kiểm thử

```bash
npm test
```

⬜ **CẦN ĐIỀN:** mô tả các bộ test đã viết, hoặc ghi rõ "chưa có test tự động"
nếu tới giờ đóng băng vẫn chưa kịp viết.

### Biến môi trường

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `PORT` | Không | `3000` | Cổng của static server |

Hiện dự án **không cần khóa bí mật hay tệp `.env`**. Nếu về sau có phát sinh, tạo
`.env` từ tệp mẫu `.env.example`; `.env` đã được [`.gitignore`](./.gitignore)
loại trừ và **không bao giờ được commit**.

---

## 5. Mô tả cấu trúc thư mục

```
ronaldosiuuu_ronaldo-siuuu-cc6z/
├── README.md              # Tài liệu này
├── chatlog.md             # Toàn bộ lịch sử tương tác với AI, tham chiếu chéo tới commit
├── submission.json        # Tệp khai báo cấu trúc cho hệ thống chấm tự động
├── .gitignore             # Loại trừ khóa bí mật, biến môi trường, phụ thuộc, build output
├── package.json           # Tệp khai báo phụ thuộc và các lệnh chạy
└── source/                # Toàn bộ mã nguồn
    ├── server.js          # Static server bằng node:http, phục vụ source/public/
    ├── core/              # Logic nghiệp vụ thuần, không phụ thuộc DOM
    │   ├── solver.js      # Duyệt tổ hợp, kiểm tra ràng buộc, chấm điểm phương án
    │   └── explain.js     # Sinh báo cáo giải thích từ kết quả của solver
    ├── data/
    │   └── candidates.js  # Kho hồ sơ ứng viên giả lập (≥ 20 hồ sơ)
    └── public/            # Frontend tĩnh do server phục vụ
        ├── index.html     # Trang chính
        ├── styles.css     # Giao diện
        └── app.js         # Kết nối UI với core, xử lý cập nhật động
```

> ⬜ **CẦN ĐIỀN:** `source/core/`, `source/data/` và cấu trúc chi tiết của
> `source/public/` là thiết kế dự kiến, chưa được tạo tại thời điểm viết tệp này.
> Cập nhật lại cây thư mục cho khớp thực tế trước khi nộp.

**Nguyên tắc tách lớp:** `source/core/` là các hàm thuần — nhận dữ liệu vào, trả
kết quả ra, không đụng tới DOM và không giữ trạng thái. Nhờ vậy mỗi lần dữ liệu
hay ràng buộc thay đổi, hệ thống tính lại từ đầu và không thể còn sót kết quả cũ
đã hết hợp lệ.

---

## 6. Đội thi và vai trò thành viên

**Tên đội: ronaldosiuuu**

| Thành viên | Vai trò | Công việc phụ trách |
|---|---|---|
| **Ngô Thuận An** | Kỹ sư Điều phối AI | Viết prompt điều khiển AI sinh mã, thao tác repository, tạo commit, xuất và duy trì `chatlog.md` |
| **Nguyễn Nhật Vy** | Kỹ sư Trình bày | Sản xuất video demo độc lập (tối đa 3 phút), bám 5 checkpoint theo yêu cầu đề thi |

---

## 7. Tuyên bố về việc sử dụng AI

Theo luật cuộc thi, **toàn bộ mã nguồn trong dự án này do AI sinh**. Thành viên
trong đội không gõ hay chỉnh sửa thủ công bất kỳ dòng mã nào. Mọi thay đổi đều đi
qua prompt gửi cho AI.

Toàn bộ lịch sử tương tác — bao gồm cả những prompt bị từ chối và không tạo ra
commit nào — được ghi trong [`chatlog.md`](./chatlog.md), có đánh số lượt liên
tục, timestamp, nhãn phân biệt từng AI và tham chiếu chéo tới mã commit tương ứng.

---

## 8. Hạn chế đã biết và hướng phát triển

⬜ **CẦN ĐIỀN sau khi đóng băng tính năng lúc 18:00:** liệt kê những gì chưa làm
được và lý do (ví dụ: chưa có kiểm thử tự động, chưa lưu trạng thái giữa các phiên,
chưa hỗ trợ ghép nhiều đội song song), kèm hướng phát triển nếu có thêm thời gian.

## 9. Giấy phép

⬜ **CẦN ĐIỀN:** chọn giấy phép (gợi ý: MIT) hoặc ghi rõ "Chỉ dùng cho mục đích
dự thi SPD Challenge 2026".
