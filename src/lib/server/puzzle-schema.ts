import { z } from "zod";

export const puzzleInput = z.object({
  title: z.string().trim().min(2).max(100),
  theme: z.string().trim().max(60).default(""),
  leftUrl: z.string().regex(/^\/(api\/media\/\d+|puzzles\/[\w.-]+)$/, "ảnh không hợp lệ"),
  rightUrl: z.string().regex(/^\/(api\/media\/\d+|puzzles\/[\w.-]+)$/, "ảnh không hợp lệ"),
  width: z.number().int().min(100).max(8000),
  height: z.number().int().min(100).max(8000),
  regions: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(40),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        r: z.number().min(0.005).max(0.3),
        label: z.string().trim().max(80).default(""),
      }),
    )
    .max(15)
    .refine((r) => new Set(r.map((x) => x.id)).size === r.length, "id vùng bị trùng"),
  active: z.boolean().default(true),
  campaignCode: z.string().trim().toUpperCase().max(40).nullable().default(null),
});
