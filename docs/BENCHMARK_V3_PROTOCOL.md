# Giao thức benchmark cạnh tranh v3 — dự thảo trước khi đo

Ngày lập: **05/10/2026**. Trạng thái: **kế hoạch, chưa xây dựng đủ corpus và chưa chạy đối thủ**. Baseline runtime của dự án: `1a8c9c0c2cded8a23e8567ff9a28aeaf517ea3c2`.

## 1. Câu hỏi cần trả lời

1. Với cùng biểu mẫu, đáp án do người dùng chỉ định và quyền truy cập, công cụ nào điền **đúng toàn bộ** nhiều trường hợp nhất?
2. Khi chất lượng bằng nhau, công cụ nào hoàn tất nhanh hơn, giữ giao diện phản hồi tốt hơn và cần ít thao tác cấu hình hơn?
3. Những loại câu hỏi, nền tảng, cấu hình hay quyền nào còn chưa được hỗ trợ?

Không suy ra độ đúng từ thông báo “success”, số trường đã click, số sao GitHub hoặc nhãn “AI”. Không dùng thời gian gửi HTTP để xếp hạng chung với thao tác giao diện. Không gộp điểm tổng để che một bộ khảo sát thua.

## 2. Phạm vi và các bảng riêng

| Bảng | Điều kiện vào bảng | Đối chứng ban đầu |
| --- | --- | --- |
| NTTU/khảo sát trường | Native/ARIA DOM; đáp án định trước; manual submit | v1.5, v2.0, extension HTML phù hợp, script trường được cấu hình hợp lệ |
| Google Forms | Biểu mẫu Google do nhóm thử nghiệm sở hữu + bản fixture có nguồn | GoogleFormsAutoFiller, QuickFill, Fillo, Form Forge, các extension đa nền tảng |
| Microsoft Forms | Biểu mẫu Microsoft do nhóm thử nghiệm sở hữu + bản fixture có nguồn | Lightning Autofill, extension HTML/ARIA phù hợp; bot Selenium ở bảng riêng |
| HTML thông dụng | Radio, checkbox, select, text, số, ngày giờ; oracle đáp án | Testofill, Fake Filler, ronedata/form-filler-extension, thuyydt/formfiller |
| Widget/framework | Ứng dụng framework thật; state cuối cùng phải khớp | Các extension có tuyên bố/triển khai hỗ trợ tương ứng |
| Phục hồi/biểu mẫu động | Rerender, điều kiện, lazy options, nhiều trang | Những công cụ có workflow/ghi nhớ/chờ điều kiện |
| Quyền kiểm soát | Giữ sửa tay, Stop, Undo, không gửi ngoài ý muốn | Báo cáo riêng; không biến thiếu Undo thành lỗi accuracy của tác vụ chỉ yêu cầu điền |
| AI/cloud | Cùng profile, cùng yêu cầu, model/version/cost được ghi | Công cụ AI; tách khỏi bảng offline xác định |

“Bộ khảo sát” là một suite có manifest và oracle đã đóng băng; “nền tảng” là nguồn UI. Một repo không hỗ trợ Microsoft Forms không bị giả vờ đo như đã hỗ trợ, nhưng bảng **coverage toàn bộ nền tảng** vẫn ghi unsupported vào mẫu số. Bảng **common core** chỉ gồm chức năng cùng hỗ trợ, được định nghĩa trước khi xem kết quả.

Danh sách SHA: [repositories.json](research/2026-10-05/repositories.json). Đây là HEAD nghiên cứu, không tự động tương đương bản store hiện hành. Trước phép đo phải chọn source build có license hợp lệ hoặc bản store, ghi version + SHA-256 gói, ngày cài và cấu hình. Repo lỗi 404 chỉ là ứng viên chờ xác minh; không có điểm đo.

## 3. Corpus 800 trường hợp — số lượng đề xuất

| Suite | Số case đề xuất | Các phân nhóm bắt buộc |
| --- | ---: | --- |
| NTTU/trường | 120 | Thang 3/5/7/10; labels tiếng Việt; thang đảo chiều; N/A; cùng tên ở nhiều form; ma trận; profile học phần |
| Google | 160 | Single choice, checkbox, Other, dropdown mở/đóng, linear scale, rating, radio/checkbox grid, date/time, paragraph, validation, sections |
| Microsoft | 140 | Choice/multi-choice, dropdown, rating, Likert, ranking, date, text dài/ngắn, restrictions, sections, branch |
| HTML | 100 | Attribute thiếu/sai; optgroup; disabled option; min/max/step; decimal; email/date; contenteditable; constraint validation |
| Framework/widget | 80 | React/Vue/Angular/Svelte thật; React Select/MUI/Vuetify/Angular Material; portal; controlled state; blur validation |
| Động/phục hồi | 80 | AJAX options; conditions; node replacement; reorder; virtual list; SPA navigation; panel/worker restart; stop; resume |
| Frame/DOM | 60 | Same-origin, cross-origin được cấp quyền, nested iframe, about:blank, open shadow, denied permission, closed shadow |
| Hành vi bảo vệ | 60 | Preserve user edits, protected fields, duplicate labels, ambiguous rules, sensitive inputs, consent, unexpected submit, Undo conflict |
| **Tổng** | **800** | Chưa có 800 case tại thời điểm lập kế hoạch |

