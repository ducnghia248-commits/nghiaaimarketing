/**
 * Sinh bộ tranh mẫu cho FIND THE DIFFERENCE (SVG vector, sắc nét mọi màn hình, dung lượng nhỏ).
 * Mỗi cảnh được vẽ bằng cùng một hàm với variant "a" / "b" nên tọa độ vùng khác biệt luôn chính xác.
 *   node scripts/gen-puzzles.mjs
 * Kết quả: public/puzzles/*.svg + src/lib/db/seed-puzzles.json
 * Đây là tranh minh họa placeholder — Marketing có thể thay bằng ảnh thật trong Admin → Tìm điểm khác biệt.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const W = 800, H = 600;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "puzzles");
fs.mkdirSync(outDir, { recursive: true });

const svg = (body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<defs>${defs}<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0b1020" flood-opacity=".25"/></filter></defs>` +
  body + `</svg>`;

const reg = (id, px, py, pr, label) => ({ id, x: +(px / W).toFixed(4), y: +(py / H).toFixed(4), r: +(pr / W).toFixed(4), label });

// ---------------------------------------------------------------- Cảnh 1: Phòng khách WiFi
function livingRoom(v) {
  const b = v === "b";
  const defs = `
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf2ff"/><stop offset="1" stop-color="#d3e3ff"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ec1ff"/><stop offset="1" stop-color="#d4eeff"/></linearGradient>
  <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a5cd8"/><stop offset="1" stop-color="#062a6b"/></linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c99b6b"/><stop offset="1" stop-color="#a87b4f"/></linearGradient>`;
  const hand = (deg, len, w, c) => `<line x1="560" y1="100" x2="${560 + len * Math.sin((deg * Math.PI) / 180)}" y2="${100 - len * Math.cos((deg * Math.PI) / 180)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    return `<line x1="${560 + 30 * Math.sin(a)}" y1="${100 - 30 * Math.cos(a)}" x2="${560 + 35 * Math.sin(a)}" y2="${100 - 35 * Math.cos(a)}" stroke="#334155" stroke-width="2"/>`;
  }).join("");
  const planks = Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${460 + i * 20}" x2="800" y2="${460 + i * 20}" stroke="#9c7046" stroke-opacity=".35"/>`).join("");
  const antenna = (x, rot) => `<rect x="${x - 3.5}" y="128" width="7" height="56" rx="3.5" fill="#1f2a44" transform="rotate(${rot} ${x} 184)"/>`;
  const body = `
  <rect width="800" height="440" fill="url(#wall)"/>
  <rect y="440" width="800" height="160" fill="url(#floor)"/>${planks}
  <rect y="430" width="800" height="12" fill="#b6c6de"/>
  <!-- cửa sổ -->
  <rect x="50" y="60" width="200" height="160" rx="8" fill="#fff" stroke="#9fb3d1" stroke-width="3" filter="url(#sh)"/>
  <rect x="60" y="70" width="180" height="140" fill="url(#sky)"/>
  ${b
    ? `<g fill="#fff"><ellipse cx="200" cy="108" rx="26" ry="14"/><ellipse cx="185" cy="100" rx="14" ry="12"/><ellipse cx="212" cy="98" rx="12" ry="10"/></g>`
    : `<circle cx="200" cy="105" r="20" fill="#ffd23f"/><circle cx="200" cy="105" r="28" fill="#ffd23f" opacity=".25"/>`}
  <ellipse cx="100" cy="180" rx="40" ry="10" fill="#fff" opacity=".8"/>
  <line x1="150" y1="70" x2="150" y2="210" stroke="#fff" stroke-width="5"/><line x1="60" y1="140" x2="240" y2="140" stroke="#fff" stroke-width="5"/>
  <rect x="34" y="48" width="26" height="190" rx="6" fill="#f37021" opacity=".9"/><rect x="240" y="48" width="26" height="190" rx="6" fill="#f37021" opacity=".9"/>
  <!-- tranh treo tường -->
  <rect x="300" y="70" width="150" height="105" rx="4" fill="#6b4f3a" filter="url(#sh)"/>
  <rect x="310" y="80" width="130" height="85" fill="#fdf6e3"/>
  <polygon points="310,165 355,108 400,165" fill="#2e7d32"/><polygon points="360,165 405,120 440,165" fill="#43a047"/>
  ${b ? "" : `<circle cx="420" cy="98" r="10" fill="#f37021"/>`}
  <!-- đồng hồ -->
  <circle cx="560" cy="100" r="40" fill="#fff" stroke="#0a5cd8" stroke-width="6" filter="url(#sh)"/>${ticks}
  ${b ? hand(90, 18, 5, "#0b1020") + hand(0, 27, 3, "#0b1020") : hand(-60, 18, 5, "#0b1020") + hand(60, 27, 3, "#0b1020")}
  <circle cx="560" cy="100" r="4" fill="#f37021"/>
  <!-- kệ + router WiFi -->
  <rect x="500" y="215" width="270" height="12" rx="3" fill="#8d6e63" filter="url(#sh)"/>
  <rect x="512" y="171" width="14" height="44" fill="#ef4444"/><rect x="528" y="178" width="12" height="37" fill="#22c55e"/><rect x="542" y="166" width="16" height="49" fill="#0a5cd8"/>
  <g fill="none" stroke="#22d3ee" stroke-linecap="round"><path d="M640 118 Q660 104 680 118" stroke-width="4"/><path d="M628 106 Q660 82 692 106" stroke-width="4" opacity=".7"/><path d="M616 94 Q660 60 704 94" stroke-width="4" opacity=".45"/></g>
  ${antenna(615, -12)}${antenna(660, 0)}${b ? "" : antenna(705, 12)}
  <rect x="598" y="178" width="124" height="37" rx="11" fill="#f5f7fb" stroke="#c5d0e6" stroke-width="2" filter="url(#sh)"/>
  <rect x="598" y="202" width="124" height="6" fill="#0a5cd8"/>
  <circle cx="618" cy="191" r="3" fill="#22c55e"/><circle cx="630" cy="191" r="3" fill="#22c55e"/><circle cx="642" cy="191" r="3" fill="#22c55e"/>
  <text x="702" y="195" font-family="Arial" font-weight="700" font-size="10" fill="#0a5cd8" text-anchor="middle">FPT</text>
  <!-- TV -->
  <rect x="95" y="215" width="280" height="150" rx="8" fill="#111827" filter="url(#sh)"/>
  <rect x="103" y="223" width="264" height="134" rx="3" fill="url(#scr)"/>
  <circle cx="235" cy="276" r="22" fill="#fff" opacity=".15"/><polygon points="228,264 228,288 248,276" fill="#fff"/>
  <text x="235" y="328" font-family="Arial" font-weight="700" font-size="18" fill="#fff" text-anchor="middle">FPT Play</text>
  <rect x="70" y="370" width="330" height="62" rx="6" fill="#5d4037" filter="url(#sh)"/>
  <rect x="85" y="384" width="140" height="34" rx="4" fill="#6d4c41"/><rect x="245" y="384" width="140" height="34" rx="4" fill="#6d4c41"/>
  <!-- cây -->
  <ellipse cx="34" cy="350" rx="14" ry="34" fill="#2e7d32" transform="rotate(-20 34 350)"/><ellipse cx="46" cy="345" rx="14" ry="36" fill="#43a047" transform="rotate(15 46 345)"/>
  <polygon points="18,385 62,385 56,438 24,438" fill="#f37021"/>
  <!-- sofa -->
  <ellipse cx="420" cy="525" rx="270" ry="45" fill="#e0e7ff" opacity=".75"/>
  <rect x="440" y="295" width="320" height="95" rx="22" fill="#355c9a" filter="url(#sh)"/>
  <rect x="470" y="310" width="72" height="62" rx="14" fill="${b ? "#22c55e" : "#f37021"}"/>
  <rect x="660" y="310" width="72" height="62" rx="14" fill="#ffd23f"/>
  <rect x="428" y="368" width="344" height="62" rx="16" fill="#2c4f86"/>
  <rect x="418" y="335" width="34" height="95" rx="14" fill="#274677"/><rect x="748" y="335" width="34" height="95" rx="14" fill="#274677"/>
  <rect x="445" y="428" width="12" height="18" fill="#3e2723"/><rect x="745" y="428" width="12" height="18" fill="#3e2723"/>`;
  return svg(body, defs);
}
const livingRegions = [
  reg("sun", 200, 104, 36, "Mặt trời ngoài cửa sổ"),
  reg("painting", 420, 98, 24, "Mặt trời trong bức tranh"),
  reg("clock", 560, 100, 44, "Kim đồng hồ"),
  reg("antenna", 711, 152, 30, "Ăng-ten Router WiFi"),
  reg("cushion", 506, 341, 44, "Màu gối tựa"),
];

// ---------------------------------------------------------------- Cảnh 2: Ngôi nhà an toàn với FPT Camera
function safeHome(v) {
  const b = v === "b";
  const defs = `
  <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#e3f5ff"/></linearGradient>
  <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#74c776"/><stop offset="1" stop-color="#4f9e55"/></linearGradient>`;
  const body = `
  <rect width="800" height="430" fill="url(#sky2)"/>
  <circle cx="710" cy="80" r="34" fill="#ffd23f"/><circle cx="710" cy="80" r="48" fill="#ffd23f" opacity=".25"/>
  <g fill="#fff"><ellipse cx="150" cy="85" rx="50" ry="18"/><ellipse cx="128" cy="72" rx="26" ry="18"/><ellipse cx="168" cy="70" rx="22" ry="16"/></g>
  <g fill="#fff" opacity=".85"><ellipse cx="470" cy="60" rx="38" ry="12"/><ellipse cx="455" cy="51" rx="18" ry="12"/></g>
  <rect y="420" width="800" height="180" fill="url(#grass)"/>
  <polygon points="370,500 450,500 500,600 320,600" fill="#d7ccc8"/>
  <!-- cây -->
  <rect x="95" y="330" width="26" height="100" rx="4" fill="#795548"/>
  <circle cx="70" cy="330" r="40" fill="#2e7d32"/><circle cx="148" cy="330" r="40" fill="#2e7d32"/><circle cx="108" cy="295" r="58" fill="#388e3c"/>
  <circle cx="90" cy="290" r="7" fill="#ef4444"/><circle cx="128" cy="318" r="7" fill="#ef4444"/><circle cx="104" cy="335" r="7" fill="#ef4444"/>
  ${b ? `<g><ellipse cx="152" cy="252" rx="14" ry="10" fill="#1565c0"/><circle cx="164" cy="244" r="7" fill="#1565c0"/><polygon points="170,243 180,246 170,249" fill="#f37021"/><circle cx="166" cy="242" r="1.8" fill="#fff"/><path d="M140 250 L130 244 L136 256 Z" fill="#0d47a1"/></g>` : ""}
  <!-- ngôi nhà -->
  <rect x="520" y="140" width="30" height="70" fill="#8d6e63"/>
  <rect x="220" y="230" width="380" height="270" fill="#fff3e0" stroke="#e0c9a6" stroke-width="3" filter="url(#sh)"/>
  <polygon points="198,238 410,108 622,238" fill="#0a5cd8" filter="url(#sh)"/>
  <polygon points="236,232 410,126 584,232" fill="#1e6ff0"/>
  <rect x="250" y="270" width="100" height="80" rx="4" fill="${b ? "#ffe082" : "#bfe3ff"}" stroke="#fff" stroke-width="6"/>
  <line x1="300" y1="270" x2="300" y2="350" stroke="#fff" stroke-width="5"/><line x1="250" y1="310" x2="350" y2="310" stroke="#fff" stroke-width="5"/>
  <rect x="470" y="270" width="100" height="80" rx="4" fill="#bfe3ff" stroke="#fff" stroke-width="6"/>
  <line x1="520" y1="270" x2="520" y2="350" stroke="#fff" stroke-width="5"/><line x1="470" y1="310" x2="570" y2="310" stroke="#fff" stroke-width="5"/>
  <rect x="370" y="360" width="80" height="140" rx="6" fill="#8d5a3b"/>
  <rect x="380" y="400" width="60" height="40" rx="4" fill="#7a4a2f"/><rect x="380" y="448" width="60" height="40" rx="4" fill="#7a4a2f"/>
  <circle cx="438" cy="432" r="5" fill="#ffd23f"/>
  <rect x="390" y="370" width="40" height="22" rx="4" fill="#fff"/>
  <text x="410" y="387" font-family="Arial" font-weight="700" font-size="15" fill="#0a5cd8" text-anchor="middle">${b ? "21" : "12"}</text>
  <rect x="456" y="404" width="15" height="28" rx="3" fill="#1f2a44"/><circle cx="463.5" cy="411" r="2.5" fill="#22d3ee"/>
  <!-- FPT Camera -->
  <polygon points="552,272 470,420 610,420" fill="#22d3ee" opacity=".12"/>
  <rect x="580" y="244" width="8" height="22" fill="#607d8b"/>
  <rect x="546" y="257" width="46" height="24" rx="11" fill="${b ? "#1f2a44" : "#ffffff"}" stroke="#90a4ae" stroke-width="2" filter="url(#sh)"/>
  <circle cx="555" cy="269" r="8" fill="#0a5cd8"/><circle cx="555" cy="269" r="3.5" fill="#0b1020"/><circle cx="584" cy="263" r="2.5" fill="#22c55e"/>
  <!-- bụi cây -->
  <g fill="#43a047"><ellipse cx="260" cy="500" rx="45" ry="22"/><ellipse cx="330" cy="505" rx="35" ry="18"/><ellipse cx="500" cy="505" rx="35" ry="18"/><ellipse cx="565" cy="500" rx="45" ry="22"/></g>
  <!-- hộp thư -->
  <rect x="670" y="430" width="10" height="75" fill="#6d4c41"/>
  <rect x="645" y="404" width="60" height="32" rx="12" fill="#0a5cd8" filter="url(#sh)"/>
  ${b
    ? `<rect x="703" y="420" width="30" height="6" rx="2" fill="#e53935"/>`
    : `<rect x="703" y="378" width="6" height="34" rx="2" fill="#e53935"/><rect x="709" y="378" width="18" height="11" fill="#e53935"/>`}`;
  return svg(body, defs);
}
const homeRegions = [
  reg("door-number", 410, 381, 30, "Số nhà"),
  reg("camera", 568, 268, 36, "Màu FPT Camera"),
  reg("window", 300, 310, 52, "Đèn trong cửa sổ"),
  reg("bird", 155, 250, 32, "Chú chim trên cây"),
  reg("mailbox", 714, 400, 34, "Cờ hộp thư"),
];

// ---------------------------------------------------------------- Cảnh 3: Góc giải trí FPT Play
function entertainment(v) {
  const b = v === "b";
  const defs = `
  <linearGradient id="wall3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#3730a3"/></linearGradient>
  <linearGradient id="scr3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a5cd8"/><stop offset="1" stop-color="#0b1f4d"/></linearGradient>
  <radialGradient id="glow3"><stop offset="0" stop-color="#fff59d" stop-opacity=".55"/><stop offset="1" stop-color="#fff59d" stop-opacity="0"/></radialGradient>`;
  const tiles = [b ? ["#f37021", "#22c55e", "#a855f7"] : ["#f37021", "#22d3ee", "#a855f7"]][0]
    .map((c, i) => {
      const x = 190 + i * 130;
      return `<rect x="${x}" y="180" width="115" height="90" rx="8" fill="${c}"/><polygon points="${x + 50},212 ${x + 50},238 ${x + 72},225" fill="#fff" opacity=".9"/>`;
    })
    .join("");
  const body = `
  <rect width="800" height="455" fill="url(#wall3)"/>
  <rect y="450" width="800" height="150" fill="#2a2340"/>
  <ellipse cx="400" cy="540" rx="320" ry="45" fill="#4c1d95" opacity=".6"/>
  <text x="80" y="70" font-family="Arial" font-weight="900" font-size="26" fill="#22d3ee" opacity=".9">GAME ON</text>
  <!-- đèn trần -->
  <line x1="650" y1="0" x2="650" y2="42" stroke="#94a3b8" stroke-width="3"/>
  ${b ? "" : `<circle cx="650" cy="70" r="70" fill="url(#glow3)"/>`}
  <polygon points="628,42 672,42 686,64 614,64" fill="#f37021"/>
  <circle cx="650" cy="70" r="10" fill="${b ? "#64748b" : "#fff59d"}"/>
  <!-- TV -->
  <rect x="160" y="80" width="420" height="240" rx="12" fill="#0b1020" filter="url(#sh)"/>
  <rect x="170" y="90" width="400" height="220" rx="4" fill="url(#scr3)"/>
  <rect x="190" y="108" width="22" height="22" rx="5" fill="#f37021"/>
  <text x="222" y="126" font-family="Arial" font-weight="700" font-size="20" fill="#fff">FPT Play</text>
  <rect x="190" y="145" width="160" height="10" rx="5" fill="#fff" opacity=".35"/>
  ${tiles}
  <rect x="230" y="345" width="280" height="22" rx="11" fill="#111827"/>
  <g fill="#334155">${Array.from({ length: 12 }, (_, i) => `<circle cx="${250 + i * 22}" cy="356" r="3"/>`).join("")}</g>
  <rect x="150" y="380" width="440" height="62" rx="8" fill="#3b2f63" filter="url(#sh)"/>
  <rect x="165" y="394" width="130" height="34" rx="4" fill="#4c3d7a"/><rect x="445" y="394" width="130" height="34" rx="4" fill="#4c3d7a"/>
  <!-- loa cột -->
  ${b ? "" : `<rect x="660" y="250" width="60" height="200" rx="12" fill="#111827" filter="url(#sh)"/><circle cx="690" cy="295" r="18" fill="#334155"/><circle cx="690" cy="295" r="7" fill="#0b1020"/><circle cx="690" cy="375" r="24" fill="#334155"/><circle cx="690" cy="375" r="9" fill="#0b1020"/>`}
  <!-- cây -->
  <ellipse cx="70" cy="380" rx="16" ry="40" fill="#15803d" transform="rotate(-18 70 380)"/><ellipse cx="88" cy="372" rx="16" ry="44" fill="#16a34a" transform="rotate(14 88 372)"/>
  <polygon points="52,420 106,420 98,470 60,470" fill="#f37021"/>
  <!-- bàn -->
  <rect x="240" y="482" width="320" height="22" rx="11" fill="#a16207" filter="url(#sh)"/>
  <rect x="265" y="500" width="10" height="45" fill="#78350f"/><rect x="525" y="500" width="10" height="45" fill="#78350f"/>
  <polygon points="282,438 332,438 324,484 290,484" fill="#fff"/>
  <polygon points="290,438 300,438 302,484 296,484" fill="#ef4444"/><polygon points="312,438 322,438 318,484 312,484" fill="#ef4444"/>
  <g fill="#fef3c7"><circle cx="292" cy="434" r="8"/><circle cx="306" cy="428" r="9"/><circle cx="320" cy="434" r="8"/><circle cx="300" cy="438" r="6"/></g>
  ${b ? "" : `<rect x="398" y="470" width="54" height="13" rx="6" fill="#1f2937"/><circle cx="410" cy="476.5" r="3" fill="#ef4444"/><circle cx="424" cy="476.5" r="2.5" fill="#94a3b8"/><circle cx="436" cy="476.5" r="2.5" fill="#94a3b8"/>`}
  <path d="M482 470 q8 -14 23 -12 q15 -2 23 12 q6 14 -6 15 q-6 0 -10 -6 h-14 q-4 6 -10 6 q-12 -1 -6 -15z" fill="${b ? "#f37021" : "#0a5cd8"}"/>
  <circle cx="496" cy="469" r="3" fill="#fff"/><circle cx="516" cy="466" r="2.5" fill="#fff"/><circle cx="520" cy="472" r="2.5" fill="#fff"/>`;
  return svg(body, defs);
}
const funRegions = [
  reg("lamp", 650, 62, 40, "Đèn trần"),
  reg("tile", 377, 225, 52, "Màu ô phim giữa"),
  reg("speaker", 690, 350, 70, "Loa cột"),
  reg("remote", 425, 476, 34, "Điều khiển TV"),
  reg("gamepad", 505, 470, 34, "Màu tay cầm game"),
];

const scenes = [
  { slug: "living-room", title: "Phòng khách có Router WiFi FPT", theme: "WiFi", fn: livingRoom, regions: livingRegions },
  { slug: "safe-home", title: "Ngôi nhà an toàn với FPT Camera", theme: "FPT Camera", fn: safeHome, regions: homeRegions },
  { slug: "entertainment", title: "Góc giải trí cùng FPT Play", theme: "FPT Play", fn: entertainment, regions: funRegions },
];

const manifest = [];
for (const s of scenes) {
  for (const v of ["a", "b"]) fs.writeFileSync(path.join(outDir, `${s.slug}-${v}.svg`), s.fn(v));
  manifest.push({ title: s.title, theme: s.theme, leftUrl: `/puzzles/${s.slug}-a.svg`, rightUrl: `/puzzles/${s.slug}-b.svg`, width: W, height: H, regions: s.regions });
}
fs.writeFileSync(path.join(root, "src", "lib", "db", "seed-puzzles.json"), JSON.stringify(manifest, null, 2));
console.log(`Generated ${scenes.length} puzzles → ${outDir}`);
