import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { handle, ok, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const branding = z.object({
  logoMediaId: z.number().int().positive().nullable(),
  heroModelMediaId: z.number().int().positive().nullable(),
});

export const GET = handle(async () => {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "branding"));
  return ok({ branding: { logoMediaId: null, heroModelMediaId: null, ...((row?.value as object) ?? {}) } });
});

export const PUT = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const value = branding.parse(await readJson(req));
  const db = await getDb();
  const [before] = await db.select().from(schema.settings).where(eq(schema.settings.key, "branding"));
  await db
    .insert(schema.settings)
    .values({ key: "branding", value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
  await audit(admin, "update", "settings", "branding", before?.value, value);
  return ok({ branding: value });
});
