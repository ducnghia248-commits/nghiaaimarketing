import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { handle, ok, readJson } from "@/lib/server/http";
import { questionInput, type QuestionInput } from "@/lib/server/question-schema";

const body = z.object({ rows: z.array(z.unknown()).min(1).max(1000) });

/** Nhập hàng loạt (đã được client đọc từ Excel/CSV thành JSON). Trả về lỗi theo từng dòng. */
export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const { rows } = body.parse(await readJson(req));
  const valid: QuestionInput[] = [];
  const errors: { row: number; error: string }[] = [];
  rows.forEach((r, i) => {
    const p = questionInput.safeParse(r);
    if (p.success) valid.push(p.data);
    else errors.push({ row: i + 2, error: p.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ") });
  });
  const db = await getDb();
  if (valid.length) await db.insert(schema.questions).values(valid);
  await audit(admin, "import", "question", null, undefined, { imported: valid.length, errors: errors.length });
  return ok({ imported: valid.length, errors });
});
