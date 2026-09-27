# Product Requirements Document — AI Agent Chatbot doanh nghiệp (Business Account) chăm sóc khách trong chat

| Thuộc tính | Giá trị |
|---|---|
| Product owner | Product Manager |
| Phiên bản | 1.0 — Gate 1 baseline |
| Ngày cập nhật | 19/09/2026 |
| Thời gian MVP | 3 tuần |
| Đội hình | 3 người: PM, AI/ML, Fullstack |
| Primary user | Khách hàng của showroom xe |
| Product model | GPT-4o hoặc Claude — cần chốt qua spike/eval |
| Trạng thái | Draft for team sign-off |

## 1. Executive summary

AI Agent Chatbot doanh nghiệp hỗ trợ khách hàng trong Business Account của showroom xe. Sản phẩm trả lời bằng tri thức đã duyệt có trích nguồn, đặt lịch lái thử/tư vấn, ghi nhớ ngữ cảnh và bàn giao cho nhân viên khi AI không thể xử lý an toàn. MVP không thay nhân viên tư vấn và không tự cam kết giá, chính sách hoặc kết quả tác vụ khi chưa có bằng chứng.

MVP được thiết kế để trả lời một câu hỏi duy nhất thật tốt:

> Trong một cuộc chat với showroom, AI có thể giải quyết yêu cầu phổ biến có căn cứ, thực hiện đúng tác vụ và chuyển người đúng lúc mà không làm lộ dữ liệu hay không?

## 2. Problem statement

### Hiện trạng đa doanh nghiệp

- Các thương hiệu thuộc Tập đoàn X đã mở Business Account trên app chat.
- Nhân viên không đủ khả năng trực 24/7 để trả lời câu hỏi lặp về giá, lịch hẹn và tình trạng đơn.
- Khách phải chờ hoặc lặp lại thông tin khi hội thoại được chuyển người.
- LLM thuần có thể trả lời tự tin nhưng không có căn cứ hoặc cam kết sai chính sách.
- Tool nội bộ có thể lỗi, timeout hoặc trả dữ liệu không hợp lệ; chatbot không được báo thành công giả.
- Dữ liệu khách hàng, memory và Knowledge Base phải được phân quyền, không lộ chéo giữa các Business Account.

### Evidence từ survey và giới hạn

