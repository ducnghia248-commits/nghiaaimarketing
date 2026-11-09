import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { HttpError, handle, ok, readJson } from "@/lib/server/http";
import { puzzleInput } from "@/lib/server/puzzle-schema";

type P = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, { params }: P) => {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  const p = puzzleInput.parse(await readJson(req));
  const db = await getDb();
  const [before] = await db.select().from(schema.puzzles).where(eq(schema.puzzles.id, id));
  if (!before) throw new HttpError(404, "Không tìm thấy bộ hình.");
  const [after] = await db.update(schema.puzzles).set({ ...p, updatedAt: new Date() }).where(eq(schema.puzzles.id, id)).returning();
  await audit(admin, "update", "puzzle", id, before, after);
  return ok({ puzzle: after });
});

export const DELETE = handle(async (_req: Request, { params }: P) => {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  const db = await getDb();
  const [before] = await db.delete(schema.puzzles).where(eq(schema.puzzles.id, id)).returning();
  if (!before) throw new HttpError(404, "Không tìm thấy bộ hình.");
  await audit(admin, "delete", "puzzle", id, before);
  return ok({ ok: true });
});
