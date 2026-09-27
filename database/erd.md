# THIẾT KẾ MÔ HÌNH THỰC THỂ LIÊN KẾT (ENTITY RELATIONSHIP DIAGRAM - ERD)

**Dự án:** Hệ Thống AI Automation & Agentic Workflow Cho Showroom Ô Tô  
**Hệ CSDL:** PostgreSQL 16 + pgvector  
**Chuẩn thiết kế:** 3NF, Zero Data Leakage (Multi-tenancy isolation), Idempotency Tool Execution Ledger.

---

## 1. Biểu Đồ Quan Hệ Thực Thể (ERD - Mermaid Diagram)

```mermaid
erDiagram
    BUSINESS_ACCOUNTS ||--o{ USERS : "has many"
    BUSINESS_ACCOUNTS ||--o{ VEHICLES : "manages inventory"
    BUSINESS_ACCOUNTS ||--o{ PROMOTIONS : "runs campaigns"
    BUSINESS_ACCOUNTS ||--o{ KB_DOCUMENTS : "maintains knowledge"
    BUSINESS_ACCOUNTS ||--o{ CONVERSATIONS : "owns chat sessions"
    BUSINESS_ACCOUNTS ||--o{ TEST_DRIVE_BOOKINGS : "schedules slots"
    
    USERS ||--o{ CONVERSATIONS : "participates in"
    USERS ||--o{ TEST_DRIVE_BOOKINGS : "books appointment"
    USERS ||--o{ HANDOFF_CASES : "assigned/claimed by"
    
    VEHICLES ||--o{ PRICE_UPDATE_AUDIT_LOGS : "price history"
    VEHICLES ||--o{ TEST_DRIVE_BOOKINGS : "selected for test"
    
    KB_DOCUMENTS ||--o{ KB_CHUNKS : "chunked & embedded"
    
    CONVERSATIONS ||--o{ MESSAGES : "contains"
    CONVERSATIONS ||--o{ HANDOFF_CASES : "escalates to"
    CONVERSATIONS ||--o{ TOOL_EXECUTIONS : "invokes"
    
    USERS ||--o| CUSTOMER_MEMORIES : "persistent context (1:1 per tenant)"

    BUSINESS_ACCOUNTS {
        varchar id PK
        varchar name
        varchar brand
        varchar working_hours
        varchar kb_version
        jsonb settings
        boolean is_active
    }

    USERS {
        uuid id PK
        varchar business_id FK
        varchar username UK
        varchar password_hash
        varchar full_name
        varchar role
        boolean is_online
    }

    VEHICLES {
        varchar id PK
        varchar business_id FK
        varchar model_name
        varchar trim_level
        varchar category
        numeric listed_price
        int available_stock
        jsonb specifications
        jsonb rolling_price_estimates
    }

    PRICE_UPDATE_AUDIT_LOGS {
        uuid id PK
        varchar vehicle_id FK
        numeric previous_price
        numeric new_price
        varchar status
        uuid approved_by_user_id FK
        boolean embedding_reindexed
        timestamp effective_from
    }

    PROMOTIONS {
        varchar id PK
        varchar business_id FK
        varchar campaign_name
        varchar status
        timestamp effective_from
        timestamp effective_to
        jsonb rule_conditions
        jsonb benefit_details
    }

    KB_DOCUMENTS {
        uuid id PK
        varchar business_id FK
        varchar title
        varchar version
        boolean is_approved
        varchar approved_by
    }

    KB_CHUNKS {
        uuid id PK
        uuid document_id FK
        varchar business_id FK
        text content
        jsonb citation_metadata
        vector_1536 embedding
    }

    CONVERSATIONS {
        varchar id PK
        varchar business_id FK
        uuid customer_id FK
        varchar state
        uuid assigned_consultant_id FK
        int lead_intent_score
        text summary_text
    }

    MESSAGES {
        varchar id PK
        varchar conversation_id FK
        varchar sender_type
        varchar sender_id
        text content
        jsonb citations
        timestamp created_at
    }

    CUSTOMER_MEMORIES {
        uuid customer_id PK,FK
        varchar business_id PK,FK
        jsonb confirmed_facts
        text intent_summary
        timestamp expires_at
    }

    TEST_DRIVE_BOOKINGS {
        varchar id PK
        varchar business_id FK
        uuid customer_id FK
        varchar vehicle_id FK
        varchar service_type
        timestamp slot_start
        timestamp slot_end
        varchar status
        varchar idempotency_request_id UK
    }

    HANDOFF_CASES {
        uuid id PK
        varchar conversation_id FK
        varchar business_id FK
        uuid customer_id FK
        varchar reason
        varchar urgency_level
        uuid claimed_by_consultant_id FK
        timestamp claimed_at
    }

    TOOL_EXECUTIONS {
        varchar request_id PK
        varchar conversation_id FK
        varchar tool_name
        varchar business_id
        jsonb input_payload
        varchar status
        jsonb result_data
        int execution_duration_ms
    }

    USAGE_AUDIT_LOGS {
        uuid id PK
        varchar business_id
        varchar model_name
        int total_tokens
        numeric estimated_cost_usd
        int latency_ms
    }
```

---

## 2. Giải Thích 7 Miền Dữ Liệu Cốt Lõi

1. **Multi-Tenancy & Identity:** Cách ly dữ liệu cấp độ bản ghi (Row-Level / Tenant Foreign Key). Mỗi Showroom là một tenant độc lập với cài đặt thời gian biểu, kho tài liệu và nhân sự riêng biệt.
2. **Vehicle & Inventory Management:** Quản lý danh mục xe, phiên bản, giá niêm yết và tạm tính giá lăn bánh theo tỉnh/thành phố. Bảng `price_update_audit_logs` kiểm soát quy trình 4 mắt (Four-eyes principle) khi thay đổi giá xe.
3. **Promotion & Dynamic Rule Engine:** Lưu trữ các chiến dịch khuyến mãi có cấu trúc JSONB linh hoạt, lọc theo hạng khách hàng, dòng xe, khu vực địa lý và hình thức thanh toán.
4. **Knowledge Base (RAG & pgvector):** Lưu trữ tài liệu chính thức đã được ban giám đốc phê duyệt, chia nhỏ thành các chunk kèm vector nhúng cosine 1536 chiều được đánh chỉ mục `HNSW`.
5. **Conversation, State & Working Memory:** Quản lý vòng đời hội thoại (`AI_ACTIVE` -> `HANDOFF_PENDING` -> `HUMAN_ACTIVE` -> `RESOLVED`), lưu trữ ngữ cảnh khách hàng định danh trong 24 giờ.
6. **Booking & Lead Escalation (Handoff):** Xử lý đặt lịch tư vấn và lái thử xe với khóa chống trùng lặp (`idempotency_request_id`), phân bổ ca trực cho chuyên viên tư vấn khi phát hiện khách hàng nóng hoặc yêu cầu thương lượng giá.
7. **Idempotency Tool Execution Ledger & Audit:** Ghi nhận mọi lệnh gọi công cụ vào cơ sở dữ liệu để ngăn ngừa tình trạng gọi lặp (double booking/double ticket) và theo dõi chi phí API token chi tiết.
