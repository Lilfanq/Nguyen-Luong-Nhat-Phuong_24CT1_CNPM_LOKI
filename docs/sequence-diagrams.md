# Biểu đồ tuần tự LOKI

## Bộ sơ đồ

Nguồn PlantUML được tách thành năm file độc lập để mỗi luồng có lifeline và bản xem trước riêng:

- [1. Đăng ký tài khoản](sequence-register.txt)
- [2. Đăng nhập](sequence-login.txt)
- [3. Đăng nhập Google/Discord OAuth](sequence-oauth.txt)
- [4. Kết nối thiết bị HID](sequence-device.txt)
- [5. Quản trị hệ thống](sequence-admin.txt)

## Ký hiệu

| Ký hiệu | Ý nghĩa |
| --- | --- |
| `actor` | Người hoặc vai trò khởi tạo thao tác. |
| `boundary` | UI hoặc module Front-End khởi tạo thao tác. |
| `control` / `participant` | Dịch vụ thật như Supabase Auth, PostgREST/RPC, WebHID hoặc Edge Function; không tự thêm một server không có trong code. |
| `database` | Đúng bảng đang được code dùng, như `auth.users`, `public.app_users` hoặc `public.user_profiles`. |
| `activate` / `deactivate` | Bắt đầu/kết thúc activation bar, thể hiện thời gian một đối tượng đang xử lý. |
| `alt` / `else` / `end` | Rẽ nhánh theo điều kiện thực tế; ví dụ quyền admin, OAuth provider bật/tắt, hoặc cấp quyền WebHID. |

Sơ đồ HID đi thẳng từ Front-End tới WebHID và browser storage, không qua Backend/Database. Profile, role và Auth mới gọi Supabase; AI gọi Supabase Edge Function. Cloud status hiện tại và giới hạn dữ liệu được ghi trong [technical defense guide](project-defense-guide.md).

## Xem và xuất

Cả năm sơ đồ tuần tự hiện mang đuôi `.txt` nhưng chứa cú pháp PlantUML. Để dùng preview trực tiếp trong VS Code, đổi đuôi file thành `.puml` hoặc mở bằng PlantText. Nếu cần nộp ảnh PNG/SVG, dùng chức năng xuất của PlantText.

Mục link Git trên Trello do bạn tự bổ sung.
