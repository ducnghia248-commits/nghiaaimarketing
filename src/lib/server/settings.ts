import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";

export type Branding = { logoUrl: string | null; heroModelUrl: string | null };

export async function getBranding(): Promise<Branding> {
  const db = await getDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "branding"));
  const v = (row?.value ?? {}) as { logoMediaId?: number | null; heroModelMediaId?: number | null };
  return {
    logoUrl: v.logoMediaId ? `/api/media/${v.logoMediaId}` : null,
    heroModelUrl: v.heroModelMediaId ? `/api/media/${v.heroModelMediaId}` : null,
  };
}
