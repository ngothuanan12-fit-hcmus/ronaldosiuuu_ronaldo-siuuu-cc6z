# chatlog.md — Toàn bộ lịch sử tương tác với AI

Dự án: `ronaldosiuuu_ronaldo-siuuu-cc6z`
Phiên thi: 14:00 – 20:00 ngày 09/08/2026 (đóng băng tính năng 18:00)
Múi giờ dùng cho mọi timestamp trong tệp này: **UTC+07:00**

---

## 0. Hướng dẫn cách ghi

**Nguyên tắc chung**

- Ghi theo thứ tự thời gian, **không bao giờ sửa lại hay xóa** một lượt đã ghi.
  Nếu ghi sai, thêm một dòng `> Đính chính:` ngay dưới lượt đó.
- Số thứ tự lượt (`#N`) **liên tục và không tái sử dụng**, tính chung cho **tất cả**
  các AI. Prompt bị từ chối vẫn chiếm một số thứ tự.
- Timestamp là **thời điểm gửi prompt**, định dạng `HH:MM` (thêm giây nếu cần đối
  chiếu sát commit: `HH:MM:SS`).
- Nhãn AI — dùng đúng một trong các mã sau:

  | Mã | AI | Vai trò | Nơi chạy |
  |---|---|---|---|
  | `AGENT` | Claude Code (Opus 5) | Agent chính, sinh toàn bộ mã nguồn | IDE (VS Code) |
  | `REVIEWER` | AI phụ #1 | Review code, soát lỗi | Browser |
  | `DOCS` | AI phụ #2 | Soạn tài liệu, README, slide | Browser |

  Nếu dùng thêm AI khác, khai báo thêm một dòng vào bảng này trước khi ghi lượt đầu tiên của nó.

**Trạng thái lượt** — dùng đúng một trong:

- `ACCEPTED` — kết quả được nhận vào dự án.
- `REJECTED` — kết quả bị loại, không đưa vào dự án.
- `NO-CODE` — lượt không sinh mã (hỏi đáp, lập kế hoạch, thiết lập nguyên tắc).

**Tham chiếu commit**

- `Commit:` ghi hash ngắn 7 ký tự + subject. Nếu một lượt sinh nhiều commit, ghi
  nhiều dòng. Nếu không có commit, ghi `Commit: — (không sinh commit)` **và nêu lý do**.
- Mỗi commit chỉ nên được tham chiếu bởi đúng một lượt, để ban tổ chức đối chiếu 1-1.
- Đối chiếu ngược bất cứ lúc nào bằng:
  `git log --format=fuller --date=format:'%H:%M:%S'`

**Khuôn mẫu một lượt** — copy nguyên khối này:

```
### #N — HH:MM — `AGENT` — ACCEPTED
**Prompt:**
> (dán nguyên văn prompt đã gửi, không viết lại)

**Kết quả:** (AI đã làm gì, tệp nào được tạo/sửa)
**Commit:** `xxxxxxx` — subject
```

**Quy tắc chống nghi ngờ can thiệp thủ công**

- Mọi thay đổi mã nguồn phải truy được về một lượt trong tệp này. Không có lượt
  tương ứng = commit đó không giải trình được.
- Không gõ hay sửa code bằng tay. Nếu vô tình chạm vào file, ghi ngay một lượt
  `NO-CODE` mô tả việc đã xảy ra và cách hoàn nguyên.
- Cập nhật tệp này **ngay sau mỗi lượt**, không dồn lại ghi cuối phiên.

---

## 1. Link session chia sẻ công khai

Bằng chứng được ban tổ chức chấp nhận. Một link mỗi dòng, **theo thứ tự thời gian**.
Dán link vào cột `Link`; các cột còn lại điền cùng lúc.

| # | Khoảng thời gian | AI | Link |
|---|---|---|---|
| S1 | 14:01 – | `AGENT` | _(chờ dán)_ |
| S2 | | | |
| S3 | | | |
| S4 | | | |
| S5 | | | |

> Ghi chú: `AGENT` chạy trong IDE nên có thể không có link chia sẻ công khai; nếu
> vậy ghi `— (không có link, xem lượt #… trong tệp này)` và giữ hàng lại để không
> lệch thứ tự.

---

## 2. Prompt vàng (trình bày trong video)

Các prompt có ảnh hưởng lớn nhất tới sản phẩm — chọn ra sau, khi đã biết prompt nào
thực sự quyết định. Mỗi mục trỏ về số thứ tự lượt gốc ở mục 4.

### PV1 — lượt #… — `…`
**Prompt:**
> …

**Vì sao là prompt vàng:** …
**Nó tạo ra:** …

### PV2 — lượt #… — `…`
**Prompt:**
> …

