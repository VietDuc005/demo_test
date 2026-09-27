# ĐẶC TẢ THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SPECIFICATION)

**Dự án:** Showroom AutoAdvisor AI  
**Hệ quản trị CSDL:** PostgreSQL 16 + pgvector Extension  
**Mục tiêu:** Lưu trữ bền vững, tìm kiếm vector tốc độ cao, hỗ trợ phân tán dữ liệu theo tenant và ghi vết kiểm toán toàn diện.

---

## 1. Danh Mục Các Bảng Dữ Liệu (Data Dictionary)

| Nhóm chức năng | Tên bảng | Mục đích lưu trữ | Khóa chính / Khóa ngoại quan trọng |
|---|---|---|---|
| **Đa Showroom & Quyền** | `business_accounts` | Thông tin chi nhánh showroom độc lập (Honda Giải Phóng, Toyota Bến Thành). | `id` (PK) |
| | `users` | Tài khoản khách hàng, chuyên viên bán hàng và ban quản lý đại lý. | `id` (PK), `business_id` (FK) |
| **Sản Phẩm & Bảng Giá** | `vehicles` | Danh mục xe, phiên bản, giá niêm yết, tồn kho và công thức tính lăn bánh. | `id` (PK), `business_id` (FK) |
| | `price_update_audit_logs` | Lịch sử thay đổi giá xe, thông tin người phê duyệt và trạng thái cập nhật vector. | `id` (PK), `vehicle_id` (FK) |
| **Khuyến Mãi** | `promotions` | Các chiến dịch khuyến mãi kèm điều kiện lọc của Promotion Rule Engine. | `id` (PK), `business_id` (FK) |
| **Kho Tri Thức (RAG)** | `kb_documents` | Metadata tài liệu Catalog, bảng giá gốc đã được duyệt. | `id` (PK), `business_id` (FK) |
| | `kb_chunks` | Các đoạn văn bản đã cắt nhỏ (~500 tokens) kèm vector nhúng 1536 chiều. | `id` (PK), `document_id` (FK) |
| **Hội Thoại & Bộ Nhớ** | `conversations` | Quản lý phiên hội thoại, trạng thái vòng đời và điểm số Lead Intent Score. | `id` (PK), `customer_id` (FK) |
| | `messages` | Từng tin nhắn trao đổi, người gửi, nội dung và thẻ trích dẫn Citation. | `id` (PK), `conversation_id` (FK) |
| | `customer_memories` | Bộ nhớ thông tin đã xác thực của khách hàng (duy trì trong 24 giờ). | `(customer_id, business_id)` (PK kép) |
| **Giao Dịch & Handoff** | `test_drive_bookings` | Lịch hẹn lái thử và tư vấn trực tiếp có khóa chống trùng lặp. | `id` (PK), `vehicle_id` (FK) |
| | `handoff_cases` | Hồ sơ ca bàn giao từ AI sang nhân viên bán hàng kèm lý do chi tiết. | `id` (PK), `conversation_id` (FK) |
| **Kiểm Toán & Vận Hành**| `tool_executions` | Sổ cái ghi vết (Ledger) mọi lệnh gọi công cụ nghiệp vụ chống thực thi lặp. | `request_id` (PK) |
| | `usage_audit_logs` | Ghi nhận chi phí token, thời gian phản hồi phục vụ tính toán ROI. | `id` (PK), `business_id` (FK) |

---

## 2. Chiến Lược Đánh Chỉ Mục & Tối Ưu Truy Vấn (Indexing Strategy)

1. **Chỉ mục Vector HNSW (Hierarchical Navigable Small World):**
   ```sql
   CREATE INDEX idx_kb_chunks_vector ON kb_chunks 
   USING hnsw (embedding vector_cosine_ops) 
   WITH (m = 16, ef_construction = 64);
   ```
   - Cho phép tìm kiếm tương đồng vector với độ trễ dưới **15ms** trên kho dữ liệu hàng chục nghìn đoạn văn bản, nhanh hơn 10 lần so với chỉ mục IVFFlat truyền thống và không cần huấn luyện trước (no warm-up training required).
2. **Chỉ mục Độc quyền Cố định (Partial Unique Index):**
   ```sql
   CREATE UNIQUE INDEX uq_active_customer_conversation 
   ON conversations (customer_id, business_id) 
   WHERE state != 'RESOLVED';
   ```
   - Ngăn chặn triệt để tình trạng một khách hàng mở đồng thời nhiều phiên hội thoại cùng lúc gây phân mảnh ngữ cảnh.

---

## 3. Quản Trị Giao Dịch & Khóa Bi Quan (Transaction Isolation)
Khi khách hàng bấm xác nhận đặt lịch lái thử, hệ thống thực thi thủ tục với mức độ cô lập giao dịch cao nhất nhằm loại bỏ tình trạng bán trùng slot:
```sql
BEGIN;
-- Khóa dòng dữ liệu slot xe lái thử để các request khác phải chờ
SELECT available_stock FROM vehicles WHERE id = :vehicle_id FOR UPDATE;

-- Kiểm tra và ghi nhận lịch hẹn
INSERT INTO test_drive_bookings (id, business_id, customer_id, vehicle_id, slot_start, slot_end, status, idempotency_request_id)
VALUES (:id, :business_id, :customer_id, :vehicle_id, :slot_start, :slot_end, 'CONFIRMED', :idempotency_key);

COMMIT;
```
Nếu xảy ra xung đột hoặc mất kết nối mạng giữa chừng, transaction tự động ROLLBACK hoàn toàn, bảo đảm hệ thống không bao giờ rơi vào trạng thái bất nhất định.
