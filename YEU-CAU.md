# Yêu cầu game: Hứng Quà FPT (tên tạm)

## Ý tưởng
Game arcade phản xạ trên web: người chơi điều khiển một chiếc giỏ để **hứng các sản phẩm/dịch vụ FPT** rơi từ trên xuống và **né vật xấu**. Game chơi vô tận, có 3 mạng, tốc độ rơi tăng dần theo thời gian.

## Kết quả phỏng vấn (06/11/2026)
| # | Câu hỏi | Trả lời |
|---|---------|---------|
| 1 | Thể loại | Arcade / phản xạ |
| 2 | Cơ chế chính | Bắt vật rơi: di chuyển giỏ hứng vật tốt, tránh vật xấu |
| 3 | Nền tảng & điều khiển | Web, chạy cả PC và điện thoại |
| 4 | Luật thắng/thua | Vô tận, 3 mạng; mất mạng khi hứng vật xấu hoặc để lọt vật tốt; tốc độ tăng dần |
| 5 | Chủ đề | Sản phẩm FPT |

## Quyết định đã duyệt (06/11/2026)
- Dữ liệu (điểm cao, cài đặt) lưu **cục bộ trên trình duyệt** (localStorage), chưa có server hay bảng xếp hạng chung.
- Danh sách sản phẩm rơi: Modem Wi-Fi, FPT Play Box, FPT Camera, gói Internet, gói combo Internet + Truyền hình.
- Hình ảnh sản phẩm dùng icon minh hoạ tự vẽ; logo và nhận diện thương hiệu FPT chỉ dùng khi đã được bộ phận thương hiệu duyệt.
- Giao diện tài liệu theo `design/tokens.css`.

## Phạm vi giai đoạn này
Chỉ viết tài liệu trong `docs/`. **Chưa viết code game.**
