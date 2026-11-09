import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { playerSummary } from "@/lib/server/engine";
import { HttpError, handle, limitOrThrow, ok, readJson } from "@/lib/server/http";
import { getOrCreatePlayer, getPlayer } from "@/lib/server/player";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const p = await getPlayer();
  if (!p) return ok({ player: null });
  const db = await getDb();
  return ok({ player: await playerSummary(db, p) });
});

// danh sách chặn tối giản (so khớp theo từ, sau khi bỏ dấu) — mở rộng khi cần
const BLOCKED = ["admin", "fpt telecom", "dm", "dmm", "dcm", "vcl", "vkl", "clgt", "fuck", "shit"];
const nick = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "tối thiểu 2 ký tự")
    .max(24, "tối đa 24 ký tự")
    .regex(/^[\p{L}\p{N} _.\-#]+$/u, "chỉ gồm chữ, số, khoảng trắng"),
});

/** Đặt tên hiển thị trên bảng xếp hạng (không cần thông tin cá nhân). */
export const PATCH = handle(async (req: Request) => {
  limitOrThrow(req, "nick", 10, 60_000);
  const { nickname } = nick.parse(await readJson(req));
  const plain = nickname.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  if (BLOCKED.some((w) => plain.split(/[\s_.\-#]+/).includes(w) || (w.includes(" ") && plain.includes(w)))) {
    throw new HttpError(400, "Tên hiển thị không phù hợp, vui lòng chọn tên khác.");
  }
  const p = await getOrCreatePlayer(req);
  const db = await getDb();
  await db.update(schema.players).set({ nickname }).where(eq(schema.players.id, p.id));
  return ok({ player: await playerSummary(db, { ...p, nickname }) });
});
