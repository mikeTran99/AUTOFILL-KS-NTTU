# Nghiên cứu cạnh tranh AUTOFILL-KS-NTTU

Ngày kiểm tra: **05/10/2026**. Mục tiêu sản phẩm: extension Chromium, tiếng Việt, điền theo lựa chọn của người dùng; ưu tiên NTTU/HTML, Google Forms, Microsoft Forms; fixed/random/weighted, xem trước, xác minh, điều khiển tác vụ.

## Kết luận phục vụ kế hoạch

Repo chưa có bằng chứng đứng đầu internet. Internal v2 đạt 14/14 fixture của dự án; nghiên cứu này **không chạy runtime của đối thủ**. Các phần source được xem cho thấy nhiều công cụ đã có rule/profile, popup dropdown, nhận diện label và Undo. Cơ hội cạnh tranh cần kiểm chứng: kết hợp chính sách khảo sát tiếng Việt đúng ngữ nghĩa, adapters ba nền tảng, commit-state verification và benchmark tái lập.

Năm probe mới đều tái hiện giới hạn v2. Đây là ưu tiên sửa, không phải lý do thêm hàng loạt tính năng trước khi chữa độ đúng. Xem [audit JSON](research/2026-10-05/v2-gap-audit.json) và [kế hoạch nâng cấp](UPGRADE_MASTER_PLAN.md).

## 1. Phạm vi thực sự đã khảo sát

- GitHub REST: **22 query, 27 trang, 871 kết quả trước deduplicate, 711 repo duy nhất**. Đã phân trang đủ số lượng GitHub báo cho từng query; 0 query bị cap, 0 incomplete trong snapshot này.
- 25 repo được chọn để xác minh sâu hơn, gồm repo của người dùng; 23 pin SHA thành công, 2 repo API 404. Đã tải các README sẵn có và **26 source/tài liệu ở 16 repo** để kiểm tra các đoạn liên quan.
- Bổ sung web search: trang nhà sản phẩm, Chrome Web Store, docs chính thức, GitHub topics, Greasy Fork và scripts đánh giá môn học Việt Nam.
- Snapshot truy vấn và metadata: [discovery.json](research/2026-10-05/discovery.json), [repositories.json](research/2026-10-05/repositories.json). Thời điểm mỗi query được ghi trong JSON. Repo mới đẩy code được ghi đúng SHA; không dùng số sao để xếp hạng.
- Source tải về chỉ dùng đọc tĩnh dưới đuôi `.source.txt`, nằm trong `tmp/competitive-research/` bị Git ignore; không cài hoặc thực thi code đối thủ. File path gốc, permalink, byte count và SHA-256 nằm trong evidence JSON.

Đây là khảo sát rộng **có giới hạn được ghi lại**, không phải đã cào hết internet. Repository search phụ thuộc index/từ khóa, không phải full-text review toàn source của 711 repo. Fork, docs-only, repo trống, bot submit, dự án ngoài chủ đề và các nhánh không indexed có thể xuất hiện hoặc bị bỏ sót. Private repos, trang cần đăng nhập, nội dung bị robots/chặn và mọi dự án chưa biết nằm ngoài phạm vi. Các truy vấn có cùng từ khóa có overlap; 871 hits không phải 871 đối thủ.

Trong kết quả đã xem, chưa xác định được một leaderboard độc lập chung cho NTTU + Google + Microsoft với cùng corpus/oracle/version. Điều này là **kết quả tìm kiếm của lần khảo sát**, không chứng minh mọi leaderboard như vậy đều không tồn tại. Các bài “best form software” chủ yếu so form builders hoặc nội dung editorial, không thay thế phép đo extension.

## 2. Cách đọc bằng chứng

- **L**: đã kiểm thực thi cục bộ trong dự án này; chỉ v2/v1.5 và probe của chính dự án.
- **C**: quan sát được trong đoạn code ở SHA đã pin; chưa chứng minh chạy đúng trên site hiện tại.
- **T**: có test source của tác giả; chưa chạy hoặc xác thực lại ở đây.
- **V**: README/docs/store tự công bố; chưa kiểm thực thi độc lập.
- **U**: không có đủ bằng chứng; không gán điểm số.

