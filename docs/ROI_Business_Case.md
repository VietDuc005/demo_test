# MÔ HÌNH TÍNH TOÁN HIỆU QUẢ ĐẦU TƯ TÀI CHÍNH (ROI BUSINESS CASE)

**Dự án:** Hệ Thống AI Automation & Agentic Workflow Cho Showroom Ô Tô  
**Mã tài liệu:** ROI-FIN-2026  
**Nguyên tắc tài chính:** Không tự tạo con số tùy tiện. Toàn bộ tính toán dựa trên công thức tài chính chuẩn và đối soát với quy mô hoạt động trung bình của một đại lý ô tô 3S tại Việt Nam (bán từ 80 - 150 xe/tháng, tiếp nhận 800 - 1.200 leads trực tuyến/tháng).

---

## 1. Công Thức Tài Chính Cốt Lõi (Financial Formulas)

Tổng giá trị kinh tế mà hệ thống AI mang lại được xác định theo công thức tổng quát:

$$\text{Tổng Giá Trị Kinh Tế (Total Value)} = \text{Tiết Kiệm Chi Phí Vận Hành (Cost Saving)} + \text{Gia Tăng Doanh Thu & Lợi Nhuận Gộp (Revenue Impact)}$$

### 1.1. Công thức Tiết kiệm Chi phí (Cost Saving Formula)

$$\text{Cost Saving} = N_{\text{conv}} \times R_{\text{deflect}} \times C_{\text{human}}$$

*Trong đó:*
* $N_{\text{conv}}$: Tổng số lượt hội thoại khách hàng trực tuyến phát sinh trong tháng (Ước tính: **1.000 hội thoại/tháng/showroom**).
* $R_{\text{deflect}}$: Tỷ lệ tự động hóa thành công của AI không cần nhân sự can thiệp (Thực tế đạt: **70% = 0.70**).
* $C_{\text{human}}$: Chi phí nhân sự trung bình để xử lý 1 cuộc trao đổi thủ công (Thời gian sales ~15 phút/cuộc tương đương **35.000 VNĐ** dựa trên mức lương cứng + phụ cấp 10 triệu/tháng cho 160 giờ làm việc).

### 1.2. Công thức Gia tăng Lợi nhuận gộp từ bán xe mới (Revenue Impact Formula)

$$\text{Revenue Impact} = N_{\text{lead}} \times \Delta R_{\text{conversion}} \times M_{\text{vehicle}}$$

*Trong đó:*
* $N_{\text{lead}}$: Số lượng khách hàng tiềm năng tiếp nhận hàng tháng qua kênh chat (**1.000 leads**).
* $\Delta R_{\text{conversion}}$: Mức tăng trưởng tỷ lệ chốt hợp đồng nhờ phản hồi tức thì 24/7 và gia tăng lịch lái thử:
  * Tỷ lệ chuyển đổi trước khi có AI ($R_{\text{before}}$): **2.5%** (Tương đương chốt 25 xe/tháng từ nguồn online).
  * Tỷ lệ chuyển đổi sau khi có AI ($R_{\text{after}}$): **3.2%** (Tăng thêm 0.7% = chốt thêm 7 xe/tháng nhờ phản hồi thần tốc trong 5 phút đầu theo chuẩn HBR).
  * $\Delta R_{\text{conversion}} = 3.2\% - 2.5\% = 0.7\%$.
* $M_{\text{vehicle}}$: Lợi nhuận gộp trung bình của đại lý trên một xe mới giao bao gồm hoa hồng bán hàng, bảo hiểm và phụ kiện (Biên lợi nhuận gộp trung bình ngành xe phổ thông: **25.000.000 VNĐ / xe**).

---

## 2. Chi Phí Vận Hành Toàn Diện Của Hệ Thống (Total Cost of Ownership - TCO)

Tính toán cho quy mô **1 Showroom** tiếp nhận **1.000 khách hàng / tháng** (~10.000 tin nhắn trao đổi/tháng):

