# Biểu đồ tuần tự LOKI

## 2.1 Sơ đồ chính theo yêu cầu

Chọn hai chức năng tự chọn phù hợp với dự án: kết nối/cấu hình thiết bị và trợ lý AI. Mỗi sơ đồ chính chỉ có bốn lifeline User, FR, BE, DB:

- [1. Đăng ký tài khoản](sequence-register.txt)
- [2. Đăng nhập](sequence-login.txt)
- [3. Tự chọn 1 — Kết nối thiết bị WebHID](sequence-device.txt)
- [4. Tự chọn 2 — Trợ lý AI cấu hình](sequence-assistant.txt)

## Sơ đồ bổ trợ

- [Đăng nhập Google/Discord OAuth](sequence-oauth.txt)
- [Quản trị tài khoản và vai trò](sequence-admin.txt)

PERT của dự án: [pert-loki.mmd](pert-loki.mmd). User Flow: [flowchart-loki.mmd](flowchart-loki.mmd). Wireframe: [wireframe-loki.svg](wireframe-loki.svg).

## Ký hiệu

| Ký hiệu | Ý nghĩa |
| --- | --- |
| `User` | Người dùng khởi tạo thao tác. |
| `FR` | Front-end LOKI chạy trong trình duyệt. |
| `BE` | Backend xử lý yêu cầu; trong dự án này là dịch vụ managed của Supabase, không phải server Node/Express riêng. |
| `DB` | Database Supabase của LOKI; project ref `ynccytvbcsfutwstwmjr`, các bảng như `auth.users`, `public.app_users`, `public.user_profiles`. |
| `activate` / `deactivate` | Bắt đầu/kết thúc activation bar, thể hiện thời gian một đối tượng đang xử lý. |
| `alt` / `else` / `end` | Rẽ nhánh theo điều kiện thực tế; ví dụ quyền admin, OAuth provider bật/tắt, hoặc cấp quyền WebHID. |

Mỗi sơ đồ tuần tự chỉ có đúng bốn lifeline: User, FR, BE, DB. Các dịch vụ con như Auth, PostgREST, RPC, Edge Function, WebHID và OAuth được ghi trong message/ghi chú. Với luồng HID, BE và DB không tham gia. Chi tiết kiến trúc và giới hạn dữ liệu được ghi trong [technical defense guide](project-defense-guide.md).

## Xem và xuất

Cả sáu sơ đồ tuần tự hiện mang đuôi `.txt` nhưng chứa cú pháp PlantUML. Để dùng preview trực tiếp trong VS Code, đổi đuôi file thành `.puml` hoặc mở bằng PlantText. Nếu cần nộp ảnh PNG/SVG, dùng chức năng xuất của PlantText.

Mục link Git trên Trello do bạn tự bổ sung.