Hai nguồn cùng do tác giả quản lý giúp đối chiếu phiên bản/chức năng nhưng không phải hai đánh giá hiệu năng độc lập. Source + test chứng minh tác giả có triển khai/kiểm thử một hành vi, không chứng minh mọi browser/site đều hoạt động.

## 3. Nhóm đối thủ và ma trận kỹ thuật

| Công cụ/nguồn pin | Vai trò | Quan sát hữu ích | Giới hạn cần đo/xác minh | Bằng chứng |
| --- | --- | --- | --- | --- |
| [GoogleFormsAutoFiller](https://github.com/muratalperen/GoogleFormsAutoFiller/blob/bf94b96cb1e07e37ea0ca61416db437b417d7171/scripts/GoogleForm.js) | Trực tiếp/Google | Fuzzy title; cache; observer debounce; ngày theo locale | Handler đã đọc tập trung text/textarea/date; chưa suy ra hỗ trợ mọi grid | C + T |
| [QuickFill](https://github.com/Nir-Bhay/google-forms-autofill-extension/blob/764eed8055efb7fc6bfc098b57a2b041344445c3/content.js) | Trực tiếp/Google | Profile matching, dropdown, học mapping, Undo | Dropdown đọc options toàn document và delay cố định trong đoạn đã đọc; cần case portal/trùng nhãn | C |
| [Fillo](https://github.com/kiron0/fillo/blob/8ad3b7f54e16670767f0a54a3224ebc6f18c5ab5/src/features/content/form-dom.ts) | Trực tiếp/Google | Popup retry, keyboard fallback, identity và date/time | Code/test có xử lý sâu; chất lượng live và latency chưa được đo ở đây | C + T |
| [Form Forge](https://github.com/rauf17/form-forge/blob/657ac28931670a922534b6cfa3f262525add423a/content.js) | Trực tiếp/Google | Fuzzy profile; mở dropdown rồi click option | Đoạn dropdown tìm toàn document, partial match; cần oracle xác minh lựa chọn thực | C |
| [Gemini Form Filler](https://github.com/ArtikTheOnlyOne/gemini-form-filler/blob/f6b947e12bcbd6386874d4c425e79f65d75e1181/content/content.js) | Trực tiếp/AI | Parser riêng scale/rating/grid/date/time | Writer dropdown sửa class/ARIA và hidden input; cần kiểm state/rerender, không coi là lỗi runtime đã chứng minh | C |
| [Testofill](https://github.com/holyjak/Testofill-chrome-extension/blob/8051a48eb6b185e15fa14bb850aec1ffc3ea7c1b/src/extension/content/testofill-run.js) | Trực tiếp/HTML | Rule CSS + generators, native multi-select | Cần cấu hình selectors; đoạn fill đã đọc chưa tạo bằng chứng commit-state cuối | C |
| [ronedata Form Filler](https://github.com/ronedata/form-filler-extension/blob/f96d8e81e96f9ae1a26eca67ff382c09e9177f2f/src/common/formmap.js) | Trực tiếp/HTML | Form map, selector fallback, native setters | Capability tự khai rộng hơn phần source đã đọc; không có số liệu so sánh | C |
| [Fake Filler](https://github.com/FakeFiller/fake-filler-extension/blob/36daf90519a7208b301af8df0863ad6b789c9306/src/common/element-filler.ts) | Trực tiếp/HTML | Custom fields/profile, regex, random data | Radio trong đoạn source nhóm theo name ở document; cần case hai form cùng name; store có thể khác SHA | C + V |
| [thuyydt Form Filler](https://github.com/thuyydt/formfiller/blob/c4121e6144e9a015cc2aaa59532eb8c79ab9caaa/content.ts) | Trực tiếp/HTML/VN | Locale, single-field fill, Undo handler, busy guard | Entry point có các hook; không đồng nghĩa đã verify mọi helper/framework | C + V |
| [HUTECH script](https://github.com/dat1208/script-hutech-survey/blob/f9772e2ffb112f592aa64ad31b298d7294920e29/script.js) | Trường/adjacent | Luồng đặc thù trường | XPath tuyệt đối, sleeps và click gửi; track không tương đương manual-fill extension | C |
| [HCMUS script](https://github.com/ngntrgduc/HCMUS-danh-gia-mon-hoc/blob/8453cbd4a83699e2090355a599597221ac4df25a/main.js) | Trường/adjacent | Mức 5 sao và điều hướng đặc thù | IDs cố định và thao tác hoàn tất; không suy ra tương thích ngoài portal đó | C |
| [autosurvey](https://github.com/hcdkhanh/autosurvey/blob/1d5899d2f94740f7b6801fe9b3e4b40362986cfc/getlink.js) | Trường/adjacent | Xuất danh sách link khảo sát | File đã đọc là link extractor; không gán score autofill cho file này | C |
| [Survey autofill extension](https://github.com/kumorikuma/survey_autofill_extension/blob/210105db88f104b1c8e8e4a333033627a3663bc6/content-script.js) | Adjacent | Mapping survey info + shortcut 1–9 | Header source nêu Fieldwork/UserInterviews, SurveyMonkey còn TODO; không mặc định hỗ trợ Google/MS | C |
| [Automa](https://github.com/AutomaApp/automa/blob/a4cbe34a60c92873c48c2470ca8ab1d96c22c7a0/src/content/blocksHandler/handlerForms.js) | Tham chiếu/workflow | Block selectors, typing, native form controls, debugger path | Cần setup workflow và quyền khác; không so trực tiếp latency default với một click của v2 | C |
| [AutoCVApply](https://github.com/tmwclaxton/autoapplycv/blob/a09e7509fcd3c351269d8334900a5cf1d8ab912d/scripts/extension-benchmark/README.md) | Tham chiếu/QA | Phân tách mock/API/DOM verification và raw p50/p95 | ATS/job forms; corpus tác giả công bố chưa được xác thực lại; không phải survey leaderboard | C-doc |

Các repo này được chọn vì sát task, có source/docs truy cập được, nền tảng đa dạng hoặc kỹ thuật kiểm thử đáng tham khảo. Không chọn chỉ theo sao. Bot trường là baseline đặc thù; Automa/AutoCVApply là tham chiếu kỹ thuật, không phải cùng một sản phẩm.

### 3.1 Các ứng viên chưa đủ bằng chứng để so điểm

- [FilloAI README](https://github.com/AnuragRoque/FilloAI-Extension/blob/0478a04a65d6ef9584e63b7fb93319d90d403ab6/README.md): ở snapshot chỉ có README và ảnh, không có implementation engine để xác nhận những tuyên bố custom-widget/framework rộng. Ghi V; không cho điểm C.
- [ai-form-filler](https://github.com/deepak0x/ai-form-filler/blob/59b45781432f296ace565c003dc02f18df4c4a3e/README.md): tài liệu mô tả bridge Claude/local Node; cần track AI/bridge riêng và pin môi trường khi chạy.
- [Google Forms AI autofiller](https://github.com/BeastBoy2209/google-forms-ai-autofiller/blob/461234e27ef2e5fff13110748145ba9c9fb4b4a6/README.md): ứng viên Google/AI; chưa đọc đủ engine để khẳng định chất lượng.
- [googleform-autofill-and-submit](https://github.com/tienthanh214/googleform-autofill-and-submit/blob/2fcc051e5891e94feb6726a7949b66032222179e/README.md): Python/HTTP, khác đường thực thi với extension UI.
- [Adam-ZS GoogleForms](https://github.com/Adam-ZS/GoogleForms) và [Microsoft bot](https://github.com/Adam-ZS/Microsoft-Forms-Fill-Bot): web search đọc được README nhưng REST hiện trả 404. Không pin/ranking. Số “3,21 giây” trong README bot là ví dụ output, không phải benchmark đã kiểm chứng.
- [VHU survey tree](https://github.com/qvanphong/vhu-auto-survey/tree/19822fdd650dd7a9482b85b745a422016a37be8d) và [Auto Select Survey](https://github.com/leducnh1290/Auto-Select-Survey/blob/41e2ba7ce1651f91ec72eea9825054c6316591a1/README.md): giữ trong catalog trường; VHU không có README trả về qua API, chưa đủ engine inspection/runtime để so.

### 3.2 Công cụ thương mại và userscript

| Sản phẩm | Nguồn kiểm tra | Quan sát | Trạng thái |
| --- | --- | --- | --- |
| Lightning Autofill | [Store](https://chromewebstore.google.com/detail/lightning-autofill/nlmmgnhgdeffjkdckmikfpnddkbbfkkk), [docs resources](https://docs.lightningautofill.com/resources), [changelog](https://lightningautofill.com/changelog.txt) | Store hiển thị 14.24.3; có rule/profile/automation và form practice Google/MS. Changelog ghi các lần sửa lỗi nền tảng | V; cần bản gói/edition để đo |
| Fake Filler | [Site](https://fakefiller.com/), [store](https://chromewebstore.google.com/detail/fake-filler/bnjjngeaknajbdcgpfkgnonkmififhfo), source pin trong bảng | Store hiển thị 4.1.0. Site và store có số users khác nhau, không dùng làm benchmark | V + C; source/store có thể không cùng version |
| Fake Data | [Docs](https://docs.fakedata.pro/how-to-use-fake-data/), [Undo](https://docs.fakedata.pro/how-to-use-fake-data/pro/undo-input-fill.html), [Google integration](https://docs.fakedata.pro/how-to-use-fake-data/pro/custom-integrations/google-forms.html) | Có hướng dẫn Undo và tích hợp widget; cần ghi edition và phiên bản khi đo | V; chưa pin gói thực thi |
| Gemini userscript | [Code](https://greasyfork.org/en/scripts/547099-google-forms-ai-form-filler-gemini/code) | Trang code hiển thị v1.1.3, Gemini schema/data fill | Source trên trang đã đọc; chưa hash bản tải/benchmark |
| MS Smart Enhancer | [Listing](https://greasyfork.org/ar/scripts/596242-microsoft-forms-smart-enhancer-%D9%85%D8%AD%D8%B3%D9%86-microsoft-forms-%D8%A7%D9%84%D8%B0%D9%83%D9%8A) | Listing ứng viên mới; chưa đủ bằng chứng autofill/runtime | U; chưa đưa vào roster thi đấu |

Không tải gói store trả phí hoặc chạy live form bên thứ ba trong bước nghiên cứu này. Tính năng file/password/captcha của công cụ QA khác không trở thành yêu cầu tự động của extension khảo sát.

## 4. Năm đối chiếu sâu và hàm ý

### Fillo: đối chứng Google cần ưu tiên

Đoạn `fillDropdownAsync` có mở popup, retry, keyboard fallback và verify lại options; field identity bổ sung label/type/section/helpText. Test source có DOM mô phỏng. V2 thiếu combobox đóng và identity qua rerender, nên Fillo là đối chứng có ý nghĩa hơn một script click đơn giản. Chưa có bằng chứng runtime của Fillo thắng v2. [Source dropdown](https://github.com/kiron0/fillo/blob/8ad3b7f54e16670767f0a54a3224ebc6f18c5ab5/src/features/content/form-dom.ts#L1624-L1681), [test source](https://github.com/kiron0/fillo/blob/8ad3b7f54e16670767f0a54a3224ebc6f18c5ab5/tests/content-dom.test.ts).

### Testofill: cấu hình linh hoạt, cần tính cả setup

Rules CSS và generated values hỗ trợ task HTML cố định/ngẫu nhiên. Đoạn fill có native radio/checkbox/multiple-select và event dispatch. So sánh cần cho phép cấu hình rule chính thức, đo thêm setup effort và commit-state; không chỉ đưa form lạ rồi kết luận đối thủ yếu. [Writer](https://github.com/holyjak/Testofill-chrome-extension/blob/8051a48eb6b185e15fa14bb850aec1ffc3ea7c1b/src/extension/content/testofill-run.js#L13-L85), [Generators](https://github.com/holyjak/Testofill-chrome-extension/blob/8051a48eb6b185e15fa14bb850aec1ffc3ea7c1b/src/extension/content/generative.js).

### QuickFill: Undo/learning là mức tham chiếu UX

Source có lưu giá trị trước khi điền và Undo. Đoạn dropdown chờ 100 ms và truy vấn options toàn document là lý do thiết kế test trùng nhãn/portal; chưa chạy để kết luận lỗi thực tế. V2 nên có Undo chỉ hoàn tác giá trị chính engine viết, giữ sửa tay sau đó. [Dropdown](https://github.com/Nir-Bhay/google-forms-autofill-extension/blob/764eed8055efb7fc6bfc098b57a2b041344445c3/content.js#L1242-L1260), [Undo](https://github.com/Nir-Bhay/google-forms-autofill-extension/blob/764eed8055efb7fc6bfc098b57a2b041344445c3/content.js#L1713-L1758).

### Gemini Form Filler: độ rộng parser cần đi cùng oracle

Source có handlers riêng cho grid/rating/date/time. Dropdown writer chỉnh DOM/ARIA và hidden input, nên kiểm sau rerender và application state là bắt buộc trong phép đo. Không gán “đúng 100%” từ parser rộng hoặc icon success. [Writer](https://github.com/ArtikTheOnlyOne/gemini-form-filler/blob/f6b947e12bcbd6386874d4c425e79f65d75e1181/content/content.js#L403-L507).

### AutoCVApply: học cách phân lớp benchmark, không nhập sai corpus

Benchmark docs phân tách overhead client, mocked API và DOM E2E; có báo expected/actual và p50/p95. Cách chia này phù hợp để bổ sung v3, nhưng job-application corpus và con số tác giả công bố không thể trở thành điểm khảo sát NTTU/Google/MS. [Benchmark docs](https://github.com/tmwclaxton/autoapplycv/blob/a09e7509fcd3c351269d8334900a5cf1d8ab912d/scripts/extension-benchmark/README.md), [Stats](https://github.com/tmwclaxton/autoapplycv/blob/a09e7509fcd3c351269d8334900a5cf1d8ab912d/scripts/extension-benchmark/lib/stats.mjs).

## 5. Audit dự án hiện tại: bằng chứng thực thi mới

Lệnh tái hiện: `node tools/audit-v2-gaps.cjs`. Chromium 145.0.7632.6; baseline v2 SHA đã ghi. Những case này **được chọn để tìm giới hạn**, không lấy 5/5 failure làm tỷ lệ lỗi đại diện cho người dùng.

| Probe | Yêu cầu | V2 quan sát | Root cause cần xử lý |
| --- | --- | --- | --- |
| semantic-na | Mức hài lòng cao nhất trong 5 mức + N/A | Chọn “Không áp dụng” | Chỉ cần 1 label chưa biết thì toàn thang fallback theo vị trí |
| reversed-numeric-scale | Mức số cao nhất trên nhãn 7..1 | Chọn 1 | Chưa phân biệt numeric scale với thứ tự DOM |
| closed-combobox | Nhận diện control combobox đóng | 0 câu | Scan chưa chứa combobox riêng |
| seed-rerender | HTML/seed giữ nguyên sau thay nodes | 16/16 IDs đổi, 11/16 đáp án đổi | PRNG key gắn ID WeakMap của node |
| fractional-step-any | 50% của khoảng 0..1 | Điền 1 thay vì 0,5 | `step=any` bị chuyển thành bước 1 |

Các giới hạn khác từ đọc source, **chưa tái hiện riêng ở đây**: ba tab vẫn chung engine; chưa có adapters live hoàn chỉnh, ranking/composite grids chuyên biệt; điều kiện mới cần rescan; thiếu Undo; chưa kiểm real React/Vue/Angular apps; không có incremental scan hoặc cross-origin injection được cấp quyền. Những điểm này là backlog kiểm chứng, không được gộp thành lỗi đã đo.

## 6. Khoảng trống và thứ tự đầu tư

| Ưu tiên | Khoảng trống | Vì sao ảnh hưởng mục tiêu dẫn đầu | Thực hiện trước |
| --- | --- | --- | --- |
| P0 | Ngữ nghĩa scale/N/A/decimal | Có thể điền sai và vẫn báo thành công | Regression từ 5 probe; chính sách explicit scale |
| P0 | Benchmark có oracle/roster | Chưa có thứ hạng kiểm chứng | Protocol, manifest, pinned engines, raw results |
| P1 | Adapters Google/MS/NTTU | UI cùng họ nhưng không cùng commit contract | Closed dropdown, grids, composite date/time, ranking |
| P1 | Stable IDs và verify | Seed/override/mapping mất ý nghĩa sau rerender | Logical IDs, stale diff, wait có deadline |
| P1 | Undo và giữ sửa tay | Điền nhanh nhưng khó sửa/khôi phục | Before/after journal, conflict-aware undo |
| P2 | Điều kiện và nhiều trang | Whole-form thiếu câu trên nhánh mới | State machine có giới hạn; xác nhận Next từng trang |
| P2 | Rule/profile theo form | Đối thủ đã có cấu hình rộng | Alias/rule cụ thể, import migration, local memory |
| P2 | Responsiveness lớn | Stress test chưa phải benchmark cạnh tranh | Chunked scans/dirty roots chỉ sau profiling |

Không cần dựng backend, cloud sync, agent AI hay visual workflow builder để sửa các giới hạn đã biết. Dùng Node/Playwright và native extension APIs đang có; chỉ thêm dev dependency để chạy framework fixture thật khi đến hạng mục đó.

## 7. Registry phiên bản được chọn

| Repo | SHA ngắn | License API | Files source/doc tải | Ghi chú |
| --- | --- | --- | ---: | --- |
| [mikeTran99/AUTOFILL-KS-NTTU](https://github.com/mikeTran99/AUTOFILL-KS-NTTU) | `8ed9f0411858` | MIT | 0 | HEAD main là v1.5; v2 trên PR #1 |
| [muratalperen/GoogleFormsAutoFiller](https://github.com/muratalperen/GoogleFormsAutoFiller) | `bf94b96cb1e0` | MIT | 3 | Pin cho nghiên cứu, chưa chạy benchmark |
| [holyjak/Testofill-chrome-extension](https://github.com/holyjak/Testofill-chrome-extension) | `8051a48eb6b1` | EPL-2.0 | 2 | Pin cho nghiên cứu, chưa chạy benchmark |
| [ronedata/form-filler-extension](https://github.com/ronedata/form-filler-extension) | `f96d8e81e96f` | Không xác định qua API | 2 | Pin cho nghiên cứu, chưa chạy benchmark |
| [Nir-Bhay/google-forms-autofill-extension](https://github.com/Nir-Bhay/google-forms-autofill-extension) | `764eed8055ef` | MIT | 1 | Pin cho nghiên cứu, chưa chạy benchmark |
| [kiron0/fillo](https://github.com/kiron0/fillo) | `8ad3b7f54e16` | MIT | 3 | Pin cho nghiên cứu, chưa chạy benchmark |
| [ArtikTheOnlyOne/gemini-form-filler](https://github.com/ArtikTheOnlyOne/gemini-form-filler) | `f6b947e12bcb` | Apache-2.0 | 1 | Pin cho nghiên cứu, chưa chạy benchmark |
| [Adam-ZS/GoogleForms](https://github.com/Adam-ZS/GoogleForms) | Không pin được | Không xác định qua API | 0 | API 404; web index có thể cũ |
| [Adam-ZS/Microsoft-Forms-Fill-Bot](https://github.com/Adam-ZS/Microsoft-Forms-Fill-Bot) | Không pin được | Không xác định qua API | 0 | API 404; web index có thể cũ |
| [tienthanh214/googleform-autofill-and-submit](https://github.com/tienthanh214/googleform-autofill-and-submit) | `2fcc051e5891` | MIT | 0 | Pin cho nghiên cứu, chưa chạy benchmark |
| [BeastBoy2209/google-forms-ai-autofiller](https://github.com/BeastBoy2209/google-forms-ai-autofiller) | `461234e27ef2` | MIT | 0 | Pin cho nghiên cứu, chưa chạy benchmark |
| [rauf17/form-forge](https://github.com/rauf17/form-forge) | `657ac2893167` | Không xác định qua API | 1 | Pin cho nghiên cứu, chưa chạy benchmark |
| [deepak0x/ai-form-filler](https://github.com/deepak0x/ai-form-filler) | `59b45781432f` | MIT | 0 | Pin cho nghiên cứu, chưa chạy benchmark |
| [AnuragRoque/FilloAI-Extension](https://github.com/AnuragRoque/FilloAI-Extension) | `0478a04a65d6` | Không xác định qua API | 0 | Pin cho nghiên cứu, chưa chạy benchmark |
| [tmwclaxton/autoapplycv](https://github.com/tmwclaxton/autoapplycv) | `a09e7509fcd3` | NOASSERTION | 2 | Pin cho nghiên cứu, chưa chạy benchmark |
| [AutomaApp/automa](https://github.com/AutomaApp/automa) | `a4cbe34a60c9` | NOASSERTION | 2 | Pin cho nghiên cứu, chưa chạy benchmark |
| [tohodo/autofill](https://github.com/tohodo/autofill) | `6bbbd1558ac3` | Không xác định qua API | 1 | Pin cho nghiên cứu, chưa chạy benchmark |
| [FakeFiller/fake-filler-extension](https://github.com/FakeFiller/fake-filler-extension) | `36daf90519a7` | MIT | 2 | Pin cho nghiên cứu, chưa chạy benchmark |
| [thuyydt/formfiller](https://github.com/thuyydt/formfiller) | `c4121e6144e9` | MIT | 2 | Pin cho nghiên cứu, chưa chạy benchmark |
| [dat1208/script-hutech-survey](https://github.com/dat1208/script-hutech-survey) | `f9772e2ffb11` | Không xác định qua API | 1 | Pin cho nghiên cứu, chưa chạy benchmark |
| [hcdkhanh/autosurvey](https://github.com/hcdkhanh/autosurvey) | `1d5899d2f947` | Không xác định qua API | 1 | Pin cho nghiên cứu, chưa chạy benchmark |
| [ngntrgduc/HCMUS-danh-gia-mon-hoc](https://github.com/ngntrgduc/HCMUS-danh-gia-mon-hoc) | `8453cbd4a836` | MIT | 1 | Pin cho nghiên cứu, chưa chạy benchmark |
| [qvanphong/vhu-auto-survey](https://github.com/qvanphong/vhu-auto-survey) | `19822fdd650d` | Không xác định qua API | 0 | Pin cho nghiên cứu, chưa chạy benchmark |
| [leducnh1290/Auto-Select-Survey](https://github.com/leducnh1290/Auto-Select-Survey) | `41e2ba7ce165` | MIT | 0 | Pin cho nghiên cứu, chưa chạy benchmark |
| [kumorikuma/survey_autofill_extension](https://github.com/kumorikuma/survey_autofill_extension) | `210105db88f1` | Không xác định qua API | 1 | Pin cho nghiên cứu, chưa chạy benchmark |

License `null` hoặc `NOASSERTION` không chứng minh được phép sao chép. Có thể đọc để phân tích; trước khi redistribute/build/reuse cần đọc LICENSE đầy đủ của đúng SHA. Kế hoạch viết implementation riêng theo spec, không chép source đối thủ vào runtime. Không thực thi repository scripts trong nghiên cứu.

## 8. Nhật ký query GitHub

| Query | GitHub total | Hits lấy | Trang |
| --- | ---: | ---: | ---: |
| `"google forms" autofill is:public` | 114 | 114 | 2 |
| `"google forms" filler extension is:public` | 23 | 23 | 1 |
| `"google forms" random is:public` | 86 | 86 | 1 |
| `"google-forms" autofill is:public` | 115 | 115 | 2 |
| `"microsoft forms" autofill is:public` | 8 | 8 | 1 |
| `"microsoft forms" bot is:public` | 8 | 8 | 1 |
| `survey autofill extension is:public` | 7 | 7 | 1 |
| `survey filler is:public` | 74 | 74 | 1 |
| `"form filler" extension is:public` | 246 | 246 | 3 |
| `"form autofill" extension is:public` | 108 | 108 | 2 |
| `"fake filler" is:public` | 34 | 34 | 1 |
| `"khảo sát" extension is:public` | 4 | 4 | 1 |
| `"khảo sát" "tự động" is:public` | 12 | 12 | 1 |
| `"khao sat" autofill is:public` | 1 | 1 | 1 |
| `NTTU survey is:public` | 1 | 1 | 1 |
| `NTTU autofill is:public` | 1 | 1 | 1 |
| `HUTECH survey is:public` | 4 | 4 | 1 |
| `"danh gia" extension is:public` | 4 | 4 | 1 |
| `Testofill is:public` | 2 | 2 | 1 |
| `autofill benchmark is:public` | 1 | 1 | 1 |
| `survey userscript is:public` | 9 | 9 | 1 |
| `google forms userscript is:public` | 9 | 9 | 1 |

Collector: `node tools/research-competitors.cjs`; cần Node ≥22, GitHub CLI `gh` đã cấu hình. Mặc định resume cache; `--refresh` truy vấn lại và cập nhật pin. Refresh là snapshot mới, không thay lịch sử đã công bố. GitHub có giới hạn tối đa 1.000 results/query; bộ query hiện tại không vượt giới hạn. Pagination không đảm bảo snapshot atomic nếu index thay đổi trong lúc chạy.

## 9. Nguồn chuẩn hỗ trợ quyết định kỹ thuật

- [W3C combobox APG](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): popup và commit tương tác riêng; dùng để thiết kế widget cases, không ép mọi site tuân APG.
- [React input reference](https://react.dev/reference/react-dom/components/input): controlled input cần cập nhật backing state; DOM readback riêng chưa đủ cho fixture framework.
- [Chrome scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting): frame/document targets và host/activeTab permission; cấp quyền đúng frame thay vì giả định truy cập xuyên origin.
- [SurveyJS conditional logic](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic) và [matrix API](https://surveyjs.io/form-library/documentation/api-reference/questionmatrixbasemodel): nguồn độc lập để tự xây các family conditions/matrix.
- [Playwright extensions](https://playwright.dev/docs/chrome-extensions): persistent context cho kiểm thử extension; các hạn chế browser sideload cần ghi vào môi trường.

Các nguồn là tài liệu chính thức hoặc repository của tác giả. Không dùng bài affiliate/ranking tổng hợp làm chứng cứ hiệu năng.

## 10. Sản phẩm của bước này và việc còn lại

Đã hoàn tất discovery public, pin metadata, đọc tĩnh các phần liên quan, audit cục bộ và kế hoạch [UPGRADE_MASTER_PLAN.md](UPGRADE_MASTER_PLAN.md), [BENCHMARK_V3_PROTOCOL.md](BENCHMARK_V3_PROTOCOL.md).

Chưa thực hiện nâng cấp runtime theo v3, benchmark đối thủ, live-owned-platform validation, independent review hay công bố thắng từng suite. Các bước đó là điều kiện bắt buộc trước bất kỳ claim dẫn đầu nào.
