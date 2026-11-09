import { desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { handle, ok, readJson } from "@/lib/server/http";
import { puzzleInput } from "@/lib/server/puzzle-schema";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireAdmin();
  const db = await getDb();
  return ok({ puzzles: await db.select().from(schema.puzzles).orderBy(desc(schema.puzzles.id)) });
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const p = puzzleInput.parse(await readJson(req));
  const db = await getDb();
  const [row] = await db.insert(schema.puzzles).values(p).returning();
  await audit(admin, "create", "puzzle", row.id, undefined, row);
  return ok({ puzzle: row });
});