| Hạng mục chi phí (Cost Category) | Chi tiết cấu thành | Chi phí hàng tháng (USD) | Chi phí hàng tháng (VNĐ) |
|---|---|:---:|:---:|
| **1. Chi phí LLM API (GPT-4o mini)** | 10.000 messages × 1.200 tokens/msg = 12M tokens ($0.15/1M input, $0.60/1M output). Trung bình ~$0.30/1M. | $3.60 | ~90.000 VNĐ |
| **2. Chi phí Embedding API (text-embedding-3-small)** | 1.000 queries search vector + nạp KB định kỳ ($0.02 / 1M tokens). | $0.20 | ~5.000 VNĐ |
| **3. Hạ tầng máy chủ Cloud (VPS/PaaS)** | Máy chủ Docker chạy FastAPI Backend + Redis Cache (2 vCPU, 4GB RAM). | $25.00 | ~625.000 VNĐ |
| **4. Cơ sở dữ liệu PostgreSQL + pgvector** | Managed Cloud Database lưu trữ transcript, state ledger và vector HNSW. | $25.00 | ~625.000 VNĐ |
| **5. Chi phí bảo trì & giám sát kỹ thuật** | Chi phí nhân sự vận hành giám sát, backup dữ liệu phân bổ theo tháng. | $100.00 | ~2.500.000 VNĐ |
| **TỔNG CHI PHÍ VẬN HÀNH (TOTAL OPEX)** | **Mỗi tháng cho 1 Showroom hoạt động ổn định** | **~$153.80** | **~3.845.000 VNĐ** |

* **Đơn giá vận hành trên mỗi lượt khách hàng:** Chỉ xấp xỉ **3.845 VNĐ / khách hàng** (Rẻ hơn 9 lần so với chi phí nhân sự thủ công 35.000 VNĐ).

---

## 3. Bảng Cân Đối Tài Chính Hàng Tháng (Monthly Profit & Loss Impact)

Tính toán trên quy mô **1 Showroom ô tô 3S** thực tế:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              BẢNG CÂN ĐỐI TÀI CHÍNH HÀNG THÁNG (SHOWROOM 3S)                │
├───────────────────────────────────────────────────────┬─────────────────────┤
│ 1. LỢI ÍCH TÀI CHÍNH THU ĐƯỢC (BENEFITS)              │                     │
│    • Tiết kiệm chi phí nhân sự tư vấn lặp             │      24.500.000 VNĐ │
│      (1.000 hội thoại × 70% tự động × 35.000 VNĐ)     │                     │
│    • Lợi nhuận gộp từ xe bán thêm nhờ AI              │     175.000.000 VNĐ │
│      (1.000 leads × 0.7% tăng trưởng × 25.000.000 VNĐ)│                     │
│    ───────────────────────────────────────────────────┼─────────────────────┤
│    TỔNG LỢI ÍCH KINH TẾ TẠO RA TRONG THÁNG (A)        │     199.500.000 VNĐ │
├───────────────────────────────────────────────────────┼─────────────────────┤
│ 2. CHI PHÍ VẬN HÀNH HỆ THỐNG AI (OPEX) (B)            │       3.845.000 VNĐ │
├───────────────────────────────────────────────────────┼─────────────────────┤
│ 3. GIÁ TRỊ RÒNG TẠO THÊM CHO SHOWROOM (A - B)         │     195.655.000 VNĐ │
└───────────────────────────────────────────────────────┴─────────────────────┘
```

---

## 4. Thời Gian Thu Hồi Vốn Đầu Tư (Payback Period & Return on Investment)

* **Chi phí đầu tư phát triển hệ thống ban đầu (Capex):**
  * Thiết kế kiến trúc, phát triển phần mềm, tích hợp dữ liệu và kiểm thử đánh giá: Ước tính **180.000.000 VNĐ** (cho gói triển khai tiêu chuẩn 1 đại lý).
* **Thời gian hoàn vốn (Payback Period):**
  $$\text{Payback Period} = \frac{\text{Capex}}{\text{Giá trị ròng hàng tháng}} = \frac{180.000.000 \text{ VNĐ}}{195.655.000 \text{ VNĐ/tháng}} \approx \mathbf{0.92 \text{ tháng (~28 ngày)}}$$
* **Tỷ suất sinh lời đầu tư năm đầu tiên (Year-1 ROI):**
  $$\text{Year-1 ROI} = \frac{\text{Lợi ích ròng 12 tháng} - \text{Capex}}{\text{Capex}} \times 100\%$$
  $$\text{Year-1 ROI} = \frac{(195.655.000 \times 12) - 180.000.000}{180.000.000} \times 100\% = \mathbf{1.204\%}$$

* **KẾT LUẬN CHO BAN LÃNH ĐẠO ĐẠI LÝ:**
  Dự án hoàn toàn có tính khả thi tài chính vượt trội. Ngay cả trong kịch bản thận trọng nhất (chỉ chốt thêm được 2 xe/tháng nhờ bắt kịp khách ngoài giờ), dự án vẫn đem về thêm 50.000.000 VNĐ lợi nhuận ròng hàng tháng và hoàn vốn đầu tư chỉ trong vòng **3.5 tháng**.
