import { z } from "zod";
import { GAME_IDS } from "@/lib/games/defs";
import { getAdmin } from "@/lib/server/admin";
import { startSession } from "@/lib/server/engine";
import { handle, limitOrThrow, ok, readJson } from "@/lib/server/http";
import { getOrCreatePlayer } from "@/lib/server/player";

const body = z.object({
  gameId: z.enum(GAME_IDS),
  puzzleId: z.number().int().positive().optional(),
  preview: z.boolean().optional(),
});

export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "start", 30, 60_000);
  const b = body.parse(await readJson(req));
  // Chế độ xem trước chỉ dành cho admin đã đăng nhập; dữ liệu được đánh dấu demo, không tính thống kê.
  const preview = Boolean(b.preview && (await getAdmin()));
  const player = await getOrCreatePlayer(req);
  return ok(await startSession(player, b.gameId, { puzzleId: b.puzzleId, preview }));
});
