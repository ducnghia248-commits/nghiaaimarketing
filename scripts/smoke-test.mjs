/**
 * Kiểm thử đầu-cuối qua API (server phải đang chạy):
 *   node scripts/smoke-test.mjs [http://localhost:3000]
 * Chơi trọn 3 game như một người chơi thật và kiểm tra điểm do máy chủ tính.
 */
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:3000";
let cookie = "";
const ok = (c, m) => {
  if (!c) throw new Error("FAIL: " + m);
  console.log("  ✓", m);
};

async function call(path, body, method) {
  const res = await fetch(BASE + path, {
    method: method || (body ? "POST" : "GET"),
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.getSetCookie?.() ?? [];
  for (const s of set) {
    const kv = s.split(";")[0];
    const name = kv.split("=")[0];
    cookie = [...cookie.split("; ").filter((c) => c && !c.startsWith(name + "=")), kv].join("; ");
  }
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}
const act = async (sessionId, action, extra = {}) => {
  const r = await call("/api/play/action", { sessionId, action, ...extra });
  if (r.status >= 400 && r.status !== 409) throw new Error(`FAIL: ${action} → HTTP ${r.status} ${JSON.stringify(r.data)}`);
  return r;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (a) => ((a % 360) + 360) % 360;

async function perfectStop() {
  console.log("PERFECT STOP");
  const s = (await call("/api/play/start", { gameId: "perfect-stop" })).data;
  ok(s.sessionId && s.levels.length === 3, "bắt đầu phiên, 3 vòng");
  let last;
  for (let i = 0; i < s.levels.length; i++) {
    const r = (await act(s.sessionId, "round")).data;
    const t0 = Date.now();
    // thời điểm kim tới đúng tâm mục tiêu (lần đầu tiên)
    const travel = norm((r.target - r.start) * r.dir);
    const needMs = (travel / r.speed) * 1000;
    await sleep(Math.max(0, needMs - (Date.now() - t0)) + 30);
    const res = (await act(s.sessionId, "stop", { round: i, elapsedMs: needMs })).data;
    ok(res.verdict === "perfect" && res.gained === r.points, `vòng ${i + 1}: dừng đúng tâm → PERFECT +${res.gained}`);
    last = res;
  }
  ok(last.finished && last.result.score === s.maxScore, `điểm tối đa ${last.result.score}/${s.maxScore}`);

  // chống gian lận: báo thời điểm nhấn "trong tương lai"
  const s2 = (await call("/api/play/start", { gameId: "perfect-stop" })).data;
  const r2 = (await act(s2.sessionId, "round")).data;
  const cheat = (await act(s2.sessionId, "stop", { round: 0, elapsedMs: 5000 })).data;
  ok(cheat.verdict === "timeout" && cheat.gained === 0, "từ chối thời điểm nhấn không hợp lệ (gian lận) → 0 điểm");
  void r2;
}

async function quiz() {
  console.log("FPT SMART QUIZ");
  const s = (await call("/api/play/start", { gameId: "quiz" })).data;
  ok(s.total >= 5 && s.total <= 10, `bắt đầu phiên, ${s.total} câu`);
  let res;
  for (let i = 0; i < s.total; i++) {
    const q = (await act(s.sessionId, "next")).data;
    ok(q.question.options.length >= 2 && !("correctIndex" in q.question), `câu ${i + 1}: không lộ đáp án`);
    res = (await act(s.sessionId, "answer", { index: i, choice: 0 })).data;
    if (!res.correct) {
      ok(typeof res.correctChoice === "number" && res.gained === 0, `câu ${i + 1}: sai → 0đ, trả đáp án đúng + giải thích`);
    } else ok(res.gained > 0, `câu ${i + 1}: đúng → +${res.gained}`);
  }
  ok(res.finished && res.result.score === res.score, `kết thúc: ${res.result.score}/${res.result.maxScore} điểm`);
  const dup = await act(s.sessionId, "answer", { index: 0, choice: 0 });
  ok(dup.status === 409, "không thể trả lời lại sau khi kết thúc");
}

async function findDiff() {
  console.log("FIND THE DIFFERENCE");
  const s = (await call("/api/play/start", { gameId: "find-diff" })).data;
  ok(s.puzzle && s.puzzle.total >= 1 && !("regions" in s.puzzle), `bắt đầu phiên, ${s.puzzle.total} điểm khác (không lộ tọa độ)`);
  const miss = (await act(s.sessionId, "click", { x: 0.001, y: 0.999 })).data;
  ok(miss.hit === null && miss.wrong === 1, "click sai được ghi nhận");
  const hint = (await act(s.sessionId, "hint")).data;
  ok(hint.hint && hint.hintsUsed === 1, "gợi ý hoạt động");
  // bộ hình mẫu: biết trước tọa độ từ manifest → chạm đúng tâm từng vùng như người chơi thật
  const manifest = JSON.parse(fs.readFileSync(new URL("../src/lib/db/seed-puzzles.json", import.meta.url), "utf8"));
  const known = manifest.find((m) => m.leftUrl === s.puzzle.leftUrl);
  let last;
  if (known) {
    const again = (await act(s.sessionId, "click", { x: known.regions[0].x, y: known.regions[0].y })).data;
    ok(again.hit?.id === known.regions[0].id, "chạm đúng tâm vùng → tìm thấy");
    const dup = (await act(s.sessionId, "click", { x: known.regions[0].x, y: known.regions[0].y })).data;
    ok(!dup.hit && dup.already && dup.wrong === 1, "chạm lại điểm đã tìm không bị phạt");
    for (const r of known.regions.slice(1)) last = (await act(s.sessionId, "click", { x: r.x, y: r.y + 0.01 })).data;
    ok(last.finished && last.result.details.found === known.regions.length, `tìm đủ ${known.regions.length}/${known.regions.length} điểm`);
  } else {
    last = (await act(s.sessionId, "finish")).data;
    ok(last.finished, "kết thúc phiên (bộ hình tùy chỉnh)");
  }
  ok(last.result.score > 0 && last.result.score <= last.result.maxScore, `điểm hợp lệ ${last.result.score}/${last.result.maxScore} (có thưởng thời gian ${last.result.details.timeBonus})`);
}

async function register() {
  console.log("ĐĂNG KÝ TRƯỚC KHI CHƠI");
  const blocked = await call("/api/play/start", { gameId: "quiz" });
  ok(blocked.status === 428, "chưa đăng ký → không được bắt đầu game");
  const bad = await call("/api/register", { fullName: "Smoke Tester", phone: "123", consent: true });
  ok(bad.status === 400, "từ chối SĐT sai");
  const noConsent = await call("/api/register", { fullName: "Smoke Tester", phone: "0912345678", consent: false });
  ok(noConsent.status === 400, "bắt buộc tick đồng ý");
  const r = await call("/api/register", { fullName: "Nguyễn Smoke Tester", phone: "0912 345 678", province: "TP. Hà Nội", consent: true });
  ok(r.status === 200 && r.data.player.registered && r.data.player.nickname === "Tester ***678", `đăng ký thành công, tên công khai "${r.data.player.nickname}"`);
  ok(r.data.player.phoneMasked === "09xxxxx678", "SĐT trả về dạng che");
}

(async () => {
  await register();
  await perfectStop();
  await quiz();
  await findDiff();
  const me = (await call("/api/player")).data.player;
  ok(me.completedGames.length === 3 && me.badges.includes("nha-vo-dich"), `hoàn thành 3 game → huy hiệu: ${me.badges.join(", ")}`);
  const nick = await call("/api/player", { nickname: "Smoke Tester" }, "PATCH");
  ok(nick.status === 200, "đặt tên hiển thị");
  const lb = (await call("/api/leaderboard?period=day")).data;
  ok(lb.entries.some((e) => e.isMe && e.nickname === "Smoke Tester"), "xuất hiện trên bảng xếp hạng (chỉ nickname)");
  ok(!JSON.stringify(lb).includes("0912345678") && !JSON.stringify(lb).includes("Nguyễn"), "bảng xếp hạng không lộ họ tên / SĐT");
  const lead = await call("/api/leads", { consent: false, province: "TP. Hà Nội", products: ["wifi", "camera"], need: "consult" });
  ok(lead.status === 200 && lead.data.updated, "người đã đăng ký gửi tư vấn → cập nhật vào hồ sơ khách hàng sẵn có");
  const saved = cookie;
  cookie = ""; // khách mới chưa đăng ký
  const anon = await call("/api/leads", { consent: false, province: "TP. Hà Nội", products: ["wifi"], need: "explore", fullName: "X", phone: "0987654321" });
  ok(anon.status === 200, "khách chưa đăng ký gửi nhu cầu ẩn danh");
  const bad = await call("/api/leads", { consent: true, province: "TP. Hà Nội", products: ["wifi"], need: "consult", fullName: "Nguyễn Văn A", phone: "12345" });
  ok(bad.status === 400, "từ chối số điện thoại sai định dạng");
  cookie = saved;
  const adm = await call("/api/admin/stats");
  ok(adm.status === 401, "API quản trị yêu cầu đăng nhập");
  console.log("\nTẤT CẢ KIỂM THỬ ĐẠT ✔");
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
