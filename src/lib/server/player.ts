import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb, schema, type DB } from "../db";
import { cookieSecure, ipHash, randomId, signToken, verifyToken } from "./security";

const PLAYER_COOKIE = "pw_player";
export const CAMPAIGN_COOKIE = "pw_campaign";
const YEAR = 60 * 60 * 24 * 365;

export type Player = typeof schema.players.$inferSelect;

export function defaultNickname() {
  return `Người chơi #${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Chiến dịch đang hoạt động (theo mã), hoặc null. */
export async function activeCampaign(db: DB, code: string | null | undefined) {
  if (!code) return null;
  const [c] = await db.select().from(schema.campaigns).where(and(eq(schema.campaigns.code, code), eq(schema.campaigns.active, true)));
  if (!c) return null;
  const now = Date.now();
  if (c.startsAt && c.startsAt.getTime() > now) return null;
  if (c.endsAt && c.endsAt.getTime() < now) return null;
  return c;
}

export async function currentCampaignCode(db: DB): Promise<string | null> {
  const jar = await cookies();
  const c = await activeCampaign(db, jar.get(CAMPAIGN_COOKIE)?.value);
  return c?.code ?? null;
}

export async function getPlayer(): Promise<Player | null> {
  const jar = await cookies();
  const payload = await verifyToken<{ pid: string }>(jar.get(PLAYER_COOKIE)?.value);
  if (!payload?.pid) return null;
  const db = await getDb();
  const [p] = await db.select().from(schema.players).where(eq(schema.players.id, payload.pid));
  return p ?? null;
}

/** Lấy người chơi hiện tại, hoặc tạo người chơi ẩn danh mới (không cần đăng ký). */
export async function getOrCreatePlayer(req: Request): Promise<Player> {
  const existing = await getPlayer();
  const db = await getDb();
  if (existing) {
    if (Date.now() - existing.lastSeenAt.getTime() > 60_000) {
      await db.update(schema.players).set({ lastSeenAt: new Date() }).where(eq(schema.players.id, existing.id));
    }
    return existing;
  }
  const campaignCode = await currentCampaignCode(db);
  const [p] = await db
    .insert(schema.players)
    .values({ id: randomId(), nickname: defaultNickname(), campaignCode, ipHash: ipHash(req) })
    .returning();
  const jar = await cookies();
  jar.set(PLAYER_COOKIE, await signToken({ pid: p.id }, "365d"), {
    httpOnly: true, sameSite: "lax", secure: cookieSecure(), path: "/", maxAge: YEAR,
  });
  return p;
}
