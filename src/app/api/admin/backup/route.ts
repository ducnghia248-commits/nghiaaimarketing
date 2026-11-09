import { getDb } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { exportAll } from "@/lib/server/backup";
import { handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Tải bản sao lưu toàn bộ CSDL (JSON). Chỉ admin. */
export const GET = handle(async () => {
  const admin = await requireAdmin("admin");
  const db = await getDb();
  const backup = await exportAll(db);
  await audit(admin, "backup", "database", null);
  const name = `playwin-backup-${backup.createdAt.replace(/[:.]/g, "-")}.json`;
  return new Response(JSON.stringify(backup), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
});
