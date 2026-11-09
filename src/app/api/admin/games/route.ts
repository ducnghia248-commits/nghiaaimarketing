import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireAdmin();
  const db = await getDb();
  return ok({ games: await db.select().from(schema.games).orderBy(asc(schema.games.sortOrder)) });
});
