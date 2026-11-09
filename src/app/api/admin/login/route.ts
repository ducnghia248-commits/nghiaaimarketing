import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { audit, setAdminCookie, type AdminRole } from "@/lib/server/admin";
import { HttpError, handle, limitOrThrow, ok, readJson } from "@/lib/server/http";

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);
const body = z.object({ username: z.string().min(1).max(64), password: z.string().min(1).max(200) });

export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "admin-login", 10, 15 * 60_000);
  const b = body.parse(await readJson(req));
  const db = await getDb();
  const [u] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, b.username));
  // luôn so khớp băm (kể cả khi không có user) để không lộ thông tin qua thời gian phản hồi
  const valid = await bcrypt.compare(b.password, u?.passwordHash ?? DUMMY_HASH);
  if (!u || !valid) throw new HttpError(401, "Sai tên đăng nhập hoặc mật khẩu.");
  const session = { uid: u.id, username: u.username, role: u.role as AdminRole };
  await setAdminCookie(session);
  await audit(session, "login", "admin", u.id);
  return ok({ username: u.username, role: u.role });
});
