import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { PHONE_RE, PROVINCES, REGISTER_CONSENT_TEXT, normalizePhone, publicName } from "@/lib/games/defs";
import { playerSummary } from "@/lib/server/engine";
import { HttpError, handle, limitOrThrow, ok, readJson } from "@/lib/server/http";
import { currentCampaignCode, getOrCreatePlayer } from "@/lib/server/player";
import { ipHash } from "@/lib/server/security";

const body = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ và tên").max(60),
  phone: z.string().trim().max(20),
  province: z.union([z.enum(PROVINCES), z.literal("")]).optional().default(""),
  consent: z.literal(true, { errorMap: () => ({ message: "Vui lòng đồng ý điều khoản để tham gia" }) }),
  /** trường bẫy chống bot */
  website: z.string().optional(),
});

/**
 * Đăng ký thông tin trước khi chơi (bắt buộc).
 * Lưu vào hồ sơ người chơi + tạo/cập nhật bản ghi khách hàng tiềm năng (nguồn "register").
 */
export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "register", 10, 10 * 60_000);
  const b = body.parse(await readJson(req));
  if (b.website) throw new HttpError(400, "Yêu cầu không hợp lệ.");
  const fullName = b.fullName.replace(/\s+/g, " ");
  if (!/^[\p{L} .'-]+$/u.test(fullName)) throw new HttpError(400, "Họ tên chỉ gồm chữ cái và khoảng trắng.");
  const phone = normalizePhone(b.phone);
  if (!PHONE_RE.test(phone)) throw new HttpError(400, "Số điện thoại không hợp lệ (VD: 0912 345 678).");

  const db = await getDb();
  const player = await getOrCreatePlayer(req);
  const campaignCode = player.campaignCode ?? (await currentCampaignCode(db));
  const nickname = player.registeredAt && !player.nickname.includes("***") ? player.nickname : publicName(fullName, phone);
  await db
    .update(schema.players)
    .set({ fullName, phone, province: b.province || null, registeredAt: player.registeredAt ?? new Date(), nickname })
    .where(eq(schema.players.id, player.id));

  // một khách hàng (SĐT) = một bản ghi đăng ký; cập nhật nếu đã có
  const [existing] = await db
    .select({ id: schema.leads.id })
    .from(schema.leads)
    .where(and(eq(schema.leads.phone, phone), eq(schema.leads.source, "register")))
    .orderBy(desc(schema.leads.id))
    .limit(1);
  if (existing) {
    await db
      .update(schema.leads)
      .set({ fullName, playerId: player.id, ...(b.province ? { province: b.province } : {}), consentAt: new Date(), consentText: REGISTER_CONSENT_TEXT })
      .where(eq(schema.leads.id, existing.id));
  } else {
    await db.insert(schema.leads).values({
      playerId: player.id,
      fullName,
      phone,
      province: b.province || "",
      products: [],
      need: "explore",
      consent: true,
      consentText: REGISTER_CONSENT_TEXT,
      consentAt: new Date(),
      campaignCode,
      source: "register",
      isDemo: player.isDemo,
      ipHash: ipHash(req),
    });
  }
  const [fresh] = await db.select().from(schema.players).where(eq(schema.players.id, player.id));
  return ok({ player: await playerSummary(db, fresh) });
});
