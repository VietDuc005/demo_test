/**
 * AUTOADVISOR AI — SAAS PRODUCT APPLICATION LOGIC
 * Architecture: Stateful Multi-Tenant Showroom Sales Automation Engine
 */

// Embedded fallback database to ensure 100% offline portability even if opened via file:// protocol
const INLINE_DB = {
  vehicles: [
    {
      id: "VEH-CRV-2026",
      business_id: "SHOWROOM_A",
      name: "Honda CR-V L (All-Wheel Drive)",
      category: "C-SUV",
      trim: "L AWD",
      model_year: 2026,
      listed_price: 1110000000,
      deposit_required: 20000000,
      inventory_count: 5,
      colors_available: ["Trắng Ngọc", "Đen Ánh", "Ghi Bạc", "Đỏ Cá Tính"],
      specifications: {
        engine: "1.5L VTEC TURBO (188 HP, 240 Nm)",
        transmission: "CVT Mượt Mà",
        seating_capacity: "7 Chỗ rộng rãi",
        safety: "Honda SENSING thế hệ 3"
      },
      rolling_price_estimate: { hanoi: 1265000000, hcm: 1243000000, provinces: 1224000000 }
    },
    {
      id: "VEH-CITY-2026",
      business_id: "SHOWROOM_A",
      name: "Honda City RS 2026",
      category: "B-Sedan",
      trim: "RS Thể Thao",
      model_year: 2026,
      listed_price: 609000000,
      deposit_required: 10000000,
      inventory_count: 8,
      colors_available: ["Đỏ Đậm", "Trắng Ngọc", "Xám Phong Cách"],
      specifications: {
        engine: "1.5L DOHC i-VTEC (119 HP)",
        transmission: "CVT",
        seating_capacity: "5 Chỗ",
        safety: "Honda SENSING & 6 Túi khí"
      },
      rolling_price_estimate: { hanoi: 704000000, hcm: 692000000, provinces: 673000000 }
    },
    {
      id: "VEH-CAMRY-2026",
      business_id: "SHOWROOM_B",
      name: "Toyota Camry 2.5 HEV (Hybrid)",
      category: "D-Sedan",
      trim: "2.5 HEV",
      model_year: 2026,
      listed_price: 1460000000,
      deposit_required: 30000000,
      inventory_count: 3,
      colors_available: ["Đen Huyền Bí", "Trắng Ngọc Trai"],
      specifications: {
        engine: "2.5L Xăng + Hybrid Gen 5 (211 HP)",
        transmission: "E-CVT",
        seating_capacity: "5 Chỗ Chuẩn VIP",
        safety: "Toyota Safety Sense 3.0"
      },
      rolling_price_estimate: { hanoi: 1657000000, hcm: 1628000000, provinces: 1609000000 }
    },
    {
      id: "VEH-COROLLA-CROSS-2026",
      business_id: "SHOWROOM_B",
      name: "Toyota Corolla Cross 1.8 HEV",
      category: "B+ SUV",
      trim: "1.8 HEV",
      model_year: 2026,
      listed_price: 905000000,
      deposit_required: 20000000,
      inventory_count: 6,
      colors_available: ["Xanh Ánh Kim", "Trắng Ngọc Trai", "Đen"],
      specifications: {
        engine: "1.8L Hybrid siêu tiết kiệm 3.67L/100km",
        transmission: "E-CVT",
        seating_capacity: "5 Chỗ Gầm Cao",
        safety: "Toyota Safety Sense (TSS)"
      },
      rolling_price_estimate: { hanoi: 1035000000, hcm: 1017000000, provinces: 998000000 }
    }
  ],
  promotions: [
    {
      business_id: "SHOWROOM_A",
      title: "Thu Vàng Rực Rỡ - Ưu Đãi Tháng 9/2026",
      discount: "Giảm ngay 30.000.000 VNĐ tiền mặt cho dòng CR-V L AWD",
      gifts: "Tặng gói phụ kiện 3M Crystalline + Thảm 6D trị giá 15.000.000 VNĐ",
      voucher: "Miễn phí tiền công bảo dưỡng 1.000km và 5.000km"
    },
    {
      business_id: "SHOWROOM_B",
      title: "Tiên Phong Công Nghệ Xanh Hybrid 2026",
      discount: "Hỗ trợ 50% lệ phí trước bạ cho Corolla Cross Hybrid (~45-50tr)",
      gifts: "Tặng 01 năm bảo hiểm vật chất chính hãng Toyota Gold",
      voucher: "Gia hạn bảo hành pin Hybrid lên 7 năm hoặc 150.000 km"
    }
  ],
  customers: [
    {
      id: "CUST-004",
      business_id: "SHOWROOM_B",
      full_name: "Vũ Thu Trang",
      phone: "0945678901",
      city: "Đà Nẵng",
      channel: "Website Chat Widget",
      lead_score: 75,
      intent_level: "HIGH",
      status: "HANDOFF_PENDING",
      sla_seconds: 160,
      budget: "900 triệu - 1.05 tỷ",
      interested_vehicle: "Toyota Corolla Cross 1.8 HEV",
      ai_summary: "Khách hàng muốn mua xe Corolla Cross Hybrid màu xanh giao về Đà Nẵng. Cần xin ưu đãi chiết khấu riêng cho hộ kinh doanh cá thể. AI kích hoạt bàn giao vì vượt thẩm quyền đàm phán giá."
    },
    {
      id: "CUST-001",
      business_id: "SHOWROOM_A",
      full_name: "Nguyễn Văn Tuấn",
      phone: "0912345678",
      city: "Hà Nội",
      channel: "Website Chat Widget",
      lead_score: 88,
      intent_level: "HOT",
      status: "BOOKED",
      sla_seconds: 0,
      budget: "1.1 tỷ - 1.3 tỷ",
      interested_vehicle: "Honda CR-V L AWD",
      ai_summary: "Khách hàng Tuấn đã được AI tư vấn giá lăn bánh Hà Nội (~1.265 tỷ). Đã chốt đặt lịch lái thử vào lúc 09:00 sáng thứ Bảy tuần này tại showroom Giải Phóng."
    },
    {
      id: "CUST-002",
      business_id: "SHOWROOM_A",
      full_name: "Lê Thị Mai Anh",
      phone: "0987654321",
      city: "Hà Nội",
      channel: "Facebook Ads",
      lead_score: 64,
      intent_level: "MEDIUM",
      status: "CONSULTING",
      sla_seconds: 480,
      budget: "600 - 750 triệu",
      interested_vehicle: "Honda City RS",
      ai_summary: "Khách hàng trẻ hỏi chi phí lăn bánh bản City RS thể thao tại Hà Nội. Đang cân nhắc gói vay trả góp 80%."
    }
  ]
};

