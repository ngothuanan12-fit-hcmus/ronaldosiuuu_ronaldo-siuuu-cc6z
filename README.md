# SquadFit — Ghép đội hackathon sinh viên theo ràng buộc đa biến

**SquadFit** là công cụ web giúp ban tổ chức hackathon sinh viên tự động lập đội hình tối ưu
từ một kho ứng viên: khai báo đề bài cùng các năng lực bắt buộc và ràng buộc, hệ thống duyệt
toàn bộ tổ hợp hợp lệ trên máy chủ, xếp hạng và **giải thích rõ vì sao chọn phương án đó** —
ai đảm nhận yêu cầu nào, ai dự phòng, phương án này hơn phương án kia ở điểm gì. Khi không có
đội hình nào thoả mãn, hệ thống chỉ ra chính xác đang thiếu hụt năng lực hoặc ràng buộc nào.

| | |
|---|---|
| **Đội** | ronaldosiuuu |
| **Tên đăng nhập** | ronaldo-siuuu-cc6z |
| **Cuộc thi** | SPD Challenge 2026 — Trường Đại học Khoa học tự nhiên, ĐHQG-HCM |
| **Repository** | https://github.com/ngothuanan12-fit-hcmus/ronaldosiuuu_ronaldo-siuuu-cc6z |
| **Video demo** | ⬜ **CẦN ĐIỀN** — link video demo (tối đa 3 phút) |
| **Ngày thực hiện** | 09/08/2026 |

---

## 1. Bài toán mà sản phẩm giải quyết

Khi thành lập một đội làm dự án, điều tồi tệ nhất là đội hình có những nhiệm vụ mà **không thành
viên nào làm được**. Việc ghép đội thủ công thường dựa vào quen biết và cảm tính, dẫn tới ba
vấn đề:

- **Lỗ hổng năng lực không ai phát hiện** cho tới khi dự án đã chạy.
- **Trùng lặp năng lực** — bốn người cùng làm được frontend, không ai triển khai được hệ thống.
- **Không giải thích được lựa chọn** — người bị loại không biết vì sao, người tổ chức không bảo
  vệ được quyết định của mình.

Bản chất đây là bài toán **phủ tập hợp có ràng buộc đa biến**. Với 24 ứng viên và đội 3–5 người,
số tổ hợp cần cân nhắc lên tới hàng chục nghìn — không thể duyệt bằng tay, và chính vì thế người
ta chọn theo cảm tính.

**Bối cảnh cụ thể:** ban tổ chức một hackathon sinh viên mở đăng ký cá nhân, cần ghép các thí
sinh lẻ thành những đội cân bằng năng lực trước giờ khai mạc.

**Đối tượng người dùng:** thành viên ban tổ chức phụ trách phân đội. Người dùng phụ: trợ giảng
phân nhóm đồ án, sinh viên tự tìm đồng đội còn thiếu.

**Nguyên tắc dữ liệu:** toàn bộ hồ sơ là dữ liệu giả lập minh bạch. Hệ thống **không lưu và
không cho phép lọc** theo bất kỳ thông tin nhạy cảm nào (dân tộc, tôn giáo, quan điểm chính trị,
giới tính) — không tồn tại trường dữ liệu nào như vậy trong mã nguồn.

## 2. Danh sách tính năng chính

| # | Tính năng | Trạng thái |
|---|---|---|
| 1 | **Quản lý dự án** — tạo, sửa, xoá; mỗi dự án là một đề bài kèm yêu cầu và ràng buộc riêng | ✅ |
| 2 | **Kho ứng viên** — 24 hồ sơ giả lập, mỗi người **2–5 kỹ năng** kèm mức thành thạo; không giả định quan hệ 1-1 giữa người và kỹ năng | ✅ |
| 3 | **Khám phá & lọc ứng viên** — tìm theo tên, lọc theo kỹ năng, bật/tắt khả dụng từng người | ✅ |
| 4 | **Ràng buộc bắt buộc có / loại trừ** — nhấn tên ứng viên để đổi giữa ba trạng thái | ✅ |
| 5 | **Đề xuất đội hình** — duyệt tổ hợp có cắt tỉa trên máy chủ, trả về tối đa 3 phương án xếp hạng | ✅ |
| 6 | **Báo cáo giải thích** — phủ năng lực theo từng yêu cầu, phân bổ vai trò, bảng điểm 5 tiêu chí và câu so sánh với các phương án xếp sau | ✅ |
| 7 | **Cập nhật động** — mọi thay đổi đều tính lại từ đầu; kết quả hết hợp lệ biến mất ngay | ✅ |
| 8 | **Xử lý vô nghiệm** — chỉ rõ năng lực nào không ai đáp ứng, ràng buộc nào loại hết tổ hợp, và tổ hợp gần nhất còn thiếu gì | ✅ |
| 9 | Trang chốt đội hình in được | ⬜ chưa làm — xem mục 8 |

