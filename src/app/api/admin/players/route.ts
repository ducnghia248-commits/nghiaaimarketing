import { sql } from "drizzle-orm";
import { getDb, rows } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { parseFilters } from "@/lib/server/filters";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Danh sách người tham gia (chỉ tên hiển thị — không có dữ liệu cá nhân). */
export const GET = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const url = new URL(req.url);
  const f = parseFilters(url);
  const q = (url.searchParams.get("q") || "").trim();
  const db = await getDb();
  const data = await rows<{
    id: string; nickname: string; campaign_code: string | null; is_demo: boolean; created_at: string; last_played: string;
    plays: number; games_done: number; total: number; badges: string | null; has_lead: boolean;
  }>(
    db,
    sql`with s as (select * from play_sessions where ${f.where("started_at")}),
             best as (select player_id, game_id, max(score) filter (where status = 'completed') as best from s group by player_id, game_id)
        select p.id, p.nickname, p.campaign_code, p.is_demo, p.created_at, max(s.started_at) as last_played,
               (select count(*) from s s2 where s2.player_id = p.id)::int as plays,
               (select count(*) from best b where b.player_id = p.id and b.best is not null)::int as games_done,
               coalesce((select sum(b.best) from best b where b.player_id = p.id), 0)::int as total,
               (select string_agg(badge, ',') from player_badges pb where pb.player_id = p.id) as badges,
               exists(select 1 from leads l where l.player_id = p.id and l.consent) as has_lead
        from players p join s on s.player_id = p.id
        where ${q ? sql`p.nickname ilike ${"%" + q + "%"}` : sql`true`}
        group by p.id order by last_played desc limit 1000`,
  );
  if (url.searchParams.get("export") === "1") await audit(admin, "export", "players", null, undefined, { rows: data.length, filters: f });
  return ok({ players: data });
});
