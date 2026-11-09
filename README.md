# FPT TELECOM – PLAY & WIN

> **Chơi hết mình – Khám phá công nghệ – Nhận quà từ FPT.**

Nền tảng Mini Game Marketing chạy trên trình duyệt (không cần tải app, không cần đăng ký trước) dành cho khách hàng FPT Telecom. Phù hợp cho quảng cáo Facebook/TikTok, QR tại sự kiện, cửa hàng, booth trải nghiệm và các chương trình tri ân.

Gồm đúng **3 trò chơi**:

| Game | Mô tả | Thời gian | Điểm tối đa (mặc định) |
|---|---|---|---|
| **PERFECT STOP** – Thử tài dừng chuẩn xác | Kim năng lượng quay quanh vòng 3D, nhấn **DỪNG** khi kim vào tâm vùng mục tiêu. 3 vòng Dễ → Trung bình → Khó. | ~45 giây | 500 |
| **FPT SMART QUIZ** – Thử thách kiến thức FPT | 5–10 câu hỏi (trắc nghiệm, điền chỗ trống, kiến thức sản phẩm), có đồng hồ đếm ngược và giải thích. | ~90 giây | 600 |
| **FIND THE DIFFERENCE** – Tìm điểm khác biệt | Hai hình ngôi nhà công nghệ (Router WiFi, FPT Camera, FPT Play…), tìm đủ điểm khác trong thời gian giới hạn. | 60–90 giây | 480 |

---

## 1. Tính năng chính

**Phía người chơi**
- **Đăng ký bắt buộc trước khi chơi** (thu thập khách hàng tiềm năng):
  - Người chơi nhập **Họ và tên + Số điện thoại** (bắt buộc), Tỉnh/Thành phố (không bắt buộc), và tick ô đồng ý (không đánh dấu sẵn).
  - Form hiện khi bấm *BẮT ĐẦU CHƠI* hoặc khi vào thẳng link một game. Máy chủ cũng chặn: chưa đăng ký thì không bắt đầu được lượt chơi.
  - Thông tin được lưu vào *Admin → Khách hàng (SĐT)* với nguồn **“Đăng ký chơi”**. Mỗi SĐT là một hồ sơ; khi khách gửi thêm yêu cầu tư vấn, hồ sơ được cập nhật sản phẩm/nhu cầu.
  - Bảng xếp hạng chỉ hiện tên dạng che, ví dụ `Minh ***678`. Họ tên đầy đủ và SĐT không bao giờ công khai.
- Landing Page 3D (React Three Fiber): Router WiFi phát sóng, vòng năng lượng, Robot AI vẫy chào. Tự chuyển sang hình minh họa 2D khi thiết bị không hỗ trợ WebGL hoặc bật “giảm chuyển động”.
- Trang chọn game với thẻ 3D nghiêng theo con trỏ, tiến độ hành trình 0/3.
- Robot AI hướng dẫn, cổ vũ, gợi ý ở mọi màn hình.
- Màn hình kết quả: điểm, thời gian, thành tích, huy hiệu, pháo hoa, nút **CHƠI LẠI / CHƠI GAME KHÁC / VỀ TRANG CHỦ**.
- Màn hình **Tổng kết hành trình** khi hoàn thành cả 3 game.
- Huy hiệu: Tân binh công nghệ 🚀, Bậc thầy phản xạ ⚡, Cao thủ WiFi 📶, Mắt thần công nghệ 🔍, Nhà vô địch FPT 🏆.
- Bảng xếp hạng theo ngày/tuần/tất cả và theo chiến dịch; chỉ hiển thị tên hiển thị.
- Biểu mẫu nhận tư vấn tự nguyện, có thể bỏ qua.
  - Họ tên và SĐT chỉ hiện ra và chỉ được lưu khi khách **tick đồng ý được liên hệ**. Ô đồng ý không được đánh dấu sẵn.
  - Nếu không tick, hệ thống chỉ ghi nhận nhu cầu ẩn danh.