**Bốn điều kiện mà một phương án hợp lệ luôn thoả mãn** (mục 3.2 đề bài), kiểm tra đúng thứ tự:

1. Không lặp lại cùng một cá nhân trong đội.
2. Tổng số nhân sự nằm trong khoảng `teamSize.min` – `teamSize.max`.
3. Tập hợp thành viên phủ **100%** các năng lực được yêu cầu, ở mức `≥ minLevel`.
4. Thoả mãn tuyệt đối các ràng buộc bổ sung: tổng giờ cam kết, số người trình bày, danh sách
   bắt buộc có mặt, danh sách loại trừ.

Vi phạm bất kỳ điều nào → loại. Không có "gần đúng", không cho điểm một phần.

## 3. Công nghệ và các phụ thuộc được sử dụng

| Thành phần | Công nghệ | Lý do chọn |
|---|---|---|
| Máy chủ | **Node.js ≥ 18**, module `node:http`, `node:fs`, `node:crypto` có sẵn | Không cần cài gì, không có bước build, không phụ thuộc mạng |
| Frontend | **HTML + CSS + JavaScript thuần (ES Modules)** | Chạy trực tiếp trên trình duyệt, không bundler nên không có toolchain để hỏng |
| Điều hướng | Hash routing tự viết | 4 tuyến đường, không đáng để kéo về một thư viện |
| Lưu trữ dự án | `Map` trong bộ nhớ tiến trình máy chủ | Đề bài cho phép không dùng database; xem đánh đổi ở mục 6 |
| Kho ứng viên | Module JavaScript tĩnh (`source/data/`) | Dữ liệu giả lập cố định, không cần ghi |
| Thuật toán | Duyệt tổ hợp có cắt tỉa + hàm chấm điểm, viết tay | Đảm bảo tối ưu thật trên quy mô này, và giải thích được kết quả |

**Phụ thuộc bên ngoài: KHÔNG CÓ.**

`dependencies` và `devDependencies` trong [`package.json`](./package.json) đều rỗng — đây là
chủ ý, không phải thiếu sót. Dự án chạy được chỉ với Node.js cài sẵn, **không cần `npm install`**,
không cần kết nối mạng. Giao diện không tải font, ảnh, icon hay thư viện nào từ CDN.

**Yêu cầu hệ thống:** Node.js phiên bản 18 trở lên và một trình duyệt hiện đại hỗ trợ ES Modules
(Chrome, Edge, Firefox bản mới). Đã phát triển và kiểm thử trên **Windows 11 với Node.js
v24.11.0 và npm 11.6.1**.

## 4. Hướng dẫn cài đặt và chạy dự án

### Cài đặt

```bash
git clone https://github.com/ngothuanan12-fit-hcmus/ronaldosiuuu_ronaldo-siuuu-cc6z.git
cd ronaldosiuuu_ronaldo-siuuu-cc6z
```

**Không có bước cài phụ thuộc.** Dự án không dùng thư viện bên ngoài nào.

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
PORT=8080 node source/server.js         # macOS / Linux / Git Bash
$env:PORT=8080; node source/server.js   # Windows PowerShell
```

> **Lưu ý:** phải chạy qua máy chủ, không mở thẳng `index.html` bằng cách nhấp đúp. Frontend
> dùng ES Modules nên trình duyệt sẽ chặn nếu tải qua giao thức `file://`.

### Luồng sử dụng

