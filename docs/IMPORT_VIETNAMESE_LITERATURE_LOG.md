# Nhật ký chỉnh Home và import văn học Việt Nam

Ngày thực hiện: 2026-10-28

## A. Các file đã chỉnh sửa

| File | Thay đổi và lý do | Ảnh hưởng | Kiểm tra |
|---|---|---|---|
| `admin-web/src/pages/ReaderHome.tsx` | Chuyển nút hiện có ra khỏi khối giới thiệu vào `.booknest-start-area`; giữ nguyên `openBook` và không tạo nút mới. | Frontend Home; thứ tự giới thiệu → nút → Sách nổi bật được giữ nguyên. | Mở Home ở desktop 1641×1042: nút ở giữa khoảng trống; accessibility tree có đúng một nút. `npm run build` thành công. |
| `admin-web/src/pages/booknest-home.css` | Thêm vùng nút riêng, căn giữa bằng flex và điều chỉnh grid row cho desktop/tablet/mobile. | Frontend responsive; giữ style nút hiện tại. | Build thành công; breakpoint mobile được kiểm tra trong CSS. Chưa chụp màn hình mobile do phiên Computer Use bị dừng bởi kiểm tra URL của trình duyệt. |
| `src/models/book.model.js` | Đổi text index sang `default_language: none`, `language_override: search_language`; tránh MongoDB hiểu `language: "vi"` là text-index override không hỗ trợ. | Schema/index database. | Migration chạy thật; insert sách tiếng Việt thành công. |
| `scripts/migrate-book-text-index.js` | Migration idempotent chỉ thay text index cũ, không xóa bản ghi sách. | Database index. | `npm run migrate:book-text-index`: bỏ index cũ và tạo index mới thành công. |
| `src/services/book-import.service.js` | Bỏ lời gọi `probeExport` không tồn tại; dùng MediaWiki parse API khi wikitext thô chỉ là trang dẫn; kiểm tra đủ nội dung, license và attribution dịch giả; dùng bìa thay thế tự thiết kế thay cho `pageimage` có thể là ảnh của tác phẩm khác. Thay catch rỗng cập nhật import job bằng log lỗi. | Backend import, PDF, metadata nguồn. | Tìm/import thật từ Wikisource; `Lão Hạc` được đọc từ trang đã kết xuất; file PDF và cover qua API đều HTTP 200. |
| `src/utils/replacement-book-cover.js` | Tạo bìa SVG nội bộ có tên sách/tác giả và nhãn “BÌA THAY THẾ”; escape XML và chỉ cho phép SVG an toàn. | Backend ảnh bìa. | `Lão Hạc` lưu cover SVG; endpoint bìa trả `image/svg+xml` HTTP 200. |
| `src/utils/private-book-storage.js`, `src/controllers/book-import.controller.js`, `src/utils/wikisource-pdf.js` | Lưu SVG thay thế vào kho riêng, phục vụ với CSP hạn chế, và vẽ bìa vector vào PDF khi cover là SVG. | Backend lưu trữ và trình đọc PDF. | Đã đọc file lưu riêng và gọi API stream PDF có xác thực cho hai sách; cả hai trả HTTP 200, header PDF hợp lệ, có trang và EOF. |
| `scripts/import-vietnamese-literature.js` | Thêm import chạy lại an toàn cho 10 mục tiêu (thay `Dế Mèn` bằng `Nhị độ mai`); dùng admin hiện có nếu `ADMIN_OWNER_ID` không trỏ tới admin; xử lý từng sách độc lập; kiểm tra file trước khi báo thành công. | Backend/database. | Chạy import hai lượt; lượt sau `books_before=2`, `books_after=2`, `newBooks=0`. |
| `package.json` | Thêm lệnh `import:vietnamese-literature` và `migrate:book-text-index`. | Lệnh vận hành. | Cả hai lệnh chạy được trên môi trường dự án. |
| `src/utils/slugify.js` | Thêm re-export tương thích cho import path cũ được dùng trong bộ test. | Backend/test harness. | `test/validation.test.js` chạy qua. |
| `test/openbook-models.test.js`, `test/validation.test.js` | Sửa test category để chấp nhận các category hiện có trong model và đưa hai test OTP/auth ra khỏi test cha để Node test runner không hủy subtest. | Test harness. | `npm test`: 45/45 pass. |
| `docs/IMPORT_VIETNAMESE_LITERATURE_LOG.md` | Nhật ký này. | Tài liệu. | Cập nhật theo kết quả thực tế. |

