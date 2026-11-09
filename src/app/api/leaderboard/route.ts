import { sql } from "drizzle-orm";
import { getDb, rows } from "@/lib/db";
import { handle, limitOrThrow, ok } from "@/lib/server/http";
import { periodStart } from "@/lib/server/period";
import { getPlayer } from "@/lib/server/player";

export const dynamic = "force-dynamic";

/** Bảng xếp hạng: tổng điểm cao nhất của mỗi game; chỉ công khai tên hiển thị. Không gồm dữ liệu demo. */
export const GET = handle(async (req: Request) => {
  limitOrThrow(req, "lb", 60, 60_000);
  const url = new URL(req.url);
  const since = periodStart(url.searchParams.get("period"));
  const campaign = url.searchParams.get("campaign")?.trim().toUpperCase() || null;
  const db = await getDb();
  const filters = sql`status = 'completed' and is_demo = false`;
  const sinceF = since ? sql` and completed_at >= ${since.toISOString()}` : sql``;
  const campF = campaign ? sql` and campaign_code = ${campaign}` : sql``;
  const data = await rows<{ player_id: string; nickname: string; total: number; games: number }>(
    db,
    sql`with b as (select player_id, game_id, max(score) as best from play_sessions
                   where ${filters}${sinceF}${campF} group by player_id, game_id)
        select p.id as player_id, p.nickname, sum(b.best)::int as total, count(*)::int as games
        from b join players p on p.id = b.player_id
        group by p.id, p.nickname order by total desc, games desc, min(p.created_at) asc limit 50`,
  );
  const me = await getPlayer();
  const campaigns = await rows<{ code: string; name: string }>(db, sql`select code, name from campaigns where active = true order by created_at desc`);
  return ok({
    entries: data.map((r, i) => ({ rank: i + 1, nickname: r.nickname, total: r.total, games: r.games, isMe: r.player_id === me?.id })),
    campaigns,
  });
});
