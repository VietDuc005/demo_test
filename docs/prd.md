# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Sản phẩm:** Showroom AutoAdvisor AI — Hệ Thống Tự Động Hóa Chăm Sóc & Chuyển Đổi Khách Hàng Tiềm Năng Cho Đại Lý Ô Tô  
**Phiên bản:** 2.0 (Rebuild & Grounded Baseline)  
**Tác giả:** Enterprise AI Product Team (PO & Lead BA)  
**Trạng thái:** Sẵn sàng nghiệm thu kỹ thuật và thẩm định nghiệp vụ (Production-Ready Spec)

---

## 1. Tổng Quan Sản Phẩm & Bối Cảnh Nghiệp Vụ

### 1.1. Tuyên bố bài toán (Problem Statement)
Các showroom ô tô tại Việt Nam tiếp nhận hàng trăm lượt tương tác mỗi ngày qua các kênh trực tuyến. Tuy nhiên, hiệu quả chuyển đổi thành khách hàng thực tế tại showroom bị giới hạn nghiêm trọng do:
1. **Phản hồi chậm trễ ngoài giờ làm việc:** Dẫn đến tỷ lệ thất thoát khách hàng tiềm năng lên tới 30% (theo báo cáo của Cox Automotive & HBR).
2. **Sai lệch thông tin bảng giá và chính sách khuyến mãi:** Dẫn đến nguy cơ khiếu nại và tranh chấp pháp lý.
3. **Thao tác thủ công trùng lặp:** Nhân viên bán hàng mất hơn 40% quỹ thời gian làm việc chỉ để gõ lại các câu trả lời cơ bản thay vì tập trung chăm sóc khách hàng nóng.

### 1.2. Giải pháp sản phẩm (Product Solution)
Xây dựng một hệ thống **AI Sales Automation Engine** chuyên sâu cho ngành bán lẻ ô tô, vận hành trên mô hình **Stateful Agent** kết hợp công cụ dữ liệu nội bộ. Hệ thống đảm nhiệm:
- Phản hồi tức thì 24/7 với độ trễ < 3 giây.
- Trả lời thông số kỹ thuật xe chính xác kèm trích dẫn nguồn tài liệu đã phê duyệt.
- Báo giá niêm yết và dự toán lăn bánh chuẩn xác từng địa bàn.
- Đặt lịch hẹn lái thử có xác thực 2 bước và chống trùng lặp slot.
- Bàn giao thông minh kèm bản tóm tắt hồ sơ khách hàng tới Console của chuyên viên tư vấn khi xuất hiện yêu cầu thương lượng giá hoặc khiếu nại.

---

## 2. Ma Trận Truy Vết Nghiệp Vụ (Requirements Traceability Matrix)

Mọi yêu cầu kỹ thuật trong tài liệu này đều bắt nguồn từ một bài toán kinh tế cụ thể của đại lý ô tô:

| Mã bài toán | Vấn đề kinh doanh thực tế (Business Problem) | Yêu cầu nghiệp vụ (Business Requirement) | Tính năng tương ứng (Feature) | Giải pháp kỹ thuật (Technical Solution) | Chỉ số đo lường hiệu quả (Measurement KPI) |
|:---:|---|---|---|---|---|
| **BP-01** | Bỏ lỡ khách hàng nóng nhắn tin buổi tối và cuối tuần (Lead Leakage). | Tương tác 24/7/365, tiếp cận khách trong 5 phút đầu tiên. | **FR-01: 24/7 AI Sales Assistant** | FastAPI Async + WebSocket + Stateful Agent Memory | Speed to lead < 3s; Phản hồi 100% lead ngoài giờ. |
| **BP-02** | Rủi ro báo sai giá lăn bánh và khuyến mãi gây tranh chấp hợp đồng. | Giá xe và khuyến mãi phải chính xác 100% theo văn bản đã duyệt. | **FR-02: Structured Price & Promo Engine** | Tool Gateway truy vấn bảng CSDL `vehicles` & `promotions` | Hallucination rate về giá = 0%; 100% có trích dẫn nguồn. |
| **BP-03** | Trùng lịch xe lái thử do nhiều nhân viên cùng đặt một khung giờ. | Đặt lịch tập trung, chống cạnh tranh tài nguyên (Race condition). | **FR-03: Atomic Test-Drive Booking** | PostgreSQL Transaction `SELECT FOR UPDATE` + Idempotency Key | Lỗi trùng lịch = 0; Tăng tỷ lệ hoàn thành đặt lịch ≥ 85%. |
| **BP-04** | AI tự ý hứa giảm giá vượt thẩm quyền hoặc trả lời sai câu hỏi nhạy cảm. | Đóng băng AI và chuyển giao nhân sự khi vượt phạm vi/khiếu nại. | **FR-04: Smart Human Handoff** | State Machine transition sang `HANDOFF_PENDING` + Broadcast WSS | Thời gian nhân sự nhận ca < 5 phút; Không tự ý cam kết giá. |
| **BP-05** | Nhân viên mất thời gian đọc lại lịch sử chat dài khi tiếp nhận ca. | Cung cấp ngay bản tóm tắt nhu cầu và gợi ý hành động tiếp theo. | **FR-05: AI Executive Summary & Actions** | Async LLM Summarization prompt trích xuất BANT & Timeline | Giảm 80% thời gian nắm bắt hồ sơ; Tăng năng suất tư vấn. |

