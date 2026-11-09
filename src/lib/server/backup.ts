import { sql } from "drizzle-orm";
import { rows, type DB } from "../db";

/** Thứ tự bảng khi khôi phục. */
export const BACKUP_TABLES = [
  "campaigns", "games", "admin_users", "settings", "media", "questions", "puzzles",
  "players", "play_sessions", "player_badges", "leads", "events", "audit_logs",
] as const;

export type Backup = { app: "fpt-play-win"; version: 1; createdAt: string; tables: Record<string, unknown[]> };

/** Xuất toàn bộ dữ liệu ra JSON (bytea → base64). Dùng được với cả PGlite và PostgreSQL. */
export async function exportAll(db: DB): Promise<Backup> {
  const tables: Record<string, unknown[]> = {};
  for (const t of BACKUP_TABLES) {
    const data = await rows<Record<string, unknown>>(db, sql`select * from ${sql.identifier(t)}`);
    tables[t] = data.map((r) => {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) o[k] = v instanceof Uint8Array ? { $base64: Buffer.from(v).toString("base64") } : v;
      return o;
    });
  }
  return { app: "fpt-play-win", version: 1, createdAt: new Date().toISOString(), tables };
}

/** Khôi phục từ bản sao lưu: xóa dữ liệu hiện có rồi nạp lại (trong một transaction). */
export async function importAll(db: DB, backup: Backup) {
  if (backup.app !== "fpt-play-win") throw new Error("File sao lưu không hợp lệ.");
  await db.transaction(async (tx) => {
    for (const t of [...BACKUP_TABLES].reverse()) await tx.execute(sql`delete from ${sql.identifier(t)}`);
    for (const t of BACKUP_TABLES) {
      for (const r of backup.tables[t] ?? []) {
        const entries = Object.entries(r as Record<string, unknown>);
        if (!entries.length) continue;
        const cols = sql.join(entries.map(([k]) => sql.identifier(k)), sql`, `);
        const vals = sql.join(
          entries.map(([, v]) => {
            if (v && typeof v === "object" && "$base64" in (v as object)) return sql`${Buffer.from((v as { $base64: string }).$base64, "base64")}`;
            if (v !== null && typeof v === "object") return sql`${JSON.stringify(v)}::jsonb`;
            return sql`${v as string | number | boolean | null}`;
          }),
          sql`, `,
        );
        await tx.execute(sql`insert into ${sql.identifier(t)} (${cols}) values (${vals})`);
      }
    }
    // đồng bộ lại các sequence serial
    for (const t of BACKUP_TABLES) {
      await tx.execute(sql.raw(
        `select setval(pg_get_serial_sequence('${t}', 'id'), coalesce((select max(id) from ${t}), 0) + 1, false)
         where pg_get_serial_sequence('${t}', 'id') is not null`,
      ));
    }
  });
}