- Âm thanh tổng hợp WebAudio (không cần file), có nút bật/tắt. Có rung nhẹ trên điện thoại.
- Mobile-first: đã kiểm tra ở 375px. Nút lớn, hỗ trợ chạm, hai hình Find the Difference tự xếp dọc.

**Phía quản trị (`/admin`)**
- **Dashboard thống kê**:
  - Truy cập, người chơi, lượt chơi, tỷ lệ bắt đầu, tỷ lệ hoàn thành.
  - Lượt chơi, điểm trung bình và thời gian trung bình theo từng game; số người hoàn thành cả 3 game.
  - Khách để lại thông tin / đồng ý tư vấn; phân bố sản phẩm, nhu cầu, khu vực.
  - Biểu đồ theo ngày. Lọc theo thời gian, chiến dịch, có/không gồm dữ liệu DEMO.
- **Quản lý game**: bật/tắt, tên, mô tả, luật chơi, thời gian, điểm thưởng, độ khó, cấp độ Perfect Stop, ảnh thẻ game.
- **Câu hỏi Quiz**:
  - Thêm/sửa/xóa, ảnh minh họa, đáp án đúng, giải thích, độ khó, phân loại sản phẩm.
  - Nhập hàng loạt từ **Excel/CSV**, xuất CSV.
- **Tìm điểm khác biệt**:
  - Tải cặp hình (tự nén sang WebP), click để đặt vùng, tinh chỉnh x/y/bán kính.
  - **✨ Tự động dò vùng khác biệt** bằng so sánh điểm ảnh.
  - Chơi thử (dữ liệu chơi thử được gắn cờ demo), gán bộ hình theo chiến dịch.
- **Chiến dịch & QR**: mã chiến dịch, thời gian, giới hạn lượt chơi/ngày, link `/?c=MA` và tải QR PNG.
- **Người tham gia** và **Khách hàng tư vấn**: xuất CSV/Excel, cập nhật trạng thái liên hệ.
- **Thương hiệu & 3D**: thay logo chính thức và mô hình `.glb` cho Landing Page.
- **Dữ liệu & nhật ký**: tạo/xóa dữ liệu DEMO, tải bản sao lưu, xem lịch sử thay đổi cấu hình (kèm dữ liệu trước/sau).

---

## 2. Cơ chế tính điểm

Toàn bộ điểm do **máy chủ** tính. Trình duyệt chỉ hiển thị kết quả.

### PERFECT STOP
- Máy chủ phát ngẫu nhiên tâm mục tiêu, góc bắt đầu, chiều quay; tốc độ và độ rộng vùng lấy từ cấu hình từng cấp.
- Vị trí kim là hàm tất định theo thời gian: `góc = góc_đầu + chiều × tốc_độ × t`. Client gửi thời điểm nhấn (lấy từ `event.timeStamp` để chính xác tới mili-giây), máy chủ **tự tính lại góc** và độ lệch.
- Cách tính điểm theo độ lệch:
  - Lệch ≤ sai số PERFECT (mặc định 1.5°): **100% điểm vòng**.
  - Trong vùng mục tiêu: **50–100%**, giảm tuyến tính theo khoảng cách tới tâm.
  - Sát vùng (lệch tối đa 20° ngoài mép): **0–20%**.
  - Ngoài vùng hoặc hết giờ: **0**.
- Thưởng hoàn thành: +50.

### FPT SMART QUIZ
- Câu đúng: `điểm cơ bản (50) + thưởng tốc độ (tối đa 25) × thời gian còn lại / thời gian câu`. Câu sai hoặc hết giờ: 0.
- Thời gian trả lời đo bằng đồng hồ máy chủ (từ lúc phát câu hỏi), có cộng 1.5 giây bù trễ mạng.
- Thứ tự đáp án được xáo trộn mỗi lượt; đáp án đúng không bao giờ gửi xuống trước khi người chơi trả lời.

