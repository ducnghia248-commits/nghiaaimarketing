import crypto from "node:crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

let warned = false;
function secretKey(): Uint8Array {
  let s = process.env.APP_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET phải dài tối thiểu 32 ký tự ở production.");
    if (!warned) console.warn("[play-win] APP_SECRET chưa đặt — đang dùng khóa phát triển. KHÔNG dùng cho production.");
    warned = true;
    s = "dev-only-secret-do-not-use-in-production-0123456789";
  }
  return new TextEncoder().encode(s);
}

export async function signToken(payload: JWTPayload, expiresIn: string) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(secretKey());
}

export async function verifyToken<T extends JWTPayload>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as T;
  } catch {
    return null;
  }
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

/** Băm IP (không lưu IP gốc) — chỉ dùng chống spam. */
export function ipHash(req: Request): string {
  return crypto.createHash("sha256").update(clientIp(req) + "|" + (process.env.APP_SECRET || "dev")).digest("hex").slice(0, 24);
}

export const cookieSecure = () => process.env.COOKIE_SECURE === "true";

// ---------------- Giới hạn tần suất (bộ nhớ trong; nhiều instance => dùng Redis) ----------------
type Bucket = { count: number; reset: number };
const g = globalThis as typeof globalThis & { __playwinRl?: Map<string, Bucket> };
const buckets = (g.__playwinRl ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.count++;
  return b.count <= limit;
}

export function randomId() {
  return crypto.randomUUID();
}
