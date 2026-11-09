import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { HttpError, handle, ok, readJson } from "@/lib/server/http";
import { questionInput } from "@/lib/server/question-schema";

type P = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, { params }: P) => {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  const q = questionInput.parse(await readJson(req));
  const db = await getDb();
  const [before] = await db.select().from(schema.questions).where(eq(schema.questions.id, id));
  if (!before) throw new HttpError(404, "Không tìm thấy câu hỏi.");
  const [after] = await db.update(schema.questions).set({ ...q, updatedAt: new Date() }).where(eq(schema.questions.id, id)).returning();
  await audit(admin, "update", "question", id, before, after);
  return ok({ question: after });
});

export const DELETE = handle(async (_req: Request, { params }: P) => {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  const db = await getDb();
  const [before] = await db.delete(schema.questions).where(eq(schema.questions.id, id)).returning();
  if (!before) throw new HttpError(404, "Không tìm thấy câu hỏi.");
  await audit(admin, "delete", "question", id, before);
  return ok({ ok: true });
});
