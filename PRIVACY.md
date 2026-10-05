# Quyền riêng tư — AutoFill KS NTTU 2.0

- Tiện ích xử lý biểu mẫu trên máy. Không có backend, telemetry hoặc thư viện từ CDN.
- Script chỉ được chèn khi người dùng bấm Quét; đọc câu hỏi và ghi đáp án khi người dùng bấm Điền.
- Quyền `activeTab`, `scripting`, `sidePanel` dùng để mở bảng điều khiển và thao tác trang hiện tại. `host_permissions: <all_urls>` giữ khả năng thao tác nhiều tab khảo sát http/https khi Side Panel mở; Chrome cho phép giới hạn quyền này theo website trong phần quản lý tiện ích.
- Quyền `storage` lưu cấu hình và hồ sơ trong `chrome.storage.local`. Thông tin cá nhân chỉ lưu khi bấm Lưu hồ sơ. Dữ liệu đã nhập vào ô khảo sát thuộc trang khảo sát đó và chịu chính sách của trang.
- `chrome.storage.session` chỉ giữ ID tab đang chạy để phục hồi bảng điều khiển trong phiên trình duyệt. Đáp án/báo cáo tác vụ nằm trong bộ nhớ tab, mất khi tải lại hoặc đóng tab.
- Hồ sơ JSON và báo cáo JSON có thể chứa thông tin cá nhân, nhãn câu hỏi và đáp án. Người dùng chọn xuất file; tiện ích không tự gửi file đi.
- Xóa từng hồ sơ bằng nút Xóa. Gỡ tiện ích để xóa toàn bộ bộ nhớ của tiện ích.
- Tiện ích không đọc ô mật khẩu hoặc tải tệp lên biểu mẫu. Không tự bấm Gửi/Tiếp; người dùng kiểm tra và gửi thủ công.
