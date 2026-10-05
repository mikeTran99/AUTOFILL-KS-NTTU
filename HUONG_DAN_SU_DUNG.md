# Hướng dẫn AutoFill KS NTTU 2.0

## Cài đặt và nâng cấp

Giải nén gói ZIP hoặc clone repository. Vào `chrome://extensions`, bật Developer mode, chọn Load unpacked và thư mục chứa manifest.json. Ghim biểu tượng rồi mở trang khảo sát http/https. Để nâng cấp, reload extension và tải lại các tab khảo sát đang mở.

Chrome desktop 114+ có Side Panel là mục tiêu hỗ trợ; kiểm thử hiện thực hiện trên Chromium 145. Trình duyệt Chromium khác cần API tương ứng.

## Ba tab trợ giúp

| Tab | Tình huống |
| --- | --- |
| NTTU / HTML | Đánh giá môn học, radio HTML, ma trận, dropdown và thông tin sinh viên/môn học |
| Google Forms | Nhóm radio/checkbox ARIA, thang tuyến tính, lưới và văn bản |
| Microsoft Forms | Nhóm HTML/ARIA, Likert, văn bản và điểm có giới hạn |

Các tab dùng chung cấu hình và engine; chuyển tab trợ giúp giữ thông tin đã nhập. Mẫu Google/MS hiện là mô phỏng kiểm thử; không bảo đảm mọi widget của nền tảng.

## Cấu hình đáp án

**Cố định theo mức:** chọn thấp nhất, 25%, giữa thang, 75% hoặc cao nhất. Nhãn đồng ý/hài lòng quen thuộc nhận diện theo ý nghĩa cả khi thứ tự đảo ngược. Nhãn khác dùng vị trí hiển thị. Với thang không có vị trí chính xác, chọn mức gần nhất.

**Cố định theo vị trí:** đáp án khả dụng đầu là 1. Vị trí vượt số đáp án sẽ bỏ qua, không tự chọn đáp án khác.

**Cố định theo nhãn:** so khớp nhãn hoặc value sau khi chuẩn hóa chữ hoa/dấu tiếng Việt. Không khớp, hoặc khớp nhiều đáp án, sẽ bỏ qua.

**Ngẫu nhiên đều:** nhập khoảng mức 0–100%. Chỉ các đáp án trong khoảng được chọn; khoảng không chứa đáp án sẽ bỏ qua. Seed tùy chọn giúp lặp lại lựa chọn trên cùng cấu trúc. Đáp án xem trước được giữ khi điền; thay đổi câu khác không làm lệch ngẫu nhiên.

**Ngẫu nhiên trọng số:** nhập 5 số không âm (tối đa 1000) theo thứ tự mức 0/25/50/75/100%. Ví dụ `0, 0, 1, 3, 6` ưu tiên các mức cao. Mức không thuộc nhóm trọng số cố định được gán về nhóm gần nhất. Ít nhất một số phải lớn hơn 0.

**Checkbox/select nhiều:** nhập số tối thiểu/tối đa. Số lựa chọn nằm trong khoảng này. Chọn ngẫu nhiên không trùng; cố định chọn từ đáp án ưu tiên, nối tiếp theo thứ tự và quay vòng. Nếu không đủ đáp án phù hợp số tối thiểu sẽ bỏ qua.

**Văn bản:** để trống, dùng dòng mẫu đầu tiên hoặc lấy ngẫu nhiên một dòng. Không điền mẫu góp ý vào trường cá nhân/môn học còn thiếu. Nhập các trường đó trong phần Thông tin, hoặc đặt đáp án riêng từng câu.

**Số/thanh điểm:** bật điền số nếu muốn. Chỉ sử dụng ô có min/max/step hợp lệ (range dùng mặc định HTML 0–100). Hỗ trợ mức cố định hoặc ngẫu nhiên; trọng số cần nhập riêng.

## Quy trình xem trước → điền

