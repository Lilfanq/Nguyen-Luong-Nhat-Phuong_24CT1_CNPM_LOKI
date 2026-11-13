# Bước 5 — Usability Testing cho LOKI

> **Lưu ý về tính trung thực:** Đây là **kết quả mô phỏng theo yêu cầu**, không phải dữ liệu thu được từ người tham gia thật. Không trình bày các số liệu bên dưới như một buổi kiểm thử đã diễn ra. Nếu giảng viên yêu cầu kết quả thực nghiệm, cần mời người dùng thực hiện và thay số liệu mô phỏng bằng ghi nhận thật.

## 1. Mục tiêu kiểm thử

Đánh giá người dùng có thể tự tìm và hiểu các luồng chính của LOKI hay không:

- Kết nối một thiết bị qua WebHID.
- Tìm và đổi hành động của nút chuột.
- Tìm phần chỉnh DPI/polling và hiểu phạm vi lưu cài đặt.
- Tạo/chuyển profile.
- Dùng AI assistant để yêu cầu thay đổi một cấu hình trong ứng dụng.

## 2. Phương pháp mô phỏng

- **Hình thức:** moderated think-aloud — người thử thao tác và nói thành tiếng suy nghĩ.
- **Thiết bị giả định:** máy tính desktop, trình duyệt Chrome/Edge; có một chuột tương thích WebHID đã được cấp quyền.
- **Số người giả định:** 5 game thủ mới dùng LOKI.
- **Người điều phối:** không hướng dẫn trong lúc làm task; chỉ ghi nhận thời gian, lỗi, đường đi và câu hỏi của người thử.
- **Prototype:** luồng hiện có của ứng dụng và wireframe low-fi. FigJam hiện là board tham chiếu; chưa phải prototype click-through.

## 3. Kịch bản đọc cho người thử

> “Bạn hãy dùng LOKI như lần đầu tiên. Mình đang kiểm tra cách bố trí, không kiểm tra bạn. Hãy nói suy nghĩ của bạn trong lúc làm. Nếu không biết bước tiếp theo, cứ nói chưa biết. Với kiểm thử thật, vui lòng không nhập mật khẩu thật vào môi trường demo.”

## 4. Kết quả mô phỏng

| Task | Hoàn thành giả định | Thời gian giả định | Vấn đề quan sát giả định |
| --- | ---: | ---: | --- |
| T1. Tìm và kết nối chuột | 4/5 | 45 giây | Một người không để ý hộp thoại quyền WebHID của trình duyệt. |
| T2. Đổi Mouse Button 4 sang chuyển profile | 4/5 | 70 giây | Một người không nhận ra nút mở danh sách assignments. |
| T3. Đổi DPI và polling rate | 3/5 | 86 giây | Hai người không nhận ra phải cuộn từ workspace xuống Settings. |
| T4. Tạo profile mới rồi chuyển lại | 4/5 | 58 giây | Một người hỏi profile đã được lưu cloud hay chỉ trong browser. |
| T5. Nhờ AI đổi mapping/profile | 3/5 | 80 giây | Hai người nghĩ thay đổi sẽ được ghi trực tiếp vào firmware của chuột. |

**Tổng hợp giả định:** 18/25 task hoàn thành (72%). Đây chỉ là số liệu minh họa để trình bày cách tổng hợp, không phải kết quả nghiên cứu thật.

## 5. Phát hiện và ưu tiên cải tiến

| Ưu tiên | Phát hiện mô phỏng | Hướng cải tiến |
| --- | --- | --- |
| P1 | Người dùng chưa hiểu cài đặt thiết bị lưu trong browser, chưa ghi xuống firmware. | Hiển thị trạng thái lưu cục bộ cạnh Settings và mapping; không dùng “Synced” nếu chưa sync cloud. |
| P1 | Một số người bỏ lỡ bước cấp quyền WebHID. | Thêm hướng dẫn ngay trước khi gọi `requestDevice()` và trạng thái khi người dùng hủy. |
| P2 | Nút mở assignments chưa tự giải thích chức năng. | Thêm nhãn “Button assignments” cạnh icon hoặc tooltip dễ nhận biết. |
| P2 | Cài đặt nằm phía dưới workspace nên khó phát hiện. | Giữ scroll cue rõ ràng và thêm liên kết “Settings” trong header. |
| P2 | Người dùng không phân biệt lưu profile local với cloud. | Hiển thị trạng thái Local / Cloud; chỉ báo Cloud synced khi `user_profiles` hoạt động. |

## 6. Giới hạn kỹ thuật cần nêu khi báo cáo

- WebHID kết nối trực tiếp từ trình duyệt; việc người dùng cấp quyền và thiết bị được hỗ trợ quyết định task kết nối.
- DPI, polling, calibration, power và mapping hiện là cấu hình do LOKI lưu trong browser; chưa có giao thức chung để ghi các giá trị này xuống firmware.
- AI assistant gọi Supabase Edge Function `loki-chat`; action được validate trong frontend rồi cập nhật cấu hình của LOKI. Không nên nói AI đã điều khiển phần cứng.
- Cloud profile sử dụng `public.user_profiles`; cần xác nhận migration đã áp dụng trên project trước khi tuyên bố profile được đồng bộ.
- Một buổi usability test thật cần người tham gia thật, quan sát thật và số đo thật. Không dùng bảng mô phỏng này làm bằng chứng thực nghiệm.

## 7. Mẫu kết luận

**Kết luận mô phỏng:** Các task cơ bản có thể hoàn thành, nhưng người dùng mới có thể gặp khó khi tìm WebHID permission, tìm Settings/assignments, và hiểu dữ liệu được lưu ở đâu. Ưu tiên cải tiến tiếp theo là làm rõ đường dẫn vào Settings, giải thích quyền WebHID, và phân biệt cấu hình local với thao tác ghi xuống phần cứng. Cần kiểm thử với người dùng thật để xác nhận các giả định này.