1. Mở app — danh sách dự án **rỗng**. Nhấn **Tạo dự án đầu tiên**.
2. Điền tên đề bài, thêm các năng lực bắt buộc kèm mức tối thiểu, đặt quân số và ràng buộc.
3. Nhấn **Tạo dự án** — hệ thống chuyển vào không gian làm việc và tính đội hình ngay.
4. Đọc báo cáo giải thích ở cột phải; chuyển giữa 3 phương án bằng các tab.
5. Bật/tắt ứng viên hoặc nhấn tên để đặt bắt buộc/loại trừ — kết quả cập nhật lập tức.
6. Nếu không có phương án nào, đọc khối chẩn đoán để biết cần nới điều kiện nào.

### Kiểm thử

```bash
npm run check        # kiểm tra cấu trúc bài nộp, 31 điều kiện
npm run try:solver   # chạy lõi thuật toán: 3 kịch bản + 8 ca biên, KHÔNG cần máy chủ
npm run try:api      # tự khởi động máy chủ, chạy 45 ca kiểm thử API, rồi tắt
npm test             # bộ test node:test (hiện chưa có tệp test nào)
```

`npm run try:solver` chạy được mà không khởi động máy chủ — đây chính là bằng chứng cho quyết
định kiến trúc ở mục 6: tầng `domain/` không phụ thuộc HTTP.

### Biến môi trường

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `PORT` | Không | `3000` | Cổng của máy chủ |

**Để chạy sản phẩm, không cần khóa bí mật hay tệp `.env` nào.** [`.gitignore`](./.gitignore) đã
chặn sẵn mọi dạng tệp môi trường, khóa, chứng chỉ và thông tin xác thực để không bao giờ có nguy
cơ rò rỉ.

#### Công cụ thiết kế (không cần để chạy sản phẩm)

Repository có tệp [`.mcp.json.example`](./.mcp.json.example) khai báo một MCP server dùng lúc
*phát triển* để sinh giao diện. Bản thật `.mcp.json` **nằm trong `.gitignore` và không bao giờ
được commit**, vì trường `env` của nó chứa API key.

Người muốn dùng công cụ đó sao chép tệp mẫu thành `.mcp.json`, rồi đặt khóa của mình theo một
trong hai cách, **cả hai đều không đưa khóa vào repository**:

```bash
# Cách 1 — đặt biến môi trường rồi mới mở Claude Code (khuyến nghị, không ghi gì lên đĩa)
$env:STITCH_API_KEY = "khoa-cua-ban"    # Windows PowerShell
export STITCH_API_KEY="khoa-cua-ban"    # macOS / Linux / Git Bash
```

Cách 2: đặt trực tiếp vào `.mcp.json` — chấp nhận được vì tệp đó đã bị `.gitignore` chặn, nhưng
khóa vẫn nằm dạng văn bản thường trên đĩa. Cách 1 an toàn hơn.

Lưu ý: `stitch-mcp-server` là gói của **bên thứ ba**, không phải gói chính thức của Google, và
khóa API sẽ được truyền vào gói này.

## 5. Mô tả cấu trúc thư mục