1. Mở trang khảo sát, bấm biểu tượng tiện ích, chọn tab trợ giúp và cấu hình.
2. Nhập thông tin cá nhân/môn học nếu cần. Để trống trường không dùng.
3. Bấm **Quét & xem trước**. Kiểm tra số câu, đáp án sẽ điền và lý do bỏ qua.
4. Mỗi câu có thể chọn Theo cấu hình chung, Bỏ qua hoặc Chọn/nhập riêng. Với nhiều đáp án, giữ Ctrl/Cmd khi chọn. Ngày tháng dùng định dạng của ô (ví dụ `2026-10-05`).
5. Bấm **Cập nhật đáp án** khi sửa lựa chọn riêng. Thay cấu hình chung thì Quét lại.
6. Bấm **Điền theo xem trước**. Tiến độ thật hiển thị số câu đã xử lý; lỗi không được tính là điền thành công.
7. Dùng **Dừng** để dừng sau thao tác đang thực hiện; các câu đã điền được giữ nguyên. Mở lại Side Panel trong cùng phiên để theo dõi tác vụ đang chạy.
8. Kiểm tra kết quả, các câu bắt buộc còn thiếu, rồi tự bấm Gửi/Tiếp. Quét lại trang kế tiếp hoặc câu hỏi mới xuất hiện.

Mặc định giữ câu có sẵn; bật Ghi đè nếu muốn thay thế. Tác vụ không tự chạy lại sau khi trang tải lại. Thông tin thay đổi trong khi đang điền có thể cần quét lại.

## Hồ sơ và báo cáo

Nhập tên rồi bấm Lưu để lưu cấu hình và thông tin tại trình duyệt (tối đa 30 hồ sơ). Chọn hồ sơ rồi Nạp hoặc Xóa. Lưu cùng tên cập nhật hồ sơ đó. Cấu hình lần quét được nhớ, nhưng thông tin cá nhân chỉ lưu khi bấm Lưu hồ sơ.

Xuất/nhập JSON để chuyển hồ sơ; hồ sơ nhập chưa được lưu cho tới khi bấm Lưu. File nhập tối đa 100 KB, định dạng schemaVersion 1. Xuất báo cáo sau tác vụ để kiểm tra câu đã điền/bỏ qua/lỗi. File JSON có thể chứa thông tin cá nhân và đáp án; lưu ở nơi phù hợp.

## Khi gặp vấn đề

| Tình trạng | Cách xử lý |
| --- | --- |
| Không thấy câu hỏi | Đợi tải xong, Quét lại; mở khảo sát trong tab riêng nếu nhúng iframe khác nguồn |
| Dropdown không thấy đáp án | Mở danh sách trên trang rồi Quét lại; dropdown chỉ hỗ trợ options đã có trong DOM |
| Biểu mẫu đã thay đổi | Quét lại trước khi điền; không dùng bản xem trước cũ |
| Không phản hồi / thiếu quyền tab | Bấm lại biểu tượng tiện ích trên tab khảo sát rồi Quét lại |
| Câu đã có đáp án bị bỏ qua | Bật Ghi đè nếu bạn muốn thay câu trả lời |
| Văn bản vượt giới hạn / giá trị sai | Sửa đáp án riêng cho đúng ràng buộc của ô; giá trị không hợp lệ được báo lỗi |
| Trang không nhận click | Xem lỗi, chọn thủ công; không ép trạng thái checked giả |

Không hỗ trợ mọi widget riêng, canvas, iframe khác nguồn, Shadow DOM đóng, câu kéo thả/xếp hạng, CAPTCHA hoặc tải file. Extension không tự gửi khảo sát và không gửi dữ liệu tới backend riêng.

## Kiểm chứng

Xem `docs/BENCHMARK.md` và `docs/benchmark-results.json` để biết mẫu, phiên bản, kết quả, thời gian và giới hạn. 100% mẫu nội bộ không đồng nghĩa 100% mọi website. Xem `PRIVACY.md` cho chi tiết lưu dữ liệu và quyền truy cập.
