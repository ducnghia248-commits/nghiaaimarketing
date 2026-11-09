import { sql } from "drizzle-orm";
import { getDb, rows } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";
import { parseFilters } from "@/lib/server/filters";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const f = parseFilters(new URL(req.url));
  const db = await getDb();
  const ev = f.where("created_at");
  const ps = f.where("started_at");
  const pc = f.where("completed_at");
  const ld = f.where("created_at");

  const [traffic] = await rows<{ visits: number; visitors: number; starters: number }>(
    db,
    sql`select count(*) filter (where type = 'visit')::int as visits,
               count(distinct visitor_id) filter (where type = 'visit')::int as visitors,
               count(distinct visitor_id) filter (where type = 'start_click')::int as starters
        from events where ${ev}`,
  );
  const [play] = await rows<{ players: number; started: number; completed: number }>(
    db,
    sql`select count(distinct player_id)::int as players, count(*)::int as started,
               count(*) filter (where status = 'completed')::int as completed
        from play_sessions where ${ps}`,
  );
  const perGame = await rows<{ game_id: string; started: number; completed: number; avg_score: number | null; avg_pct: number | null; avg_ms: number | null }>(
    db,
    sql`select game_id, count(*)::int as started, count(*) filter (where status = 'completed')::int as completed,
               round(avg(score) filter (where status = 'completed'))::int as avg_score,
               round(avg(100.0 * score / nullif(max_score, 0)) filter (where status = 'completed'))::int as avg_pct,
               round(avg(duration_ms) filter (where status = 'completed'))::int as avg_ms
        from play_sessions where ${ps} group by game_id order by game_id`,
  );
  const [allThree] = await rows<{ n: number }>(
    db,
    sql`select count(*)::int as n from (select player_id from play_sessions where status = 'completed' and ${pc}
        group by player_id having count(distinct game_id) >= 3) t`,
  );
  const [leadStats] = await rows<{ total: number; consented: number; registered: number; consult: number }>(
    db,
    sql`select count(*)::int as total, count(*) filter (where consent)::int as consented,
               count(*) filter (where source = 'register')::int as registered,
               count(*) filter (where source = 'consult' or need <> 'explore' or jsonb_array_length(products) > 0)::int as consult
        from leads where ${ld}`,
  );
  const products = await rows<{ product: string; n: number }>(
    db,
    sql`select p as product, count(*)::int as n from leads, jsonb_array_elements_text(products) p where ${ld} group by p order by n desc`,
  );
  const needs = await rows<{ need: string; n: number }>(db, sql`select need, count(*)::int as n from leads where ${ld} group by need order by n desc`);
  const provinces = await rows<{ province: string; n: number }>(
    db,
    sql`select province, count(*)::int as n from leads where ${ld} group by province order by n desc limit 15`,
  );
  const daily = await rows<{ day: string; visits: number; sessions: number; completed: number; leads: number }>(
    db,
    sql`with d as (
          select ((created_at + interval '7 hours')::date)::text as day, 'visit' as k from events where type = 'visit' and ${ev}
          union all select ((started_at + interval '7 hours')::date)::text, 'session' from play_sessions where ${ps}
          union all select ((completed_at + interval '7 hours')::date)::text, 'completed' from play_sessions where status = 'completed' and ${pc}
          union all select ((created_at + interval '7 hours')::date)::text, 'lead' from leads where ${ld})
        select day, count(*) filter (where k = 'visit')::int as visits, count(*) filter (where k = 'session')::int as sessions,
               count(*) filter (where k = 'completed')::int as completed, count(*) filter (where k = 'lead')::int as leads
        from d group by day order by day`,
  );
  const [demo] = await rows<{ n: number }>(db, sql`select (select count(*) from players where is_demo) ::int as n`);

  return ok({
    filters: { from: f.from, to: f.to, campaign: f.campaign, includeDemo: f.includeDemo },
    demoRecords: demo.n,
    traffic,
    play,
    startRate: traffic.visitors ? Math.round((1000 * traffic.starters) / traffic.visitors) / 10 : null,
    completionRate: play.started ? Math.round((1000 * play.completed) / play.started) / 10 : null,
    perGame,
    playersAllThree: allThree.n,
    leads: leadStats,
    products,
    needs,
    provinces,
    daily,
  });
});
