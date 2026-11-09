import { and, desc, eq, gte, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { CONSENT_TEXT, REGISTER_CONSENT_TEXT, NEEDS, PHONE_RE, PRODUCTS, PROVINCES, normalizePhone } from "@/lib/games/defs";
import { HttpError, handle, limitOrThrow, ok, readJson } from "@/lib/server/http";
import { currentCampaignCode, getPlayer } from "@/lib/server/player";
import { ipHash, rateLimit } from "@/lib/server/security";

const body = z.object({
  consent: z.boolean(),
  fullName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  province: z.enum(PROVINCES),
  area: z.string().trim().max(120).optional().default(""),
  products: z.array(z.enum(PRODUCTS.map((p) => p.id) as [string, ...string[]])).min(1, "chọn ít nhất 1 sản phẩm").max(5),
  need: z.enum(NEEDS.map((n) => n.id) as [string, ...string[]]),
  /** trường bẫy chống bot — người thật không nhìn thấy */
  website: z.string().optional(),
});

/**
 * Ghi nhận nhu cầu khách hàng.
 * - Có đồng ý liên hệ: lưu họ tên + SĐT để FPT gọi tư vấn.
 * - Không đồng ý: chỉ lưu nhu cầu ẩn danh (KHÔNG lưu họ tên/SĐT).
 */
export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "lead", 5, 10 * 60_000);
  const b = body.parse(await readJson(req));
  if (b.website) return ok({ ok: true }); // bot

  const db = await getDb();
  const player = await getPlayer();
  const campaignCode = await currentCampaignCode(db);

  let fullName: string | null = null;
  let phone: string | null = null;
  let consent = b.consent;
  let consentText = b.consent ? CONSENT_TEXT : null;
  if (player?.registeredAt && player.phone) {
    // người chơi đã đăng ký (và đồng ý được liên hệ) khi bắt đầu chơi → dùng thông tin đã có
    fullName = player.fullName;
    phone = player.phone;
    consent = true;
    consentText = REGISTER_CONSENT_TEXT;
  } else if (b.consent) {
    fullName = (b.fullName || "").replace(/\s+/g, " ").trim();
    if (fullName.length < 2) throw new HttpError(400, "Vui lòng nhập họ và tên.");
    phone = normalizePhone(b.phone || "");
    if (!PHONE_RE.test(phone)) throw new HttpError(400, "Số điện thoại không hợp lệ (VD: 0912345678).");
  }
  if (phone && !rateLimit(`lead-phone:${phone}`, 5, 24 * 3600_000)) throw new HttpError(429, "Bạn đã gửi yêu cầu, FPT sẽ sớm liên hệ bạn.");

  if (phone) {
    // cùng SĐT: cập nhật bản ghi đăng ký hoặc yêu cầu trong 24h thay vì tạo bản ghi mới
    const since = new Date(Date.now() - 24 * 3600_000);
    const [dup] = await db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.phone, phone), or(eq(schema.leads.source, "register"), gte(schema.leads.createdAt, since))))
      .orderBy(desc(schema.leads.id))
      .limit(1);
    if (dup) {
      await db
        .update(schema.leads)
        .set({ products: b.products, need: b.need, province: b.province, area: b.area, status: dup.status === "done" ? "new" : dup.status })
        .where(eq(schema.leads.id, dup.id));
      return ok({ ok: true, updated: true });
    }
  }

  await db.insert(schema.leads).values({
    playerId: player?.id ?? null,
    fullName,
    phone,
    province: b.province,
    area: b.area,
    products: b.products,
    need: b.need,
    consent,
    consentText,
    consentAt: consent ? new Date() : null,
    campaignCode,
    isDemo: player?.isDemo ?? false,
    ipHash: ipHash(req),
  });
  return ok({ ok: true });
});
