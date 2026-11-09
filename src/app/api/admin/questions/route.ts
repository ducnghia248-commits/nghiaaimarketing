import { desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { handle, ok, readJson } from "@/lib/server/http";
import { questionInput } from "@/lib/server/question-schema";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireAdmin();
  const db = await getDb();
  return ok({ questions: await db.select().from(schema.questions).orderBy(desc(schema.questions.id)) });
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const q = questionInput.parse(await readJson(req));
  const db = await getDb();
  const [row] = await db.insert(schema.questions).values(q).returning();
  await audit(admin, "create", "question", row.id, undefined, row);
  return ok({ question: row });
});