## B. Lỗi đã xử lý

1. **MongoDB từ chối sách có `language: "vi"`.** Text index mặc định coi trường `language` là language override; MongoDB trả `language override unsupported: vi`. Migration thay đúng text index sang `language_override: search_language` và `default_language: none`. Sau migration, hai bản ghi sách đã được tạo.
2. **Import gọi `probeExport` nhưng không có hàm định nghĩa.** Bỏ lời gọi chết này; thay bằng kiểm tra lại license, nội dung đầy đủ, bìa và xác nhận PDF sau khi lưu.
3. **Một số trang Wikisource lưu nội dung qua transclusion.** Đọc nội dung trang đã kết xuất khi wikitext thô quá ngắn. `Lão Hạc` được xác minh với 17.595 ký tự sau kết xuất.
4. **Ảnh `pageimage` của “Truyện Kiều” là bìa “Kim Vân Kiều truyện”, không phải bìa đúng tác phẩm.** Thay bằng bìa OpenBook tự thiết kế, ghi rõ là bìa thay thế; tạo lại PDF để trang bìa trong PDF khớp.
5. **Cấu hình `ADMIN_OWNER_ID` không khớp một admin trong DB.** Script dùng tài khoản `ADMIN` hiện hữu trong database khi ID cấu hình không hợp lệ; không tạo user giả và không in thông tin xác thực.
6. **Test harness cũ không chạy ổn định.** Model test giới hạn category theo enum cũ; `validation.test.js` import nhầm đường dẫn slugify và khai báo test con bên trong test cha. Đã sửa kiểm tra category, thêm re-export và tách test top-level.

## C. Kết quả import đã kiểm chứng

Database đang cấu hình trong `.env` là MongoDB `test`; số bản ghi Book ban đầu là 0. Không dùng database mock.

| STT | Tên sách | Tác giả | Database ID | Ảnh bìa | Nội dung đọc | Trạng thái |
|---:|---|---|---|---|---|---|
| 1 | Truyện Kiều | Nguyễn Du | `6ae20101112775c25210f079` | Bìa thay thế PNG; API HTTP 200 | PDF 243.855 byte; stream HTTP 200 | SUCCESS |
| 2 | Lục Vân Tiên | Nguyễn Đình Chiểu | — | — | Trang tìm được không đủ nội dung; license không được xác minh bởi nguồn hiện tại | SKIPPED_LICENSE |
| 3 | Chinh phụ ngâm (bản Đoàn Thị Điểm) | Đặng Trần Côn; trang ghi người dịch Đoàn Thị Điểm | — | — | Không import: trang nguồn ghi attribution người dịch còn tranh luận, không đáp ứng yêu cầu bản dịch đã xác minh | FAILED |
| 4 | Cung oán ngâm khúc | Nguyễn Gia Thiều | — | — | Nguồn hiện tại không có license được hỗ trợ và nội dung trích xuất không đầy đủ | SKIPPED_LICENSE |
| 5 | Hoàng Lê nhất thống chí | Ngô gia văn phái | — | — | Trang nguồn hiện tại không cung cấp tác giả/nội dung đầy đủ theo bộ kiểm tra | FAILED |
| 6 | Nhị độ mai (thay Dế Mèn phiêu lưu ký) | Khuyết danh | — | — | Trang Wikisource hiện tại chỉ có nội dung ngắn, không đạt điều kiện tác phẩm đầy đủ | FAILED |
| 7 | Tắt đèn | Ngô Tất Tố | — | — | Trang Wikisource được tìm thấy là văn bản chưa hoàn thành/trích đoạn; không tạo sách thiếu nội dung | FAILED |
| 8 | Số đỏ | Vũ Trọng Phụng | — | — | Không tìm thấy trang nguồn khớp tiêu đề/tác giả để xác minh bản văn và cover | FAILED |
| 9 | Chí Phèo | Nam Cao | — | — | Không có license được nguồn hiện tại xác nhận cho bản văn cụ thể | SKIPPED_LICENSE |
| 10 | Lão Hạc | Nam Cao | `6ae2050764c4f34f6dc60abe` | Bìa thay thế SVG; API HTTP 200 | PDF 60.907 byte; stream HTTP 200 | SUCCESS |