---

## 3. Đặc Tả Chi Tiết Yêu Cầu Chức Năng (Functional Requirements - FR)

### FR-01: Hệ Thống Xác Thực & Cách Ly Đa Showroom (Multi-Tenant Auth)
- **Mô tả:** Hệ thống hỗ trợ đa đại lý độc lập trên cùng một nền tảng. Khách hàng truy cập đúng showroom mình quan tâm; nhân viên đại lý nào chỉ nhìn thấy khách hàng và bảng giá của đại lý đó.
- **Tiêu chuẩn kiểm tra:** Kiểm tra quyền ở cấp dịch vụ Backend và Row-Level Security, không chỉ ẩn hiện trên giao diện.

### FR-02: Hỏi Đáp Kiến Thức Sản Phẩm Kèm Trích Dẫn (RAG with Citations)
- **Mô tả:** AI Agent tra cứu thông số kỹ thuật, công nghệ an toàn, màu sắc, động cơ từ kho tài liệu PDF chính hãng đã được phê duyệt.
- **Tiêu chuẩn kiểm tra:** Mỗi câu trả lời phải kèm thẻ trích dẫn gồm: Tên tài liệu, Chương/Mục và đoạn văn bản căn cứ. Tuyệt đối không sinh thông số ngoài tài liệu.

### FR-03: Báo Giá Niêm Yết & Tính Dự Toán Lăn Bánh Chuẩn Xác
- **Mô tả:** Khi khách hàng hỏi giá, AI Agent kích hoạt công cụ tính toán tự động:
  - Giá niêm yết chính hãng.
  - Lệ phí trước bạ (12% tại Hà Nội, 10% tại TP.HCM và các tỉnh).
  - Phí cấp biển số (20 triệu tại Hà Nội/TP.HCM, 1-2 triệu tại các tỉnh).
  - Phí đăng kiểm, bảo hiểm TNDS bắt buộc và phí bảo trì đường bộ 1 năm.
- **Tiêu chuẩn kiểm tra:** Dữ liệu lấy trực tiếp từ bảng giá cấu hình trong CSDL, không để LLM tự tính nhẩm.

### FR-04: Áp Dụng Chính Sách Khuyến Mãi Theo Điều Kiện (Promotion Rules)
- **Mô tả:** Tự động áp dụng gói giảm giá tiền mặt, quà tặng phụ kiện chính hãng hoặc voucher bảo dưỡng dựa trên dòng xe và khu vực khách hàng đăng ký.

### FR-05: Đặt Lịch Lái Thử & Tư Vấn Có Khóa Chống Trùng (Idempotent Booking)
- **Mô tả:** Thu thập thông tin khách hàng (Họ tên, SĐT, Dòng xe lái thử, Ngày giờ, Địa điểm). Hiển thị thẻ tóm tắt để khách bấm xác nhận. Khi khách xác nhận, hệ thống kiểm tra tình trạng slot xe còn trống trong transaction an toàn và trả về mã đặt lịch duy nhất dạng `BK-YYYYMM-XXX`.

### FR-06: Bàn Giao Ca Thông Minh Cho Nhân Viên (Human Handoff)
- **Mô tả:** Tự động kích hoạt khi:
  1. Khách hàng trực tiếp yêu cầu gặp người tư vấn.
  2. Khách hàng bày tỏ khiếu nại, bức xúc về dịch vụ.
  3. Khách hàng yêu cầu giảm giá vượt khung chính sách chính thức.
  4. Hệ thống phát hiện tài liệu bảng giá bị mâu thuẫn hoặc thiếu thông tin đã duyệt.
- **Hành vi hệ thống:** Đổi trạng thái hội thoại sang `HANDOFF_PENDING`, gửi thông báo thời gian thực sang Employee Console, khóa quyền tự động trả lời nghiệp vụ của AI cho đến khi ca kết thúc.

### FR-07: Bảng Điều Khiển Nhân Viên (Employee Console)
- **Mô tả:** Cung cấp giao diện làm việc chuyên nghiệp cho chuyên viên bán hàng trực ca:
  - Hàng chờ ca cần hỗ trợ kèm đồng hồ đếm ngược SLA phản hồi (< 5 phút).
  - Thẻ hồ sơ khách hàng tích hợp điểm tiềm năng (Lead Intent Score).
  - Khung tóm tắt tự động nhu cầu của khách do AI biên soạn.
  - Các nút bấm trả lời nhanh 1-click (Gửi bảng tính trả góp, Xác nhận xe có sẵn, Hẹn đón tại showroom).

