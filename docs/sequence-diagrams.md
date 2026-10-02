# Biểu đồ tuần tự LOKI

## Bộ sơ đồ

Nguồn PlantUML được tách thành bốn file độc lập để mỗi luồng có lifeline và bản xem trước riêng:

- [1. Đăng ký tài khoản](sequence-register.puml)
- [2. Đăng nhập](sequence-login.puml)
- [3. Kết nối thiết bị HID](sequence-device.puml)
- [4. Quản trị hệ thống](sequence-admin.puml)

## Ký hiệu

| Ký hiệu | Ý nghĩa |
| --- | --- |
| `actor` | Người hoặc vai trò khởi tạo thao tác. |
| `boundary "path FE"` | Giao diện/luồng xử lý phía Front-End. |
| `control "path BE"` | Luồng xử lý phía Back-End. |
| `participant "db/table"` | Bảng dữ liệu được truy vấn hoặc cập nhật, như `users` và `profiles`. |
| `database "CSDL"` | Cơ sở dữ liệu, hiển thị bằng ký hiệu cylinder. |
| `activate` / `deactivate` | Bắt đầu/kết thúc activation bar, thể hiện thời gian một đối tượng đang xử lý. |
| `alt` / `else` / `end` | Khung rẽ nhánh điều kiện và các trường hợp thay thế. |

## Xem và xuất

Mở từng file `.puml` trong VS Code. Extension **Plan UML** sẽ hiển thị bản xem trước tương tác riêng cho sơ đồ đó. Nếu cần nộp ảnh PNG/SVG, dùng chức năng xuất của PlantText. Không cần cài PlantUML CLI riêng.

Mục link Git trên Trello do bạn tự bổ sung.