**Vì sao là prompt vàng:** …
**Nó tạo ra:** …

---

## 3. Bảng AI sinh code sai / bịa API

Ghi mọi lần AI cho ra mã sai hoặc gọi API không tồn tại. Cột `Lượt` trỏ tới lượt gốc,
cột `Lượt sửa` trỏ tới lượt đã khắc phục.

| # | Lượt | AI | Hiện tượng | Cách phát hiện | Prompt đã dùng để sửa | Kết quả | Lượt sửa |
|---|---|---|---|---|---|---|---|
| E1 | | | | | | | |
| E2 | | | | | | | |
| E3 | | | | | | | |

---

## 4. Lịch sử lượt

### #1 — 14:01 — `AGENT` — ACCEPTED

**Prompt:**
> Tôi đang thi một hackathon từ 14:00 tới 20:00 hôm nay, luật bắt buộc toàn bộ
> mã nguồn phải do AI sinh; tôi không được gõ hay sửa code bằng tay, và không
> được commit gì sau 20:00. Việc đầu tiên tôi muốn làm là
> dựng thư mục dự án và kiểm tra đường đi từ máy tôi lên GitHub hoạt động
> được, trước khi bắt tay vào sản phẩm.
>
> Hãy làm tuần tự và báo cáo từng bước:
>
> 1. Tạo thư mục con tên chính xác: ronaldosiuuu_ronaldo-siuuu-cc6z
>    Từ giờ đến hết phiên, MỌI tệp của dự án phải nằm bên trong thư mục này.
>    Tuyệt đối không tạo tệp nào ở thư mục cha.
>
> 2. Khởi tạo git bên trong thư mục đó.
>
> 3. Cho tôi xem git đang cấu hình tên và email nào cho commit. Tôi cần xác
>    nhận đó là danh tính GitHub của chính tôi, vì theo luật cuộc thi thì
>    người commit phải là tôi.
>
> 4. Tạo tệp .gitignore đầu tiên, loại trừ: tệp biến môi trường thật, tệp cơ
>    sở dữ liệu local, mọi dạng khóa và thông tin xác thực, thư mục phụ thuộc,
>    thư mục build, tệp log, tệp cấu hình IDE và hệ điều hành. Tôi cố ý làm
>    tệp này TRƯỚC MỌI TỆP KHÁC để không bao giờ có nguy cơ commit lộ khóa.
>
> 5. Tạo commit đầu tiên với tệp đó.
>
>    RÀNG BUỘC QUAN TRỌNG VỀ COMMIT MESSAGE: không được thêm bất kỳ dòng nào
>    ghi nhận AI vào commit message — không Co-Authored-By, không dòng kiểu
>    "Generated with", không emoji hay chữ ký của công cụ, không đồng tác giả.
>    Commit phải mang danh tính của tôi và chỉ của tôi. Áp dụng cho mọi commit
>    từ giờ tới cuối phiên. Nếu công cụ bạn đang chạy tự thêm những dòng đó,
>    nói cho tôi biết cách tắt.
>
> 6. Cho tôi lệnh tạo một repository GitHub công khai tên chính xác
>    ronaldosiuuu_ronaldo-siuuu-cc6z, liên kết và đẩy commit này lên.
>
> 7. Sau khi đẩy xong, hiển thị commit vừa tạo ở dạng đầy đủ nhất có thể, gồm
>    tác giả, người commit, thời điểm và toàn văn message, để tôi kiểm tra
>    không có dòng nào ghi nhận AI.

**Kết quả:**
- Tạo thư mục `ronaldosiuuu_ronaldo-siuuu-cc6z/`, chạy `git init`, đặt nhánh mặc định `main`.
- Báo cáo danh tính commit: `user.name = ngothuanan12-fit-hcmus`,
  `user.email = ngothuanan12@gmail.com` (nguồn: `C:/Users/Admin/.gitconfig`).
- Tạo `.gitignore` (123 dòng) phủ 8 nhóm: biến môi trường, DB local, khóa/credentials,
  dependencies, build, log, IDE, OS.
- Tạo commit đầu tiên, message một dòng, **không có dòng ghi nhận AI** (author = committer = thí sinh).
- Cung cấp lệnh tạo repo GitHub công khai + push (thực thi thủ công vì cần đăng nhập GitHub;
  `gh` chưa cài trên máy).
- Hiển thị commit dạng `--format=fuller` để đối chiếu.
- Cảnh báo phát sinh: `.gitconfig` toàn cục có khóa `user.password` dạng plaintext.

