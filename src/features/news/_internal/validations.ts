import { z } from "zod";

export const createArticleSchema = z.object({
  categoryId: z.string().uuid(),
  titleTh: z.string().min(1, "กรุณากรอกหัวข้อภาษาไทย").max(255),
  titleEn: z.string().min(1, "Please enter English title").max(255),
  slug: z.string().min(1).max(255),
  excerptTh: z.string().optional().nullable(),
  excerptEn: z.string().optional().nullable(),
  contentTh: z.string().min(1, "กรุณากรอกเนื้อหาภาษาไทย"),
  contentEn: z.string().min(1, "Please enter English content"),
  coverImageUrl: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isPinned: z.boolean().default(false),
});

export const updateArticleSchema = createArticleSchema.extend({
  id: z.string().uuid(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
