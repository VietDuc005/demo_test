# PRODUCT BRIEF: HỆ THỐNG AI AUTOMATION CHO SHOWROOM Ô TÔ

**Tên dự án:** Showroom AutoAdvisor AI — Hệ Thống Tự Động Hóa Chăm Sóc & Chuyển Đổi Khách Hàng Tiềm Năng Cho Đại Lý Ô Tô  
**Khung phương pháp:** SDLC Harness (Product Owner / Business Analyst Framework)  
**Phiên bản:** 2.0 (Rebuild)  
**Ngày phát hành:** 23/09/2026

---

## 1. Tuyên Bố Tầm Nhìn & Sứ Mệnh Sản Phẩm (Product Vision)

### Tầm nhìn (Vision):
Trở thành **Nền tảng Tự động hóa Bán hàng & Trợ lý Số hàng đầu (Leading AI Sales Automation Platform)** cho các hệ thống đại lý ô tô tại Việt Nam, kết nối liền mạch từ điểm chạm tìm kiếm trực tuyến ban đầu đến trải nghiệm lái thử trực tiếp tại showroom, giúp đại lý gia tăng 25% tỷ lệ chuyển đổi khách hàng tiềm năng và giảm 70% chi phí vận hành thủ công.

### Sứ mệnh (Mission):
Giải quyết dứt điểm vấn đề "rò rỉ khách hàng nóng" do phản hồi chậm trễ ngoài giờ làm việc; cung cấp thông tin dự toán lăn bánh và chính sách khuyến mãi chính xác 100% có trích dẫn nguồn tài liệu chính hãng; đồng thời tự động hóa khâu đặt lịch lái thử có kiểm soát xung đột tài nguyên.

---

## 2. Bối Cảnh Thị Trường & Vấn Đề Cốt Lõi (Problem Statement)

1. **Khách hàng trực tuyến bỏ đi vì phản hồi chậm:** Theo nghiên cứu của Harvard Business Review, phản hồi khách hàng trong 5 phút đầu tiên tăng cơ hội xác thực lên 21 lần. Tuy nhiên, 80% showroom tại Việt Nam mất từ 30 phút đến 8 tiếng để trả lời tin nhắn vào buổi tối hoặc cuối tuần.
2. **Sai sót thông tin báo giá lăn bánh:** Bảng giá xe và chính sách khuyến mãi thay đổi liên tục theo từng tuần/tháng. Nhân viên bán hàng báo giá lệch nhau hoặc áp dụng sai điều kiện khuyến mãi dẫn đến khiếu nại của khách hàng.
3. **Thất thoát dữ liệu tiếp thị:** Khách hàng nhắn tin qua fanpage/web chat nhưng không được ghi nhận cấu trúc vào CRM, khiến đại lý lãng phí ngân sách quảng cáo (Cost Per Lead từ 300.000 – 1.200.000 VNĐ/lead).

---

## 3. Khách Hàng Mục Tiêu & Chân Dung Người Dùng (Target Audience & Personas)

1. **Khách hàng mua xe (Car Buyer - Persona: Anh Tuấn, 35 tuổi):**
   - Đang tìm mua xe C-SUV cho gia đình, online vào 21:00 tối sau giờ làm việc.
   - Nhu cầu: Cần biết ngay giá lăn bánh chính xác tại Hà Nội, các ưu đãi tháng này và muốn đặt lịch lái thử sáng thứ Bảy mà không muốn bị nhân viên gọi điện chèo kéo dồn dập.
2. **Chuyên viên tư vấn bán hàng (Sales Consultant - Persona: Chị Lan, 27 tuổi):**
   - Hàng ngày mệt mỏi vì phải gõ phím lặp lại hàng chục lần cùng một câu hỏi báo giá, mất tập trung vào các khách hàng đã đến showroom.
   - Nhu cầu: Cần một trợ lý sàng lọc sẵn khách hàng nóng, tóm tắt nhu cầu cụ thể và gửi lịch hẹn lái thử rõ ràng vào lịch làm việc.
3. **Giám đốc bán hàng / Đại lý (Sales Manager - Persona: Anh Hải, 42 tuổi):**
   - Áp lực đạt chỉ tiêu doanh số 120 xe/tháng, kiểm soát chi phí marketing và chất lượng phục vụ của đội ngũ.
   - Nhu cầu: Dashboard thời gian thực theo dõi tỷ lệ phản hồi, tỷ lệ tự động hóa, số lượng lịch lái thử mới và phát hiện các trường hợp khách hàng phàn nàn để can thiệp kịp thời.

---

## 4. Định Nghĩa Phạm Vi MVP & Phân Hạng MoSCoW

| Phân hạng | Tính năng / Phạm vi trong MVP Rebuild |
|---|---|
| **Must-Have (Bắt buộc có)** | • Web Chat có AI Agent phản hồi tức thì < 3s, hỗ trợ 2 Showroom độc lập (Showroom A & Showroom B).<br>• RAG truy xuất thông số kỹ thuật xe chính hãng kèm Trích dẫn nguồn (Citation).<br>• Báo giá niêm yết và dự toán lăn bánh theo tỉnh/thành từ dữ liệu bảng giá đã duyệt.<br>• Áp dụng quy tắc khuyến mãi theo Promotion Rule Engine.<br>• Đặt lịch lái thử xe có chống trùng lịch (Idempotency Ledger) và xác nhận 2 bước.<br>• Chuyển giao thông minh (Human Handoff) sang Employee Console khi vượt thẩm quyền.<br>• Phân quyền và cách ly dữ liệu Multi-tenancy 100%. |
| **Should-Have (Nên có)** | • Tự động tính điểm độ nóng khách hàng (Lead Intent Scoring 0-100).<br>• Tóm tắt hội thoại tự động (AI Conversation Summary) cho nhân viên trực ca.<br>• Gợi ý câu trả lời 1-click (One-click suggested responses) cho nhân viên.<br>• Dashboard quản lý đo lường SLA, Deflection Rate và ước tính ROI. |
| **Could-Have (Có thể có sau)** | • Tích hợp trực tiếp Webhook Zalo Official Account và Facebook Messenger.<br>• Gửi tin nhắn SMS Brandname tự động nhắc lịch lái thử trước 24h.<br>• Portal cho Giám đốc showroom tự tải lên và duyệt file PDF bảng giá mới. |
| **Won't-Have (Không làm ở bản này)** | • Thanh toán trực tuyến tiền đặt cọc xe qua cổng ngân hàng.<br>• Quản lý toàn diện quy trình sửa chữa bảo dưỡng sau bán hàng (After-sales workshop).<br>• Giọng nói thông minh (Voicebot AI gọi điện thoại tự động). |
