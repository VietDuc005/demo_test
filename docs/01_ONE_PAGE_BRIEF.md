# 1-Page Brief — AI Agent Chatbot doanh nghiệp (Business Account) chăm sóc khách trong chat

**Owner:** Product Manager   
**Version:** 1.0  
**Ngày khóa:** 19/09/2026  
**Mục tiêu Gate 1:** Chốt đúng bài toán, người dùng, AI decision point, phạm vi MVP ba tuần và cách chứng minh sản phẩm hoạt động.

## 1. Bối cảnh và vấn đề

Các thương hiệu y tế, showroom xe và bất động sản của Tập đoàn X đã mở Business Account nhưng thiếu nhân lực trả lời 24/7 câu hỏi lặp về giá, lịch hẹn và đơn hàng. Benchmark thị trường hỗ trợ pain point này: [Zendesk](https://www.zendesk.com/newsroom/press-releases/contextual-intelligence-becomes-the-new-standard-for-exceptional-customer-experience-in-2026/) ghi nhận 74% người tiêu dùng kỳ vọng dịch vụ 24/7 và 74% khó chịu khi phải lặp thông tin; [PwC Việt Nam](https://www.pwc.com/vn/en/publications/vietnam-publications/voice-of-consumer-2024.html) ghi nhận 59% chấp nhận AI hỗ trợ customer service. Nhóm chọn một lát cắt có thể kiểm chứng: **AI Agent hỗ trợ khách của một showroom xe, thực hiện tác vụ và bàn giao đủ ngữ cảnh cho nhân viên**. Sản phẩm không thay nhân viên hoặc cam kết ngoài chính sách đã duyệt.


## 2. Người dùng và nhu cầu

**Người dùng chính:** Khách showroom cần được trả lời nhanh, đúng chính sách và hoàn thành yêu cầu trong chat.  
**Người dùng phụ:** Nhân viên sale cần giảm thời gian xử lý câu hỏi lặp, nhận ca đúng lúc và tiếp tục hỗ trợ mà không hỏi lại khách.  
**Công việc cần hoàn thành:** Khách tìm hiểu xe, đặt lịch lái thử/tư vấn; nếu AI không xử lý an toàn, hội thoại được chuyển cho nhân viên cùng ngữ cảnh.

## 3. Giải pháp đề xuất

AI Agent cho phép khách trò chuyện với Business Account của showroom, sau đó hệ thống:

1. Xác định khách cần thông tin, thực hiện tác vụ hay gặp nhân viên.
2. Truy xuất đúng Knowledge Base của showroom và trả lời kèm nguồn.
3. Kiểm tra lịch trống qua Booking API mock; xác nhận dữ liệu trước khi tạo lịch và xử lý rõ khi tool lỗi.
4. Ghi nhớ ngữ cảnh theo đúng cặp khách hàng–Business Account.
5. Handoff khi khách khiếu nại, hỏi ngoài KB hoặc tool lỗi; nhân viên nhận lý do, tóm tắt và lịch sử.

## 4. AI decision point và model

**GPT-4o hoặc Claude kết hợp RAG** phân mỗi lượt chat vào `answer_from_kb`, `call_tool` hoặc `handoff`; tạo truy vấn, chọn tool và soạn câu trả lời theo evidence. Ứng dụng kiểm tra quyền, tenant ID, schema, xác nhận thao tác ghi và kết quả tool.

**Ranh giới an toàn:** thiếu evidence thì trả `insufficient_evidence` hoặc handoff; không bịa giá/chính sách/trạng thái hay xác nhận tác vụ chưa thành công. Data, memory và retrieval được cách ly theo Business Account; cache và context limit kiểm soát độ trễ/chi phí.

**Stack tham chiếu:** LangGraph; Qdrant/pgvector; API mock; WebSocket; FastAPI/NestJS; React; Docker, Postgres, Redis, Railway.

## 5. Phạm vi MVP ba tuần

### In scope — P0

- App deploy, đăng nhập và ít nhất hai vai trò: khách hàng, nhân viên/agent doanh nghiệp.
- Một showroom chính với KB gồm giá, thông số, khuyến mãi, trả góp và giờ làm việc.
- RAG có citation và xử lý câu hỏi ngoài phạm vi.
- Booking mock, xác nhận trước thao tác ghi và xử lý tool fail.
- Memory hội thoại theo khách hàng–Business Account.
- Handoff queue và console cho nhân viên xem, nhận, trả lời và kết thúc ca realtime.
- Tenant ID áp dụng ở data, retrieval và memory; test tenant chỉ dùng kiểm tra không lộ chéo.
- Log retrieval, tool-call, lỗi, handoff, model/prompt version và kết quả.
- Deploy bản demo end-to-end bằng dữ liệu giả lập.

### Out of scope

- Quản lý nhiều Business Account với KB riêng; tạo/theo dõi ticket.
- CRM/booking production, thanh toán, đa kênh hoặc dữ liệu khách hàng thật.
- Gợi ý trả lời, CSAT/deflection, cảnh báo chi phí và phát hiện ngoài phạm vi nâng cao.
- Triển khai nghiệp vụ y tế/bất động sản hoặc tư vấn chuyên môn.
- Cam kết tuân thủ/bảo mật cấp production; MVP chỉ áp dụng nguyên tắc phân quyền, giảm dữ liệu và cách ly tenant.

## 6. Cách đo sản phẩm

Bộ đo MVP dưới đây chứng minh chất lượng kỹ thuật và khả năng demo, chưa chứng minh agent đã giảm tải hoặc tăng booking trong vận hành thật.

Bộ thử nghiệm v1 có **30 test case**: 12 RAG/citation, 6 tool-call, 4 memory, 4 handoff và 4 isolation/out-of-scope. Chuẩn đạt được khóa trước khi chạy:

- Ít nhất **80% test case đạt** — tương đương tối thiểu 24/30.
- Không có lần nào AI tạo giá, chính sách, kết quả đặt lịch hoặc citation không tồn tại.
- Tool-call đúng schema và đúng tool trong ít nhất **95%** trường hợp hợp lệ.
- Không có lần nào test tenant truy xuất được KB, memory hoặc hội thoại của tenant khác.
- Handoff luôn có lý do và tóm tắt; nhân viên hoàn tất được vòng đời ca.
- Demo end-to-end thành công **ba lần liên tiếp** trước ngày trình bày.

## 7. Kết quả Gate 1 cần chốt

- Problem statement và AI decision point được khóa trong Sprint 1.
- PRD v1 có P0, acceptance criteria, non-goals và business rules cốt lõi.
- UI flow từ Customer Chat → Agent → Tool/Handoff → Employee Console.
- Monorepo có rule, branch/PR template, CODEOWNERS, env template và cấu trúc eval.
- Bộ 30 test case có expected output và người review.
- AI log phân biệt AI hỗ trợ dự án với model chạy trong sản phẩm.

## 8. Quyết định cần xác nhận trong team review

- Tên, vai trò và GitHub handle của từng thành viên.
- Nguồn dữ liệu showroom được phép dùng và người duyệt nội dung seed.
- Model, API quota và ngân sách thử nghiệm.
- Cách định danh khách, thời hạn lưu memory và dữ liệu cần che khỏi log.
- Business reviewer tạo expected output và xử lý test case bất đồng.
- Deadline ba tuần, môi trường deploy và tải demo dự kiến.
- Nguồn baseline nội bộ để đo chat volume, response time, FAQ share, repeat-information rate và booking funnel.
