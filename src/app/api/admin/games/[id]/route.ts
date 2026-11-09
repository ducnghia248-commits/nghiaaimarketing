import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { GAME_IDS, configSchemas, type GameId } from "@/lib/games/defs";
import { audit, requireAdmin } from "@/lib/server/admin";
import { HttpError, handle, ok, readJson } from "@/lib/server/http";

const body = z.object({
  name: z.string().trim().min(1).max(60),
  tagline: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  rules: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
  estimatedTime: z.string().trim().min(1).max(30),
  enabled: z.boolean(),
  sortOrder: z.number().int().min(0).max(99),
  coverMediaId: z.number().int().positive().nullable(),
  config: z.unknown(),
});

export const PUT = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const id = (await params).id as GameId;
  if (!GAME_IDS.includes(id)) throw new HttpError(404, "Không tìm thấy trò chơi.");
  const b = body.parse(await readJson(req));
  const config = configSchemas[id].parse(b.config);
  const db = await getDb();
  const [before] = await db.select().from(schema.games).where(eq(schema.games.id, id));
  const [after] = await db
    .update(schema.games)
    .set({ ...b, config, updatedAt: new Date() })
    .where(eq(schema.games.id, id))
    .returning();
  await audit(admin, "update", "game", id, before, after);
  return ok({ game: after });
});
