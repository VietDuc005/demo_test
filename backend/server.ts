import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

function loadEnv(path: string) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(ROOT, "ui-demo", ".env"));

type Role = "CUSTOMER" | "EMPLOYEE";
type User = { id: string; username: string; full_name: string; email: string; role: Role };
type Route = "KNOWLEDGE_ANSWER" | "CORRECTION" | "BOOKING" | "GUIDE_ONLY" | "HANDOFF";
type Decision = { route: Route; intent: string; answer: string; confidence: number; reason: string; missing_fields: string[] };

const DB_PATH = process.env.DB_PATH || resolve(ROOT, "database", "showroom_mvp.db");
mkdirSync(resolve(DB_PATH, ".."), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('CUSTOMER','EMPLOYEE'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL, stock INTEGER NOT NULL,
      test_drive_resource TEXT NOT NULL, specs_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'AI_ACTIVE',
      assigned_employee_id TEXT REFERENCES users(id), summary TEXT NOT NULL DEFAULT '', facts_json TEXT NOT NULL DEFAULT '{}',
      next_action TEXT NOT NULL DEFAULT '', started_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL, content TEXT NOT NULL, route TEXT, provider TEXT,
      latency_ms INTEGER NOT NULL DEFAULT 0, correct_feedback INTEGER, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS handoffs (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
      reason TEXT NOT NULL, priority TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'WAITING',
      claimed_by TEXT REFERENCES users(id), created_at TEXT NOT NULL, claimed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES users(id), vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
      consultant_id TEXT NOT NULL REFERENCES users(id), customer_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL,
      slot_start TEXT NOT NULL, slot_end TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'CONFIRMED', attendance TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT NOT NULL DEFAULT '', idempotency_key TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_booking_slot ON bookings(consultant_id, slot_start, slot_end, status);
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY, booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      kind TEXT NOT NULL, scheduled_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', sent_at TEXT,
      UNIQUE(booking_id, kind)
    );
    CREATE TABLE IF NOT EXISTS question_clusters (
      cluster_key TEXT PRIMARY KEY, label TEXT NOT NULL, representative TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 1,
      suggested_answer TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, user_id TEXT, conversation_id TEXT, name TEXT NOT NULL, payload_json TEXT NOT NULL,
      duration_ms INTEGER, created_at TEXT NOT NULL
    );
  `);
  const insertUser = db.prepare("INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?)");
  insertUser.run("usr-customer", "customer", hashPassword("demo123"), "Nguyễn Minh Anh", "customer@demo.vn", "CUSTOMER");
  insertUser.run("usr-employee", "employee", hashPassword("demo123"), "Trần Hoàng Nam", "sales@demo.vn", "EMPLOYEE");
  insertUser.run("usr-employee-2", "employee2", hashPassword("demo123"), "Lê Thu Hà", "sales2@demo.vn", "EMPLOYEE");
  const insertVehicle = db.prepare("INSERT OR IGNORE INTO vehicles VALUES (?, ?, ?, ?, ?, ?)");
  insertVehicle.run("veh-crv", "Honda CR-V L AWD 2026", 1110000000, 5, "car-crv-01", JSON.stringify({ engine: "1.5L VTEC Turbo", seats: 7, safety: "Honda SENSING", colors: ["Trắng", "Đen", "Đỏ"] }));
  insertVehicle.run("veh-city", "Honda City RS 2026", 609000000, 8, "car-city-01", JSON.stringify({ engine: "1.5L DOHC i-VTEC", seats: 5, safety: "Honda SENSING", colors: ["Đỏ", "Trắng", "Xám"] }));
}
initDb();

const nowIso = () => new Date().toISOString();
const json = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

async function bodyJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new Error("INVALID_JSON"); }
}

function auth(req: IncomingMessage): User | null {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  return db.prepare(`SELECT u.id,u.username,u.full_name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token=? AND s.expires_at>?`).get(token, nowIso()) as User | null;
}

function requireRole(req: IncomingMessage, res: ServerResponse, roles: Role[]) {
  const user = auth(req);
  if (!user) { json(res, 401, { error: "Bạn cần đăng nhập." }); return null; }
  if (!roles.includes(user.role)) { json(res, 403, { error: "Bạn không có quyền thực hiện thao tác này." }); return null; }
  return user;
}

function getConversation(customerId: string) {
  let row = db.prepare("SELECT * FROM conversations WHERE customer_id=? AND status!='RESOLVED' ORDER BY started_at DESC LIMIT 1").get(customerId) as any;
  if (!row) {
    const id = `conv-${randomUUID()}`;
    db.prepare("INSERT INTO conversations(id,customer_id,started_at,updated_at) VALUES(?,?,?,?)").run(id, customerId, nowIso(), nowIso());
    row = db.prepare("SELECT * FROM conversations WHERE id=?").get(id);
  }
  return row;
}

function knowledgeContext() {
  const vehicles = db.prepare("SELECT * FROM vehicles ORDER BY price").all() as any[];
  return vehicles.map(v => ({ id: v.id, name: v.name, listed_price_vnd: v.price, available_stock: v.stock, specifications: JSON.parse(v.specs_json) }));
}

function localDecision(message: string): Decision {
  const m = message.toLocaleLowerCase("vi");
  const booking = /(đặt|hẹn|book|đăng ký).*(lịch|lái thử|xem xe)|(lái thử|test drive)/i.test(m);
  const correction = /(sai|không đúng|nhầm|đính chính|hôm trước|nói là)/i.test(m);
  const guide = /(vay|trả góp|thủ tục|hồ sơ|bảo hiểm|đăng kiểm|sang tên)/i.test(m);
  const handoff = /(nhân viên|tư vấn viên|người thật|khiếu nại|giảm thêm|thương lượng|gặp quản lý|không hài lòng)/i.test(m);
  const crv = /cr-?v/i.test(m);
  const city = /city/i.test(m);
  if (handoff) return { route: "HANDOFF", intent: "human_support", confidence: .96, reason: "Khách yêu cầu người thật hoặc nội dung vượt thẩm quyền", missing_fields: [], answer: "Mình đã chuyển toàn bộ nội dung và tóm tắt nhu cầu sang hàng chờ của tư vấn viên. Bạn không cần trình bày lại từ đầu." };
  if (booking) return { route: "BOOKING", intent: "test_drive_booking", confidence: .94, reason: "Có ý định lái thử/đặt lịch", missing_fields: ["vehicle_id", "slot_start", "phone"], answer: "Mình có thể đặt lịch trực tiếp. Hãy mở biểu mẫu bên dưới; hệ thống sẽ kiểm tra lịch trống và xác nhận ngay, không chỉ gửi hướng dẫn." };
  if (correction) return { route: "CORRECTION", intent: "answer_dispute", confidence: .82, reason: "Khách phản hồi câu trả lời có thể sai", missing_fields: [], answer: "Cảm ơn bạn đã phản hồi. Mình sẽ không bảo vệ câu trả lời cũ: thông tin cần được đối chiếu lại với dữ liệu đã duyệt. Nếu chưa đủ căn cứ, mình sẽ chuyển nhân viên xác minh." };
  if (guide) return { route: "GUIDE_ONLY", intent: "regulated_or_external_process", confidence: .9, reason: "Quy trình cần ngân hàng/cơ quan ngoài hệ thống", missing_fields: [], answer: "Mình có thể hướng dẫn hồ sơ và các bước, nhưng không thể tự phê duyệt thay ngân hàng/cơ quan liên quan. Hồ sơ vay thường gồm CCCD, chứng minh thu nhập và thông tin khoản vay; tư vấn viên sẽ xác nhận điều kiện cụ thể với ngân hàng." };
  if (crv) return { route: "KNOWLEDGE_ANSWER", intent: "vehicle_question", confidence: .94, reason: "Khớp dữ liệu xe đã duyệt", missing_fields: [], answer: "Honda CR-V L AWD 2026 có giá niêm yết mẫu 1.110.000.000đ, động cơ 1.5L VTEC Turbo, 7 chỗ và Honda SENSING. Hiện dữ liệu mẫu ghi nhận còn 5 xe. Giá lăn bánh/ưu đãi cần xác nhận theo tỉnh và thời điểm." };
  if (city) return { route: "KNOWLEDGE_ANSWER", intent: "vehicle_question", confidence: .94, reason: "Khớp dữ liệu xe đã duyệt", missing_fields: [], answer: "Honda City RS 2026 có giá niêm yết mẫu 609.000.000đ, động cơ 1.5L DOHC i-VTEC, 5 chỗ và Honda SENSING. Hiện dữ liệu mẫu ghi nhận còn 8 xe." };
  return { route: "HANDOFF", intent: "unknown_or_ungrounded", confidence: .35, reason: "Không tìm thấy căn cứ đủ mạnh trong kho dữ liệu mẫu", missing_fields: [], answer: "Mình chưa có nguồn đã duyệt để trả lời chắc chắn câu này. Mình đã chuyển cho tư vấn viên cùng toàn bộ ngữ cảnh để tránh trả lời đoán." };
}

const ROUTES = new Set<Route>(["KNOWLEDGE_ANSWER", "CORRECTION", "BOOKING", "GUIDE_ONLY", "HANDOFF"]);

async function modelDecision(message: string): Promise<{ decision: Decision; provider: string }> {
  const context = knowledgeContext();
  const system = `Bạn là bộ định tuyến an toàn cho showroom. Chỉ trả JSON. Chọn đúng một route: KNOWLEDGE_ANSWER (có căn cứ), CORRECTION (khách nói bot sai), BOOKING (ý định đặt lịch), GUIDE_ONLY (chỉ có thể hướng dẫn, không thể thực hiện thủ tục ngoài hệ thống), HANDOFF (yêu cầu người thật, khiếu nại, thương lượng hoặc thiếu căn cứ). Không bịa giá/khuyến mãi. JSON: {"route":"...","intent":"...","answer":"...","confidence":0.0,"reason":"...","missing_fields":[]}. Dữ liệu đã duyệt: ${JSON.stringify(context)}`;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const providerPreference = (process.env.MODEL_PROVIDER || "auto").toLowerCase();
  try {
    let raw = "";
    let provider = "";
    if (openRouterKey && providerPreference !== "gemini" && providerPreference !== "local") {
      provider = "openrouter";
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST", signal: AbortSignal.timeout(12000),
        headers: { "Authorization": `Bearer ${openRouterKey}`, "Content-Type": "application/json", "HTTP-Referer": "http://localhost:8080", "X-Title": "AutoAdvisor MVP" },
        body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || "google/gemini-3.8-flash", temperature: 0.1, messages: [{ role: "system", content: system }, { role: "user", content: message }], response_format: { type: "json_schema", json_schema: { name: "showroom_decision", strict: true, schema: { type: "object", properties: { route: { type: "string", enum: [...ROUTES] }, intent: { type: "string" }, answer: { type: "string" }, confidence: { type: "number" }, reason: { type: "string" }, missing_fields: { type: "array", items: { type: "string" } } }, required: ["route", "intent", "answer", "confidence", "reason", "missing_fields"], additionalProperties: false } } } })
      });
      if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
      const data: any = await response.json();
      raw = data.choices?.[0]?.message?.content || "";
    } else if (geminiKey && providerPreference !== "openrouter" && providerPreference !== "local") {
      provider = "gemini";
      const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: "POST", signal: AbortSignal.timeout(12000), headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: message }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } })
      });
      if (!response.ok) throw new Error(`Gemini ${response.status}`);
      const data: any = await response.json();
      raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else return { decision: localDecision(message), provider: "local-policy" };
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
    if (!ROUTES.has(parsed.route)) throw new Error("Invalid route");
    const decision: Decision = { route: parsed.route, intent: String(parsed.intent || "unknown"), answer: String(parsed.answer || ""), confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)), reason: String(parsed.reason || ""), missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields.map(String) : [] };
    if (decision.route === "KNOWLEDGE_ANSWER" && decision.confidence < .72) return { decision: { ...decision, route: "HANDOFF", answer: "Mình chưa có đủ căn cứ để trả lời chắc chắn nên đã chuyển tư vấn viên kiểm tra.", reason: "Confidence dưới ngưỡng policy" }, provider };
    return { decision, provider };
  } catch {
    return { decision: localDecision(message), provider: "local-fallback" };
  }
}

function clusterFor(message: string, decision: Decision) {
  const key = decision.intent.replace(/[^a-z0-9_]/gi, "_").slice(0, 60) || "other";
  const existing = db.prepare("SELECT * FROM question_clusters WHERE cluster_key=?").get(key) as any;
  if (existing) db.prepare("UPDATE question_clusters SET count=count+1,updated_at=? WHERE cluster_key=?").run(nowIso(), key);
  else db.prepare("INSERT INTO question_clusters VALUES(?,?,?,?,?,?)").run(key, decision.intent, message.slice(0, 240), 1, decision.answer.slice(0, 500), nowIso());
}

function buildSummary(conversationId: string) {
  const items = db.prepare("SELECT sender_role,content FROM messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT 8").all(conversationId) as any[];
  const ordered = items.reverse();
  const customer = ordered.filter(x => x.sender_role === "CUSTOMER").map(x => x.content).slice(-3);
  const summary = customer.length ? `Khách đã hỏi: ${customer.join(" | ").slice(0, 700)}` : "Khách yêu cầu hỗ trợ trực tiếp.";
  const next = "Đọc tóm tắt, xác minh nhu cầu còn thiếu và phản hồi trong SLA 5 phút.";
  db.prepare("UPDATE conversations SET summary=?,facts_json=?,next_action=?,updated_at=? WHERE id=?")
    .run(summary, JSON.stringify({ recent_customer_requests: customer }), next, nowIso(), conversationId);
  return { summary, facts: { recent_customer_requests: customer }, next_action: next };
}

function ensureHandoff(conversationId: string, reason: string) {
  const context = buildSummary(conversationId);
  const existing = db.prepare("SELECT * FROM handoffs WHERE conversation_id=?").get(conversationId) as any;
  if (!existing) db.prepare("INSERT INTO handoffs(id,conversation_id,reason,priority,created_at) VALUES(?,?,?,?,?)")
    .run(`handoff-${randomUUID()}`, conversationId, reason, "HIGH", nowIso());
  db.prepare("UPDATE conversations SET status='HANDOFF_PENDING',updated_at=? WHERE id=?").run(nowIso(), conversationId);
  return context;
}

function event(name: string, userId: string | null, conversationId: string | null, payload: unknown, duration?: number) {
  db.prepare("INSERT INTO events VALUES(?,?,?,?,?,?,?)").run(randomUUID(), userId, conversationId, name, JSON.stringify(payload), duration ?? null, nowIso());
}

async function processDueReminders() {
  const due = db.prepare(`SELECT r.*,b.email,b.customer_name,b.slot_start,v.name vehicle_name
    FROM reminders r JOIN bookings b ON b.id=r.booking_id JOIN vehicles v ON v.id=b.vehicle_id
    WHERE r.status='PENDING' AND r.scheduled_at<=? ORDER BY r.scheduled_at LIMIT 20`).all(nowIso()) as any[];
  for (const reminder of due) {
    const subject = `Nhắc lịch lái thử ${reminder.vehicle_name}`;
    const html = `<p>Xin chào ${reminder.customer_name},</p><p>Bạn có lịch lái thử ${reminder.vehicle_name} lúc ${new Date(reminder.slot_start).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.</p>`;
    try {
      if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
        const response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.MAIL_FROM, to: [reminder.email], subject, html }) });
        if (!response.ok) throw new Error(`Mail provider ${response.status}`);
        db.prepare("UPDATE reminders SET status='SENT',sent_at=? WHERE id=?").run(nowIso(), reminder.id);
      } else {
        db.prepare("UPDATE reminders SET status='SIMULATED',sent_at=? WHERE id=?").run(nowIso(), reminder.id);
        console.log(`[reminder-preview] ${reminder.kind} -> ${reminder.email}: ${subject}`);
      }
      event("reminder_processed", null, null, { reminder_id: reminder.id, mode: process.env.RESEND_API_KEY ? "email" : "simulated" });
    } catch (error) {
      event("reminder_failed", null, null, { reminder_id: reminder.id, error: (error as Error).message });
    }
  }
}

function routeMatch(pathname: string, pattern: RegExp) { return pathname.match(pattern); }

async function api(req: IncomingMessage, res: ServerResponse, url: URL) {
  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body: any = await bodyJson(req);
    const user = db.prepare("SELECT * FROM users WHERE username=?").get(String(body.username || "")) as any;
    if (!user || !verifyPassword(String(body.password || ""), user.password_hash)) return json(res, 401, { error: "Sai tài khoản hoặc mật khẩu." });
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 12 * 3600_000).toISOString();
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(token, user.id, expires);
    event("login_success", user.id, null, { role: user.role });
    return json(res, 200, { token, user: { id: user.id, username: user.username, full_name: user.full_name, email: user.email, role: user.role } });
  }
  if (req.method === "GET" && url.pathname === "/api/health") return json(res, 200, { status: "ok", database: "sqlite", provider: process.env.OPENROUTER_API_KEY ? "openrouter" : (process.env.GEMINI_API_KEY ? "gemini" : "local-policy") });
  if (req.method === "GET" && url.pathname === "/api/me") {
    const user = requireRole(req, res, ["CUSTOMER", "EMPLOYEE"]); if (!user) return;
    return json(res, 200, { user });
  }
  if (req.method === "GET" && url.pathname === "/api/vehicles") {
    const user = requireRole(req, res, ["CUSTOMER", "EMPLOYEE"]); if (!user) return;
    return json(res, 200, { vehicles: knowledgeContext() });
  }
  if (req.method === "GET" && url.pathname === "/api/conversations/current") {
    const user = requireRole(req, res, ["CUSTOMER"]); if (!user) return;
    const conversation = getConversation(user.id);
    const messages = db.prepare("SELECT id,sender_role,content,route,provider,latency_ms,correct_feedback,created_at FROM messages WHERE conversation_id=? ORDER BY created_at").all(conversation.id);
    return json(res, 200, { conversation, messages });
  }
  if (req.method === "POST" && url.pathname === "/api/chat/messages") {
    const user = requireRole(req, res, ["CUSTOMER"]); if (!user) return;
    const body: any = await bodyJson(req); const content = String(body.content || "").trim();
    if (!content || content.length > 2000) return json(res, 400, { error: "Tin nhắn phải có 1-2000 ký tự." });
    const conv = getConversation(user.id); const start = performance.now(); const customerMessageId = randomUUID();
    db.prepare("INSERT INTO messages(id,conversation_id,sender_role,content,created_at) VALUES(?,?,?,?,?)").run(customerMessageId, conv.id, "CUSTOMER", content, nowIso());
    if (conv.status === "HANDOFF_PENDING" || conv.status === "HUMAN_ACTIVE") {
      const context = buildSummary(conv.id);
      event("message_routed_to_human", user.id, conv.id, { state: conv.status }, Math.round(performance.now() - start));
      return json(res, 200, { message: { id: customerMessageId, sender_role: "SYSTEM", content: "Tin nhắn mới đã được chuyển vào đúng ca tư vấn. Nhân viên sẽ thấy ngay cùng toàn bộ ngữ cảnh.", route: "HANDOFF", provider: "policy", latency_ms: Math.round(performance.now() - start), created_at: nowIso() }, decision: { route: "HANDOFF", intent: "human_active", confidence: 1, reason: "Conversation đã thuộc hàng chờ/người thật", missing_fields: [], answer: "" }, action: "HANDOFF_CREATED", handoff_context: context });
    }
    const { decision, provider } = await modelDecision(content);
    const latency = Math.round(performance.now() - start);
    const assistantId = randomUUID();
    db.prepare("INSERT INTO messages(id,conversation_id,sender_role,content,route,provider,latency_ms,created_at) VALUES(?,?,?,?,?,?,?,?)")
      .run(assistantId, conv.id, "AI", decision.answer, decision.route, provider, latency, nowIso());
    db.prepare("UPDATE conversations SET updated_at=? WHERE id=?").run(nowIso(), conv.id);
    clusterFor(content, decision);
    let handoff_context = null;
    if (decision.route === "HANDOFF") handoff_context = ensureHandoff(conv.id, decision.reason);
    event("chat_response", user.id, conv.id, { route: decision.route, confidence: decision.confidence, provider }, latency);
    return json(res, 200, { message: { id: assistantId, sender_role: "AI", content: decision.answer, route: decision.route, provider, latency_ms: latency, created_at: nowIso() }, decision, action: decision.route === "BOOKING" ? "OPEN_BOOKING" : decision.route === "HANDOFF" ? "HANDOFF_CREATED" : null, handoff_context });
  }
  const feedbackMatch = routeMatch(url.pathname, /^\/api\/messages\/([^/]+)\/feedback$/);
  if (req.method === "POST" && feedbackMatch) {
    const user = requireRole(req, res, ["CUSTOMER"]); if (!user) return;
    const body: any = await bodyJson(req); const correct = body.correct === true ? 1 : 0;
    const result = db.prepare(`UPDATE messages SET correct_feedback=? WHERE id=? AND conversation_id IN
      (SELECT id FROM conversations WHERE customer_id=?)`).run(correct, feedbackMatch[1], user.id);
    if (!result.changes) return json(res, 404, { error: "Không tìm thấy câu trả lời." });
    const answer: any = db.prepare("SELECT conversation_id FROM messages WHERE id=?").get(feedbackMatch[1]);
    let action = null;
    if (!correct && answer?.conversation_id) { ensureHandoff(answer.conversation_id, "customer_reported_incorrect_answer"); action = "HANDOFF_CREATED"; }
    event("answer_feedback", user.id, answer?.conversation_id || null, { message_id: feedbackMatch[1], correct: !!correct });
    return json(res, 200, { ok: true, action });
  }
  if (req.method === "GET" && url.pathname === "/api/bookings/availability") {
    const user = requireRole(req, res, ["CUSTOMER", "EMPLOYEE"]); if (!user) return;
    const vehicleId = url.searchParams.get("vehicle_id") || "veh-crv"; const date = url.searchParams.get("date") || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: "Ngày không hợp lệ." });
    const slots = ["09:00", "10:30", "13:30", "15:00", "16:30"].map(time => {
      const start = new Date(`${date}T${time}:00+07:00`); const end = new Date(start.getTime() + 60 * 60_000);
      const busy = db.prepare("SELECT 1 FROM bookings WHERE vehicle_id=? AND status='CONFIRMED' AND slot_start<? AND slot_end>? LIMIT 1").get(vehicleId, end.toISOString(), start.toISOString());
      return { time, slot_start: start.toISOString(), available: !busy };
    });
    return json(res, 200, { slots });
  }
  if (req.method === "POST" && url.pathname === "/api/bookings") {
    const user = requireRole(req, res, ["CUSTOMER"]); if (!user) return;
    const body: any = await bodyJson(req);
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id=?").get(String(body.vehicle_id || "")) as any;
    const start = new Date(String(body.slot_start || ""));
    if (!vehicle || Number.isNaN(start.getTime()) || start.getTime() < Date.now()) return json(res, 400, { error: "Xe hoặc thời gian không hợp lệ." });
    if (!/^0\d{9}$/.test(String(body.phone || ""))) return json(res, 400, { error: "Số điện thoại cần có 10 chữ số." });
    const end = new Date(start.getTime() + 60 * 60_000); const key = String(body.idempotency_key || randomUUID());
    const existing = db.prepare("SELECT * FROM bookings WHERE idempotency_key=?").get(key);
    if (existing) return json(res, 200, { booking: existing, idempotent_replay: true });
    const consultants = db.prepare("SELECT id FROM users WHERE role='EMPLOYEE' ORDER BY id").all() as any[];
    let consultant = null;
    for (const c of consultants) {
      const conflict = db.prepare("SELECT 1 FROM bookings WHERE consultant_id=? AND status='CONFIRMED' AND slot_start<? AND slot_end>? LIMIT 1").get(c.id, end.toISOString(), start.toISOString());
      if (!conflict) { consultant = c.id; break; }
    }
    const carConflict = db.prepare("SELECT 1 FROM bookings WHERE vehicle_id=? AND status='CONFIRMED' AND slot_start<? AND slot_end>? LIMIT 1").get(vehicle.id, end.toISOString(), start.toISOString());
    if (!consultant || carConflict) return json(res, 409, { error: "Khung giờ vừa được người khác đặt. Vui lòng chọn giờ khác.", code: "SLOT_CONFLICT" });
    const id = `booking-${randomUUID()}`;
    try {
      db.exec("BEGIN IMMEDIATE");
      const conflictAgain = db.prepare("SELECT 1 FROM bookings WHERE (vehicle_id=? OR consultant_id=?) AND status='CONFIRMED' AND slot_start<? AND slot_end>? LIMIT 1").get(vehicle.id, consultant, end.toISOString(), start.toISOString());
      if (conflictAgain) throw new Error("SLOT_CONFLICT");
      db.prepare("INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id, user.id, vehicle.id, consultant, String(body.customer_name || user.full_name), String(body.phone), String(body.email || user.email), start.toISOString(), end.toISOString(), "CONFIRMED", "PENDING", String(body.notes || ""), key, nowIso());
      for (const [kind, offset] of [["BEFORE_24H", 24], ["BEFORE_3H", 3]] as const) {
        db.prepare("INSERT INTO reminders(id,booking_id,kind,scheduled_at) VALUES(?,?,?,?)").run(randomUUID(), id, kind, new Date(start.getTime() - offset * 3600_000).toISOString());
      }
      db.exec("COMMIT");
    } catch (error) {
      try { db.exec("ROLLBACK"); } catch {}
      if ((error as Error).message.includes("SLOT_CONFLICT")) return json(res, 409, { error: "Khung giờ vừa được người khác đặt. Vui lòng chọn giờ khác.", code: "SLOT_CONFLICT" });
      throw error;
    }
    event("booking_confirmed", user.id, getConversation(user.id).id, { booking_id: id, vehicle_id: vehicle.id, lead_time_ms: start.getTime() - Date.now() });
    return json(res, 201, { booking: db.prepare("SELECT * FROM bookings WHERE id=?").get(id), reminders: db.prepare("SELECT kind,scheduled_at,status FROM reminders WHERE booking_id=?").all(id) });
  }
  if (req.method === "GET" && url.pathname === "/api/employee/queue") {
    const user = requireRole(req, res, ["EMPLOYEE"]); if (!user) return;
    const queue = db.prepare(`SELECT h.*,c.customer_id,c.summary,c.facts_json,c.next_action,c.updated_at,u.full_name customer_name
      FROM handoffs h JOIN conversations c ON c.id=h.conversation_id JOIN users u ON u.id=c.customer_id
      WHERE h.status!='RESOLVED' ORDER BY CASE h.priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 ELSE 2 END,h.created_at`).all();
    return json(res, 200, { queue });
  }
  const convMatch = routeMatch(url.pathname, /^\/api\/employee\/conversations\/([^/]+)$/);
  if (req.method === "GET" && convMatch) {
    const user = requireRole(req, res, ["EMPLOYEE"]); if (!user) return;
    const conversation = db.prepare("SELECT * FROM conversations WHERE id=?").get(convMatch[1]);
    if (!conversation) return json(res, 404, { error: "Không tìm thấy hội thoại." });
    const messages = db.prepare("SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at").all(convMatch[1]);
    return json(res, 200, { conversation, messages });
  }
  const claimMatch = routeMatch(url.pathname, /^\/api\/employee\/handoffs\/([^/]+)\/claim$/);
  if (req.method === "POST" && claimMatch) {
    const user = requireRole(req, res, ["EMPLOYEE"]); if (!user) return;
    db.exec("BEGIN IMMEDIATE");
    const result = db.prepare("UPDATE handoffs SET status='CLAIMED',claimed_by=?,claimed_at=? WHERE id=? AND status='WAITING'").run(user.id, nowIso(), claimMatch[1]);
    if (!result.changes) { db.exec("ROLLBACK"); return json(res, 409, { error: "Ca đã được nhân viên khác nhận." }); }
    const handoff: any = db.prepare("SELECT * FROM handoffs WHERE id=?").get(claimMatch[1]);
    db.prepare("UPDATE conversations SET status='HUMAN_ACTIVE',assigned_employee_id=?,updated_at=? WHERE id=?").run(user.id, nowIso(), handoff.conversation_id);
    db.exec("COMMIT");
    event("handoff_claimed", user.id, handoff.conversation_id, { handoff_id: claimMatch[1] });
    return json(res, 200, { ok: true });
  }
  const replyMatch = routeMatch(url.pathname, /^\/api\/employee\/conversations\/([^/]+)\/messages$/);
  if (req.method === "POST" && replyMatch) {
    const user = requireRole(req, res, ["EMPLOYEE"]); if (!user) return;
    const conv: any = db.prepare("SELECT * FROM conversations WHERE id=?").get(replyMatch[1]);
    if (!conv || conv.assigned_employee_id !== user.id) return json(res, 403, { error: "Bạn phải nhận ca trước khi trả lời." });
    const body: any = await bodyJson(req); const content = String(body.content || "").trim();
    if (!content) return json(res, 400, { error: "Nội dung trống." });
    db.prepare("INSERT INTO messages(id,conversation_id,sender_role,content,created_at) VALUES(?,?,?,?,?)").run(randomUUID(), conv.id, "EMPLOYEE", content, nowIso());
    return json(res, 201, { ok: true });
  }
  if (req.method === "GET" && url.pathname === "/api/employee/bookings") {
    const user = requireRole(req, res, ["EMPLOYEE"]); if (!user) return;
    const bookings = db.prepare(`SELECT b.*,v.name vehicle_name,u.full_name consultant_name FROM bookings b JOIN vehicles v ON v.id=b.vehicle_id JOIN users u ON u.id=b.consultant_id ORDER BY b.slot_start`).all();
    return json(res, 200, { bookings });
  }
  const attendanceMatch = routeMatch(url.pathname, /^\/api\/employee\/bookings\/([^/]+)\/attendance$/);
  if (req.method === "PATCH" && attendanceMatch) {
    const user = requireRole(req, res, ["EMPLOYEE"]); if (!user) return;
    const body: any = await bodyJson(req); const value = String(body.attendance || "");
    if (!["ARRIVED", "NO_SHOW", "PENDING"].includes(value)) return json(res, 400, { error: "Trạng thái không hợp lệ." });
    db.prepare("UPDATE bookings SET attendance=? WHERE id=?").run(value, attendanceMatch[1]);
    event("booking_attendance_updated", user.id, null, { booking_id: attendanceMatch[1], attendance: value });
    return json(res, 200, { ok: true });
  }
  if (req.method === "GET" && url.pathname === "/api/employee/insights") {
    const user = requireRole(req, res, ["EMPLOYEE"]); if (!user) return;
    const clusters = db.prepare("SELECT * FROM question_clusters ORDER BY count DESC,updated_at DESC LIMIT 20").all();
    const metrics = db.prepare(`SELECT
      COUNT(*) responses,
      ROUND(AVG(latency_ms),0) avg_latency_ms,
      ROUND(100.0*AVG(CASE WHEN correct_feedback=1 THEN 1.0 WHEN correct_feedback=0 THEN 0.0 END),1) answer_accuracy_pct,
      ROUND(100.0*AVG(CASE WHEN route!='HANDOFF' THEN 1.0 ELSE 0.0 END),1) automation_pct
      FROM messages WHERE sender_role='AI'`).get();
    const bookingMetrics = db.prepare(`SELECT COUNT(*) bookings,
      ROUND(100.0*AVG(CASE WHEN attendance='ARRIVED' THEN 1.0 WHEN attendance='NO_SHOW' THEN 0.0 END),1) arrival_rate_pct FROM bookings`).get();
    const reminders = db.prepare("SELECT r.*,b.email,b.customer_name FROM reminders r JOIN bookings b ON b.id=r.booking_id ORDER BY r.scheduled_at LIMIT 20").all();
    return json(res, 200, { clusters, metrics: { ...(metrics as object), ...(bookingMetrics as object) }, reminders });
  }
  return json(res, 404, { error: "API không tồn tại." });
}

const mime: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" };
function staticFile(res: ServerResponse, pathname: string) {
  const dist = resolve(ROOT, "ui-demo", "dist");
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let file = resolve(dist, requested);
  if (!file.startsWith(dist) || !existsSync(file)) file = resolve(dist, "index.html");
  if (!existsSync(file)) return json(res, 503, { error: "Frontend chưa build. Chạy: npm install && npm run build" });
  res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}

export const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) await api(req, res, url); else staticFile(res, url.pathname);
  } catch (error) {
    const id = randomUUID();
    console.error(`[${id}]`, error instanceof Error ? error.message : error);
    json(res, (error as Error).message === "PAYLOAD_TOO_LARGE" ? 413 : 500, { error: "Lỗi hệ thống.", trace_id: id });
  }
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT || 8080);
  server.listen(port, () => {
    console.log(`AutoAdvisor MVP: http://localhost:${port}`);
    processDueReminders().catch(() => {});
    const timer = setInterval(() => processDueReminders().catch(() => {}), 60_000);
    timer.unref();
  });
}
