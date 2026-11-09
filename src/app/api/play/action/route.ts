import { z } from "zod";
import { sessionAction } from "@/lib/server/engine";
import { HttpError, handle, limitOrThrow, ok, readJson } from "@/lib/server/http";
import { getPlayer } from "@/lib/server/player";

const body = z
  .object({
    sessionId: z.string().uuid(),
    action: z.enum(["round", "stop", "next", "answer", "click", "hint", "finish"]),
  })
  .passthrough();

export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "action", 300, 60_000);
  const b = body.parse(await readJson(req));
  const player = await getPlayer();
  if (!player) throw new HttpError(401, "Phiên chơi đã hết hạn, vui lòng tải lại trang.");
  const { sessionId, action, ...payload } = b;
  return ok(await sessionAction(player, sessionId, action, payload));
});