// Global State
let currentTenant = "SHOWROOM_A";
let activeLeadId = "CUST-004";
let chatConversation = [];

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initTenantSelector();
  initCustomerChat();
  initEmployeeConsole();
  initManagerDashboard();
  initBookingModal();
  renderTenantContent();
});

// ------------------------------------------------------------------------------
// 1. NAVIGATION & TAB SWITCHING
// ------------------------------------------------------------------------------
function initNavigation() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.getAttribute("data-tab");
      document.querySelectorAll(".view-panel").forEach(panel => {
        panel.classList.remove("active");
      });
      document.getElementById(targetId).classList.add("active");
    });
  });
}

function initTenantSelector() {
  const select = document.getElementById("showroomSelect");
  select.addEventListener("change", (e) => {
    currentTenant = e.target.value;
    renderTenantContent();
    resetChatWithGreeting();
  });
}

function renderTenantContent() {
  // 1. Update Vehicle Sidebar
  const vehicleListEl = document.getElementById("vehicleShowcaseList");
  const filteredVehicles = INLINE_DB.vehicles.filter(v => v.business_id === currentTenant);
  
  vehicleListEl.innerHTML = filteredVehicles.map(veh => `
    <div class="vehicle-mini-item" onclick="triggerVehicleInquiry('${veh.name}')">
      <div class="vehicle-mini-title">${veh.name}</div>
      <div class="vehicle-mini-price">${formatVND(veh.listed_price)} (Niêm yết)</div>
      <div class="vehicle-mini-specs">
        <span><i class="fa-solid fa-gauge-high"></i> ${veh.specifications.engine}</span>
        <span><i class="fa-solid fa-users"></i> ${veh.specifications.seating_capacity}</span>
      </div>
    </div>
  `).join("");

  // 2. Update Promo Sidebar Card
  const promoEl = document.getElementById("activePromoCard");
  const activePromo = INLINE_DB.promotions.find(p => p.business_id === currentTenant);
  if (activePromo) {
    promoEl.innerHTML = `
      <div class="promo-tag"><i class="fa-solid fa-bolt"></i> ${activePromo.title}</div>
      <div class="promo-benefit-item"><i class="fa-solid fa-check text-success"></i> ${activePromo.discount}</div>
      <div class="promo-benefit-item"><i class="fa-solid fa-gift text-cyan"></i> ${activePromo.gifts}</div>
      <div class="promo-benefit-item"><i class="fa-solid fa-shield text-amber"></i> ${activePromo.voucher}</div>
    `;
  }

  // 3. Update Chat Header
  const headerName = document.getElementById("agentDisplayName");
  headerName.textContent = currentTenant === "SHOWROOM_A" 
    ? "AutoAdvisor AI — Showroom Honda Giải Phóng" 
    : "AutoAdvisor AI — Showroom Toyota Bến Thành";
}

// ------------------------------------------------------------------------------
// 2. CUSTOMER CHAT INTERFACE
// ------------------------------------------------------------------------------
function initCustomerChat() {
  resetChatWithGreeting();

  const btnSend = document.getElementById("btnSendMessage");
  const chatInput = document.getElementById("chatInput");
  const btnClear = document.getElementById("btnClearChat");

  btnSend.addEventListener("click", handleUserSend);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserSend();
    }
  });

  btnClear.addEventListener("click", resetChatWithGreeting);

  // Scenario Quick Chips
  document.querySelectorAll(".chip[data-scenario]").forEach(chip => {
    chip.addEventListener("click", () => {
      const scenarioKey = chip.getAttribute("data-scenario");
      triggerCustomerScenario(scenarioKey);
    });
  });

  // Voice AI Simulation
  const btnVoice = document.getElementById("btnVoiceAi");
  if (btnVoice) {
    btnVoice.addEventListener("click", () => {
      btnVoice.classList.add("recording");
      const originalPlaceholder = chatInput.placeholder;
      chatInput.placeholder = "Đang lắng nghe khẩu lệnh giọng nói của bạn qua Neural STT 5.0...";
      
      setTimeout(() => {
        chatInput.value = "Giá lăn bánh xe CR-V bản L AWD ở Hà Nội bao nhiêu?";
        btnVoice.classList.remove("recording");
        chatInput.placeholder = originalPlaceholder;
        handleUserSend();
      }, 1500);
    });
  }

  // Handoff Request button
  document.getElementById("btnCustomerRequestHandoff").addEventListener("click", () => {
    triggerCustomerScenario("handoff_escalate");
  });
}

function resetChatWithGreeting() {
  const chatArea = document.getElementById("chatMessagesArea");
  chatArea.innerHTML = "";
  
  const greetingText = currentTenant === "SHOWROOM_A"
    ? "Dạ em chào anh/chị! Em là Trợ lý AI Bán hàng số của Showroom Honda Giải Phóng. Em có thể hỗ trợ anh/chị tra cứu bảng giá lăn bánh chuẩn xác, thông số kỹ thuật xe CR-V & City 2026, hoặc giúp anh/chị đặt lịch lái thử xe trong 2 phút ạ!"
    : "Dạ em chào anh/chị! Em là Trợ lý AI của Showroom Toyota Bến Thành. Em có thể cung cấp bảng giá lăn bánh xe Camry & Corolla Cross Hybrid, giải đáp chương trình ưu đãi thuế trước bạ và hỗ trợ anh/chị đăng ký lịch lái thử xe tận nơi ạ!";

  appendAgentMessage(greetingText, [
    { title: "Catalog_San_Pham_2026.pdf", section: "Tổng quan các dòng xe chính hãng" }
  ]);
}

