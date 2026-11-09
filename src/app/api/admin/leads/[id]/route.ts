import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { HttpError, handle, ok, readJson } from "@/lib/server/http";

const body = z.object({ status: z.enum(["new", "contacted", "done"]) });

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin("admin");
  const id = Number((await params).id);
  const { status } = body.parse(await readJson(req));
  const db = await getDb();
  const [before] = await db.select({ status: schema.leads.status }).from(schema.leads).where(eq(schema.leads.id, id));
  if (!before) throw new HttpError(404, "Không tìm thấy khách hàng.");
  await db.update(schema.leads).set({ status }).where(eq(schema.leads.id, id));
  await audit(admin, "update", "lead-status", id, before, { status });
  return ok({ ok: true });
});
