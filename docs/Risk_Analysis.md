# PHÂN TÍCH RỦI RO & PHƯƠNG ÁN ỨNG PHÓ (RISK ANALYSIS & MITIGATION PLAN)

**Dự án:** Hệ Thống AI Automation & Agentic Workflow Cho Showroom Ô Tô  
**Mã tài liệu:** RISK-ASSESS-2026  
**Phương pháp:** Ma trận đánh giá rủi ro định lượng (Likelihood × Impact) và Kế hoạch dự phòng kinh doanh liên tục (Business Continuity Planning).

---

## 1. Ma Trận Đánh Giá Rủi Ro Tổng Thể

```
    Mức độ ảnh hưởng (Impact)
       ▲
       │
   Cao │      [R-01: Sai giá xe]          [R-02: Rò rỉ dữ liệu Tenant]
       │
   Vừa │      [R-03: Gián đoạn LLM API]   [R-04: Trùng lịch lái thử]
       │
  Thấp │      [R-05: Sales ngại dùng]     [R-06: Khách spam tin nhắn]
       └────────────────────────────────────────────────────────►
              Thấp                         Cao
                           Xác suất xảy ra (Likelihood)
```

---

## 2. Chi Tiết Rủi Ro & Kế Hoạch Ứng Phó (Risk Mitigation Details)

### 2.1. Rủi ro R-01: AI báo sai giá bán hoặc sai chương trình khuyến mãi (Nghiêm trọng)
* **Nguyên nhân tiềm ẩn:** LLM bị ảo giác (Hallucination) hoặc tài liệu PDF bảng giá cũ chưa được thu hồi.
* **Hậu quả:** Khách hàng khiếu nại đòi mua xe theo giá sai; showroom đối mặt nguy cơ bồi thường hoặc ảnh hưởng nghiêm trọng tới uy tín thương hiệu.
* **Chiến lược kiểm soát (Mitigation):**
  1. **Khóa dữ liệu tài chính:** Không bao giờ để LLM tự do tính toán số tiền trong prompt. Mọi dữ liệu về giá niêm yết, lệ phí trước bạ, tiền biển số bắt buộc phải được trả về qua hàm `Tool Gateway` kết nối trực tiếp bảng CSDL `vehicles`.
  2. **Cơ chế đối soát mâu thuẫn:** Khi phát hiện 2 văn bản giá có hiệu lực giao nhau nhưng số tiền khác nhau, Agent lập tức dừng trả lời giá, chuyển trạng thái sang `HANDOFF_PENDING` kèm lý do `conflicting_price_source`.
  3. **Disclaimer pháp lý:** Mọi thông điệp báo giá của AI đều có câu chú thích chuẩn: *"Bảng tính chỉ mang tính chất dự toán tham khảo. Giá bán chính thức có hiệu lực theo hợp đồng ký kết tại Showroom."*

### 2.2. Rủi ro R-02: Rò rỉ dữ liệu giữa các Showroom (Multi-Tenant Data Breach)
* **Nguyên nhân tiềm ẩn:** Lập trình viên quên điều kiện `WHERE business_id = :id` khi truy vấn database hoặc prompt injection từ phía người dùng khai thác context.
* **Hậu quả:** Khách của Showroom Honda A nhìn thấy khách hàng hoặc chính sách giá nội bộ của Showroom Toyota B.
* **Chiến lược kiểm soát (Mitigation):**
  1. **Row-Level Security (RLS) & Partitioning:** Cấu hình chính sách bảo mật cấp dòng trong PostgreSQL, tự động gán tenant filter cho mọi kết nối database.
  2. **Namespace cách ly Vector:** Đánh chỉ mục pgvector với điều kiện lọc metadata bắt buộc `business_id = current_tenant`.
  3. **Kiểm thử hồi quy tự động:** Bộ kiểm thử CI/CD chạy 100% ca kiểm thử phân quyền chéo (Cross-tenant penetration test).

### 2.3. Rủi ro R-03: Nhà cung cấp mô hình LLM bị gián đoạn hoặc vượt ngưỡng Rate Limit
* **Nguyên nhân tiềm ẩn:** OpenAI API bị sập diện rộng hoặc lưu lượng truy cập showroom đột ngột tăng vọt giờ cao điểm.
* **Hậu quả:** Khách hàng gửi tin nhắn nhưng hệ thống bị treo hoặc báo lỗi kỹ thuật 500.
* **Chiến lược kiểm soát (Mitigation):**
  1. **Circuit Breaker & Fallback Provider:** Nếu OpenAI không phản hồi trong vòng 4 giây, hệ thống tự động chuyển sang mô hình dự phòng (Claude 3.5 Sonnet / Gemini Flash) qua LiteLLM Gateway.
  2. **Graceful Degradation:** Nếu toàn bộ LLM bên ngoài bị gián đoạn, hệ thống chuyển sang chế độ Rule-based: tự động hiển thị Menu nút bấm (Tra cứu thông số, Tải brochure, Đăng ký lái thử qua Form tĩnh) và gửi tin nhắn xin lỗi khách.

### 2.4. Rủi ro R-04: Cạnh tranh tài nguyên - Trùng lịch lái thử (Race Condition)
* **Nguyên nhân tiềm ẩn:** 2 khách hàng cùng bấm xác nhận một khung giờ lái thử xe duy nhất (ví dụ chiều thứ Bảy lúc 14:30) trong cùng một giây.
* **Hậu quả:** 2 khách đến cùng lúc nhưng chỉ có 1 xe trải nghiệm, gây bực bội cho khách hàng.
* **Chiến lược kiểm soát (Mitigation):**
  1. **Database Pessimistic Locking:** Sử dụng cú pháp `SELECT ... FOR UPDATE` trong transaction PostgreSQL khi xử lý giữ chỗ.
  2. **Khóa chống trùng (Idempotency Key):** Mỗi giao dịch xác nhận lịch được gắn mã hash duy nhất `customer_id + slot_start + vehicle_id`. Giao dịch thứ hai đến sau sẽ bị từ chối và nhận thông báo: *"Khung giờ này vừa có khách đặt trước, xin vui lòng chọn khung giờ kế tiếp"*.

### 2.5. Rủi ro R-05: Nhân viên tư vấn bán hàng phản đối hoặc không chịu tiếp nhận ca (Adoption Resistance)
* **Nguyên nhân tiềm ẩn:** Nhân viên lo sợ AI sẽ thay thế công việc hoặc xem việc tiếp nhận ca từ AI là gánh nặng thêm.
* **Hậu quả:** Khách hàng chuyển sang hàng chờ nhưng không có nhân viên tiếp ứng; phá vỡ cam kết phản hồi < 5 phút.
* **Chiến lược kiểm soát (Mitigation):**
  1. **Định vị AI là "Trợ lý đắc lực mang khách đến tận tay":** Đào tạo nội bộ nhấn mạnh AI chỉ làm nhiệm vụ sàng lọc ban đầu và làm ấm khách hàng; toàn bộ hoa hồng bán xe vẫn thuộc về chuyên viên tư vấn tiếp nhận.
  2. **Employee Console trực quan & Tiện lợi:** Cung cấp sẵn bản tóm tắt ý định mua xe và các nút trả lời mẫu 1-click (One-click suggested responses), giúp nhân viên tiết kiệm 80% công sức gõ phím.
  3. **Cơ chế Escalation tự động:** Nếu ca bàn giao không có nhân viên nhận sau 5 phút, hệ thống tự động bắn cảnh báo Zalo/Telegram đến Trưởng phòng kinh doanh.