### FIND THE DIFFERENCE
- Mỗi điểm tìm đúng được 60 điểm.
- Tìm đủ thì được thưởng `2 điểm × số giây còn lại`.
- Click sai: 3 lần đầu miễn phạt, từ lần thứ 4 trừ 10 điểm/lần. Mỗi lần gợi ý trừ 30 điểm.
- Tọa độ vùng được lưu dạng chuẩn hóa (x, y ∈ [0,1], bán kính theo tỉ lệ chiều rộng), nên vùng click khớp ảnh trên mọi kích thước màn hình. Có thêm dung sai 1.5% cho thao tác chạm.

Tất cả thông số trên chỉnh được trong **Admin → Quản lý game**.

---

## 3. Bảo mật & chống gian lận

| Biện pháp | Chi tiết |
|---|---|
| Điểm tính ở máy chủ | Trạng thái lượt chơi (mục tiêu, đáp án, tọa độ vùng) chỉ nằm trên máy chủ; client không gửi điểm. |
| Kiểm tra thời điểm nhấn | Perfect Stop từ chối thời điểm “trong tương lai” (lớn hơn thời gian thực đã trôi qua) hoặc trễ bất thường (> 4 giây); vòng đó tính 0 điểm. |
| Khóa lạc quan | Mỗi lượt chơi có `version`; gửi trùng hoặc gửi song song bị từ chối (409), không thể cộng điểm 2 lần. |
| Chống chọn lại mục tiêu | Yêu cầu lại vòng đang chạy (ví dụ tải lại trang) thì vòng cũ tính là hết giờ. |
| Đăng ký bắt buộc | API bắt đầu game trả về 428 nếu người chơi chưa đăng ký họ tên + SĐT hợp lệ và chưa đồng ý điều khoản. |
| Giới hạn tần suất | Theo IP: đăng ký 10/10 phút, bắt đầu game 30/phút, thao tác 300/phút, biểu mẫu 5/10 phút, đăng nhập admin 10/15 phút; mỗi SĐT tối đa 3 lần/24 giờ. |
| Chống spam biểu mẫu | Trường bẫy (honeypot), kiểm tra định dạng SĐT Việt Nam; SĐT trùng trong 24 giờ thì cập nhật thay vì tạo bản ghi mới. |
| Phân quyền | `admin`: toàn quyền, xem dữ liệu khách hàng, sao lưu, nhật ký. `editor`: quản lý game/câu hỏi/hình/chiến dịch/thống kê, **không** xem dữ liệu cá nhân. |
| Phiên đăng nhập | Cookie JWT ký HS256, `httpOnly`, `SameSite=Strict`, hết hạn sau 8 giờ. Mật khẩu băm bcrypt. |
| Nhật ký | Mọi thay đổi cấu hình, nhập câu hỏi, xuất dữ liệu khách hàng, sao lưu, đăng nhập đều được ghi lại. |
| Bảo vệ dữ liệu cá nhân | Chỉ thu họ tên, SĐT, tỉnh/thành (tùy chọn) kèm đồng ý có lưu thời điểm và nội dung điều khoản. Chỉ vai trò `admin` xem được; client chỉ nhận SĐT dạng che. IP chỉ lưu dạng băm. Bảng xếp hạng không công khai dữ liệu cá nhân. |
| Upload an toàn | Chỉ nhận PNG/JPEG/WebP/GLB, kiểm tra chữ ký file; ảnh phục vụ kèm CSP `sandbox`. |
| Giới hạn lượt chơi | Theo chiến dịch (số lượt / game / người / ngày). |

---

## 4. Cài đặt & chạy local

Yêu cầu: **Node.js 20+** (đã kiểm thử trên Node 24). Không cần cài PostgreSQL: khi chạy local, ứng dụng dùng **PGlite**, tức PostgreSQL nhúng lưu trong thư mục `.data/`.

```bash
npm install
```