```
ronaldosiuuu_ronaldo-siuuu-cc6z/
├── README.md                    Tài liệu này
├── chatlog.md                   Toàn bộ lịch sử tương tác với AI, tham chiếu chéo tới commit
├── submission.json              Tệp khai báo cấu trúc cho hệ thống chấm tự động
├── .gitignore                   Chặn tệp môi trường, khóa, phụ thuộc, build output
├── package.json                 Tệp khai báo phụ thuộc và các lệnh chạy
│
├── scripts/                     Công cụ kiểm thử, không thuộc sản phẩm
│   ├── check-structure.js       Kiểm tra 31 điều kiện cấu trúc bài nộp
│   ├── try-solver.js            Chạy lõi thuật toán từ dòng lệnh
│   ├── try-api.js               45 ca kiểm thử tầng API
│   └── sample-request.json      Body mẫu để gọi bằng curl
│
└── source/                      Toàn bộ mã nguồn
    ├── server.js                Dựng HTTP server, nối router, phục vụ tệp tĩnh
    │
    ├── api/                     Tầng HTTP — biết về request/response, KHÔNG biết thuật toán
    │   ├── router.js            Khớp method + đường dẫn có tham số, đọc body, bắt mọi lỗi
    │   ├── handlers.js          GET /api/candidates, /api/scenarios, /api/meta, POST /api/solve
    │   ├── projects.js          CRUD dự án, kho Map trong bộ nhớ
    │   ├── validation.js        Kiểm tra hình dạng dữ liệu, dùng chung cho solve và projects
    │   └── http-error.js        Kiểu lỗi có mã trạng thái và thông báo tiếng Việt
    │
    ├── domain/                  Tầng nghiệp vụ — hàm thuần, KHÔNG biết HTTP tồn tại
    │   ├── solver.js            Lọc, kiểm tra khả thi sớm, duyệt tổ hợp có cắt tỉa, xếp hạng
    │   ├── scoring.js           Chấm điểm 5 thành phần và sinh câu so sánh giữa các phương án
    │   ├── assignment.js        Phân vai chính và dự phòng, ưu tiên kỹ năng khan hiếm trước
    │   ├── diagnosis.js         Chẩn đoán vô nghiệm ba khối
    │   └── candidate-utils.js   Hàm thuần dùng chung
    │
    ├── data/
    │   ├── candidates.js        24 hồ sơ ứng viên giả lập
    │   ├── skills.js            12 kỹ năng cố định, 3 mức thành thạo
    │   └── scenarios.js         3 kịch bản Dễ / Khó / Vô nghiệm dùng cho kiểm thử và demo
    │
    └── public/                  Frontend tĩnh
        ├── index.html           Khung ứng dụng
        ├── styles.css           Toàn bộ giao diện, không tài nguyên từ mạng ngoài
        ├── app.js               Router hash 4 tuyến, tải dữ liệu tham chiếu, xử lý lỗi
        ├── lib/
        │   ├── api.js           Lớp gọi API dùng chung, hàm escape chống XSS
        │   └── store.js         Dữ liệu tham chiếu tải một lần
        └── views/
            ├── dashboard.js     Danh sách dự án và trạng thái rỗng
            ├── project-form.js  Form tạo và sửa dự án
            └── workspace.js     Kho ứng viên, kết quả, báo cáo giải thích
```

## 6. Kiến trúc và các quyết định đánh đổi

### Toàn bộ thuật toán chạy trên máy chủ

Frontend **không chứa một dòng logic nghiệp vụ nào**. Nó gọi `POST /api/solve` và vẽ lại JSON
nhận được. Kiểm chứng: `scripts/try-solver.js` chạy đầy đủ thuật toán mà không cần khởi động
máy chủ, còn `source/public/` không import bất cứ thứ gì từ `source/domain/`.

### Hai tầng có bản chất trái ngược nhau

| | `/api/projects` | `/api/solve` |
|---|---|---|
| Trạng thái | **CÓ** — `Map` trong bộ nhớ tiến trình | **KHÔNG** — hàm thuần |
| Lưu gì | Dữ liệu người dùng nhập | Không lưu gì. Nhận vào, tính, trả ra, quên |

Đề bài (mục 3.4) yêu cầu kết quả hết hợp lệ phải bị loại bỏ **lập tức**. Cách chắc chắn nhất để
đạt điều đó không phải là viết code dọn cache cho đúng, mà là **không có cache nào để dọn**.
Mỗi thay đổi đều gọi lại `POST /api/solve` từ đầu, nên kết quả trên màn hình luôn là kết quả của
đúng dữ liệu vừa gửi đi.

**Đánh đổi:** dự án chỉ nằm trong bộ nhớ tiến trình — **khởi động lại máy chủ là mất sạch**.
Đây là chủ ý cho một prototype 6 giờ, không phải thiếu sót. Tầng lưu trữ xuống đĩa sẽ là thứ
được thêm vào đầu tiên nếu có thêm thời gian, và `domain/` không cần đổi một dòng nào vì nó
không phụ thuộc vào nguồn dữ liệu.

### Duyệt tổ hợp thay vì thuật toán tham lam

Thuật toán tham lam nhanh hơn nhưng không đảm bảo tối ưu, và quan trọng hơn là **không giải
thích được vì sao một phương án khác thua**. Duyệt tổ hợp cho cả hai. Quy mô thực tế nhỏ:
kịch bản khó nhất chỉ duyệt 6.610 tổ hợp trong khoảng 90ms.

**Bốn tầng cắt tỉa:** hết chỗ trống trong đội · kỹ năng còn thiếu không tồn tại trong phần hậu
tố · người bắt buộc đã nằm ngoài phần hậu tố · cận trên tổng giờ cam kết không đạt.

