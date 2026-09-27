import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";

const port = 18080 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const dbPath = join(tmpdir(), `autoadvisor-test-${process.pid}.db`);
let child;
let customerToken = "";
let employeeToken = "";

async function request(path, options = {}) {
  const response = await fetch(base + path, options);
  const data = await response.json();
  return { status: response.status, data };
}
function headers(token) { return { "content-type": "application/json", authorization: `Bearer ${token}` }; }

before(async () => {
  child = spawn(process.execPath, ["backend/server.ts"], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), DB_PATH: dbPath, MODEL_PROVIDER: "local" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 50; i++) { try { const health = await request("/api/health"); if (health.status === 200) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  const customer = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "customer", password: "demo123" }) });
  const employee = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "employee", password: "demo123" }) });
  customerToken = customer.data.token; employeeToken = employee.data.token;
});

after(() => { child?.kill(); for (const suffix of ["", "-shm", "-wal"]) { try { rmSync(dbPath + suffix); } catch {} } });

test("RBAC tách màn khách và nhân viên", async () => {
  const denied = await request("/api/employee/queue", { headers: headers(customerToken) }); assert.equal(denied.status, 403);
  const allowed = await request("/api/employee/queue", { headers: headers(employeeToken) }); assert.equal(allowed.status, 200);
});

test("năm câu tự do đi đúng năm route", async () => {
  const cases = [["CR-V giá bao nhiêu?", "KNOWLEDGE_ANSWER"], ["Tôi muốn đặt lịch lái thử", "BOOKING"], ["Câu trả lời vừa rồi sai", "CORRECTION"], ["Hướng dẫn hồ sơ vay trả góp", "GUIDE_ONLY"], ["Cho tôi gặp tư vấn viên để thương lượng", "HANDOFF"]];
  for (const [content, route] of cases) { const result = await request("/api/chat/messages", { method: "POST", headers: headers(customerToken), body: JSON.stringify({ content }) }); assert.equal(result.status, 200); assert.equal(result.data.decision.route, route); }
});

test("booking tạo đúng hai reminder và chống trùng slot", async () => {
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const availability = await request(`/api/bookings/availability?vehicle_id=veh-crv&date=${date}`, { headers: headers(customerToken) });
  const slot = availability.data.slots.find(x => x.available).slot_start;
  const payload = { vehicle_id: "veh-crv", slot_start: slot, customer_name: "Khách Test", phone: "0912345678", email: "test@example.com", idempotency_key: "test-booking-1" };
  const booked = await request("/api/bookings", { method: "POST", headers: headers(customerToken), body: JSON.stringify(payload) }); assert.equal(booked.status, 201); assert.equal(booked.data.reminders.length, 2);
  const replay = await request("/api/bookings", { method: "POST", headers: headers(customerToken), body: JSON.stringify(payload) }); assert.equal(replay.status, 200); assert.equal(replay.data.idempotent_replay, true);
  const conflict = await request("/api/bookings", { method: "POST", headers: headers(customerToken), body: JSON.stringify({ ...payload, idempotency_key: "test-booking-2" }) }); assert.equal(conflict.status, 409);
});

test("handoff giữ context, nhân viên claim rồi mới trả lời", async () => {
  const queue = await request("/api/employee/queue", { headers: headers(employeeToken) }); assert.ok(queue.data.queue.length > 0);
  const item = queue.data.queue[0]; assert.ok(item.summary.includes("Khách đã hỏi"));
  const beforeClaim = await request(`/api/employee/conversations/${item.conversation_id}/messages`, { method: "POST", headers: headers(employeeToken), body: JSON.stringify({ content: "Xin chào" }) }); assert.equal(beforeClaim.status, 403);
  const claim = await request(`/api/employee/handoffs/${item.id}/claim`, { method: "POST", headers: headers(employeeToken), body: "{}" }); assert.equal(claim.status, 200);
  const reply = await request(`/api/employee/conversations/${item.conversation_id}/messages`, { method: "POST", headers: headers(employeeToken), body: JSON.stringify({ content: "Mình đã nắm được yêu cầu và sẽ hỗ trợ ngay." }) }); assert.equal(reply.status, 201);
});
