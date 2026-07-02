# Hướng Dẫn Cài Đặt Và Sử Dụng AUTOFILL-KS-NTTU

AUTOFILL-KS-NTTU là tiện ích Chromium hỗ trợ điền nhanh phiếu đánh giá môn học/khảo sát. Tiện ích dùng **Side Panel** để bảng điều khiển luôn nằm bên cạnh trang khảo sát, giúp bạn thao tác trên trang web mà không làm mất giao diện điều khiển.

> Lưu ý: Tiện ích chỉ hỗ trợ điền biểu mẫu trên trình duyệt của bạn. Hãy kiểm tra lại nội dung trước khi gửi và sử dụng đúng quy định của hệ thống khảo sát.

## 1. Yêu Cầu Trước Khi Cài Đặt

- Chrome, Microsoft Edge hoặc trình duyệt Chromium có hỗ trợ Manifest V3 và Side Panel.
- Khuyến nghị Chrome 114 trở lên.
- Mã nguồn tiện ích đã được tải hoặc clone về máy.

## 2. Cài Đặt Extension

1. Giải nén hoặc clone repository `AUTOFILL-KS-NTTU`.
2. Mở trình duyệt Chrome/Edge/Cốc Cốc.
3. Truy cập trang quản lý tiện ích:
   - Chrome/Cốc Cốc: `chrome://extensions/`
   - Edge: `edge://extensions/`
4. Bật **Developer mode** hoặc **Chế độ dành cho nhà phát triển**.
5. Chọn **Load unpacked** hoặc **Tải tiện ích đã giải nén**.
6. Chọn thư mục chứa các file `manifest.json`, `popup.html`, `content.js` của dự án.
7. Kiểm tra tiện ích **Auto Fill Khảo Sát** đã xuất hiện trong danh sách.

Nếu đã cài bản cũ, hãy bấm nút **Reload** trên thẻ tiện ích để cập nhật mã mới.

## 3. Ghim Extension Lên Thanh Công Cụ

1. Bấm biểu tượng tiện ích của trình duyệt.
2. Tìm **Auto Fill Khảo Sát**.
3. Bấm biểu tượng ghim để đưa tiện ích lên thanh công cụ.

Sau khi ghim, bạn có thể mở Side Panel nhanh bằng cách bấm biểu tượng tiện ích.

## 4. Mở Bảng Điều Khiển Side Panel

1. Mở trang khảo sát cần điền.
2. Bấm biểu tượng **Auto Fill Khảo Sát** trên thanh công cụ.
3. Bảng điều khiển sẽ mở ở cạnh bên trình duyệt.

Side Panel có thể giữ nguyên khi bạn click, cuộn hoặc thao tác trên trang khảo sát.

## 5. Cách Sử Dụng

1. Trong Side Panel, chọn **Tùy chọn mức độ đánh giá**.
2. Điền các thông tin nếu trang khảo sát có trường tương ứng:
   - Tên môn học
   - Giảng viên
   - Mã môn học
   - Khoa
   - Học kỳ
   - Năm học
3. Bấm **Chạy Auto Fill**.
4. Tiện ích sẽ:
   - Tìm các ô nhập liệu dựa trên nhãn gần đó.
   - Nhập từng ký tự vào các ô tìm thấy.
   - Tìm nhóm câu hỏi trắc nghiệm và chọn đáp án theo mức đánh giá đã chọn.
   - Điền `ok` vào các ô góp ý còn trống.
5. Khi hoàn tất, tiện ích sẽ báo để bạn kiểm tra lại.
6. Nếu trang có nút gửi với id `btnGui`, tiện ích sẽ hỏi xác nhận trước khi bấm gửi.

## 6. Các Mức Đánh Giá Được Hỗ Trợ

- Hoàn toàn đồng ý / Rất hài lòng
- Đồng ý / Hài lòng
- Phân vân / Bình thường
- Không đồng ý / Không hài lòng
- Hoàn toàn không đồng ý / Rất không hài lòng

## 7. Xử Lý Lỗi Thường Gặp

### Không mở được Side Panel

- Kiểm tra trình duyệt có hỗ trợ Side Panel hay không.
- Cập nhật trình duyệt lên phiên bản mới.
- Vào trang quản lý tiện ích và bấm **Reload**.

### Bấm chạy nhưng không điền được

- Đảm bảo bạn đang mở trang web dạng `http://` hoặc `https://`.
- Không chạy trên trang quản lý nội bộ của trình duyệt như `chrome://extensions/`.
- Kiểm tra trang khảo sát có cấu trúc nhãn và ô nhập liệu rõ ràng.
- Tải lại trang khảo sát rồi chạy lại.

### Chọn sai hoặc thiếu một số câu hỏi

- Một số trang khảo sát dùng cấu trúc HTML riêng, tên lớp khác hoặc nội dung đáp án khác.
- Hãy kiểm tra lại toàn bộ nội dung trước khi gửi.

## 8. Quyền Riêng Tư

- Tiện ích chạy trực tiếp trong trình duyệt.
- Không có máy chủ riêng.
- Không gửi dữ liệu người dùng về backend của dự án.
- Quyền truy cập `<all_urls>` được dùng để tiện ích có thể chạy trên nhiều trang khảo sát khác nhau.

## 9. Gỡ Cài Đặt

1. Mở `chrome://extensions/` hoặc `edge://extensions/`.
2. Tìm **Auto Fill Khảo Sát**.
3. Bấm **Remove** hoặc **Gỡ bỏ**.