```bash
copy .env.example .env.local
```

Mở `.env.local` và đặt `APP_SECRET` (chuỗi ngẫu nhiên ≥ 32 ký tự) cùng `ADMIN_PASSWORD`.

> Trong thư mục này **đã có sẵn `.env.local`** với `APP_SECRET` và mật khẩu admin/editor được sinh ngẫu nhiên. Mở file để xem; nên đổi mật khẩu trước khi dùng thật.

```bash
npm run dev
```

- Trang game: http://localhost:3000
- Quản trị: http://localhost:3000/admin, đăng nhập bằng `ADMIN_USERNAME` / `ADMIN_PASSWORD` trong `.env.local`.

Lần chạy đầu, hệ thống tự tạo bảng (migration), 3 game, 24 câu hỏi mẫu, 3 bộ hình mẫu và tài khoản quản trị.

**Chạy bản production local:**

```bash
npm run build
```

```bash
npm start
```

### Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `APP_SECRET` | Có (production) | Khóa ký phiên người chơi/admin, ≥ 32 ký tự. |
| `DATABASE_URL` | Production | Chuỗi kết nối PostgreSQL. Để trống thì dùng PGlite. |
| `DATABASE_SSL` | – | `true` nếu PostgreSQL yêu cầu SSL (Supabase, Neon, RDS…). |
| `DATABASE_POOL_MAX` | – | Số kết nối tối đa (mặc định 10). |
| `PGLITE_DIR` | – | Thư mục dữ liệu PGlite (mặc định `./.data/pglite`). |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Có | Tài khoản `admin`, được tạo khi khởi động nếu chưa tồn tại. |
| `EDITOR_USERNAME` / `EDITOR_PASSWORD` | – | Tài khoản `editor` cho Marketing (không xem dữ liệu khách hàng). |
| `COOKIE_SECURE` | Production | `true` khi chạy sau HTTPS. |

> Đổi `ADMIN_PASSWORD` trong env **không** đổi mật khẩu của tài khoản đã tồn tại. Biến này chỉ dùng khi tạo tài khoản lần đầu.

---

## 5. Triển khai (deploy)

### Khuyến nghị: VPS (Ubuntu) + Node 20 + PostgreSQL + Nginx + PM2

1. Cài PostgreSQL và tạo database:

   ```bash
   sudo -u postgres psql -c "CREATE USER playwin WITH PASSWORD '<mat-khau>';" -c "CREATE DATABASE playwin OWNER playwin;"
   ```

2. Chép mã nguồn lên server (không chép `node_modules`, `.next`, `.data`, `.env.local`), rồi tạo file `.env.production.local` với các giá trị sau:

   ```
   APP_SECRET=<chuỗi ngẫu nhiên dài>
   DATABASE_URL=postgres://playwin:<mat-khau>@localhost:5432/playwin
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<mật khẩu mạnh>
   EDITOR_USERNAME=marketing
   EDITOR_PASSWORD=<mật khẩu mạnh>
   COOKIE_SECURE=true
   ```

3. Build và chạy bằng PM2. Migration tự chạy khi khởi động; thư mục `drizzle/` phải có mặt trên server.

   ```bash
   npm ci && npm run build
   ```

   ```bash
   pm2 start npm --name playwin -- start && pm2 save
   ```