### FR-08: Bảng Chỉ Số Quản Trị Dành Cho Lãnh Đạo (Manager Dashboard)
- **Mô tả:** Cung cấp bức tranh toàn cảnh về hoạt động tiếp cận khách hàng số:
  - Tỷ lệ tự động hóa thành công (Deflection Rate).
  - Số lượng lịch lái thử mới phát sinh theo ngày/tuần.
  - Tỷ lệ tuân thủ SLA phản hồi của đội ngũ nhân viên tư vấn.
  - Chi phí API token tiêu hao và ước tính giá trị kinh tế mang lại.

---

## 4. Đặc Tả Kịch Bản Người Dùng & Tiêu Chí Nghiệm Thu (User Stories & Acceptance Criteria)

### US-01: Báo giá lăn bánh xe C-SUV tại Hà Nội
- **Story:** Là một người mua xe, tôi muốn biết chính xác giá lăn bánh xe Honda CR-V bản L AWD tại Hà Nội và ưu đãi hiện có, để tôi cân đối ngân sách gia đình trước khi đi xem xe.
- **AC-01.1 (Happy Path - Báo giá đầy đủ có căn cứ):**
  - **Given** Khách hàng hỏi: *"Bản CR-V L AWD lăn bánh ở Hà Nội giá bao nhiêu em?"*
  - **When** AI Agent xử lý tin nhắn,
  - **Then** Hệ thống gọi hàm `calculate_rolling_price(vehicle_id='VEH-CRV-2026', location='hanoi')`, trả về số tiền niêm yết 1.110.000.000 VNĐ, dự toán lăn bánh ~1.265.000.000 VNĐ, liệt kê các khoản thuế phí chi tiết, nêu rõ ưu đãi giảm 30 triệu tiền mặt trong tháng 9, và hiển thị thẻ trích dẫn tài liệu `Bang_Gia_Chinh_Thuc_CRV_2026.pdf`.
- **AC-01.2 (Negative Path - Hỏi dòng xe không kinh doanh):**
  - **Given** Khách hàng hỏi dòng xe mà showroom không phân phối (ví dụ xe Mercedes),
  - **When** AI Agent tìm kiếm trong KB không có kết quả,
  - **Then** Hệ thống phản hồi lịch sự thông báo showroom chỉ phân phối các dòng xe chính hãng thuộc danh mục và gợi ý các dòng xe tương đương hiện có.

### US-02: Đặt lịch lái thử xe ô tô có chống trùng lặp
- **Story:** Là một người mua xe đã chọn được phiên bản ưng ý, tôi muốn đăng ký lịch lái thử xe vào sáng thứ Bảy, để tôi có thể trực tiếp trải nghiệm khả năng vận hành của xe.
- **AC-02.1 (Happy Path - Đặt lịch thành công):**
  - **Given** Khách hàng đã cung cấp thông tin dòng xe, ngày giờ mong muốn và số điện thoại,
  - **When** Khách hàng bấm nút "Xác nhận đặt lịch",
  - **Then** Hệ thống mở transaction database, kiểm tra slot xe còn khả dụng, tạo bản ghi `test_drive_bookings` với trạng thái `CONFIRMED`, trả về mã lịch hẹn `BK-202609-XXX` và hiển thị thông tin chuyên viên phụ trách đón tiếp.
- **AC-02.2 (Edge Case - Slot đã bị khách khác giữ chỗ trước):**
  - **Given** Khung giờ khách chọn vừa được một khách hàng khác xác nhận thành công trước đó 1 giây,
  - **When** Transaction kiểm tra thấy capacity = 0,
  - **Then** Hệ thống rollback an toàn, thông báo khung giờ vừa kín chỗ và chủ động gợi ý khung giờ kế tiếp còn trống (ví dụ: 10:00 cùng ngày).

### US-03: Kích hoạt bàn giao ca khi khách yêu cầu bớt thêm tiền
- **Story:** Là một chuyên viên tư vấn bán hàng, tôi muốn nhận được thông báo ngay lập tức khi khách hàng muốn thương lượng giá đặc biệt, để tôi vào hỗ trợ chốt hợp đồng kịp thời.
- **AC-03.1 (Handoff Flow):**
  - **Given** Hội thoại đang ở trạng thái `AI_ACTIVE`,
  - **When** Khách hàng gửi tin nhắn: *"Giảm thêm cho anh 20 triệu nữa đi anh chuyển khoản cọc luôn bây giờ"*,
  - **Then** AI Agent nhận diện ý định thương lượng giá vượt thẩm quyền tự động, không tự đồng ý, thông báo kết nối chuyên viên bán hàng, chuyển trạng thái ca sang `HANDOFF_PENDING` với lý do `price_negotiation_out_of_bounds`, và bắn thông báo thời gian thực lên Employee Console.