function handleUserSend() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  appendUserMessage(text);
  input.value = "";

  // Simulate AI Thinking & Retrieval Response
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    processCustomerQuery(text);
  }, 900);
}

// 5 KỊCH BẢN TƯƠNG TÁC ĐẶC BIỆT THEO YÊU CẦU
function triggerCustomerScenario(scenarioKey) {
  const scenarios = {
    correct: {
      userText: "Cho anh hỏi giá lăn bánh xe Honda CR-V L AWD tại Hà Nội và ưu đãi hiện tại?",
      botReply: "Dạ em gửi anh bảng tính dự toán chi phí lăn bánh chính xác nhất cho xe **Honda CR-V L AWD (2026)** tại Hà Nội:\n\n" +
        "• **Giá niêm yết:** 1.110.000.000 VNĐ\n" +
        "• **Lệ phí trước bạ (12%):** 133.200.000 VNĐ\n" +
        "• **Tiền biển số Hà Nội:** 20.000.000 VNĐ\n" +
        "• **Bảo hiểm TNDS & phí đường bộ:** ~2.300.000 VNĐ\n" +
        "• **TỔNG LĂN BÁNH DỰ KIẾN:** **~1.265.000.000 VNĐ**\n\n" +
        "🎁 **Ưu đãi áp dụng tháng này:** Giảm trực tiếp **30.000.000 VNĐ** tiền mặt + Tặng gói phụ kiện cao cấp (phim cách nhiệt 3M + thảm lót sàn) trị giá 15.000.000 VNĐ. Anh có muốn đăng ký trải nghiệm lái thử xe vào cuối tuần này không ạ?",
      citations: [{ title: "Bang_Gia_Chinh_Thuc_CRV_2026.pdf", section: "Mục 2.1 - Bảng dự toán chi phí lăn bánh khu vực 1" }]
    },
    clarify: {
      userText: "Ủa sao hôm trước có bạn tư vấn nói xe này giảm 50 triệu tiền mặt, giờ chatbot lại báo giảm có 30 triệu? Chatbot trả lời sai à?",
      botReply: "Dạ em xin chân thành cảm ơn anh đã phản hồi và em xin phép được **đính chính làm rõ ngay**:\n\n" +
        "1. **Chương trình giảm 50 triệu:** Đó là đợt ưu đãi xả kho áp dụng riêng cho lô xe sản xuất năm trước (VIN 2025), chương trình này đã **kết thúc vào ngày 15/09/2026**.\n" +
        "2. **Chính sách hiện hành (VIN 2026 mới 100%):** Hiện tại hãng áp dụng mức giảm niêm yết chuẩn là **30 triệu tiền mặt + gói quà phụ kiện VIP 15 triệu**.\n\n" +
        "Dữ liệu của em được đối soát tự động từ Thông báo bán hàng mới nhất của Showroom. Em xin gửi kèm văn bản chính sách bên dưới để anh đối chứng minh bạch ạ!",
      citations: [{ title: "Thong_Bao_Chinh_Sach_Gia_Showroom_89_2026.pdf", section: "Khoản 3 - Điều chỉnh khuyến mại xe VIN 2026" }]
    },
    testdrive: {
      userText: "Anh muốn đặt lịch lái thử xe Honda CR-V L AWD vào sáng thứ Bảy này.",
      botReply: "Dạ tuyệt vời ạ! Để hệ thống AI **tự động xếp lịch lái thử và xuất mã đặt chỗ**, em xin phép xác nhận nhanh 3 thông tin cần thiết:\n\n" +
        "📋 **1. Họ tên người lái thử:** Nguyễn Văn Tuấn\n" +
        "📱 **2. Số điện thoại liên hệ:** 0912345678\n" +
        "⏰ **3. Khung giờ thuận tiện:** Sáng thứ Bảy (09:00 hoặc 10:30)?\n\n" +
        "👉 *Em đã chuẩn bị sẵn phiếu đăng ký tự động bên dưới, anh/chị có thể bấm xác nhận để AI tự động lên lịch ngay:*",
      citations: [{ title: "Quy_Trinh_Tiep_Nhan_Lai_Thu.pdf", section: "Điều 2 - Tự động hóa đăng ký trải nghiệm" }],
      hasAutoAction: true
    },
    loan_guide: {
      userText: "Em làm và duyệt luôn hồ sơ vay trả góp ngân hàng 80% cho anh trên này luôn được không?",
      botReply: "Dạ theo quy định pháp lý và quy chuẩn bảo mật tài chính của Ngân hàng Nhà nước, **Chatbot AI không được phép trực tiếp khởi tạo hợp đồng tín dụng hay phê duyệt hồ sơ vay vốn cá nhân**.\n\n" +
        "Tuy nhiên, em xin gửi anh **Cẩm nang 3 bước chuẩn bị hồ sơ vay 80% nhanh nhất**:\n" +
        "• **Bước 1 — Hồ sơ nhân thân:** Ảnh 2 mặt CCCD gắn chip (của anh và vợ/chồng nếu có) + Giấy đăng ký kết hôn / xác nhận độc thân.\n" +
        "• **Bước 2 — Chứng minh nguồn thu:** Sao kê tài khoản nhận lương 6 tháng gần nhất (hoặc giấy phép ĐKKD nếu kinh doanh tự do).\n" +
        "• **Bước 3 — Lãi suất liên kết:** Showroom hiện liên kết độc quyền gói vay ưu đãi từ **6.99%/năm đầu** tại Vietcombank & Techcombank, hạn mức duyệt 80% giá trị xe trong 2 giờ.\n\n" +
        "Em đã chuyển tiếp nhu cầu của anh tới **Chuyên viên tín dụng ngân hàng liên kết**, bạn sẽ gọi điện hướng dẫn và hỗ trợ thu hồ sơ tận nơi cho anh trong vòng 15 phút ạ!",
      citations: [{ title: "Quy_Trinh_Tin_Dung_Ngan_Hang_2026.pdf", section: "Mục 4 - Hướng dẫn thủ tục vay mua xe ô tô" }]
    },
    handoff_escalate: {
      userText: "Bớt thêm cho anh 40 triệu tiền mặt nữa và tặng bảo hiểm VIP 2 năm thì anh chuyển cọc 50 triệu chốt xe ngay!",
      botReply: "Dạ mức chiết khấu thương mại thêm 40 triệu và tặng bảo hiểm VIP 2 năm **vượt quá thẩm quyền phê duyệt tự động của AI**.\n\n" +
        "Em xin phép **chuyển ngay cuộc hội thoại này sang Chuyên viên tư vấn trực ca** để trình Ban Giám Đốc phê duyệt chính sách riêng cho anh!\n\n" +
        "⏳ *Chuyên viên tư vấn đang tiếp nhận cuộc gọi... Anh vui lòng chờ trong giây lát.*",
      citations: [{ title: "Tham_Quyen_Phe_Duyet_Gia.pdf", section: "Khoản C - Phân cấp thẩm quyền giảm giá xe đại lý" }],
      isHandoff: true
    }
  };

  const sc = scenarios[scenarioKey];
  if (!sc) return;

  appendUserMessage(sc.userText);
  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();
    appendAgentMessage(sc.botReply, sc.citations);

    if (sc.hasAutoAction) {
      appendAutoBookingCard();
    }

    if (sc.isHandoff) {
      triggerHandoffToEmployee(sc.userText);
    }
  }, 750);
}

