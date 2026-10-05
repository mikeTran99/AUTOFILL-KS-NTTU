# AutoFill KS NTTU 2.0

Tiện ích Chromium Manifest V3 giúp điền trang khảo sát theo cấu hình của bạn, có Side Panel và ba tab trợ giúp **NTTU/HTML**, **Google Forms**, **Microsoft Forms**. Quét câu hỏi, kiểm tra đáp án dự kiến, chỉnh riêng từng câu rồi điền. Người dùng kiểm tra và gửi thủ công.

## Chọn đáp án theo cách bạn muốn

- **Cố định:** theo mức đánh giá, vị trí đáp án từ 1 hoặc nhãn/giá trị chính xác. Thang 2/3/5/7/10 mức; nhãn đồng ý/hài lòng hỗ trợ cả thứ tự đảo ngược. Với nhãn khác, mức 0–100% theo thứ tự hiển thị.
- **Ngẫu nhiên đều:** giới hạn khoảng mức muốn chọn; mã seed để lặp lại kết quả. Mỗi câu có chuỗi ngẫu nhiên riêng, giữ đáp án xem trước khi người dùng sửa câu khác.
- **Ngẫu nhiên có trọng số:** 5 trọng số cho các mức 0/25/50/75/100%; có thể loại mức bằng trọng số 0.
- **Nhiều đáp án:** số lựa chọn tối thiểu/tối đa, chọn không trùng; hỗ trợ checkbox và select nhiều.
- **Văn bản:** bỏ qua, mẫu cố định hoặc chọn một dòng ngẫu nhiên. Trường cá nhân/môn học chỉ dùng thông tin bạn nhập hoặc đáp án riêng; không tự tạo danh tính.
- **Điền riêng từng câu:** chọn đáp án, nhập nội dung hoặc bỏ qua trong bản xem trước, kể cả ô ngày tháng cần giá trị cụ thể.

## Độ ổn định và quyền kiểm soát

- Radio HTML được nhóm đúng theo form và cây DOM; hỗ trợ nhóm ARIA, ma trận theo từng nhóm radio, textarea, select và listbox có options trong DOM.
- Số/thanh điểm chỉ điền khi bật, có giới hạn min/max hợp lệ; không áp dụng trọng số cho loại này.
- Giữ câu trả lời có sẵn theo mặc định; tùy chọn ghi đè, tốc độ 0–2000 ms và cuộn từng câu.
- Tiến độ và kết quả thật, nút Dừng, báo lỗi nếu trang không nhận thao tác. Mở lại Side Panel để xem tác vụ đang chạy trong phiên trình duyệt.
- Kiểm tra cấu trúc biểu mẫu trước khi điền; báo câu hỏi phát sinh và câu bắt buộc còn thiếu để quét lại.
- Lưu/nạp/xóa và nhập/xuất hồ sơ JSON; xuất báo cáo JSON. Hồ sơ được ghi tuần tự trong service worker và xác nhận sau khi lưu xong.
- Iframe cùng nguồn và Shadow DOM mở được quét. Câu hỏi đa trang xử lý từng trang bằng nút Quét.

## Cài đặt

1. Giải nén ZIP bản 2.0 được chuẩn bị trong `dist/`, hoặc clone repo.
2. Mở `chrome://extensions` (Edge: `edge://extensions`), bật **Developer mode**.
3. Chọn **Load unpacked** và thư mục chứa `manifest.json` — repo này hoặc thư mục ZIP đã giải nén.
4. Ghim biểu tượng, mở trang khảo sát http/https, bấm biểu tượng để mở Side Panel.
5. Chọn tab trợ giúp, cấu hình, **Quét & xem trước** → chỉnh riêng nếu cần → **Cập nhật đáp án** → **Điền theo xem trước**.
6. Kiểm tra kết quả; tự bấm Gửi/Tiếp. Quét lại khi trang xuất hiện câu hỏi mới.

Yêu cầu Chrome desktop 114+ có Side Panel. Chromium/Edge/Cốc Cốc cần API tương ứng; kiểm thử tự động hiện dùng Chromium 145, chưa xác minh từng phiên bản Chrome 114 hoặc các trình duyệt khác. Không hỗ trợ Firefox/Safari/mobile.

Sau khi nâng cấp, reload extension trong `chrome://extensions` và tải lại các tab khảo sát đang mở để bỏ script bản cũ.

## Kiểm chứng và benchmark

Chạy trên Node 22+:

```powershell
npm ci --ignore-scripts
npx playwright install chromium
npm run check
npm run benchmark
node tools/guide-pdf.cjs
npm run package
```

`check` gồm kiểm tra cú pháp/MV3, kiểm thử chính sách và storage, DOM thật trên Chromium, cài extension MV3 thật, luồng Side Panel và mẫu 1.000 câu. CI chạy lại trên Linux và tạo ZIP với SHA-256. ZIP chỉ gồm tài nguyên runtime và tài liệu, không đóng gói node_modules, mẫu test, hồ sơ local hoặc bản sao lưu.

[Phương pháp benchmark](docs/BENCHMARK.md) · [Số liệu JSON](docs/benchmark-results.json). Benchmark nội bộ so bản 1.5 và 2.0 bằng mẫu kiểm soát; không phải bảng xếp hạng đối thủ và không chứng minh tương thích 100% mọi website.

## Phạm vi tương thích

Ba tab trợ giúp dùng chung engine dựa trên HTML/ARIA. Mẫu Google/MS trong test là mô phỏng cấu trúc, **chưa xác minh trên khảo sát thật có đăng nhập**. Website có widget riêng, dropdown tạo options sau khi mở, canvas, closed Shadow DOM, iframe khác nguồn, câu kéo thả/xếp hạng, tải file hoặc CAPTCHA cần xử lý thủ công. Tiện ích không tự chuyển trang hoặc gửi phiếu.

Nếu không thấy dropdown, mở danh sách rồi quét lại. Nếu iframe khác nguồn, mở URL khảo sát trong tab riêng. Nếu tab đã đổi hoặc trang không phản hồi, bấm lại biểu tượng tiện ích rồi quét lại.

## Tài liệu

- [Hướng dẫn](HUONG_DAN_SU_DUNG.md), [HTML](HUONG_DAN_SU_DUNG.html), [PDF](Hướng%20Dẫn%20Sử%20Dụng%20Extension%20Khảo%20Sát.pdf).
- [Quyền riêng tư](PRIVACY.md) và [lịch sử thay đổi](CHANGELOG.md).
- `shared.js`: chính sách lựa chọn/kiểm tra dữ liệu; `content.js`: quét, lập kế hoạch và điền.
- `popup.html`, `popup.css`, `popup.js`: Side Panel; `background.js`: mở bảng và lưu hồ sơ.
- `tests/`, `tools/`: kiểm thử, benchmark, PDF, đóng gói.

Không có backend hoặc telemetry; [MIT](LICENSE). Sử dụng theo quy định của đơn vị khảo sát.
