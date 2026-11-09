import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { eq, sql, type SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { DEFAULT_CONFIGS, DEFAULT_GAMES } from "../games/defs";
import { SEED_QUESTIONS } from "./seed-questions";
import seedPuzzles from "./seed-puzzles.json";

export type DB = NodePgDatabase<typeof schema>;
export { schema };

type GlobalWithDb = typeof globalThis & { __playwinDb?: Promise<DB> };
const g = globalThis as GlobalWithDb;

/**
 * Kết nối CSDL (singleton):
 *  - Có DATABASE_URL  → PostgreSQL thật (node-postgres).
 *  - Không có         → PostgreSQL nhúng PGlite lưu tại PGLITE_DIR (chạy local không cần cài đặt).
 * Tự động chạy migration + khởi tạo dữ liệu nền ở lần gọi đầu tiên.
 */
export function getDb(): Promise<DB> {
  if (!g.__playwinDb) {
    g.__playwinDb = init().catch((e) => {
      g.__playwinDb = undefined;
      throw e;
    });
  }
  return g.__playwinDb;
}

async function init(): Promise<DB> {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  let db: DB;
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
    db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder });
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const dir = path.resolve(process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pglite"));
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    const client = new PGlite(dir);
    const pdb = drizzle(client, { schema });
    await migrate(pdb, { migrationsFolder });
    db = pdb as unknown as DB;
  }
  await seedBase(db);
  return db;
}

/** Chạy SQL thô, trả về mảng dòng (tương thích cả PGlite & node-postgres). */
export async function rows<T>(db: DB, query: SQL): Promise<T[]> {
  const res = (await db.execute(query)) as unknown as { rows: T[] };
  return res.rows;
}

async function seedBase(db: DB) {
  // 3 trò chơi
  const existingGames = await db.select({ id: schema.games.id }).from(schema.games);
  const have = new Set(existingGames.map((g) => g.id));
  for (const gdef of DEFAULT_GAMES) {
    if (have.has(gdef.id)) continue;
    await db.insert(schema.games).values({ ...gdef, enabled: true, config: DEFAULT_CONFIGS[gdef.id] });
  }

  const [{ n: qCount }] = await rows<{ n: number }>(db, sql`select count(*)::int as n from questions`);
  if (qCount === 0) await db.insert(schema.questions).values(SEED_QUESTIONS);

  const [{ n: pCount }] = await rows<{ n: number }>(db, sql`select count(*)::int as n from puzzles`);
  if (pCount === 0) await db.insert(schema.puzzles).values(seedPuzzles);

  await ensureAdmin(db, process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD, "admin");
  await ensureAdmin(db, process.env.EDITOR_USERNAME, process.env.EDITOR_PASSWORD, "editor");
}

async function ensureAdmin(db: DB, username: string | undefined, password: string | undefined, role: "admin" | "editor") {
  if (!username || !password) {
    if (role === "admin") console.warn("[play-win] Chưa cấu hình ADMIN_USERNAME/ADMIN_PASSWORD — chưa tạo tài khoản quản trị.");
    return;
  }
  const found = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, username));
  if (found.length) return;
  await db.insert(schema.adminUsers).values({ username, passwordHash: await bcrypt.hash(password, 10), role });
}