function appendAutoBookingCard() {
  const chatArea = document.getElementById("chatMessagesArea");
  const card = document.createElement("div");
  card.className = "chat-bubble agent";
  card.style.background = "#14151a";
  card.style.border = "1px solid #3f424c";
  card.innerHTML = `
    <div style="font-weight: 700; color: #ffffff; margin-bottom: 6px;"><i class="fa-solid fa-calendar-check"></i> Xác Nhận Lên Lịch Tự Động</div>
    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
      Họ tên: <strong>Nguyễn Văn Tuấn</strong> • SĐT: <strong>0912345678</strong><br>
      Xe lái thử: <strong>Honda CR-V L AWD (2026)</strong> • Giờ: <strong>09:00 Sáng thứ Bảy (28/09)</strong>
    </div>
    <button class="btn btn-sm btn-primary" id="btnConfirmAutoBooking">
      <i class="fa-solid fa-check"></i> Xác Nhận Tự Động Lên Lịch
    </button>
  `;
  chatArea.appendChild(card);
  chatArea.scrollTop = chatArea.scrollHeight;

  const btnConfirm = card.querySelector("#btnConfirmAutoBooking");
  btnConfirm.addEventListener("click", () => {
    card.remove();
    appendSystemMessage("✅ ĐÃ TỰ ĐỘNG LÊN LỊCH THÀNH CÔNG! Mã lịch hẹn: [BK-9821]. Thời gian: 09:00 Sáng thứ Bảy (28/09). Showroom Honda Giải Phóng đã chuẩn bị xe sẵn sàng đón tiếp anh!");
  });
}

function triggerHandoffToEmployee(userText) {
  appendSystemMessage("Hệ thống: Đã chuyển cuộc hội thoại sang Hàng Chờ Nhân Viên (Lý do: Thương lượng giá ngoài thẩm quyền).");
  
  const badge = document.getElementById("handoffBadge");
  if (badge) badge.textContent = "2 chờ";

  // Thêm ticket mới vào danh sách Lead Queue của nhân viên
  const newLead = {
    id: "CUST-ESCALATE",
    business_id: currentTenant,
    full_name: "Khách Đàm Phán Giá (Cọc 50Tr)",
    phone: "0909888999",
    city: "Hà Nội",
    channel: "Website Chat Widget",
    lead_score: 95,
    intent_level: "HOT",
    status: "HANDOFF_PENDING",
    sla_seconds: 120,
    budget: "1.1 - 1.25 tỷ",
    interested_vehicle: "Honda CR-V L AWD",
    ai_summary: "Khách hàng muốn bớt thêm 40 triệu và tặng bảo hiểm VIP 2 năm, sẵn sàng cọc 50 triệu ngay. Vượt thẩm quyền AI, đã chuyển giao sang nhân viên."
  };

  const existingIdx = INLINE_DB.customers.findIndex(c => c.id === "CUST-ESCALATE");
  if (existingIdx >= 0) {
    INLINE_DB.customers.splice(existingIdx, 1);
  }
  INLINE_DB.customers.unshift(newLead);
  activeLeadId = "CUST-ESCALATE";
  renderLeadQueue();
  renderActiveLeadDossier("CUST-ESCALATE");

  // Notification trong chat
  const note = document.createElement("div");
  note.className = "chat-bubble system";
  note.innerHTML = `<i class="fa-solid fa-arrow-right"></i> <strong>Nhân viên trực ca đã nhận được tin nhắn!</strong> Chuyển sang tab <strong>Employee Console</strong> để xem và xử lý.`;
  document.getElementById("chatMessagesArea").appendChild(note);
}