- [Zendesk CX Trends 2026](https://www.zendesk.com/newsroom/press-releases/contextual-intelligence-becomes-the-new-standard-for-exceptional-customer-experience-in-2026/) khảo sát hơn 11.000 respondents tại 22 quốc gia: 74% consumers kỳ vọng service 24/7; 74% khó chịu khi phải lặp lại thông tin; 81% muốn agent tiếp tục hội thoại mà không backtrack.
- [Execs In The Know 2024](https://execsintheknow.com/wp-content/uploads/2024/09/2024-September-ResearchReport-CX-Leaders-Consumer-Edition.pdf) ghi nhận 58% consumers kỳ vọng online chat phản hồi trong hai phút; 52% khó chịu khi không thể gặp human agent sau automation. Mẫu chỉ gồm người trưởng thành tại Hoa Kỳ, 273–547 respondents tùy câu hỏi.
- [Intercom automation survey](https://www.intercom.com/blog/customer-support-automation-trends/) với 404 support managers/leaders ghi nhận 80% agents cảm thấy tác vụ lặp khiến họ không đủ thời gian cung cấp trải nghiệm tốt; đây là vendor-sponsored benchmark, không phải dữ liệu showroom.
- [PwC Voice of the Consumer 2024 — Vietnam](https://www.pwc.com/vn/en/publications/vietnam-publications/voice-of-consumer-2024.html) với 515 respondents Việt Nam ghi nhận 69% chấp nhận AI hỗ trợ thu thập thông tin sản phẩm, 63% gợi ý sản phẩm và 59% customer service.
- [ABeam Vietnam Automotive Survey 2024](https://www.abeam.com/vn/en/insights/vn_auto_depth_analysis/) với 320 respondents tại sáu thành phố cho thấy dealer là nguồn offline chính trong giai đoạn nghiên cứu; danh tiếng, giá và xe sẵn có được hơn 65% chọn là yếu tố quan trọng tại dealer visit.

External survey xác nhận pain point và mức độ chấp nhận AI có tính phổ biến, nhưng **không chứng minh showroom X đang có cùng mức độ pain**. Các claim về giảm tải, tăng booking hoặc cải thiện CSAT chỉ được xác nhận sau khi có baseline và pilot nội bộ.

| Pain point | Evidence status |
|---|---|
| Nhu cầu phản hồi nhanh/24-7 | Externally supported; internally unvalidated |
| Khách phải lặp lại thông tin khi handoff | Externally supported; internally unvalidated |
| Nhân viên bị chiếm thời gian bởi câu hỏi lặp | Externally supported; internally unvalidated |
| AI phù hợp cho FAQ/gợi ý/customer service ít rủi ro | Supported by Vietnam consumer survey |
| Human handoff là bắt buộc | Supported by survey và risk analysis |
| Agent làm tăng booking/doanh thu | Not validated |

### Vấn đề cần giải quyết


Nhóm cần kiểm chứng liệu một luồng chăm sóc khách trong chat có thể trả lời theo KB được duyệt, thực hiện đúng booking, duy trì ngữ cảnh và handoff cho nhân viên khi vượt giới hạn. MVP chứng minh tính khả thi và an toàn kỹ thuật; business impact được đo riêng trong pilot.

### Vì sao chọn showroom xe

- Giá, thông số, khuyến mãi và lịch làm việc tạo thành KB có cấu trúc, phù hợp để kiểm thử RAG.
- Kiểm tra lịch trống và đặt lịch lái thử đại diện cho cả tác vụ đọc và ghi.
- Rủi ro nghiệp vụ đủ thực tế nhưng thấp hơn tư vấn y tế hoặc pháp lý.
- Một domain hoàn chỉnh trong ba tuần có giá trị hơn ba domain chạy không trọn luồng.

## 3. Product principles

1. **Grounded before fluent:** thông tin về giá/chính sách phải có evidence từ KB.
2. **Ask or hand off, do not guess:** thiếu dữ liệu thì hỏi thêm hoặc chuyển người.
3. **Confirm before write:** tác vụ tạo lịch chỉ chạy sau khi khách xác nhận dữ liệu.
4. **Tool result is the truth:** chỉ thông báo thành công khi tool trả kết quả thành công hợp lệ.
5. **Human owns the service decision:** khách được yêu cầu gặp người; nhân viên tiếp quản ca khó/khiếu nại.
6. **Tenant isolation by default:** data, retrieval, memory và log luôn có tenant scope.
7. **Narrow scope, complete flow:** một showroom chạy end-to-end là P0.
8. **Trace important decisions:** lưu route, citation, tool-call, lỗi, handoff và model/prompt version.

## 4. Goals and non-goals

### Product goals

- Trả lời câu hỏi phổ biến của showroom bằng KB có citation.
- Kiểm tra lịch trống và đặt lịch qua mock API với validation và error handling.
- Nhớ đúng ngữ cảnh của khách trong Business Account hiện tại.
- Handoff đúng trigger và chuyển đủ ngữ cảnh cho nhân viên.
- Cách ly dữ liệu theo tenant và role.
- Có bộ eval tái chạy được sau mỗi thay đổi model, prompt hoặc KB.
- Deploy và demo được luồng hoàn chỉnh trong ba tuần.
- Ghi nhận đủ event để thiết lập baseline cho response time, repetitive-query share, handoff và booking funnel khi pilot.

### Non-goals

- Không thay nhân viên đưa ra quyết định bán hàng hoặc cam kết ngoài KB.
- Không triển khai production CRM/booking, thanh toán hoặc đa kênh.
- Không quản trị nhiều Business Account trên dashboard P0.
- Không tạo/theo dõi ticket trong P0.
- Không triển khai nghiệp vụ y tế hoặc bất động sản.
- Không xây quản trị KB, CSAT/deflection analytics hoặc cost alert đầy đủ.
- Không tuyên bố tuân thủ/bảo mật cấp production; MVP chỉ áp dụng các kiểm soát thiết kế cốt lõi.

## 5. Personas

### Persona A — Khách hàng showroom

- Mục tiêu: nhận thông tin đáng tin, hoàn thành đặt lịch nhanh và gặp nhân viên khi cần.
- Nỗi đau: chờ lâu, phải lặp thông tin, không biết chatbot có trả lời đúng chính sách hay không.
- Tiêu chí thành công: hoàn thành happy path trong một cuộc chat và thấy nguồn/kết quả rõ ràng.

### Persona B — Nhân viên sale/agent doanh nghiệp

- Mục tiêu: nhận đúng ca, hiểu nhanh bối cảnh và tiếp tục hỗ trợ khách.
- Nỗi đau: thiếu lịch sử/lý do handoff, nhận ca muộn hoặc không biết AI đã làm gì.
- Tiêu chí thành công: xem được tóm tắt, transcript, tool result và hoàn tất vòng đời ca.

### Persona C — Người vận hành kỹ thuật

- Mục tiêu: phát hiện lỗi RAG/tool/handoff và truy lại quyết định của agent.
- Nỗi đau: lỗi không tái hiện được, log lộ dữ liệu hoặc không biết phiên bản model/prompt nào tạo kết quả.
- Tiêu chí thành công: điều tra được một case bằng trace không chứa secret hoặc dữ liệu nhạy cảm dư thừa.

## 6. Core user journey

1. Khách mở Business Account showroom và bắt đầu chat.
2. Hệ thống xác định tenant, customer và session; tải memory phù hợp.
3. Agent phân loại lượt chat thành trả lời KB, gọi tool hoặc handoff.
4. Với câu hỏi thông tin, agent retrieve KB, kiểm tra evidence và trả lời kèm citation.
5. Với booking, agent thu thập trường còn thiếu, hiển thị tóm tắt và yêu cầu xác nhận.
6. Nếu ngoài KB, khiếu nại, khách yêu cầu gặp người hoặc tool lỗi không phục hồi, agent tạo handoff.
7. Nhân viên thấy ca trong queue, mở tóm tắt/transcript, nhận ca và trả lời realtime.
8. Nhân viên kết thúc ca; hệ thống lưu trạng thái và audit event.

## 7. AI decision specification

### 7.1 Decision statement

GPT-4o hoặc Claude kết hợp RAG quyết định mỗi lượt chat thuộc một route:

- `answer_from_kb`: có đủ evidence đã duyệt để trả lời.
- `call_tool`: cần đọc/ghi dữ liệu qua một tool được phép.
- `handoff`: khách yêu cầu gặp người, khiếu nại, thiếu evidence hoặc hệ thống không xử lý an toàn.

Model trả về tối thiểu: `route`, `intent`, `confidence`, `citations`, `tool_name/tool_args` hoặc `handoff_reason`, và nội dung phản hồi dự kiến.

### 7.2 Điều AI không quyết định

- Không tự tạo giá, khuyến mãi, chính sách hoặc kết quả đặt lịch.
- Không tự bỏ qua xác nhận của khách trước tác vụ ghi.
- Không quyết định người dùng có quyền xem tenant/customer nào.
- Không thông báo tool thành công nếu chưa có response thành công hợp lệ.
- Không tự mở rộng sang tư vấn y tế, pháp lý hoặc tài chính.
- Không tiếp tục tự động xử lý sau khi nhân viên đã nhận ca.

### 7.3 Runtime flow

1. Auth/RBAC xác định `tenant_id`, `actor_id`, role và conversation.
2. Input guard lọc nội dung không hợp lệ và dữ liệu nhạy cảm không cần thiết.
3. Agent router chọn route; output được kiểm tra theo JSON schema.
4. Nhánh KB retrieve theo tenant, rerank và kiểm tra citation tồn tại.
5. Nhánh tool validate args; tác vụ ghi phải có `confirmation_token` còn hiệu lực.
6. Tool gateway thực thi mock API và chuẩn hóa success/error/timeout.
7. Policy layer quyết định trả lời, hỏi thêm, retry có giới hạn hoặc handoff.
8. Memory chỉ lưu dữ liệu cần thiết theo policy; trace lưu phiên bản model/prompt/KB/tool.
9. WebSocket đẩy message và trạng thái handoff đến đúng conversation/tenant.

### 7.4 Fallback

- Output sai schema: retry tối đa một lần bằng repair prompt; vẫn sai thì handoff/fail-safe.
- Citation không tồn tại hoặc không hỗ trợ claim: loại claim và trả `insufficient_evidence`.
- Tool validation error: hỏi lại đúng trường thiếu/sai, không gọi tool.
- Tool timeout/service error: retry tối đa một lần với read-only; tác vụ ghi không tự retry nếu chưa có idempotency guarantee.
- Model/API lỗi: hiển thị trạng thái tạm thời, không dùng kết quả cũ như kết quả mới.
- Không có nhân viên online: đưa ca vào queue và thông báo trạng thái chờ cho khách.

## 8. Agent decision policy v1

| Tín hiệu | Route | Kết quả bắt buộc |
|---|---|---|
| FAQ có evidence trong KB tenant | `answer_from_kb` | Trả lời ngắn, citation, không thêm claim ngoài nguồn |
| Hỏi ngoài KB hoặc evidence yếu | `handoff` | Nói rõ giới hạn, tạo lý do `insufficient_evidence` |
| Muốn đặt lịch | `call_tool` | Thu thập dữ liệu → tóm tắt → xác nhận → booking |
| Khiếu nại/yêu cầu gặp người | `handoff` | Không tranh luận; chuyển ca cùng tóm tắt |
| Tool lỗi không phục hồi | `handoff` | Không báo thành công; kèm tool error category |
| Nhân viên đã nhận ca | Human mode | AI dừng tự trả lời; chỉ lưu/hiển thị trạng thái |

Thứ tự ưu tiên: yêu cầu gặp người/khiếu nại → an toàn/quyền truy cập → trạng thái human mode → tool workflow đang chờ xác nhận → intent mới.

## 9. Functional requirements

### FR-01 — Authentication and role access

**User story:** Là người dùng, tôi muốn đăng nhập đúng vai trò để chỉ truy cập chức năng và dữ liệu được phép.

**Acceptance criteria:**

- Có ít nhất hai role: `customer` và `employee`.
- Customer chỉ xem conversation của chính mình trong tenant hiện tại.
- Employee chỉ xem queue/conversation thuộc tenant được cấp quyền.
- Request thiếu/sai quyền trả 401/403 và không để lộ dữ liệu trong response/log.

### FR-02 — Conversation and memory

**User story:** Là khách hàng, tôi muốn agent nhớ ngữ cảnh để không phải lặp lại thông tin trong cuộc chat.

**Acceptance criteria:**

- Mỗi conversation gắn `tenant_id`, `customer_id` và trạng thái.
- Agent dùng được dữ kiện đã xác nhận ở lượt trước của cùng conversation.
- Không nạp memory từ customer hoặc tenant khác.
- Context được tóm tắt/giới hạn khi vượt ngân sách cấu hình.

### FR-03 — Grounded KB answer

**User story:** Là khách hàng, tôi muốn câu trả lời về xe/chính sách có nguồn để có thể kiểm chứng.

**Acceptance criteria:**

- Retrieval luôn filter theo `tenant_id` và chỉ dùng tài liệu trạng thái approved.
- Claim về giá, khuyến mãi, trả góp và giờ làm việc có citation.
- Citation mở được source title/section dùng trong câu trả lời.
- Không đủ evidence thì không đoán; agent hỏi thêm hoặc handoff.

### FR-04 — Vehicle consultation

**User story:** Là khách hàng, tôi muốn được gợi ý dòng xe dựa trên nhu cầu đã cung cấp.

**Acceptance criteria:**

- Agent hỏi bổ sung khi thiếu nhu cầu cốt lõi như ngân sách/mục đích sử dụng.
- Gợi ý chỉ gồm xe có trong KB approved.
- Mỗi lý do gợi ý truy được về thông số/chính sách trong KB.
- Không khẳng định xe “tốt nhất” nếu không có tiêu chí đã thống nhất với khách.

### FR-05 — Booking consultation/test drive

**User story:** Là khách hàng, tôi muốn đặt lịch tư vấn/lái thử ngay trong chat.

**Acceptance criteria:**

- Thu thập tối thiểu loại lịch, mẫu xe, showroom, ngày/giờ và thông tin liên hệ cần thiết.
- Validate định dạng và slot trước khi yêu cầu xác nhận.
- Hiển thị tóm tắt; chỉ gọi tool sau xác nhận rõ ràng của khách.
- Thành công hiển thị booking ID và chi tiết; thất bại không tạo thông báo thành công giả.
- Chống double submit bằng idempotency key hoặc cơ chế tương đương.

### FR-07 — Tool failure handling

**User story:** Là khách hàng, tôi muốn được thông báo trung thực khi hệ thống không hoàn thành tác vụ.

**Acceptance criteria:**

- Phân biệt validation error, not found, timeout và service error.
- Read-only call có thể retry tối đa một lần; write call tuân thủ idempotency policy.
- Sau lỗi không phục hồi, agent đề xuất handoff và giữ dữ liệu khách đã cung cấp trong tóm tắt.
- Log không chứa API key hoặc dữ liệu nhạy cảm dạng thô.

### FR-08 — Request handoff

**User story:** Là khách hàng, tôi muốn gặp nhân viên khi AI không đáp ứng được yêu cầu.

**Acceptance criteria:**

- Trigger gồm khiếu nại, yêu cầu gặp người, ngoài KB và tool fail không phục hồi.
- Tạo handoff với reason code, priority, summary và conversation reference.
- Khách thấy trạng thái `waiting_for_employee`.
- Agent không tiếp tục tự xử lý nội dung nghiệp vụ sau khi ca được nhận.

### FR-09 — Employee queue and claim

**User story:** Là nhân viên, tôi muốn xem và nhận ca thuộc showroom của mình.

**Acceptance criteria:**

- Queue hiển thị trạng thái, thời gian chờ, reason, customer display name và preview.
- Employee mở ca thấy transcript, summary, citations và tool result liên quan.
- Một ca chỉ có một employee owner tại một thời điểm.
- Claim conflict được xử lý rõ; không silently ghi đè owner.

### FR-10 — Human conversation and closure

**User story:** Là nhân viên, tôi muốn tiếp tục chat realtime và kết thúc ca khi đã xử lý xong.

**Acceptance criteria:**

- Tin nhắn nhân viên/khách được cập nhật realtime đúng conversation.
- UI thể hiện rõ human mode; AI không gửi câu trả lời tự động.
- Employee có thể kết thúc ca với resolution code và ghi chú tùy chọn.
- Sau khi kết thúc, khách có thể mở conversation mới; lịch sử cũ vẫn giữ theo retention policy.

### FR-11 — Tenant isolation

**User story:** Là doanh nghiệp, tôi muốn dữ liệu của mình không bị lộ sang Business Account khác.

**Acceptance criteria:**

- Mọi record nghiệp vụ cốt lõi có tenant scope.
- Retrieval, memory, conversation, queue và tool credential đều kiểm tra tenant.
- Test tenant không đọc/suy ra được dữ liệu tenant khác qua UI hoặc API.
- Vi phạm boundary bị từ chối và ghi security event không chứa payload nhạy cảm.

### FR-12 — Trace and reproducibility

**User story:** Là người vận hành, tôi muốn truy lại agent đã quyết định gì để debug và đánh giá.

**Acceptance criteria:**

- Lưu route, intent, citation IDs, tool name/status, handoff reason và latency.
- Lưu model, prompt, KB/index và tool-contract version.
- Có correlation ID xuyên suốt message → agent → retrieval/tool → response.
- Secret và raw sensitive data không xuất hiện trong application log.

## 10. Information architecture and key screens

1. `/login` — đăng nhập và chọn đúng workspace nếu được cấp nhiều tenant.
2. `/chat/:businessAccountId` — giao diện khách, citation, tool confirmation và trạng thái handoff.
3. `/employee/conversations` — queue chờ, ca đang xử lý và ca đã đóng.
4. `/employee/conversations/:conversationId` — transcript, summary, tool/citation context, nhận ca và trả lời.
5. `/demo/trace/:conversationId` — màn hình demo/technical trace đã redacted, chỉ role được phép truy cập.

Wireframe chi tiết sẽ nằm tại `docs/03_WIREFRAME_UI_FLOW.md` và prototype tương ứng.

## 11. Data contract — output tối thiểu

```json
{
  "trace_id": "tr_001",
  "tenant_id": "showroom_x",
  "conversation_id": "conv_001",
  "route": "call_tool",
  "intent": "book_test_drive",
  "confidence": "high",
  "answer": "Tôi đã tổng hợp thông tin lịch hẹn. Bạn xác nhận giúp tôi trước khi đặt lịch.",
  "citations": [
    {
      "document_id": "kb_vehicle_01",
      "section_id": "working_hours",
      "verified": true
    }
  ],
  "tool_call": {
    "name": "create_booking",
    "status": "awaiting_confirmation",
    "arguments": {
      "vehicle_id": "vehicle_01",
      "slot_id": "slot_20260928_0900"
    }
  },
  "handoff": null,
  "versions": {
    "model": "TBD",
    "prompt": "router-v1",
    "kb_index": "showroom-x-v1",
    "tool_contract": "booking-v1"
  },
  "created_at": "2026-09-25T10:00:00+07:00"
}
```

Field chứa PII chỉ xuất hiện ở tool boundary khi cần, không được đưa vào trace payload dùng cho analytics/demo.

## 12. Non-functional requirements

| ID | Requirement | Target MVP |
|---|---|---|
| NFR-01 | Schema reliability | ≥95% agent runs pass schema sau allowed retry |
| NFR-02 | Grounded answer | 100% claim giá/chính sách hiển thị có citation verified |
| NFR-03 | Hallucination safety | 0 fabricated price/policy/booking status trong regression set |
| NFR-04 | Latency | p95 first meaningful response ≤5 giây trên demo environment; tool latency đo riêng |
| NFR-05 | Tenant isolation | 100% cross-tenant negative tests bị từ chối |
| NFR-06 | Availability | Demo path chạy thành công 3 lần liên tiếp |
| NFR-07 | Security | Không có API key trong repo/log; PII tối thiểu và redacted |
| NFR-08 | Traceability | Mọi agent response có correlation ID và version metadata |
| NFR-09 | Accessibility | Core actions dùng được bằng keyboard; status không chỉ thể hiện bằng màu |
| NFR-10 | Cost control | Token/tool usage được ghi nhận; context limit và cache có cấu hình |

## 13. Success metrics and evaluation plan

### Locked evaluation commitment

- Test set: **30 cases**.
- Phân bổ: 12 RAG/citation, 6 tool-call, 4 memory, 4 handoff, 4 isolation/out-of-scope.
- Pass threshold: **≥80% overall** — tối thiểu 24/30.
- Zero-tolerance: fabricated price/policy/booking status/citation và cross-tenant leakage.
- First-run result: `NOT_RUN` cho đến khi vertical slice tích hợp sẵn sàng.

### Per-case pass definition

Một case chỉ pass khi:

1. Route/intent nằm trong expected set.
2. Required fact/tool/handoff reason được nhận diện.
3. Không có prohibited claim hoặc data disclosure.
4. Citation tồn tại và hỗ trợ claim nếu case yêu cầu RAG.
5. Tool args/output hoặc handoff payload đúng schema.
6. User-visible response không báo thành công sai.

### Product delivery metrics

- 100% P0 user stories quan trọng demo được.
- 0 blocker/critical bug trong release candidate.
- ≥90% smoke test pass trước demo.
- Khách test hoàn thành FAQ → booking mà không cần hỗ trợ ngoài chat.
- Employee test nhận và kết thúc một handoff trong tối đa 3 phút.

### Business validation metrics — pilot, không phải release gate

Các metric dưới đây phải đo theo baseline → pilot; chưa khóa target khi chưa có dữ liệu showroom:

- Conversation volume và tỷ lệ chat ngoài giờ.
- Median/p90 first response time.
- Tỷ lệ conversation thuộc FAQ: giá, chính sách và lịch hẹn.
- Unanswered/abandoned conversation rate.
- Repeat-information rate sau handoff.
- Agent handling time cho FAQ so với ca phức tạp.
- Funnel: có ý định đặt lịch → bắt đầu booking → booking thành công → khách đến.
- Accuracy incident: trả sai giá/chính sách/kết quả đặt lịch.

## 14. Analytics/events

MVP ghi nhận event tối thiểu để debug và eval:

- `conversation_started`
- `agent_route_selected`
- `retrieval_completed`
- `citation_verified` / `citation_rejected`
- `tool_confirmation_requested`
- `tool_started` / `tool_completed` / `tool_failed`
- `handoff_created` / `handoff_claimed` / `handoff_closed`
- `conversation_resolved_by_ai`
- `booking_started` / `booking_completed`
- `message_sent`
- `security_boundary_denied`

Analytics không lưu raw message, contact detail, booking identifier đầy đủ hoặc tool credential.

## 15. Team model and RACI — 3 members

| Workstream | PM / Product | AI/ML | Fullstack |
|---|---:|---:|---:|
| Problem, scope, PRD | A/R | C | C |
| Eval set và expected behavior | A/R | R | C |
| RAG/agent/prompt/schema | C | A/R | C |
| API/database/tool integration | C | C | A/R |
| Chat, console và realtime UI | C | I | A/R |
| Privacy, tenant isolation, secrets | A | C | R |
| Acceptance test | A/R | C | C |
| Demo và submission | A/R | C | C |

**A:** accountable · **R:** responsible · **C:** consulted · **I:** informed.

## 16. Three-week delivery outline

### Week 1 — Contract and vertical slice

- Freeze problem, P0, route schema, tool contracts, tenant boundary và UI flow.
- Seed KB showroom, booking fixtures và 10 eval cases đầu tiên.
- Build auth shell, chat shell, mock console và một vertical slice FAQ có citation.
- Exit criterion: Customer UI → API → agent → retrieval → cited response chạy được.

### Week 2 — Tools, memory and handoff

- Hoàn thiện booking, confirmation, memory và error policy.
- Tích hợp queue, employee claim/reply/close và WebSocket.
- Chạy đủ 30 eval cases lần đầu; phân loại lỗi theo route/retrieval/tool/policy/UI.
- Exit criterion: P0 feature complete và có benchmark đầu tiên.

### Week 3 — Trust and release

- Fix failure có impact cao; harden tenant isolation, tool failure và log redaction.
- Chạy regression, smoke, usability test và ba demo rehearsals.
- Freeze feature; chuẩn bị seed reset, backup responses và demo script.
- Exit criterion: release rule pass, 0 critical bug.

## 17. Risks and mitigations

| Risk | Impact | Early signal | Mitigation | Owner |
|---|---|---|---|---|
| AI bịa giá/chính sách/citation | Critical | Citation verifier fail; claim không có source | Tenant-filtered RAG; verify citation; loại claim và handoff | AI/ML |
| Lộ dữ liệu giữa tenant/customer | Critical | Negative test đọc được record khác scope | Tenant ID mọi record/query; RBAC; security tests | Fullstack |
| Tool tạo tác vụ trùng hoặc báo sai | High | Double booking; timeout sau write | Confirmation token; idempotency; normalize result; không retry mù | Fullstack |
| Handoff thiếu ngữ cảnh | High | Nhân viên phải hỏi lại toàn bộ | Structured summary; transcript/tool result; acceptance test | PM + Fullstack |
| Contract thay đổi liên tục | High | UI/mock phải sửa nhiều lần | Freeze schema v1 cuối Week 1; version breaking change | Fullstack |
| Model/API quota hoặc latency bất ổn | Medium | 429/timeout; demo gián đoạn | Cache fixed cases; quota monitor; backup response/video | AI/ML + Fullstack |
| Scope multi-account/ticket tràn vào P0 | High | P0 chưa xong nhưng mở dashboard/ticket | Non-goals rõ; P0-first; change control | PM |
| Team bị phân tán | High | Task không owner; tích hợp muộn | Một owner/outcome; WIP limit; daily integration | PM |

## 18. Open questions before Sprint 1

- [ ] Điền tên và GitHub handle cho ba vai trò PM, AI/ML và Fullstack.
- [ ] Chọn GPT-4o hay Claude dựa trên spike nhỏ về groundedness, tool-call, latency và quota.
- [ ] Chốt pgvector hay Qdrant; FastAPI hay NestJS.
- [ ] Xác nhận nguồn KB showroom, ngày hiệu lực và người duyệt dữ liệu seed.
- [ ] Chốt mock contract cho booking, gồm idempotency/error codes.
- [ ] Chốt định danh khách và thời hạn lưu memory.
- [ ] Chốt giờ trực, owner/SLA handoff và hành vi khi không có nhân viên online.
- [ ] Chốt reviewer tạo expected output và phân xử eval case bất đồng.
- [ ] Chốt API quota, ngân sách, môi trường deploy và tải demo.
- [ ] Chốt lịch daily, mid-week review và Gate review.
- [ ] Chốt nguồn dữ liệu baseline nội bộ trong 2–4 tuần: chat volume, after-hours rate, response time, FAQ share, abandoned chat, repeat-information rate và booking funnel.

## 19. Release decision rule

PM chỉ xác nhận MVP `ready to demo` khi:

- Toàn bộ P0 acceptance criteria quan trọng đã pass.
- Bộ eval đạt ít nhất 24/30 và không có zero-tolerance failure.
- Cross-tenant negative tests đạt 100%.
- Không còn blocker/critical bug mở.
- Một máy sạch chạy được theo README hoặc demo environment hoạt động.
- Seed/reset script đưa hệ thống về trạng thái demo dự kiến.
- Nhóm đã rehearsal end-to-end ba lần liên tiếp, gồm ít nhất một tool fail và một handoff.

---

## Appendix A — User story index

1. Là khách hàng, tôi muốn đăng nhập và chỉ xem hội thoại của mình để bảo vệ dữ liệu.
2. Là khách hàng, tôi muốn agent nhớ ngữ cảnh để không phải lặp thông tin.
3. Là khách hàng, tôi muốn câu trả lời có nguồn để kiểm chứng giá/chính sách.
4. Là khách hàng, tôi muốn được gợi ý xe theo nhu cầu đã cung cấp.
5. Là khách hàng, tôi muốn xác nhận trước khi hệ thống tạo lịch.
6. Là khách hàng, tôi muốn nhận booking ID khi đặt lịch thành công.
7. Là khách hàng, tôi muốn biết rõ khi tool lỗi thay vì nhận thông báo thành công sai.
8. Là khách hàng, tôi muốn yêu cầu gặp nhân viên bất cứ lúc nào.
9. Là khách hàng, tôi muốn thấy trạng thái khi đang chờ nhân viên.
10. Là nhân viên, tôi muốn xem queue ca thuộc showroom của mình.
11. Là nhân viên, tôi muốn nhận một ca mà không xung đột với nhân viên khác.
12. Là nhân viên, tôi muốn xem tóm tắt và transcript trước khi trả lời.
13. Là nhân viên, tôi muốn tiếp tục chat realtime với khách.
14. Là nhân viên, tôi muốn kết thúc ca với resolution rõ ràng.
15. Là doanh nghiệp, tôi muốn data/KB/memory được cách ly theo Business Account.
16. Là người vận hành, tôi muốn truy lại route, citation, tool và handoff để debug.
17. Là nhóm sản phẩm, tôi muốn chạy lại eval set để đo ảnh hưởng của thay đổi model/prompt/KB.

## Appendix B — Implementation and testing decisions

### Implementation decisions

- Agent orchestration dùng state graph với ba route công khai; policy/authorization nằm ngoài LLM.
- Retrieval và persistence luôn nhận tenant context bắt buộc.
- Tool gateway cung cấp interface ổn định cho booking mock và chuẩn hóa lỗi.
- Write action dùng confirmation token và idempotency mechanism.
- Handoff là một state machine có queue/owner/status, không chỉ là một message đặc biệt.
- Memory, trace và analytics là ba data concern riêng; analytics không lưu raw sensitive content.
- WebSocket chỉ phát event vào room đã xác thực theo tenant/conversation.

### Testing decisions

- Test hành vi quan sát được và contract; không khóa test vào prompt text hoặc implementation detail.
- Unit/contract test: router schema, citation verifier, tenant guard, tool validation/idempotency và handoff state machine.
- Integration test: chat → RAG; chat → booking; tool fail → handoff; employee claim/reply/close.
- Security negative test: customer/employee/tenant truy cập sai scope.
- Eval regression: 30 cases có expected route, required/prohibited outputs và reviewer.
- End-to-end smoke: FAQ, booking, tool fail, handoff và tenant denial.
