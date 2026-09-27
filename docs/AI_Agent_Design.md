# THIẾT KẾ CHIẾN LƯỢC & KIẾN TRÚC AI AGENT (AI AGENT STRATEGY & ARCHITECTURE)

**Dự án:** Hệ Thống AI Automation & Agentic Workflow Cho Showroom Ô Tô  
**Mã tài liệu:** SPEC-AGENT-2026  
**Mục tiêu:** Định vị chính xác vai trò của AI, tránh lạm dụng mô hình đa tác tử không cần thiết, tối ưu hóa chi phí token và bảo đảm độ tin cậy cấp doanh nghiệp (Enterprise Reliability).

---

## 1. Chiến Lược AI: Định Vị Bản Chất Công Nghệ

### 1.1. So sánh 3 cấp độ kiến trúc AI hội thoại

| Tiêu chí so sánh | Cấp độ 1: RAG Chatbot truyền thống | Cấp độ 2: AI Agent có trạng thái (Stateful Agent) | Cấp độ 3: Hệ thống Đa tác tử (Multi-Agent System) |
|---|---|---|---|
| **Cơ chế hoạt động** | Nhận câu hỏi ➔ Tìm kiếm vector ➔ Ghép prompt ➔ Trả lời văn bản tĩnh. | Lập kế hoạch (Plan) ➔ Gọi Tool nghiệp vụ ➔ Duy trì trạng thái hội thoại ➔ Tự ra quyết định bàn giao. | Nhiều tác tử LLM độc lập trao đổi thông điệp qua lại (Agent-to-Agent communication). |
| **Khả năng ghi nhận giao dịch** | Không thể (chỉ đọc thông tin, không thể đặt lịch hẹn hoặc tạo ticket an toàn). | Rất tốt (Sử dụng Tool Gateway có cơ chế Transaction và kiểm tra idempotency). | Tốt nhưng phức tạp, khó kiểm soát thứ tự thực thi giao dịch. |
| **Độ trễ trung bình (Latency)** | Nhanh (~1.0s – 1.8s). | Vừa phải (~1.5s – 2.5s). | Chậm (~4.0s – 8.0s do qua nhiều vòng đàm thoại giữa các agent). |
| **Chi phí Token** | Thấp ($0.001 - $0.003 / tin nhắn). | Tối ưu ($0.003 - $0.006 / tin nhắn). | Rất cao ($0.02 - $0.05 / tin nhắn vì nhân bản context liên tục). |
| **Rủi ro sai lệch (Hallucination)** | Trung bình (phụ thuộc vào chất lượng chunk). | Rất thấp (Ràng buộc bằng schema JSON và logic rẽ nhánh có kiểm soát). | Cao (Hiện tượng rò rỉ ngữ cảnh hoặc suy diễn vòng vo giữa các tác tử). |
| **Đánh giá mức độ phù hợp** | Không đủ đáp ứng yêu cầu đặt lịch và kiểm tra giá chính thức. | **LỰA CHỌN TỐI ƯU CHO SHOWROOM MVP & PRODUCTION.** | Quá phức tạp (Over-engineering), không đem lại ROI tương xứng cho showroom. |

* **Kết luận của Solution Architect:** Dự án áp dụng mô hình **Single Supervisor Stateful Agent với Modular Tool Sub-nodes (LangGraph StateGraph)**. Mô hình này mang lại sức mạnh tương đương Multi-agent trong việc phân tách trách nhiệm nghiệp vụ nhưng giữ được độ trễ cực thấp, tiết kiệm 70% chi phí token và hoàn toàn có thể kiểm soát (deterministic state machine).

---

## 2. Ma Trận Đánh Giá Mức Độ Phù Hợp Của AI (Process Suitability Matrix)

| Quy trình nghiệp vụ Showroom | Tần suất xuất hiện (Frequency) | Chi phí nhân sự (Human Cost) | Rủi ro sai sót (Error Risk) | Khả năng tự động hóa bằng AI (Suitability) | Mức độ ưu tiên (Priority) |
|---|---|---|---|---|:---:|
| **Hỏi thông số kỹ thuật xe & So sánh** | Rất cao (Hàng trăm lượt/ngày) | Trung bình (Tốn thời gian gõ phím) | Thấp (Thông số cố định) | **Rất cao (RAG từ Catalog chính hãng)** | **P1 (Must-have)** |
| **Báo giá niêm yết & Dự toán lăn bánh** | Rất cao (Mọi khách hàng đều hỏi) | Trung bình | Nghiêm trọng (Báo sai giá gây tranh chấp) | **Cao (Ràng buộc bằng Tool gọi Database giá)** | **P1 (Must-have)** |
| **Tư vấn khuyến mãi & Quà tặng phụ kiện** | Cao | Cao (Cần tính toán theo khu vực) | Cao (Lệch thời hạn áp dụng) | **Cao (Áp dụng Promotion Rule Engine)** | **P1 (Must-have)** |
| **Đặt lịch lái thử (Test Drive Booking)** | Cao (Điểm then chốt để bán xe) | Cao (Phải gọi điện thoại qua lại) | Cao (Trùng xe, bùng lịch hẹn) | **Rất cao (Slot booking + Xác nhận 2 bước)** | **P1 (Must-have)** |
| **Tra cứu tiến độ giao xe / Biển số** | Trung bình | Thấp | Thấp | **Cao (Order Lookup Tool)** | **P2 (Should-have)** |
| **Đàm phán giảm giá thêm / Khách VIP** | Thấp - Trung bình | Rất cao (Kỹ năng chốt sale) | Cực kỳ nguy hiểm (Vượt biên lợi nhuận) | **Không phù hợp AI ➔ Bắt buộc Human Handoff** | **P1 (Handoff Flow)** |

