# Lịch sử thay đổi

## 2.0.0 — 05/10/2026

- Ba tab trợ giúp NTTU/HTML, Google Forms, Microsoft Forms; cấu hình chung và đáp án riêng từng câu.
- Cố định theo mức, vị trí hoặc nhãn chính xác; ngẫu nhiên theo khoảng; trọng số 5 mức; mã seed để lặp lại lựa chọn.
- Nhận diện nhóm radio theo form/tree, nhóm ARIA, checkbox, select đơn/nhiều, listbox có đáp án trong DOM, văn bản/contenteditable, số/thanh điểm có giới hạn, iframe cùng nguồn và Shadow DOM mở.
- Xem trước trước khi ghi; kiểm tra biểu mẫu đã thay đổi; giữ lựa chọn ngẫu nhiên từng câu khi người dùng sửa câu khác.
- Tiến độ thật, nút Dừng, phát hiện thao tác trang không nhận; giữ câu trả lời có sẵn; báo câu bắt buộc còn thiếu và câu hỏi phát sinh để quét lại.
- Giữ các trường lớp, MSSV, họ tên, email đang có trong bản sửa local. Không tự thêm nhận xét khi để trống hoặc tự gửi khảo sát.
- Lưu/nạp/xóa và nhập/xuất hồ sơ, báo cáo JSON. Worker tuần tự hóa ghi hồ sơ và chỉ xác nhận sau khi storage hoàn tất.
- Kiểm thử chính sách, DOM Chromium, extension MV3 thật, giao diện 300px và stress 1.000 câu; benchmark có bản gốc 1.5, dữ liệu đo và giới hạn công bố.
- CI kiểm tra tự động; ZIP theo danh sách tệp rõ ràng và checksum SHA-256.

## 1.5

Bản công khai ban đầu: bảng Side Panel, các trường môn học và lựa chọn đánh giá NTTU theo nhãn.
