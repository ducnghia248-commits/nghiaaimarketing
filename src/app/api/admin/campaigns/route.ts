import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { HttpError, handle, ok, readJson } from "@/lib/server/http";
import { campaignInput } from "@/lib/server/campaign-schema";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireAdmin();
  const db = await getDb();
  return ok({ campaigns: await db.select().from(schema.campaigns).orderBy(desc(schema.campaigns.id)) });
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const c = campaignInput.parse(await readJson(req));
  const db = await getDb();
  const dup = await db.select().from(schema.campaigns).where(eq(schema.campaigns.code, c.code));
  if (dup.length) throw new HttpError(409, "Mã chiến dịch đã tồn tại.");
  const [row] = await db.insert(schema.campaigns).values(c).returning();
  await audit(admin, "create", "campaign", row.id, undefined, row);
  return ok({ campaign: row });
});
