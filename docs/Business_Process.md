# ĐẶC TẢ QUY TRÌNH NGHIỆP VỤ ĐẠI LÝ Ô TÔ (BUSINESS PROCESS SPECIFICATION)

**Dự án:** Hệ Thống AI Automation & Agentic Workflow Cho Showroom Ô Tô  
**Đối soát:** PRD v1.1, SAD v0.3 & Quy chuẩn TSOP Toyota / Honda Standards  
**Phương pháp:** BPMN 2.0 Mapping, Phân tích AS-IS vs. TO-BE, Ma trận giá trị kinh tế.

---

## 1. Phân Tích Quy Trình Hiện Tại (AS-IS Process Analysis)

Quy trình bán hàng xe mới tại các showroom ô tô truyền thống khi tiếp nhận khách hàng qua các kênh trực tuyến (Website, Facebook Fanpage, Zalo OA) hiện nay:

```
[Khách gửi tin nhắn] ──► [Chờ Sales trực ca phản hồi] ──► [Sales hỏi nhu cầu thủ công]
                                 │ (Trễ 15p - 4 tiếng)           │ (Hỏi lặp, thiếu cấu trúc)
                                 ▼                               ▼
[Thất thoát Lead ngoài giờ] ◄────┴────────── [Tra cứu giá & khuyến mãi trên file Excel/Zalo nhóm]
                                                                 │ (Rủi ro lệch bảng giá)
                                                                 ▼
[Ghi sổ tay / quên cập nhật CRM] ◄─────────── [Hẹn lái thử bằng nhắn tin miệng]
```

### 1.1. Ma trận chi tiết các bước trong quy trình AS-IS

| Bước | Người thực hiện | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Điểm nghẽn vận hành (Painpoint) | Chi phí / Tổn thất ước tính | Cơ hội tự động hóa (Automation Opportunity) |
|---|---|---|---|---|---|---|
| **1. Tiếp nhận Inquiry** | Sales trực ca / CSKH | Tin nhắn từ Web chat, Fanpage, Zalo | Lời chào, mở hội thoại | Phản hồi chậm ngoài giờ hành chính (buổi tối, cuối tuần mất 2 - 8 tiếng). | Thất thoát 20-30% lead nóng (mất chi phí CPL 300k - 800k/lead). | AI Agent phản hồi tức thì trong < 3 giây 24/7/365. |
| **2. Khám phá nhu cầu** | Sales trực ca | Yêu cầu sơ bộ của khách | Thông tin dòng xe, ngân sách, khu vực | Sales mới vào nghề khai thác thiếu thông tin; khách phải lặp lại nhiều lần. | Tốn 15-20 phút tương tác rời rạc giữa khách và sales. | AI dẫn dắt theo bộ khung định sẵn (Slot-filling prompt). |
| **3. Tư vấn thông số & So sánh** | Sales trực ca | Dòng xe khách hỏi | Bảng thông số, so sánh xe | Sales không nhớ hết thông số phiên bản, trả lời mơ hồ hoặc sai tính năng. | Giảm độ tin cậy của showroom trong mắt khách hàng. | RAG Agent truy xuất tức thì từ tài liệu Catalog chính hãng. |
| **4. Báo giá & Dự toán lăn bánh** | Sales trực ca | Tỉnh/thành đăng ký, phiên bản xe | Con số dự toán lăn bánh, khuyến mãi | Bảng giá khuyến mãi thay đổi liên tục giữa các tuần; sales báo lệch giá gây khiếu nại. | Rủi ro bồi thường chênh lệch giá (5 - 20 triệu/xe). | Database Tool Gateway trả bảng giá chuẩn hóa đã duyệt. |
| **5. Đặt hẹn lái thử (Test Drive)** | Sales trực ca | Yêu cầu ngày giờ của khách | Tin nhắn xác nhận lịch | Trùng xe lái thử do nhiều sales cùng hẹn một khung giờ; quên nhắc lịch khách. | Tỷ lệ khách bùng lịch (No-show) lên tới 40-50%. | Quản lý Slot tập trung với Database Transaction + SMS/Zalo nhắc tự động. |
| **6. Ghi nhận dữ liệu vào CRM** | Sales trực ca | Thông tin thu thập được | Bản ghi trên CRM đại lý | Sales quên nhập liệu hoặc chỉ nhập khi khách đã chốt cọc; mất dữ liệu phân tích. | Lãng phí dữ liệu tiếp thị; không theo dõi được phễu chuyển đổi. | Tự động đồng bộ Profile, Transcript & Lead Score vào CRM. |

---

## 2. Quy Trình Tương Lai (TO-BE Process Design)

Hệ thống đưa AI Agent vào làm việc như một **"Chuyên viên Tiếp đón & Điều phối Bán hàng Số 24/7" (Tier-1 AI Sales Assistant)** kết hợp nhịp nhàng với đội ngũ tư vấn con người (Human-in-the-loop):

```
[Khách gửi tin nhắn] ──► [AI Agent phản hồi tức thì < 3s]
                                │
                                ├──► [RAG: Trả lời thông số chính hãng có Citation]
                                ├──► [Tool: Báo giá niêm yết + Lăn bánh chuẩn xác]
                                ├──► [Rule Engine: Áp dụng khuyến mãi cá nhân hóa]
                                ├──► [Booking Engine: Đặt lịch lái thử nguyên tử (Atomic)]
                                │
                                ├──► [Phát hiện ý định: Thương lượng giá / Khiếu nại]
                                │           │
                                │           ▼
                                └──► [Handoff: Bàn giao toàn bộ Transcript + Context cho Sales Console]
                                            │
                                            ▼
                                     [Sales nhận ca & Chốt cọc trong < 5 phút]
```