Phân phối trên là ngân sách xây corpus, không phải kết quả. Ít nhất 20% case theo **họ biểu mẫu** dành cho holdout; cả các biến thể của một template nằm cùng partition, tránh leakage. Người/nhóm giữ holdout không cung cấp oracle cho người tối ưu trước đợt đánh giá. Khi chỉ có một người thực hiện, công khai giới hạn thiếu đánh giá độc lập; không gọi private holdout do chính người đó tạo là độc lập.

Ưu tiên nguồn: (a) biểu mẫu do nhóm sở hữu và có đáp án kiểm tra; (b) demo công khai có quyền dùng phù hợp; (c) fixture tự viết theo spec; (d) snapshot được chủ form cho phép, đã bỏ dữ liệu nhận dạng. Mỗi nguồn có nhãn riêng; không gọi fixture ARIA tự viết là đã kiểm thử Google/Microsoft thật. Không thu thập câu trả lời sinh viên hoặc lưu token đăng nhập.

Microsoft ranking và Google checkbox grid cần oracle vector/matrix. Không rút chúng thành một radio rồi công bố hỗ trợ. File upload, CAPTCHA, closed shadow và canvas-only là case từ chối có giải thích, không phải case điền thành công.

Mẫu manifest tối thiểu:

```json
{
  "id": "google-dropdown-portal-001",
  "suite": "google",
  "family": "dropdown-portal",
  "partition": "development",
  "origin": "self-authored-fixture",
  "sourceUrl": null,
  "licenseOrPermission": "project-authored",
  "fixtureSha256": "<hash>",
  "oracleVersion": 1,
  "task": {"mode": "fixed-label", "answers": {"q1": "Khoa CNTT"}},
  "expected": {"q1": {"value": "it", "label": "Khoa CNTT"}},
  "requiredCapabilities": ["combobox", "portal", "committed-state"],
  "timeoutMs": 10000
}
```

`expected` do oracle test quản lý, không gửi cho engine hay AI ngoài nội dung task mà mọi đối thủ nhận như nhau. Hash fixture và oracle manifest được công bố trước lần đo release. Tác vụ ambiguous có `expectedOutcome: needs-user`, không có đáp án đoán ngầm.

## 4. Oracle độc lập với engine

- Native: giá trị form/checked/selected, constraint validity, required còn thiếu; thêm state ứng dụng khi framework kiểm soát.
- ARIA: checked/selected của đúng nhóm, giá trị ứng dụng và màn hình sau rerender/blur; `aria-activedescendant` đơn thuần chưa chứng minh đã chọn.
- Grid: từng hàng/cột đúng và luật “mỗi cột tối đa một lựa chọn” nếu form quy định.
- Ranking: thứ tự toàn bộ + không trùng/mất phần tử; kiểm state thật thay vì chỉ vị trí DOM.
- Dynamic: tất cả trường **cần điền trên nhánh đã chọn**, không bỏ câu hỏi mới khỏi mẫu số vì lần scan đầu chưa thấy.
- Sau thao tác chờ ổn định theo deadline; mô phỏng blur/rerender có kiểm soát rồi kiểm lại. Không thêm submit trên form bên thứ ba để xác minh.
- Negative case: không mutation vào trường bị cấm; không request ngoài phạm vi; Stop và Undo giữ sửa tay. Ghi negative pass riêng, không cộng để nâng positive completion.

Không tái sử dụng hàm nhận diện/lựa chọn của chính extension làm oracle. Test assertion dựa manifest độc lập. Đối thủ được thao tác qua public UI/API được tài liệu hóa; shim cần thiết phải công khai và không sửa thuật toán. Mock riêng cho bridge/API phải có bảng kết quả riêng.

## 5. Chỉ số và mẫu số