---

## 3. Kiến Trúc Các Tác Tử / Phân Hệ Chức Năng (Modular Agent Sub-systems)

Hệ thống được tổ chức thành 6 phân hệ chuyên trách phối hợp chặt chẽ trên khung điều phối **LangGraph**:

```
                       ┌─────────────────────────┐
                       │  Khách hàng gửi tin     │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │  1. PLANNER / SUPERVISOR│
                       │     (Phân loại Intent)  │
                       └────────────┬────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│2. RETRIEVER AGENT│       │3. TOOL EXEC AGENT│       │4. CRM & INTENT   │
│   (RAG pgvector) │       │ (Price/Inventory)│       │   SCORING AGENT  │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │5. APPOINTMENT AGENT     │
                       │   (Idempotent Booking)  │
                       └────────────┬────────────┘
                                    │
                                    ▼ (Nếu cần đàm phán sâu / khiếu nại)
                       ┌─────────────────────────┐
                       │6. HUMAN HANDOFF AGENT   │
                       │   (Console Dispatch)    │
                       └─────────────────────────┘
```

### 3.1. Chi tiết trách nhiệm từng phân hệ:

1. **Planner / Supervisor Node:**
   - Phân tích cú pháp tin nhắn, đối chiếu trạng thái hiện tại (`conversation.state`).
   - Quyết định kích hoạt truy xuất kiến thức, gọi công cụ dữ liệu, hay chuyển giao nhân viên.
   - Quản lý bộ nhớ ngắn hạn (Short-term context window) dưới 6 lượt trao đổi để kiểm soát độ trễ.

2. **Retriever Node (RAG Engine):**
   - Thực hiện tìm kiếm tương đồng vector trên không gian nhúng 1536 chiều (`text-embedding-3-small`).
   - Sử dụng bộ lọc cứng theo `business_id` để ngăn chặn rò rỉ dữ liệu giữa các đại lý.
   - Bắt buộc trả về Citation Metadata (Tên tài liệu, Chương, Mục) kèm theo mỗi luận điểm.

3. **Tool Execution Node (Data Gateway):**
   - Chỉ cho phép AI gọi các hàm đã được khai báo schema nghiêm ngặt: `get_vehicle_spec`, `calculate_rolling_price`, `get_active_promotions`, `lookup_order_status`.
   - Mọi câu trả lời về giá tiền bắt buộc phải lấy giá trị từ hàm này, nghiêm cấm LLM tự suy đoán con số.

4. **CRM & Lead Qualification Node:**
   - Đánh giá chỉ số tiềm năng mua xe **Lead Intent Score (0 - 100 điểm)** dựa trên các tiêu chí BANT (Budget, Authority, Need, Timeline).
   - Khách có điểm trên 75 được gắn nhãn `HOT_LEAD`, tự động gửi thông báo ưu tiên tới điện thoại của Trưởng phòng bán hàng.

5. **Follow-up & Appointment Booking Node:**
   - Thực hiện quy trình đặt lịch lái thử 2 bước: (1) Thu thập thông tin & Tóm tắt ➔ (2) Khách bấm xác nhận ➔ Gọi `book_test_drive_slot`.
   - Sinh mã `idempotency_request_id` duy nhất để ngăn ngừa việc khách bấm liên tục gây đặt trùng giờ.

6. **Human Handoff Node:**
   - Kích hoạt khi: Khách yêu cầu gặp người, câu hỏi khiếu nại chất lượng xe, khách đòi bớt thêm tiền ngoài chính sách, hoặc RAG không tìm thấy tài liệu phù hợp.
   - Đóng băng quyền trả lời tự động của AI (`state = HANDOFF_PENDING`), tổng hợp tóm tắt 3 dòng về nhu cầu của khách và đẩy ngay vào hàng chờ của Employee Console.

---

## 4. Chính Sách Kiểm Soát Sai Lệch Tuyệt Đối (Zero-Hallucination Policy)

Trong ngành ô tô, sai lệch giá trị xe dù chỉ 5 triệu đồng cũng có thể dẫn tới hậu quả pháp lý nghiêm trọng hoặc mất uy tín thương hiệu. Hệ thống áp dụng 4 lớp bảo vệ:
1. **Lớp 1 (System Prompt Constraint):** *"Bạn là AI hỗ trợ tư vấn xe chính thức. Tuyệt đối không tự bịa đặt giá bán, chương trình khuyến mãi hoặc thông số kỹ thuật. Nếu tài liệu không nêu rõ, bạn phải thông báo thành thật và đề nghị kết nối chuyên viên bán hàng."*
2. **Lớp 2 (Structured Tool Grounding):** Toàn bộ dữ liệu tài chính (giá niêm yết, thuế trước bạ, biển số, tiền cọc) phải đến từ đầu ra của Tool, không trích xuất từ câu trả lời tự do của LLM.
3. **Lớp 3 (Fallback & Contradiction Detection):** Khi hệ thống phát hiện 2 văn bản có giá trị mâu thuẫn (ví dụ văn bản cũ chưa hết hạn ghi 1.1 tỷ, văn bản mới ghi 1.11 tỷ), hệ thống ngay lập tức từ chối đưa ra kết luận và tự động chuyển giao ca sang nhân sự kèm mã lỗi `conflicting_price_source`.
4. **Lớp 4 (Audit Ledger):** Lưu vết toàn bộ Input/Output token, mã chunk trích dẫn và thời gian phản hồi vào bảng `usage_audit_logs` để phục vụ hậu kiểm.
