import { cookies } from "next/headers";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { handle, limitOrThrow, ok, readJson } from "@/lib/server/http";
import { CAMPAIGN_COOKIE, activeCampaign, currentCampaignCode, getPlayer } from "@/lib/server/player";
import { cookieSecure } from "@/lib/server/security";

const body = z.object({
  type: z.enum(["visit", "start_click"]),
  visitorId: z.string().min(8).max(64),
  campaign: z.string().max(64).optional(),
});

/** Ghi nhận lượt truy cập / bấm BẮT ĐẦU CHƠI phục vụ thống kê; gắn mã chiến dịch từ ?c=CODE. */
export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "track", 60, 60_000);
  const b = body.parse(await readJson(req));
  const db = await getDb();
  let campaignCode: string | null = null;
  if (b.campaign) {
    const c = await activeCampaign(db, b.campaign.trim().toUpperCase());
    if (c) {
      campaignCode = c.code;
      (await cookies()).set(CAMPAIGN_COOKIE, c.code, { httpOnly: true, sameSite: "lax", secure: cookieSecure(), path: "/", maxAge: 60 * 60 * 24 * 30 });
    }
  }
  campaignCode ??= await currentCampaignCode(db);
  const player = await getPlayer();
  await db.insert(schema.events).values({ type: b.type, visitorId: b.visitorId, playerId: player?.id ?? null, campaignCode });
  return ok({ ok: true, campaign: campaignCode });
});