| Chỉ số | Định nghĩa |
| --- | --- |
| Whole-form exact completion | Case có mọi đáp án được yêu cầu đúng, mọi constraint liên quan đạt, không thay đổi trường ngoài task / tổng positive cases |
| Field exact accuracy | Trường đúng / tổng trường yêu cầu; công bố alongside whole-form, không thay thế |
| Coverage | Case nhận diện và thực hiện đúng / toàn bộ positive corpus của suite; unsupported vẫn nằm mẫu số |
| Attempt precision | Trường đúng / trường đã thử điền; ghi abstention và coverage để không thưởng công cụ bỏ gần hết |
| Silent wrong | Engine báo thành công nhưng oracle sai; luôn công bố số tuyệt đối và tỷ lệ |
| Needs-user/unsupported | Hai trạng thái tách riêng, với loại trường và lý do; case positive chưa hoàn tất vẫn không được tính thành công |
| Latency | Từ lệnh người dùng đến trạng thái đã verify; p50/p95, cold/warm tách riêng |
| Setup effort | Số thao tác + thời gian cấu hình để đạt đáp án được yêu cầu, theo kịch bản quay lại được |
| Responsiveness | Long tasks >50 ms, thời gian phản hồi Stop, panel input latency |
| Recovery | Số tác vụ tiếp tục chính xác sau sự cố / tổng fault-injection scenarios |
| Policy distribution | Uniform/weighted sampling, replay seed, chọn không lặp, respect exclusion/range |

Sai 1 ô trong một form 100 ô => whole-form thất bại. Duplicate/overfilled/sensitive mutation cũng thất bại. Đối thủ chỉ sinh dummy data ngẫu nhiên được đánh giá ở **random-valid track**; không giả định nó nhận yêu cầu fixed-label nếu sản phẩm không có giao diện tương ứng.

Bảng latency phải có `n_total`, `n_success`, `n_failed`, `n_timeout`. Không bỏ failure rồi chỉ so tốc độ success. Công bố thêm time-to-correct-or-timeout với deadline đã đóng băng, không tự đặt penalty vô hạn hoặc chỉnh timeout để giúp một engine. Chỉ xếp hạng tốc độ trên cùng tập tác vụ và nhóm chất lượng tương đương.

## 6. Cấu hình công bằng

1. Hai track: **out-of-box** (thiết lập mặc định) và **configured** (đủ rule/profile để thực hiện task). Không trộn hai track.
2. Configured cho mỗi công cụ cùng ngân sách 30 phút/họ form, theo documented options; công bố config và thao tác. Không sửa source để giúp vượt oracle.
3. Nếu đối thủ có delay mặc định thì đo nguyên trạng ở out-of-box; thêm cấu hình không delay nếu tùy chọn chính thức có sẵn. Báo thời gian delay để không gọi tối ưu timer là CPU nhanh hơn.
4. Build source và store bản thương mại có version khác thì là hai mục riêng. Paid-only được ghi giá/edition và capability; không gán free edition lỗi của paid edition chưa đo.
5. Fixed answers cung cấp cùng profile/từ khóa; random-valid có cùng ràng buộc hợp lệ. Seed chỉ so replay nội bộ từng công cụ, không buộc PRNG khác nhau trả cùng chuỗi.
6. Python HTTP, Selenium Firefox, Chromium extension và cloud AI là track thực thi khác. Có bảng task-level chung nếu thật sự cùng task/oracle, nhưng không gọi CPU/engine nhanh hơn từ so sánh môi trường khác.

## 7. Môi trường và thống kê

Accuracy: 3 lượt cho mỗi case/cấu hình; deterministic task phải ổn định cả 3. Random-valid chạy ít nhất 20 seed ở từng họ; thống kê phân phối tách thành đợt lớn 10.000 lựa chọn cho thang đại diện. Trọng số bằng 0 không được chọn; impossible constraints phải từ chối rõ ràng.

Timing: chọn trước tối thiểu 12 workload đại diện (ít/vừa/lớn cho ba nền tảng + widget động). 5 warmup + tối thiểu 30 cặp đo xáo trộn thứ tự trên fresh page; CI p95 và tuyên bố tail-latency cần ít nhất 100 cặp. Không chạy parallel trên cùng máy. Paired bootstrap theo case/run, 10.000 resample; accuracy CI cluster theo họ form, không xem hàng nghìn ô cùng template là quan sát độc lập. Khi ít họ độc lập, ghi rõ CI không đủ để kết luận rộng.