Nguồn nội dung: [Truyện Kiều trên Wikisource](https://vi.wikisource.org/wiki/Truy%E1%BB%87n_Ki%E1%BB%81u), license ghi phạm vi công cộng; [Lão Hạc trên Wikisource](https://vi.wikisource.org/wiki/L%C3%A3o_H%E1%BA%A1c), license ghi phạm vi công cộng tại Việt Nam. Cả hai file PDF được lưu trong kho riêng của ứng dụng; ảnh bìa do OpenBook thiết kế và được lưu tại kho riêng.

`Dế Mèn phiêu lưu ký` không được phân phối vì tác giả Tô Hoài mất năm 2014 và thời hạn thông thường của tác phẩm văn học là đời tác giả cộng 50 năm; nguồn xuất bản vẫn ghi nhận tái bản tác phẩm. Thay bằng truyện thơ Nôm `Nhị độ mai` nhưng trang nguồn tìm thấy không đủ văn bản để import. Tham khảo [Nhà xuất bản Chính trị quốc gia về Tô Hoài](https://nxbctqg.org.vn/sp-xut-bn-li-toan-b-tac-pham-ca-nha-vn-to-hoai.html), [Luật sửa đổi Luật Sở hữu trí tuệ 2022](https://chinhphu.vn/?classid=1&docid=206240&orggroupid=1&pageid=27160) và [thời hạn bảo hộ tại Việt Nam](https://mst.gov.vn/giai-phap-bao-ho-quyen-tac-gia-trong-ky-nguyen-so-197251012065354133.htm).

## D. Tổng kết và lệnh tái hiện

- Số đầu mục mục tiêu: 10 (trong đó thay Dế Mèn bằng Nhị độ mai).
- Import thành công: 2; một phần: 0; thất bại: 5; bỏ qua do license/nguồn quyền: 3.
- Bản ghi mới: 2; bản ghi đã cập nhật: 1 (Truyện Kiều được thay cover và tạo lại PDF đúng tác phẩm).
- File PDF đã xác minh: 2; chương sách: 0; ảnh bìa đã xác minh: 2.
- Tái chạy lần cuối: 2 bản ghi trước, 2 bản ghi sau, 0 bản ghi mới; hai sách trả `SUCCESS_EXISTING`.
- Lỗi còn lại: 8 tác phẩm chưa thể import vì nguồn/license/bản dịch/bản văn không đạt điều kiện; cần nguồn đầy đủ và quyền sử dụng cụ thể trước khi nhập. Chưa có ảnh chụp viewport mobile.

Lệnh vận hành:

```bash
npm run migrate:book-text-index
npm run import:vietnamese-literature
```

Kiểm thử:

| Lệnh | Kết quả |
|---|---|
| `npm test` | 45/45 pass, exit code 0. Test con `test-upload.js` vẫn in phản hồi HTTP 540 từ Supabase/S3, dù script con trả trạng thái pass; kết quả này không được coi là xác nhận upload Supabase thành công. |
| `npm run build` trong `admin-web` | Thành công; bundle JS 565 KB, Vite cảnh báo chunk lớn hơn 500 KB. |
| API kiểm tra sách, cover, PDF | Cả hai sách: metadata/cover/stream HTTP 200; cover MIME PNG/SVG đúng; PDF có `%PDF-`, cấu trúc trang và `%%EOF`. |
| Import hai lượt liên tiếp | Lần cuối không tăng số bản ghi (`2 → 2`). |
| Kiểm tra desktop Home | Nút đơn, đúng handler, nằm giữa phần giới thiệu và “Sách nổi bật”. |
