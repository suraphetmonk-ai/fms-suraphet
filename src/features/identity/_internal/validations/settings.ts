import { z } from "zod";
import { PALETTE_IDS } from "@/shared/lib/palette";

export const smtpSettingsSchema = z
  .object({
    provider: z.literal("gmail").default("gmail"),
    enabled: z.boolean().default(false),
    user: z.string().trim().email("อีเมลไม่ถูกต้อง").or(z.literal("")).default(""),
    pass: z.string().trim().optional(),
    fromName: z.string().trim().max(100).optional(),
    fromEmail: z.string().trim().email("อีเมลผู้ส่งไม่ถูกต้อง").or(z.literal("")).optional(),
    port: z.coerce.number().default(465),
    secure: z.boolean().default(true),
  })
  .optional();

export const contactSettingsSchema = z
  .object({
    addressTh: z.string().trim().max(500).default(""),
    addressEn: z.string().trim().max(500).default(""),
    phone: z.string().trim().max(100).default(""),
    email: z.string().trim().email("อีเมลไม่ถูกต้อง").or(z.literal("")).default(""),
    fax: z.string().trim().max(100).default(""),
    officeHours: z.string().trim().max(255).default(""),
    facebook: z.string().trim().max(255).default(""),
    lineId: z.string().trim().max(100).default(""),
    mapEmbedUrl: z.string().trim().max(2000).default(""),
  })
  .optional();

export const geminiSettingsSchema = z
  .object({
    enabled: z.boolean().default(false),
    apiKey: z.string().trim().optional(),
    model: z.string().trim().default("gemini-2.5-flash"),
  })
  .optional();

export const updateSettingsSchema = z.object({
  nameTh: z.string().trim().min(1).max(255),
  nameEn: z.string().trim().min(1).max(255),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((val) => val === "" || val.startsWith("/") || /^https?:\/\//.test(val), {
      message: "Invalid URL or path",
    })
    .nullish()
    .transform((val) => val ?? ""),
  palette: z.enum(PALETTE_IDS),
  smtp: smtpSettingsSchema,
  contact: contactSettingsSchema,
  gemini: geminiSettingsSchema,
});
export const updateProfileSchema = z.object({ name: z.string().trim().min(1).max(255), locale: z.enum(["th", "en"]) });
export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;
export type ContactSettingsInput = z.infer<typeof contactSettingsSchema>;
export type GeminiSettingsInput = z.infer<typeof geminiSettingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