### 2.2. Traceability Matrix: Chuyển dịch từ Nỗi đau nghiệp vụ sang Giải pháp kỹ thuật

```
Vấn đề kinh doanh (Business Problem)
   └── Phản hồi chậm làm rớt khách tiềm năng ngoài giờ
Yêu cầu nghiệp vụ (Business Requirement)
   └── Hệ thống phải tương tác tự động 24/7, xác minh nhu cầu trong 5 phút đầu
Tính năng sản phẩm (Feature)
   └── AI Sales Agent tự động hội thoại, trích xuất nhu cầu, tính điểm Lead Intent
Giải pháp kỹ thuật (Technical Solution)
   └── FastAPI + LangGraph Orchestration + Slot-filling State Machine
Chỉ số đo lường (Measurement KPI)
   └── Tỷ lệ phản hồi trong 5 giây đạt 99.9%; Tăng tỷ lệ Lead-to-Booking từ 12% lên 24%
```

---

## 3. Quy Trình Cập Nhật Giá Xe & Kho Tri Thức (Price & KB Update Workflow)

Để bảo đảm tính pháp lý và ngăn chặn rủi ro AI bịa giá (Hallucination), quy trình cập nhật giá tuân thủ nguyên tắc **"Quy chuẩn 4 mắt" (Four-Eyes Principle)**:

```
[1. ERP / DMS / Ban Giám Đốc]
            │
            ▼ (Đẩy dữ liệu giá xe & chính sách mới)
[2. Service Gateway Validation] ──(Dữ liệu không hợp lệ)──► [Báo lỗi từ chối]
            │ (Dữ liệu hợp lệ: Kiểm tra chênh lệch > 5%)
            ▼
[3. Approval Workflow (Sales Director)] ──(Từ chối)───────► [Hủy bỏ / Yêu cầu giải trình]
            │ (Phê duyệt chính thức)
            ▼
[4. Atomic DB Update (PostgreSQL)] ──► Cập nhật bảng `vehicles` & ghi `price_update_audit_logs`
            │
            ▼
[5. Asynchronous Vector Re-indexing] ──► Cắt chunk văn bản mới, gọi Embedding API & cập nhật `kb_chunks`
            │
            ▼
[6. Cache Invalidation & Event Broadcast] ──► Xóa Redis cache phiên bản cũ, kích hoạt Agent dùng giá mới
```

### 3.1. Các tham số kiểm soát quy trình cập nhật giá:
1. **Chế độ cập nhật (Sync Mode):** Hỗ trợ cả **Real-time API Push** (khi có quyết định giá khẩn cấp) và **Scheduled Batch Sync** (chạy định kỳ lúc 02:00 sáng hàng ngày để đối soát toàn bộ danh mục).
2. **Thẩm quyền phê duyệt (Approval Authority):** Chỉ tài khoản có vai trò `SALES_MANAGER` hoặc `DEALER_MANAGER` mới có quyền ký duyệt trên giao diện Portal quản trị.
3. **Cơ chế Rollback an toàn:** Lưu trữ toàn bộ lịch sử trong `price_update_audit_logs`. Khi phát hiện sự cố, Giám đốc đại lý có thể bấm nút "Hoàn tác (Rollback)" để quay về phiên bản giá trước đó trong vòng **< 1 giây**.
4. **Kiểm soát phiên bản (Version Control):** Mỗi văn bản chính sách giá được đánh mã phiên bản cụ thể (ví dụ: `v2026.09.B1`). Mọi câu trả lời của AI Agent bắt buộc phải gắn mã phiên bản của tài liệu trích dẫn.

---

## 4. Thiết Kế Động Cơ Quy Tắc Khuyến Mãi (Promotion Rule Engine)

Khuyến mãi trong ngành ô tô rất phức tạp, thay đổi theo vùng miền và dòng xe. Promotion Rule Engine được thiết kế theo mô hình **Rule-Evaluation Pipeline**:

```json
{
  "rule_id": "RULE-PROMO-CRV-SEP2026",
  "priority": 100,
  "conditions": {
    "vehicle_category": "C-SUV",
    "trim_codes": ["CRV-L-AWD", "CRV-L-2WD"],
    "customer_tier": ["NEW", "LOYALTY"],
    "geographic_regions": ["Hanoi", "Haiphong", "Quangninh"],
    "purchase_methods": ["CASH", "INSTALLMENT_BANK"],
    "booking_channel": "AI_AGENT"
  },
  "actions": [
    {
      "apply_discount": {
        "type": "FIXED_AMOUNT",
        "value": 30000000,
        "label": "Giảm trừ tiền mặt trực tiếp vào hợp đồng"
      }
    },
    {
      "grant_gift_package": {
        "package_id": "PKG-3M-CAM-6D",
        "retail_value": 15000000,
        "items": ["Phim cách nhiệt 3M", "Camera hành trình Vietmap", "Lót sàn 6D"]
      }
    },
    {
      "grant_voucher": {
        "voucher_type": "FREE_MAINTENANCE",
        "milestones": ["1000km", "5000km"]
      }
    }
  ]
}
```

* **Khả năng tương thích:** Động cơ kiểm tra tuần tự các điều kiện đầu vào của khách hàng (Địa điểm đăng ký xe, dòng xe quan tâm, thời điểm dự kiến mua). Nếu thỏa mãn tất cả điều kiện, Agent sẽ tự động tổng hợp thành câu chào ưu đãi hấp dẫn và gắn kèm mã tham chiếu để nhân viên tư vấn dễ dàng đối chiếu khi ký hợp đồng.
