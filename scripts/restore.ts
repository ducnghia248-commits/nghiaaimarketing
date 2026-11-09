/**
 * Khôi phục CSDL từ file sao lưu JSON (GHI ĐÈ toàn bộ dữ liệu hiện tại).
 *   npm run db:restore -- backups/playwin-backup-xxx.json
 * Lưu ý (PGlite): dừng server dev trước khi chạy.
 */
import fs from "node:fs";
import { getDb } from "../src/lib/db";
import { importAll, type Backup } from "../src/lib/server/backup";

async function main() {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) {
    console.error("Cách dùng: npm run db:restore -- <đường-dẫn-file-sao-lưu.json>");
    process.exit(1);
  }
  const backup = JSON.parse(fs.readFileSync(file, "utf8")) as Backup;
  const db = await getDb();
  await importAll(db, backup);
  console.log(`Đã khôi phục từ ${file}`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
