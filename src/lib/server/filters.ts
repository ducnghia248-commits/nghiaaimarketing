import { sql, type SQL } from "drizzle-orm";

/** Bộ lọc chung: khoảng ngày (giờ Việt Nam UTC+7), chiến dịch, có/không gồm dữ liệu demo. */
export function parseFilters(url: URL) {
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const dflt = new Date(Date.now() + 7 * 3600_000 - 29 * 86400_000).toISOString().slice(0, 10);
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const from = re.test(url.searchParams.get("from") || "") ? url.searchParams.get("from")! : dflt;
  const to = re.test(url.searchParams.get("to") || "") ? url.searchParams.get("to")! : today;
  const campaign = url.searchParams.get("campaign")?.trim().toUpperCase() || null;
  const includeDemo = url.searchParams.get("demo") === "1";
  const fromTs = new Date(`${from}T00:00:00+07:00`).toISOString();
  const toTs = new Date(new Date(`${to}T00:00:00+07:00`).getTime() + 86400_000).toISOString();
  /** prefix: bí danh bảng (vd "l.") khi truy vấn có JOIN. */
  const where = (timeCol: string, prefix = ""): SQL => {
    const col = (c: string) => sql.raw(prefix + c);
    const parts: SQL[] = [sql`${col(timeCol)} >= ${fromTs} and ${col(timeCol)} < ${toTs}`];
    if (campaign) parts.push(sql`${col("campaign_code")} = ${campaign}`);
    if (!includeDemo) parts.push(sql`${col("is_demo")} = false`);
    return sql.join(parts, sql` and `);
  };
  return { from, to, campaign, includeDemo, where };
}
