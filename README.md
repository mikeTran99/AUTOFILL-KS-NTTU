# AUTOFILL-KS-NTTU

Tiện ích Chromium hỗ trợ tự động điền phiếu đánh giá môn học/khảo sát bằng Side Panel. Giao diện luôn nằm bên cạnh trang khảo sát, giúp người dùng nhập thông tin, chọn mức đánh giá và chạy thao tác điền tự động mà không bị đóng khi chuyển focus.

## Tính năng

- Mở bảng điều khiển bằng Chrome Side Panel.
- Chọn nhanh 5 mức đánh giá: từ "Hoàn toàn không đồng ý" đến "Hoàn toàn đồng ý".
- Điền các trường thường gặp như tên môn học, giảng viên, mã môn học, khoa, học kỳ và năm học.
- Mô phỏng thao tác nhập từng ký tự, cuộn tới từng câu hỏi và chọn radio theo mức đánh giá đã chọn.
- Hỏi xác nhận trước khi bấm nút gửi nếu trang khảo sát có nút `btnGui`.

## Yêu cầu

- Chrome, Microsoft Edge hoặc trình duyệt Chromium có hỗ trợ Manifest V3 và Side Panel.
- Khuyến nghị Chrome 114 trở lên.

## Cài đặt

1. Tải hoặc clone repository này về máy.
2. Mở trình duyệt và truy cập `chrome://extensions/`.
3. Bật `Developer mode`.
4. Chọn `Load unpacked`.
5. Chọn thư mục chứa repository `AUTOFILL-KS-NTTU`.
6. Ghim tiện ích `Auto Fill Khảo Sát` lên thanh công cụ để dùng nhanh hơn.

## Sử dụng

1. Mở trang khảo sát cần điền.
2. Bấm biểu tượng tiện ích để mở Side Panel.
3. Chọn mức độ đánh giá mong muốn.
4. Điền các thông tin môn học nếu trang khảo sát có những trường tương ứng.
5. Bấm `Chạy Auto Fill`.
6. Kiểm tra lại nội dung đã điền trước khi gửi.

## Tài liệu PDF

Xem file [Hướng Dẫn Sử Dụng Extension Khảo Sát.pdf](./H%C6%B0%E1%BB%9Bng%20D%E1%BA%ABn%20S%E1%BB%AD%20D%E1%BB%A5ng%20Extension%20Kh%E1%BA%A3o%20S%C3%A1t.pdf) để có hướng dẫn cài đặt và sử dụng chi tiết.

## Quyền riêng tư và lưu ý

- Tiện ích chạy trực tiếp trên trình duyệt của người dùng, không có backend và không gửi dữ liệu về máy chủ riêng.
- Quyền `host_permissions: <all_urls>` được dùng để tiện ích có thể chạy trên nhiều trang khảo sát khác nhau.
- Người dùng nên kiểm tra lại nội dung trước khi gửi biểu mẫu.
- Hãy sử dụng tiện ích đúng quy định của đơn vị hoặc hệ thống khảo sát mà bạn đang truy cập.

## Cấu trúc dự án

- `manifest.json`: cấu hình extension Manifest V3.
- `background.js`: thiết lập hành vi mở Side Panel.
- `popup.html`, `popup.js`: giao diện và logic của Side Panel.
- `content.js`: script chạy trên trang khảo sát để tìm trường nhập liệu và chọn câu trả lời.
- `HUONG_DAN_SU_DUNG.md`, `HUONG_DAN_SU_DUNG.html`: nguồn tài liệu hướng dẫn.
- `Hướng Dẫn Sử Dụng Extension Khảo Sát.pdf`: bản hướng dẫn PDF cho người dùng cuối.
