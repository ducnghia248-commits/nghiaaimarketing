/**
 * Sao lưu CSDL ra file JSON trong thư mục backups/.
 *   npm run db:backup
 * Lưu ý (PGlite): dừng server dev trước khi chạy, vì PGlite chỉ cho một tiến trình mở dữ liệu.
 * Production (PostgreSQL): có thể dùng thêm pg_dump — xem README.
 */
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/lib/db";
import { exportAll } from "../src/lib/server/backup";

async function main() {
  const db = await getDb();
  const backup = await exportAll(db);
  const dir = path.join(process.cwd(), "backups");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `playwin-backup-${backup.createdAt.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(backup));
  const counts = Object.entries(backup.tables).map(([t, r]) => `${t}=${r.length}`).join(", ");
  console.log(`Đã sao lưu → ${file}\n${counts}`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
