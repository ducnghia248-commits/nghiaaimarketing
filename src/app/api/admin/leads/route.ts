import { sql } from "drizzle-orm";
import { getDb, rows } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { parseFilters } from "@/lib/server/filters";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Dữ liệu khách hàng — CHỈ vai trò admin. Mọi lần xuất file đều được ghi lịch sử. */
export const GET = handle(async (req: Request) => {
  const admin = await requireAdmin("admin");
  const url = new URL(req.url);
  const f = parseFilters(url);
  const consentOnly = url.searchParams.get("consent") === "1";
  const status = url.searchParams.get("status");
  const db = await getDb();
  const data = await rows<Record<string, unknown>>(
    db,
    sql`select l.id, l.full_name, l.phone, l.province, l.area, l.products, l.need, l.consent, l.consent_at, l.campaign_code,
               l.source, l.status, l.is_demo, l.created_at, p.nickname,
               coalesce((select sum(b.best) from (select max(score) as best from play_sessions s
                  where s.player_id = l.player_id and s.status = 'completed' group by s.game_id) b), 0)::int as total_score
        from leads l left join players p on p.id = l.player_id
        where ${f.where("created_at", "l.")}
          ${consentOnly ? sql`and l.consent = true` : sql``}
          ${status ? sql`and l.status = ${status}` : sql``}
        order by l.created_at desc limit 5000`,
  );
  if (url.searchParams.get("export") === "1") await audit(admin, "export", "leads", null, undefined, { rows: data.length, filters: f });
  return ok({ leads: data });
});