4. Cấu hình Nginx reverse proxy tới `127.0.0.1:3000`, bật HTTPS (Let's Encrypt/certbot). Chuyển tiếp header `X-Forwarded-For` để giới hạn tần suất nhận đúng IP:

   ```nginx
   location / {
     proxy_pass http://127.0.0.1:3000;
     proxy_set_header Host $host;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
     client_max_body_size 15m;
   }
   ```

**Docker (tùy chọn):** dùng image `node:20-alpine` với các lệnh `npm ci && npm run build`, `CMD ["npm","start"]`, mở cổng 3000 và truyền biến môi trường như trên. PostgreSQL chạy ở container riêng.

**Lưu ý:**
- **Một instance**: bộ giới hạn tần suất nằm trong bộ nhớ tiến trình. Nếu chạy nhiều instance hoặc serverless, cần chuyển sang Redis.
- **PGlite chỉ dành cho local/demo** (một tiến trình). Production dùng `DATABASE_URL`.
- Ảnh và mô hình 3D tải lên được lưu trong CSDL (bảng `media`), nên không cần ổ đĩa riêng và được sao lưu cùng dữ liệu.

---

## 6. Sao lưu & khôi phục

- **Trong Admin:** *Dữ liệu & nhật ký → Tải bản sao lưu*. Tải về file JSON chứa toàn bộ CSDL, kể cả ảnh. Chỉ vai trò admin dùng được.
- **Dòng lệnh** (với PGlite, cần dừng server trước):

  ```bash
  npm run db:backup
  ```

  ```bash
  npm run db:restore -- backups/playwin-backup-xxxx.json
  ```

  `db:backup` lưu vào thư mục `backups/`. `db:restore` **ghi đè** toàn bộ dữ liệu hiện có.
- **Production:** đặt cron chạy `pg_dump` hằng ngày, ví dụ:

  ```bash
  0 2 * * * pg_dump -Fc "$DATABASE_URL" > /var/backups/playwin-$(date +\%F).dump
  ```

---

## 7. Vận hành chiến dịch

- **Link/QR chiến dịch:** tạo tại *Admin → Chiến dịch & QR*. Người chơi vào `https://ten-mien/?c=MA_CHIEN_DICH` sẽ được gắn chiến dịch, dùng cho thống kê, bảng xếp hạng theo chiến dịch, bộ hình riêng và giới hạn lượt chơi.
- **Logo:** mặc định dùng logo FPT Telecom chính thức (`public/brand/fpt-telecom-logo.webp`), đặt trên nền trắng bo góc để giữ đúng màu thương hiệu trên nền tối. Muốn thay thì vào *Admin → Thương hiệu & 3D → Logo*. Màu giao diện theo logo: xanh `#1369B4`, cam `#F07629`, lục `#18B14A`.
- **Thay mô hình 3D:** *Admin → Thương hiệu & 3D* → tải file `.glb` (GLB thường, chưa nén Draco/Meshopt; nên < 3MB). Mô hình được tự căn giữa và co giãn vừa khung.
- **Thay hình Tìm điểm khác biệt:** *Admin → Tìm điểm khác biệt → Thêm bộ hình*. Tải Hình A, Hình B (cùng tỉ lệ), bấm *Tự động dò* hoặc click để đặt vùng, rồi lưu và *Chơi thử*. Có thể tắt các bộ hình mẫu.
- **Nhập câu hỏi từ Excel/CSV:** *Admin → Câu hỏi Quiz → File mẫu Excel*. Các cột theo thứ tự:

  | loai | san_pham | do_kho | cau_hoi | dap_an_A | dap_an_B | dap_an_C | dap_an_D | dap_an_dung | giai_thich |
  |---|---|---|---|---|---|---|---|---|---|
  | `mcq` / `fill` / `product` | `internet` / `wifi` / `camera` / `smarthome` / `fptplay` / `general` | `easy` / `medium` / `hard` | nội dung (dạng `fill` dùng `___` cho chỗ trống) | bắt buộc | bắt buộc | tùy chọn | tùy chọn | `A`–`D` | tùy chọn |

  Dòng lỗi được báo theo số dòng; các dòng hợp lệ vẫn được nhập. CSV hỗ trợ dấu phẩy hoặc chấm phẩy, UTF-8.
- **Dữ liệu DEMO:** dùng để trình diễn Dashboard. Mọi bản ghi demo có cờ `is_demo`, bị loại khỏi thống kê mặc định và không lên bảng xếp hạng công khai. Có thể xóa bằng một nút.

---

## 8. Kiểm thử

```bash
npm test
```

Chạy 9 unit test cho thuật toán tính điểm: góc kim, độ lệch, điểm đơn điệu theo độ lệch, kiểm tra thời điểm nhấn, quiz, vùng chạm, điểm Find the Difference, điểm tối đa.

Với server đang chạy:

```bash
node scripts/smoke-test.mjs http://localhost:3000
```

Kiểm thử đầu-cuối qua API, chơi trọn 3 game như người thật:
- Perfect Stop đạt PERFECT 500/500, và từ chối gian lận thời điểm nhấn.
- Quiz không lộ đáp án, không trả lời lại được.
- Find the Difference: chạm đúng tâm vùng, chạm lại không bị phạt, có thưởng thời gian.
- Huy hiệu, bảng xếp hạng, biểu mẫu (ẩn danh / SĐT sai), API admin yêu cầu đăng nhập.

Kết quả hiện tại: `npm test` 9/9 đạt; smoke test trên bản production (`npm run build && npm start`) báo **TẤT CẢ KIỂM THỬ ĐẠT**.

> Smoke test tạo dữ liệu thật (người chơi “Smoke Tester”). Chạy trên CSDL thử nghiệm, hoặc xóa `.data/` sau đó.

---

## 9. Cấu trúc dự án

```
drizzle/                    Migration SQL (tự chạy khi khởi động)
public/puzzles/             3 bộ hình mẫu (SVG vector) cho Find the Difference
scripts/
  gen-puzzles.mjs           Sinh bộ hình mẫu + tọa độ vùng (npm run gen:puzzles)
  smoke-test.mjs            Kiểm thử đầu-cuối qua API
  backup.ts / restore.ts    Sao lưu / khôi phục
src/
  app/(site)/               Trang người chơi: landing, /play, 3 game, /journey, /leaderboard
  app/admin/                Đăng nhập + bảng quản trị
  app/api/                  API công khai (play, player, leads, leaderboard, track, media) và /api/admin/*
  components/               Robot AI, Hero 3D (three/), GameCard, ResultPanel, LeadForm, admin/…
  lib/games/defs.ts         Định nghĩa game, cấu hình mặc định, huy hiệu, tỉnh/thành, sản phẩm
  lib/games/scoring.ts      Thuật toán tính điểm thuần (dùng chung server & test)
  lib/server/engine.ts      Bộ máy lượt chơi phía máy chủ (start/action/complete, huy hiệu, xếp hạng)
  lib/server/…              Phiên admin/người chơi, rate limit, bộ lọc thống kê, demo, sao lưu
  lib/db/                   Schema Drizzle, kết nối PGlite/PostgreSQL, dữ liệu khởi tạo
tests/scoring.test.ts       Unit test
```

Công nghệ: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · React Three Fiber/Three.js · Drizzle ORM · PostgreSQL / PGlite · Zod · jose · bcryptjs.

---

## 10. Hạn chế đã biết & việc cần làm tiếp

- **Câu hỏi mẫu cần Marketing rà soát.** 24 câu khởi tạo được viết thận trọng, xoay quanh kiến thức công nghệ phổ thông và thông tin công khai (năm thành lập 1997, tổng đài 1900 6600…). Vẫn cần xác nhận trước khi chạy chiến dịch.
- **Câu slogan “Mạng mạnh … nét căng” chưa được đưa vào** vì chưa xác minh được nội dung chính xác. Marketing có thể thêm qua Admin.
- **Router 3D, Robot và các bộ hình là bản minh họa** và đều có sẵn vị trí để thay bằng tài nguyên chính thức (mục 7).
- Giới hạn tần suất nằm trong bộ nhớ (một instance). Khi mở rộng nhiều instance, chuyển sang Redis.
- Thư mục thừa **`D:\AI%20BOT`** (6 file SVG) do một lỗi ở bước sinh hình ban đầu tạo ra. Thư mục này không dùng tới, có thể xóa thủ công.
