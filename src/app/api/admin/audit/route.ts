import { desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireAdmin("admin");
  const db = await getDb();
  return ok({ logs: await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.id)).limit(500) });
});
