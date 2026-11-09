import { z } from "zod";

const optDate = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "ngày không hợp lệ");

export const campaignInput = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,40}$/, "mã chỉ gồm chữ không dấu, số, - và _"),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).default(""),
  active: z.boolean().default(true),
  startsAt: optDate,
  endsAt: optDate,
  playLimitPerDay: z.number().int().min(1).max(100).nullable().default(null),
});