**Commit:** `26e2947` — Add .gitignore for env files, local databases, keys and credentials, dependencies, build output, logs, IDE and OS files
(full hash: `26e29476bb4e3bbc8627b363ede2a1eaadf728ed`, AuthorDate/CommitDate 14:02:53 +0700)

---

### #2 — 14:08 — `AGENT` — NO-CODE

**Prompt:**
> Tôi đang thi một hackathon, trong đó luật bắt buộc TOÀN BỘ mã nguồn phải do
> AI sinh — tôi không được gõ hay sửa một dòng code nào bằng tay. Mọi thay đổi
> phải đi qua bạn.
>
> NGÂN SÁCH THỜI GIAN — hãy lập kế hoạch theo con số này, không phải theo tổng
> thời gian cuộc thi: bây giờ là khoảng 14:05 và tôi phải ĐÓNG BĂNG TÍNH NĂNG
> lúc 18:00 hôm nay. Tức khoảng 3 GIỜ 30 PHÚT để xây sản phẩm. Sau 18:00
> không thêm tính năng nào nữa, thời gian còn lại dành cho việc khác không
> liên quan tới code. Vì vậy khi đề xuất phạm vi, hãy đề xuất cho 3 giờ 30,
> và giả định con số đó đã trừ hết thời gian debug.
>
> Vì vậy hãy tuân thủ các nguyên tắc sau trong suốt phiên làm việc:
>
> 1. Không bao giờ nói "bạn hãy tự sửa dòng X" — luôn tự thực hiện thay đổi.
> 2. Khi tôi báo lỗi, đọc lại file thật trước khi sửa, đừng đoán nội dung.
> 3. Chỉ sửa đúng phạm vi tôi yêu cầu. Nếu thấy vấn đề khác, nêu ra và hỏi
>    trước, đừng tự ý sửa lan sang file khác.
> 4. Sau mỗi thay đổi, nói rõ đã sửa file nào và cần chạy lệnh gì để kiểm tra.
> 5. Nếu bạn không chắc một API hay tham số của thư viện có tồn tại thật,
>    NÓI THẲNG là không chắc. Tôi thà chậm hơn là nhận code bịa.
> 6. Ưu tiên giải pháp đơn giản, ít phụ thuộc. Ngân sách của tôi rất hẹp.
> 7. Nếu một yêu cầu của tôi vượt quá thời gian còn lại, NÓI THẲNG và đề xuất
>    một phiên bản nhỏ hơn làm được. Đừng im lặng nhận rồi làm dở dang.
>
> Sản phẩm tôi sẽ xây: {{MÔ_TẢ_1_CÂU}}
>
> Xác nhận bạn đã hiểu, rồi chờ yêu cầu tiếp theo. Chưa tạo thêm file nào.
>
> Nhắc lại một ràng buộc đã nêu ở yêu cầu trước, vì nó áp dụng cho toàn phiên:
> commit message không được chứa dòng nào ghi nhận AI — không đồng tác giả,
> không chữ ký công cụ.

**Kết quả:**
- Agent xác nhận 9 nguyên tắc làm việc cho toàn phiên (7 nguyên tắc của thí sinh +
  giữ mọi tệp trong thư mục dự án + không ghi nhận AI trong commit message).
- Chốt ngân sách lập kế hoạch: đóng băng tính năng 18:00, còn **3 giờ 52 phút** tính từ 14:08.
- Nêu vấn đề: mô tả sản phẩm vẫn là placeholder chưa thay (`{{MÔ_TẢ_1_CÂU}}`), nên chưa
  thể đề xuất phạm vi; agent không suy đoán và chờ mô tả thật.
- **Không tạo tệp nào.**

**Commit:** — (không sinh commit; lượt chỉ thiết lập nguyên tắc, không sinh mã)

---

### #3 — 14:09 — `AGENT` — ACCEPTED

**Prompt:**
> (yêu cầu tạo `chatlog.md` với: khung ghi lượt có số thứ tự liên tục / timestamp /
> nhãn AI, ghi được cả prompt bị từ chối lẫn được chấp nhận, tham chiếu chéo tới mã
> commit, mục riêng cho "Prompt vàng", bảng ghi các lần AI sinh code sai hoặc bịa API,
> mục ở đầu file liệt kê link session chia sẻ công khai theo thứ tự thời gian, kèm
> hướng dẫn ngắn về cách ghi; sau đó ghi hai lượt đầu tiên #1 và #2 vào tệp.)

**Kết quả:** Tạo `chatlog.md` gồm mục 0 (hướng dẫn), 1 (link session), 2 (prompt vàng),
3 (bảng lỗi AI), 4 (lịch sử lượt); ghi sẵn lượt #1, #2 và lượt này.
**Commit:** _(chờ)_

---

<!-- Lượt tiếp theo: #4 -->
