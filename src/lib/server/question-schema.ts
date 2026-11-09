import { z } from "zod";
import { DIFFICULTIES, QUESTION_PRODUCTS, QUESTION_TYPES } from "../games/defs";

const ids = <T extends readonly { id: string }[]>(arr: T) => arr.map((a) => a.id) as [T[number]["id"], ...T[number]["id"][]];

export const questionInput = z
  .object({
    type: z.enum(ids(QUESTION_TYPES)),
    product: z.enum(ids(QUESTION_PRODUCTS)),
    difficulty: z.enum(ids(DIFFICULTIES)),
    question: z.string().trim().min(5, "câu hỏi quá ngắn").max(300),
    options: z.array(z.string().trim().min(1).max(120)).min(2).max(4),
    correctIndex: z.number().int().min(0),
    explanation: z.string().trim().max(400).default(""),
    imageMediaId: z.number().int().positive().nullable().default(null),
    active: z.boolean().default(true),
  })
  .refine((q) => q.correctIndex < q.options.length, { message: "đáp án đúng không hợp lệ", path: ["correctIndex"] });

export type QuestionInput = z.infer<typeof questionInput>;
