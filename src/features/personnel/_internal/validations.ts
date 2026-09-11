import { z } from "zod";

export const createPersonnelSchema = z.object({
  personnelCode: z.string().max(50).optional().nullable(),
  citizenId: z.string().optional().nullable(),
  monasticTitle: z.string().max(100).optional().nullable(),
  chaya: z.string().max(50).optional().nullable(),
  paliDegree: z.string().max(30).optional().nullable(),
  templeName: z.string().max(255).optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  academicRank: z.string().optional().nullable(),
  firstNameTh: z.string().min(1, "กรุณากรอกชื่อภาษาไทย").max(100),
  lastNameTh: z.string().min(1, "กรุณากรอกนามสกุลภาษาไทย").max(100),
  firstNameEn: z.string().min(1, "Please enter English first name").max(100),
  lastNameEn: z.string().min(1, "Please enter English last name").max(100),
  departmentId: z.string().uuid().optional().nullable(),
  positionTh: z.string().min(1, "กรุณากรอกตำแหน่งภาษาไทย").max(150),
  positionEn: z.string().min(1, "Please enter English position").max(150),
  personnelType: z.enum(["ACADEMIC", "SUPPORT"]).default("ACADEMIC"),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().nullable().or(z.literal("")),
  phoneExt: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  biographyTh: z.string().optional().nullable(),
  biographyEn: z.string().optional().nullable(),
  expertise: z.array(z.string()).default([]),
  orderIndex: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export const updatePersonnelSchema = createPersonnelSchema.extend({
  id: z.string().uuid(),
});

export type CreatePersonnelInput = z.infer<typeof createPersonnelSchema>;
export type UpdatePersonnelInput = z.infer<typeof updatePersonnelSchema>;
