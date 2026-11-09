import { eq, inArray, sql } from "drizzle-orm";
import { schema, type DB } from "../db";
import { CONSENT_TEXT, GAME_IDS, NEEDS, PRODUCTS, PROVINCES, configSchemas, maxScoreOf, type GameId } from "../games/defs";
import { randomId } from "./security";

/**
 * Sinh dữ liệu DEMO để trình diễn Dashboard. Mọi bản ghi đều có is_demo = true,
 * KHÔNG xuất hiện trên bảng xếp hạng công khai và bị loại khỏi thống kê mặc định.
 */
export async function seedDemo(db: DB, count = 120) {
  const games = await db.select().from(schema.games);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
  const names = ["Minh", "Lan", "Huy", "Trang", "Nam", "Hà", "Phúc", "Linh", "Tuấn", "Vy", "Khoa", "Mai"];
  let sessions = 0, leadsN = 0;
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 28);
    const t = new Date(Date.now() - daysAgo * 86400_000 - Math.random() * 86400_000);
    const pid = randomId();
    const visitor = randomId();
    await db.insert(schema.players).values({ id: pid, nickname: `[DEMO] ${pick(names)} ${100 + i}`, isDemo: true, createdAt: t, lastSeenAt: t });
    await db.insert(schema.events).values([
      { type: "visit", visitorId: visitor, playerId: pid, isDemo: true, createdAt: t },
      ...(Math.random() < 0.85 ? [{ type: "start_click", visitorId: visitor, playerId: pid, isDemo: true, createdAt: t }] : []),
    ]);
    for (const g of GAME_IDS) {
      if (Math.random() < 0.3) continue;
      const game = games.find((x) => x.id === g)!;
      const max = maxScoreOf(g as GameId, configSchemas[g].parse(game.config));
      const completed = Math.random() < 0.88;
      const score = completed ? Math.round(max * (0.25 + Math.random() * 0.7)) : 0;
      const dur = 25_000 + Math.random() * 60_000;
      await db.insert(schema.playSessions).values({
        id: randomId(), playerId: pid, gameId: g, state: {}, status: completed ? "completed" : "active", score, maxScore: max,
        durationMs: completed ? Math.round(dur) : null, details: completed ? { demo: true } : null, isDemo: true,
        startedAt: t, completedAt: completed ? new Date(t.getTime() + dur) : null,
      });
      sessions++;
    }
    if (Math.random() < 0.35) {
      const consent = Math.random() < 0.75;
      await db.insert(schema.leads).values({
        playerId: pid,
        fullName: consent ? `[DEMO] Khách hàng ${i}` : null,
        phone: consent ? `09${String(10000000 + Math.floor(Math.random() * 89999999))}` : null,
        province: pick(PROVINCES),
        products: [...new Set([pick(PRODUCTS).id, pick(PRODUCTS).id])],
        need: pick(NEEDS).id,
        consent,
        consentText: consent ? CONSENT_TEXT : null,
        consentAt: consent ? t : null,
        isDemo: true,
        createdAt: t,
      });
      leadsN++;
    }
  }
  return { players: count, sessions, leads: leadsN };
}

export async function clearDemo(db: DB) {
  const demoPlayers = await db.select({ id: schema.players.id }).from(schema.players).where(eq(schema.players.isDemo, true));
  const ids = demoPlayers.map((p) => p.id);
  await db.delete(schema.playSessions).where(eq(schema.playSessions.isDemo, true));
  await db.delete(schema.leads).where(eq(schema.leads.isDemo, true));
  await db.delete(schema.events).where(eq(schema.events.isDemo, true));
  if (ids.length) {
    await db.delete(schema.playerBadges).where(inArray(schema.playerBadges.playerId, ids));
    await db.delete(schema.players).where(inArray(schema.players.id, ids));
  }
  await db.execute(sql`select 1`);
  return { players: ids.length };
}
