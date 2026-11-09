import { cookies } from "next/headers";
import { getDb, schema } from "../db";
import { HttpError } from "./http";
import { cookieSecure, signToken, verifyToken } from "./security";

export const ADMIN_COOKIE = "pw_admin";
export type AdminRole = "admin" | "editor";
export type AdminSession = { uid: number; username: string; role: AdminRole };

export async function getAdmin(): Promise<AdminSession | null> {
  const jar = await cookies();
  const p = await verifyToken<AdminSession>(jar.get(ADMIN_COOKIE)?.value);
  if (!p?.uid) return null;
  return { uid: p.uid, username: p.username, role: p.role };
}

/** Bắt buộc đăng nhập admin; role "admin" mới được truy cập dữ liệu khách hàng. */
export async function requireAdmin(role?: AdminRole): Promise<AdminSession> {
  const a = await getAdmin();
  if (!a) throw new HttpError(401, "Vui lòng đăng nhập quản trị.");
  if (role === "admin" && a.role !== "admin") throw new HttpError(403, "Tài khoản không có quyền truy cập chức năng này.");
  return a;
}

export async function setAdminCookie(s: AdminSession) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await signToken(s, "8h"), {
    httpOnly: true, sameSite: "strict", secure: cookieSecure(), path: "/", maxAge: 8 * 3600,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

/** Ghi lịch sử thay đổi cấu hình. */
export async function audit(admin: AdminSession, action: string, entity: string, entityId: string | number | null, before?: unknown, after?: unknown) {
  const db = await getDb();
  await db.insert(schema.auditLogs).values({
    username: admin.username,
    action,
    entity,
    entityId: entityId == null ? null : String(entityId),
    before: before === undefined ? null : stripBinary(before),
    after: after === undefined ? null : stripBinary(after),
  });
}

function stripBinary(v: unknown): unknown {
  return JSON.parse(JSON.stringify(v, (_k, val) => (val && typeof val === "object" && (val as { type?: string }).type === "Buffer" ? "[binary]" : val)));
}