function appendUserMessage(text) {
  const chatArea = document.getElementById("chatMessagesArea");
  const msgEl = document.createElement("div");
  msgEl.className = "chat-bubble customer";
  msgEl.textContent = text;
  chatArea.appendChild(msgEl);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function appendAgentMessage(text, citations = []) {
  const chatArea = document.getElementById("chatMessagesArea");
  const msgEl = document.createElement("div");
  msgEl.className = "chat-bubble agent";

  let citationsHtml = "";
  if (citations && citations.length > 0) {
    citationsHtml = `
      <div class="citation-box">
        <div class="citation-header">
          <i class="fa-solid fa-bookmark"></i> Nguồn căn cứ đã được duyệt:
        </div>
        ${citations.map(c => `
          <div class="citation-source">• <strong>${c.title}</strong> — ${c.section}</div>
        `).join("")}
      </div>
    `;
  }

  msgEl.innerHTML = `
    <div>${formatMarkdown(text)}</div>
    ${citationsHtml}
  `;
  chatArea.appendChild(msgEl);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function appendSystemMessage(text) {
  const chatArea = document.getElementById("chatMessagesArea");
  const msgEl = document.createElement("div");
  msgEl.className = "chat-bubble system";
  msgEl.innerHTML = `<i class="fa-solid fa-bell"></i> ${text}`;
  chatArea.appendChild(msgEl);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showTypingIndicator() {
  const chatArea = document.getElementById("chatMessagesArea");
  const typing = document.createElement("div");
  typing.id = "typingIndicator";
  typing.className = "chat-bubble agent text-muted";
  typing.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> AI đang đối soát bảng giá & tài liệu...`;
  chatArea.appendChild(typing);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById("typingIndicator");
  if (typing) typing.remove();
}

// Logic: AI Response Decision Engine khi người dùng tự nhập text
function processCustomerQuery(query) {
  const lower = query.toLowerCase();

  // 1. Inquiry regarding Price / Rolling price
  if (lower.includes("giá") || lower.includes("lăn bánh") || lower.includes("bao nhiêu")) {
    triggerCustomerScenario("correct");
    return;
  }

  // 2. Inquiry regarding Test Drive
  if (lower.includes("lái thử") || lower.includes("hẹn") || lower.includes("thứ bảy") || lower.includes("chủ nhật")) {
    triggerCustomerScenario("testdrive");
    return;
  }

  // 3. Inquiry regarding loan
  if (lower.includes("vay") || lower.includes("trả góp") || lower.includes("ngân hàng")) {
    triggerCustomerScenario("loan_guide");
    return;
  }

  // 4. Inquiry regarding clarify / discount
  if (lower.includes("sai") || lower.includes("50") || lower.includes("30 triệu") || lower.includes("đính chính")) {
    triggerCustomerScenario("clarify");
    return;
  }

  // 5. Inquiry regarding custom price negotiation (Trigger Handoff)
  if (lower.includes("bớt") || lower.includes("giảm thêm") || lower.includes("chiết khấu riêng") || lower.includes("cọc luôn") || lower.includes("bảo hiểm")) {
    triggerCustomerScenario("handoff_escalate");
    return;
  }

  // Default: General Consultation
  appendAgentMessage(
    "Dạ em đã ghi nhận thông tin của anh/chị. Dòng xe này hiện đang có sẵn xe giao ngay tại Showroom. Anh/chị cần em hỗ trợ tính phương án vay trả góp ngân hàng 80% hay muốn đăng ký lái thử xe trải nghiệm ạ?",
    [{ title: "Chinh_Sach_Ban_Hang_2026.pdf", section: "Điều 1 - Tiêu chuẩn hỗ trợ khách hàng số" }]
  );
}

function triggerVehicleInquiry(vehicleName) {
  const chatInput = document.getElementById("chatInput");
  chatInput.value = `Cho anh hỏi thông số chi tiết và giá lăn bánh của dòng ${vehicleName}`;
  handleUserSend();
}

// Global FAQ Consolidated Knowledge Base Data (Painpoint solution)
const FAQ_CLUSTERS_DATA = {
  "cluster-1": {
    title: "Cụm #1: Báo giá lăn bánh CR-V & Camry (58 câu hỏi trùng lặp)",
    doc: "Bang_Gia_Chinh_Thuc_2026.pdf (Mục 2.1)",
    questions: [
      "Giá ra biển Hà Nội bao nhiêu em?",
      "Tổng lăn bánh bản L AWD là bao nhiêu?",
      "Có được trừ tiền mặt khuyến mãi vào giá lăn bánh không?",
      "Lệ phí trước bạ xe 7 chỗ này tính thế nào?",
      "Chi phí đăng kiểm và biển số ở tỉnh khác gì HN?"
    ],
    response: `Dạ em gửi anh/chị bảng tính dự toán chi phí lăn bánh chính xác nhất cho xe Honda CR-V L AWD (2026) tại Hà Nội:
- Giá niêm yết: 1.110.000.000 VNĐ
- Lệ phí trước bạ (12%): 133.200.000 VNĐ
- Tiền biển số Hà Nội: 20.000.000 VNĐ
- Bảo hiểm TNDS & phí đường bộ: ~2.300.000 VNĐ
- TỔNG CHI PHÍ LĂN BÁNH: ~1.265.000.000 VNĐ
🎁 Ưu đãi đặc biệt: Giảm trực tiếp 30.000.000 VNĐ tiền mặt + Tặng gói phụ kiện cao cấp chính hãng. Em có thể giữ xe và xếp lịch lái thử cho anh/chị vào cuối tuần này nhé ạ!`
  },
  "cluster-2": {
    title: "Cụm #2: Thủ tục vay trả góp 80% & lãi suất (27 câu hỏi trùng lặp)",
    doc: "Chinh_Sach_Tin_Dung_Ngan_Hang.pdf",
    questions: [
      "Vay 80% mỗi tháng trả bao nhiêu tiền?",
      "Lãi suất ngân hàng bên em liên kết là bao nhiêu?",
      "Hồ sơ vay cần bảng lương hay sao kê không?",
      "Duyệt vay mất bao lâu thời gian?"
    ],
    response: `Dạ với gói vay trả góp 80%, Showroom liên kết trực tiếp với các ngân hàng lớn (Vietcombank, Techcombank, Shinhan) áp dụng lãi suất ưu đãi chỉ từ 6.99%/năm đầu. Hồ sơ cực kỳ đơn giản: Chỉ cần ảnh CCCD gắn chip, không cần chứng minh thu nhập phức tạp, phê duyệt hạn mức nhanh trong vòng 2 giờ làm việc ạ!`
  },
  "cluster-3": {
    title: "Cụm #3: Xe có sẵn màu giao ngay trong tuần (15 câu hỏi trùng lặp)",
    doc: "He_Thong_Ton_Kho_Realtime.json",
    questions: [
      "Bản màu đen có xe giao trước thứ 6 không?",
      "Màu trắng ngọc trai có sẵn tại đại lý không?",
      "Đặt cọc bao nhiêu tiền thì giữ được xe?"
    ],
    response: `Dạ hiện tại kho xe đại lý đang có sẵn các màu Trắng Ngọc và Đen Ánh đủ hồ sơ xe để giao ngay trong vòng 48 giờ sau khi hoàn tất thủ tục cọc (20 triệu đồng). Riêng bản màu Xanh Ánh Kim đang trên đường về cảng và sẽ bàn giao vào thứ Năm tới ạ!`
  }
};

// ------------------------------------------------------------------------------
// 3. EMPLOYEE CONSOLE LOGIC
// ------------------------------------------------------------------------------
function initEmployeeConsole() {
  renderLeadQueue();
  renderActiveLeadDossier(activeLeadId);
  initFaqRepository();

  // Claim Handoff button
  document.getElementById("btnClaimHandoff").addEventListener("click", () => {
    const statusPill = document.getElementById("activeConsoleLeadStatus");
    statusPill.className = "status-pill text-success";
    statusPill.innerHTML = `<i class="fa-solid fa-lock"></i> Bạn đã tiếp nhận độc quyền`;
    alert("Bạn đã tiếp nhận ca thành công! Quyền trả lời của AI tự động tạm dừng để bạn trực tiếp tư vấn khách hàng.");
  });

  // Action chips
  document.querySelectorAll(".btn-action-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-text");
      const input = document.getElementById("consultantReplyInput");
      input.value = text;
      input.focus();
    });
  });

  // AI Query Clusters Apply Buttons (Painpoint solution)
  document.querySelectorAll(".btn-apply-cluster").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-text");
      const input = document.getElementById("consultantReplyInput");
      input.value = text;
      input.focus();
      
      // Visual feedback
      input.style.borderColor = "var(--text-white)";
      input.style.boxShadow = "0 0 16px rgba(255, 255, 255, 0.25)";
      setTimeout(() => {
        input.style.borderColor = "";
        input.style.boxShadow = "";
      }, 1200);

      // Notification
      const topic = btn.closest(".cluster-card").querySelector(".cluster-topic").textContent;
      appendConsultantTranscriptMessage("Hệ thống AI 5.0", `Đã tải câu trả lời tổng hợp cho cụm: "${topic}". Nhấn 'Gửi Tin' để chuyển cho khách.`);
    });
  });

  // Sidebar Subtabs Switcher (Lead Dossier vs Smart FAQ)
  const subtabs = document.querySelectorAll(".subtab-btn");
  subtabs.forEach(btn => {
    btn.addEventListener("click", () => {
      subtabs.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".subtab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-subtab");
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add("active");
    });
  });

  // Consultant Send reply
  document.getElementById("btnSendConsultantReply").addEventListener("click", () => {
    const input = document.getElementById("consultantReplyInput");
    const text = input.value.trim();
    if (!text) return;

    appendConsultantTranscriptMessage("Bạn (Chuyên viên tư vấn)", text);
    input.value = "";
  });
}

function initFaqRepository() {
  const pills = document.querySelectorAll(".faq-pill-btn");
  const textarea = document.getElementById("faqEditorTextarea");
  const btnApply = document.getElementById("btnApplyFaqToChat");
  const btnSave = document.getElementById("btnSaveFaqResponse");
  const feedback = document.getElementById("faqEditorFeedback");
  const input = document.getElementById("consultantReplyInput");

  let currentCluster = "cluster-1";

  function loadCluster(clusterId) {
    currentCluster = clusterId;
    pills.forEach(p => p.classList.toggle("active", p.getAttribute("data-cluster") === clusterId));
    if (FAQ_CLUSTERS_DATA[clusterId] && textarea) {
      textarea.value = FAQ_CLUSTERS_DATA[clusterId].response;
    }
  }

  pills.forEach(p => {
    p.addEventListener("click", () => {
      loadCluster(p.getAttribute("data-cluster"));
    });
  });

  if (textarea && FAQ_CLUSTERS_DATA[currentCluster]) {
    textarea.value = FAQ_CLUSTERS_DATA[currentCluster].response;
  }

  if (btnApply) {
    btnApply.addEventListener("click", () => {
      if (input && textarea) {
        input.value = textarea.value.trim();
        input.focus();
        input.style.borderColor = "var(--text-white)";
        setTimeout(() => { input.style.borderColor = ""; }, 1200);
      }
    });
  }

  if (btnSave) {
    btnSave.addEventListener("click", () => {
      if (FAQ_CLUSTERS_DATA[currentCluster] && textarea) {
        FAQ_CLUSTERS_DATA[currentCluster].response = textarea.value.trim();
        feedback.textContent = "✅ Đã lưu!";
        feedback.style.color = "var(--text-white)";
        setTimeout(() => { feedback.textContent = ""; }, 3000);
      }
    });
  }
}

function renderLeadQueue() {
  const queueEl = document.getElementById("leadQueueList");
  queueEl.innerHTML = INLINE_DB.customers.map(c => `
    <div class="queue-item ${c.id === activeLeadId ? 'active' : ''}" onclick="selectLead('${c.id}')">
      <div class="queue-item-top">
        <span class="queue-customer-name">${c.full_name}</span>
        <span class="sla-badge ${c.status === 'HANDOFF_PENDING' ? 'urgent' : 'normal'}">
          ${c.status === 'HANDOFF_PENDING' ? 'Chờ nhận (02:40)' : 'Đã đặt lịch'}
        </span>
      </div>
      <div class="queue-item-mid">
        <i class="fa-solid fa-car text-muted"></i> ${c.interested_vehicle}
      </div>
      <div class="queue-item-bottom">
        <span><i class="fa-solid fa-phone"></i> ${c.phone}</span>
        <span>Lead Score: <strong>${c.lead_score}</strong>/100</span>
      </div>
    </div>
  `).join("");
}

function selectLead(leadId) {
  activeLeadId = leadId;
  renderLeadQueue();
  renderActiveLeadDossier(leadId);
}

function renderActiveLeadDossier(leadId) {
  const lead = INLINE_DB.customers.find(c => c.id === leadId);
  if (!lead) return;

  document.getElementById("activeConsoleCustomerName").textContent = `Khách hàng: ${lead.full_name} (${lead.phone})`;
  document.getElementById("leadScoreNumber").textContent = lead.lead_score;
  document.getElementById("leadScoreGrade").textContent = lead.lead_score >= 80 ? "CỰC KỲ TIỀM NĂNG (HOT)" : "TIỀM NĂNG (HIGH)";
  document.getElementById("aiSummaryContent").textContent = lead.ai_summary;

  const attrEl = document.getElementById("leadAttributesGrid");
  attrEl.innerHTML = `
    <div class="attr-row"><span class="attr-label">Khu vực:</span><span class="attr-val">${lead.city}</span></div>
    <div class="attr-row"><span class="attr-label">Kênh tiếp cận:</span><span class="attr-val">${lead.channel}</span></div>
    <div class="attr-row"><span class="attr-label">Ngân sách dự kiến:</span><span class="attr-val">${lead.budget}</span></div>
    <div class="attr-row"><span class="attr-label">Dòng xe quan tâm:</span><span class="attr-val">${lead.interested_vehicle}</span></div>
  `;

  // Dynamic transcript content based on selected lead
  let customerMsg = "Em ơi, tư vấn giúp anh giá lăn bánh bản Honda CR-V L AWD tại Hà Nội và thủ tục trả góp 80% với! Đang có 58 khách cùng hỏi câu này đúng không em?";
  let aiSuggestionText = "Dạ em gửi anh bảng tính lăn bánh xe Honda CR-V L AWD (2026) tại Hà Nội: Tổng lăn bánh ~1.265 tỷ (đã trừ ưu đãi 30 triệu tiền mặt). Với gói trả góp 80%, anh chỉ cần chuẩn bị trước khoảng 310 triệu là có thể nhận xe ngay, lãi suất 6.99%/năm đầu. Anh có muốn em giữ lịch trải nghiệm lái thử xe vào sáng thứ Bảy này không ạ?";
  let suggestionMatch = "Khớp 99% Cụm #1 • Đọc từ Bảng Giá 2026 & Tín Dụng";

  if (leadId === "CUST-ESCALATE") {
    customerMsg = "Bớt thêm cho anh 40 triệu tiền mặt nữa và tặng bảo hiểm VIP 2 năm thì anh chuyển cọc 50 triệu chốt xe ngay!";
    aiSuggestionText = "Dạ em chào anh! Em là Tư vấn viên chính thức của Showroom tiếp nhận trực tiếp từ Chatbot AI. Với thiện chí cọc 50 triệu của anh, em đã xin phép Giám đốc Showroom duyệt chính sách: Chiết khấu tiền mặt 35 triệu + Tặng 01 năm bảo hiểm vật chất và bộ phụ kiện VIP chính hãng. Anh có tiện ghé Showroom để em hoàn thiện hợp đồng giao xe sớm không ạ?";
    suggestionMatch = "Phát hiện đàm phán giá vượt quyền • AI đề xuất mức chiết khấu khả thi tối đa";
  } else if (lead.interested_vehicle && lead.interested_vehicle.includes("Corolla")) {
    customerMsg = "Anh ở Đà Nẵng, dòng Corolla Cross Hybrid giao xe mất bao lâu và hộ kinh doanh có được chiết khấu thêm không?";
    aiSuggestionText = "Dạ chào anh, dòng Corolla Cross Hybrid màu xanh hiện sẵn xe tại kho cảng, giao về Đà Nẵng trong vòng 3 ngày làm việc. Với khách hàng đăng ký hộ kinh doanh cá thể, bên em có gói chiết khấu thương mại 1.5% kèm thẻ bảo dưỡng miễn phí 2 năm ạ!";
    suggestionMatch = "Khớp 95% Cụm #3 & Chính sách Doanh nghiệp";
  }

  // Render Sample Transcript in Console with In-Stream AI Suggestion Card
  const transEl = document.getElementById("consoleTranscriptArea");
  transEl.innerHTML = `
    <!-- Tin nhắn của khách hàng: BÊN TRÁI -->
    <div class="chat-bubble customer">
      <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 3px;"><i class="fa-solid fa-user"></i> Khách hàng: ${lead.full_name}</div>
      <div>${customerMsg}</div>
    </div>

    <!-- AI IN-STREAM CO-PILOT SUGGESTION CARD (CÂU HỎI THƯỜNG GẶP GỢI Ý NGAY) -->
    <div class="ai-stream-suggestion-card" id="aiStreamSuggestionCard">
      <div class="suggestion-header">
        <div class="suggestion-badge"><i class="fa-solid fa-wand-magic-sparkles"></i> CHATBOT CO-PILOT GỢI Ý CÂU TRẢ LỜI CHUẨN</div>
        <span class="suggestion-tag">${suggestionMatch}</span>
      </div>
      <div class="suggestion-content" id="suggestionContentText">
        ${aiSuggestionText}
      </div>
      <div class="suggestion-actions">
        <button class="btn btn-sm btn-primary" id="btnQuickSendAiSuggestion">
          <i class="fa-solid fa-paper-plane"></i> Gửi Nhanh Cho Khách
        </button>
        <button class="btn btn-sm btn-secondary" id="btnInsertToInput">
          <i class="fa-solid fa-pen-to-square"></i> Đưa Vào Ô Soạn Để Sửa
        </button>
        <button class="btn btn-sm btn-secondary" id="btnDismissAiSuggestion">
          <i class="fa-solid fa-xmark"></i> Tự Soạn Tin / Bỏ Qua
        </button>
      </div>
    </div>
  `;

  bindInStreamSuggestionEvents();
}

function bindInStreamSuggestionEvents() {
  const card = document.getElementById("aiStreamSuggestionCard");
  const btnQuickSend = document.getElementById("btnQuickSendAiSuggestion");
  const btnInsert = document.getElementById("btnInsertToInput");
  const btnDismiss = document.getElementById("btnDismissAiSuggestion");
  const suggestionText = document.getElementById("suggestionContentText");
  const input = document.getElementById("consultantReplyInput");

  if (!card) return;

  btnQuickSend.addEventListener("click", () => {
    const text = suggestionText.textContent.trim();
    appendConsultantTranscriptMessage("Bạn (Chuyên viên tư vấn)", text);
    card.remove();
  });

  btnInsert.addEventListener("click", () => {
    input.value = suggestionText.textContent.trim();
    input.focus();
    input.style.borderColor = "var(--text-white)";
    setTimeout(() => { input.style.borderColor = ""; }, 1200);
    card.remove();
  });

  btnDismiss.addEventListener("click", () => {
    card.remove();
    appendConsultantTranscriptMessage("Hệ thống AI 5.0", "Bạn đã từ chối câu trả lời gợi ý của AI. Vui lòng tự nhập phản hồi cá nhân hóa vào ô bên dưới.");
  });
}

function appendConsultantTranscriptMessage(sender, text) {
  const transEl = document.getElementById("consoleTranscriptArea");
  const msgEl = document.createElement("div");
  msgEl.className = "chat-bubble agent";
  msgEl.innerHTML = `
    <div style="font-size: 11px; opacity: 0.7; margin-bottom: 3px;"><i class="fa-solid fa-headset"></i> ${sender}</div>
    <div>${formatMarkdown(text)}</div>
  `;
  transEl.appendChild(msgEl);
  transEl.scrollTop = transEl.scrollHeight;
}

// ------------------------------------------------------------------------------
// 4. MANAGER DASHBOARD LOGIC (DYNAMIC ROI CALCULATOR)
// ------------------------------------------------------------------------------
function initManagerDashboard() {
  const sliderLeads = document.getElementById("sliderLeads");
  const sliderMargin = document.getElementById("sliderMargin");

  sliderLeads.addEventListener("input", recalculateROI);
  sliderMargin.addEventListener("input", recalculateROI);

  recalculateROI();
}

function recalculateROI() {
  const leads = parseInt(document.getElementById("sliderLeads").value);
  const margin = parseInt(document.getElementById("sliderMargin").value);

  document.getElementById("lblSliderLeads").textContent = leads.toLocaleString('vi-VN');
  document.getElementById("lblSliderMargin").textContent = margin.toLocaleString('vi-VN');

  // Formulas
  // Cost saving: leads * 70% deflection * 35,000 VND
  const costSaving = leads * 0.70 * 35000;
  // Revenue impact: leads * 0.7% conversion uplift * vehicle margin
  const extraCarsSold = leads * 0.007;
  const revenueImpact = extraCarsSold * margin;
  // Operational Cost (Opex): ~3,845,000 VND
  const opex = 3845000;
  // Net Profit
  const netProfit = (costSaving + revenueImpact) - opex;
  // Payback period for 180,000,000 VND investment
  const paybackDays = Math.round((180000000 / netProfit) * 30);

  document.getElementById("calcCostSaving").textContent = formatVND(costSaving) + " / tháng";
  document.getElementById("calcRevenueImpact").textContent = `${formatVND(revenueImpact)} / tháng (+${extraCarsSold.toFixed(1)} xe)`;
  document.getElementById("calcNetProfit").textContent = formatVND(netProfit) + " / tháng";
  document.getElementById("calcPayback").textContent = paybackDays <= 30 
    ? `~${paybackDays} ngày (< 1 tháng)` 
    : `~${(paybackDays / 30).toFixed(1)} tháng`;
}

// ------------------------------------------------------------------------------
// 5. TEST DRIVE BOOKING MODAL
// ------------------------------------------------------------------------------
function initBookingModal() {
  const modal = document.getElementById("bookingModal");
  const btnOpen = document.getElementById("btnOpenBookingModal");
  const btnClose = document.getElementById("btnCloseBookingModal");
  const btnCancel = document.getElementById("btnCancelBooking");
  const form = document.getElementById("bookingForm");

  // Set default booking date to next Saturday
  const dateInput = document.getElementById("modalBookingDate");
  const today = new Date();
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  dateInput.value = nextSaturday.toISOString().split("T")[0];

  btnOpen.addEventListener("click", () => modal.classList.add("open"));
  btnClose.addEventListener("click", () => modal.classList.remove("open"));
  btnCancel.addEventListener("click", () => modal.classList.remove("open"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const vehicleSelect = document.getElementById("modalVehicleSelect");
    const vehicleName = vehicleSelect.options[vehicleSelect.selectedIndex].text;
    const name = document.getElementById("modalCustomerName").value;
    const phone = document.getElementById("modalCustomerPhone").value;
    const date = document.getElementById("modalBookingDate").value;
    const time = document.getElementById("modalBookingTime").value;

    const bookingId = "BK-" + Math.floor(100000 + Math.random() * 900000);

    modal.classList.remove("open");

    // Announce in chat
    appendSystemMessage(`ĐẶT LỊCH THÀNH CÔNG! Mã lịch hẹn: [${bookingId}]. Xe: ${vehicleName}. Thời gian: ${time} ngày ${date}. Chuyên viên Showroom sẽ đón tiếp quý khách đúng giờ.`);
  });
}

// Helper Utilities
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'VNĐ');
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
