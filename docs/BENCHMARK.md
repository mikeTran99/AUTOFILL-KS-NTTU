# Benchmark AutoFill KS NTTU 2.0

Đo ngày **05/10/2026**, Chromium **145.0.7632.6**, Node **24.16.0**, Windows 11 x64, Intel Core i5-12450HX. Dữ liệu thô, môi trường và SHA-256 của engine/policy/baseline nằm trong [benchmark-results.json](benchmark-results.json).

## Kết quả

| Chỉ số | Bản công khai 1.5 | Bản 2.0 |
| --- | ---: | ---: |
| Mẫu đúng đáp án kỳ vọng | 4/14 (28,6%) | 14/14 (100%) |
| Trung vị thời gian điền 10 câu NTTU | 3.195,7 ms | 30,2 ms |
| P95 trong 5 lượt đo | 3.393,2 ms | 31,3 ms |

Trong thử nghiệm 10 câu, tỉ lệ thời gian trung vị là **105,8×**. Bản 1.5 cố ý có delay 150–300 ms và 80 ms cho mỗi câu; bản 2.0 dùng tốc độ mặc định 0 ms, vẫn nhường event loop để dừng và xác minh trạng thái. Vì vậy đây là **độ trễ thao tác với cấu hình mặc định**, không phải bằng chứng CPU nhanh hơn 105,8 lần. Độ trễ tùy chỉnh, widget, độ lớn DOM và máy khác cho kết quả khác.

## Mẫu và đối chứng

- Baseline là `content.js` từ commit công khai `8ed9f0411858a3e907c0508d17bb5173ef212158` (1.5), giữ nguyên byte trong `tests/fixtures/baseline-v1.5.js`.
- 14 mẫu có giá trị DOM kỳ vọng được chỉ định riêng: NTTU 3/5/7 đáp án; HTML radio 2/3/5/7/10; nhóm ARIA mô phỏng Google 7 và Microsoft 2; checkbox; select; số giới hạn; văn bản mẫu `ok`.
- Đo cả hai phiên bản trên DOM Chromium thật, xác nhận giá trị sau khi hoàn thành. Không coi thông báo `started` của bản cũ là hoàn tất. Baseline alert chỉ được thay bằng cờ báo kết thúc; không sửa timer hoặc thuật toán. Checkbox và số là tính năng mới nên baseline không được kỳ vọng hỗ trợ chúng.
- Thời gian: 10 nhóm NTTU giống nhau, một lượt warmup mỗi phiên bản, 5 lượt đo trên trang mới, xen kẽ thứ tự chạy. Chỉ chấp nhận lượt có đúng 10 đáp án cuối thang.
- Bản mới tính cả quét/xem trước và điền; bản cũ đo từ lệnh chạy đến lúc báo hoàn tất. Không tính khởi động browser hoặc chèn script. Hai phiên bản cùng bỏ qua nút gửi và không có trường thông tin cá nhân trong phép đo thời gian.
- P95 là phần tử `ceil(0.95 × n)` của mẫu đã sắp xếp. Với chỉ 5 lượt, P95 chính là lượt cao nhất; chưa đủ mẫu để suy luận thống kê rộng.

## Kiểm thử bổ sung

`npm run check` hiện có **28 kiểm thử**: 8 kiểm thử chính sách/storage và 20 kiểm thử Chromium/extension. Các nhóm kiểm tra gồm giữ đáp án có sẵn, radio cùng tên khác form, ma trận, ngẫu nhiên khớp xem trước, trọng số/seed, widget không phản hồi, ràng buộc ô nhập, thông tin cá nhân, câu hỏi phát sinh, iframe cùng nguồn, Shadow DOM mở, storage ghi tuần tự, chờ phản hồi hoàn tất, dừng tác vụ, giao diện 300px và 1.000 câu.

Mẫu 1.000 câu là kiểm thử số lượng/khả năng hoàn tất, **không phải** số liệu leaderboard về hiệu năng. Một lượt cuối tại máy này mất khoảng 7,2 giây; timer scheduling của hệ điều hành tạo biến động. CI chạy lại với timeout đủ cho máy chậm hơn.

`node tools/package-smoke.cjs` giải nén ZIP thật, so hash tài nguyên, kiểm tra PDF/tài liệu rồi cài extension từ thư mục giải nén và mở Side Panel bằng Chromium.

## Phạm vi kết luận

Đây là **benchmark nội bộ so với phiên bản trước**, không phải so sánh các extension đối thủ hoặc một bảng xếp hạng công khai. Không có bằng chứng để tuyên bố đứng đầu chủ đề.

100% trong bảng là tỷ lệ đạt **14 mẫu mô phỏng xác định**, không phải mọi loại khảo sát. Chưa chạy các phiếu NTTU/Google/MS thật có đăng nhập. Không đo mạng, CAPTCHA, canvas, widget riêng, Shadow DOM đóng, iframe khác nguồn hoặc biểu mẫu đa trang tự động. Mẫu ARIA kiểm tra engine tương tác đúng với cấu trúc chuẩn, không xác nhận DOM hiện tại của mỗi nhà cung cấp.

## Chạy lại

```powershell
npm ci --ignore-scripts
npx playwright install chromium
npm run check
npm run benchmark
node tools/guide-pdf.cjs
npm run package
node tools/package-smoke.cjs
```

Chạy benchmark riêng khi máy không chạy kiểm thử/tác vụ nặng khác. Lệnh tạo lại JSON số liệu, nên khi đổi engine/policy cần chạy lại và cập nhật bảng này. Tệp JSON giữ từng mẫu thời gian để kiểm tra kết quả.

## Tài liệu API đã đối chiếu

- [Chrome scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting): script chèn theo tab, kết quả Promise và thế giới isolated.
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel): hành vi mở bảng từ biểu tượng và hỗ trợ phiên bản API.
- [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage): storage local/session.

Các API extension đã được chạy thật trong kiểm thử MV3 trên Chromium 145. Các nền tảng khảo sát cần mẫu trực tiếp để mở rộng phạm vi xác minh.