**Hai chặn cứng để không bao giờ treo:** tối đa `200.000` tổ hợp và quân số tối đa `8` người.
Chạm giới hạn thì dừng sớm và báo rõ trong `warnings`, thay vì treo trình duyệt.

## 7. Kiểm thử

| Bộ | Số ca | Kết quả |
|---|---|---|
| `npm run check` | 31 điều kiện cấu trúc bài nộp | ✅ |
| `npm run try:solver` | 3 kịch bản + 8 ca biên | ✅ 8/8 ca biên PASS |
| `npm run try:api` | 45 ca API | ✅ 45/45 PASS |

Tám ca biên của solver: không ai khả dụng · quân số min > max · quân số vượt giới hạn an toàn ·
không khai báo năng lực nào · `mustInclude` người không tồn tại · `mustInclude` trùng
`mustExclude` · yêu cầu giờ cam kết cực lớn · kho ứng viên rỗng. Không ca nào ném lỗi, treo,
hay trả về `undefined`.

**Chưa có bộ test `node:test`.** Đây là hạn chế đã biết, xem mục 8.

## 8. Đội thi và vai trò thành viên

**Tên đội: ronaldosiuuu**

| Thành viên | Vai trò | Công việc phụ trách |
|---|---|---|
| **Ngô Thuận An** | Kỹ sư Điều phối AI | Viết prompt điều khiển AI sinh mã, thao tác repository, tạo commit, xuất và duy trì `chatlog.md` |
| **Nguyễn Nhật Vy** | Kỹ sư Trình bày | Sản xuất video demo độc lập (tối đa 3 phút), bám 5 checkpoint theo yêu cầu đề thi |

## 9. Hạn chế đã biết và hướng phát triển

**Hạn chế**

1. **Không lưu xuống đĩa** — khởi động lại máy chủ là mất toàn bộ dự án. Chủ ý, xem mục 6.
2. **Chỉ ghép một đội mỗi lần** — chưa chia cả kho ứng viên thành nhiều đội song song, vốn là
   việc ban tổ chức thật sự phải làm.
3. **Kho ứng viên cố định** — chưa thêm/sửa/xoá ứng viên từ giao diện, chưa nhập từ CSV.
4. **Chưa có test tự động dạng `node:test`** — hiện dựa vào hai script kiểm thử thủ công
   `try-solver.js` và `try-api.js`. Hai script này bắt được lỗi thật (xem `chatlog.md`, lỗi E6),
   nhưng không thay thế được một bộ test có khẳng định rõ ràng.
5. **Chưa có trang chốt đội hình in được** — nằm trong kế hoạch nhưng bị cắt do hết thời gian.
6. **Không xác thực người dùng** — demo một người dùng, theo phạm vi đã chọn từ đầu.

**Hướng phát triển**

1. Tầng lưu trữ xuống đĩa hoặc SQLite — `domain/` không cần đổi dòng nào.
2. Ghép hàng loạt: chia N ứng viên thành K đội cùng lúc, tối ưu toàn cục thay vì từng đội.
3. Quản lý ứng viên đầy đủ và nhập từ CSV.
4. Bộ test `node:test` cho `domain/`, bắt đầu từ 4 điều kiện hợp lệ và các ca vô nghiệm.
5. Xuất báo cáo đội hình ra PDF để gửi cho thí sinh.
6. Thay vòng duyệt tổ hợp bằng quy hoạch nguyên khi kho ứng viên lớn hơn vài trăm người.

## 10. Tuyên bố về việc sử dụng AI

Theo luật cuộc thi, **toàn bộ mã nguồn trong dự án này do AI sinh**. Thành viên trong đội không
gõ hay chỉnh sửa thủ công bất kỳ dòng mã nào. Mọi thay đổi đều đi qua prompt gửi cho AI.

Toàn bộ lịch sử tương tác được ghi trong [`chatlog.md`](./chatlog.md), gồm: số thứ tự lượt liên
tục tính chung cho mọi AI, timestamp đối chiếu được với lịch sử commit, nhãn phân biệt từng AI,
cả những lượt không sinh commit, và **bảng ghi lại 9 lần AI sinh mã sai hoặc suy đoán nhầm** kèm
cách phát hiện và cách khắc phục.

## 11. Giấy phép

Mã nguồn được phát hành theo **giấy phép MIT** cho mục đích dự thi SPD Challenge 2026 và học tập.
