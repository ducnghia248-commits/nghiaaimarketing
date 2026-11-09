import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { configSchemas, maxScoreOf, type GameId } from "@/lib/games/defs";
import { handle, ok } from "@/lib/server/http";
import { getBranding } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

/** Danh sách 3 trò chơi (thông tin công khai) + cấu hình thương hiệu. */
export const GET = handle(async () => {
  const db = await getDb();
  const list = await db.select().from(schema.games).orderBy(asc(schema.games.sortOrder));
  const puzzles = await db.select({ regions: schema.puzzles.regions }).from(schema.puzzles);
  const diffCount = Math.max(5, ...puzzles.map((p) => p.regions.length));
  return ok({
    games: list.map((g) => {
      const id = g.id as GameId;
      const cfg = configSchemas[id].safeParse(g.config);
      return {
        id, name: g.name, tagline: g.tagline, description: g.description, rules: g.rules, estimatedTime: g.estimatedTime,
        enabled: g.enabled,
        maxScore: cfg.success ? maxScoreOf(id, cfg.data, diffCount) : 0,
        coverUrl: g.coverMediaId ? `/api/media/${g.coverMediaId}` : null,
      };
    }),
    branding: await getBranding(),
  });
});