Ghi OS, CPU, RAM, browser build, Node, package hash, source SHA, adapter version, viewport, locale, timezone, máy cắm nguồn/power plan, extensions khác, cold/warm, network profile, lịch thứ tự chạy và raw samples. Đối chiếu Chromium do Playwright hỗ trợ với Chrome/Edge cài thật trong kiểm thử release; không tự suy ra tương thích store từ browser test Chromium. [Playwright ghi yêu cầu persistent context cho extension](https://playwright.dev/docs/chrome-extensions).

Mục tiêu hiệu năng ban đầu, **cần hiệu chỉnh sau baseline**:

| Workload/điều kiện | Ngân sách đề xuất |
| --- | --- |
| Scan+preview 100 câu native, máy tham chiếu đã ghi | p95 ≤150 ms |
| Scan+preview 1.000 câu native | p95 ≤750 ms, không task liền mạch >50 ms |
| Apply+verify 100 câu native, delay=0 | p95 ≤750 ms |
| Apply+verify 1.000 câu native, delay=0 | p95 ≤5 s |
| Stop tác vụ chạy/chờ widget | p95 ≤100 ms; không hành động mới sau acknowledgment |
| Lazy dropdown | Chờ theo điều kiện, tối đa 2 s mặc định, deadline configurable có giới hạn |

Đây là SLA dự kiến trên máy tham chiếu, không bảo đảm máy khác hay widget có mạng. Thay ngân sách phải ghi version protocol trước run mới; không đổi sau khi thấy thứ hạng.

## 8. Điều kiện công bố “đứng đầu từng bộ”

Mỗi suite có bảng độc lập, version/date/roster rõ ràng. Chỉ phát hành tuyên bố cạnh tranh khi:

1. Đã chạy các đối thủ đủ điều kiện trong roster, tối thiểu 3 đối chứng có ý nghĩa ở suite nếu có sẵn; nếu chỉ có ít hơn, công bố giới hạn và chỉ so với số đó.
2. 100% critical safety/recovery cases đạt; silent-wrong bằng 0 trong lần đo; mọi lỗi của audit hiện tại đã có regression test và được sửa.
3. Positive whole-form ≥99% trên corpus đóng băng; **không thấp hơn điểm đo của bất kỳ đối thủ nào** trong suite; failure list và coverage đầy đủ. Mốc 99% là điều kiện phát hành nội bộ, không chứng minh 99% trên mọi form trên internet.
4. “Dẫn đầu độ đúng” chỉ dùng khi chất lượng cao hơn với CI phù hợp. Nếu nhiều công cụ cùng đạt 100% mẫu, ghi **đồng dẫn đầu trên bộ này**. Không chế thêm trọng số để tạo người thắng duy nhất.
5. “Dẫn đầu tốc độ” cần chất lượng tương đương trên cùng tập case, paired CI 95% của tỷ lệ latency nằm dưới 1; dùng mốc ≤0,9 nếu muốn gọi cải thiện đáng kể. Nếu p50 thắng nhưng p95 thua thì công bố hai thứ hạng riêng.
6. Google/Microsoft live-owned-form smoke đạt, có evidence riêng. Fixtures-only chỉ được công bố kết quả fixture.
7. Tất cả điểm được public với artifacts, protocol và cấu hình; một bên độc lập có thể chạy lại. Không gọi benchmark do dự án tổ chức là leaderboard độc lập đã được internet công nhận.

Mẫu tuyên bố hợp lệ: “Bản X đồng dẫn đầu whole-form accuracy trên Google suite Y, ngày D, so với A/B/C bản đã ghi; nhanh hơn B ở p50 trên workload W; còn thiếu ranking.” Tuyên bố “#1 toàn internet, 100% mọi khảo sát” không có phạm vi kiểm chứng và không phải tiêu chí release.

## 9. CI, cập nhật và artifacts

- PR: policy, five-gap regressions, platform fixtures, framework state, extension integration, accessibility cơ bản; thời gian perf chỉ là cảnh báo trên shared runner.
- Release: mọi suite, ZIP roundtrip, Chrome/Edge thực, controlled live forms, riêng benchmark trên máy ổn định. Fail accuracy/safety chặn release; perf noisy không tự sửa thời gian test.
- Đợt revalidation khi Google/MS DOM/browser thay đổi: ghi hash DOM đã redact, phân loại sai selector/commit state/semantic/race/permission. Refresh roster trước mỗi release lớn; không tự thay SHA của lịch sử.
- Artifacts đề xuất: `protocol.json`, `suite-manifest.json`, `engines.json`, `configs/`, `raw-runs.jsonl`, `summary.json`, `failures/`, `environment.json`, `checksums.txt`. Screenshot/trace loại bỏ profile/token; không public dữ liệu thật.
- Hỗ trợ challenge: maintainer khác gửi case/license/oracle qua PR; fix benchmark generator phải tăng suite version và chạy lại mọi đối thủ. Không xóa case thua.

## 10. Trạng thái tại ngày lập

Đã có internal benchmark 14 case và 28 kiểm thử của v2, xem [BENCHMARK.md](BENCHMARK.md). Đã tái hiện 5 giới hạn trong [v2-gap-audit.json](research/2026-10-05/v2-gap-audit.json). **Chưa có runtime measurement của đối thủ, 800-case corpus, independent holdout hay live NTTU/Google/Microsoft validation**. Giao thức này quy định công việc còn phải làm để biến mục tiêu dẫn đầu thành kết quả kiểm chứng được.
