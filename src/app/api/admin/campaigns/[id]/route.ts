import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { HttpError, handle, ok, readJson } from "@/lib/server/http";
import { campaignInput } from "@/lib/server/campaign-schema";

type P = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, { params }: P) => {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  const c = campaignInput.parse(await readJson(req));
  const db = await getDb();
  const [before] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id));
  if (!before) throw new HttpError(404, "Không tìm thấy chiến dịch.");
  const dup = await db.select().from(schema.campaigns).where(and(eq(schema.campaigns.code, c.code), ne(schema.campaigns.id, id)));
  if (dup.length) throw new HttpError(409, "Mã chiến dịch đã tồn tại.");
  const [after] = await db.update(schema.campaigns).set(c).where(eq(schema.campaigns.id, id)).returning();
  await audit(admin, "update", "campaign", id, before, after);
  return ok({ campaign: after });
});

export const DELETE = handle(async (_req: Request, { params }: P) => {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  const db = await getDb();
  const [before] = await db.delete(schema.campaigns).where(eq(schema.campaigns.id, id)).returning();
  if (!before) throw new HttpError(404, "Không tìm thấy chiến dịch.");
  await audit(admin, "delete", "campaign", id, before);
  return ok({ ok: true });
});
