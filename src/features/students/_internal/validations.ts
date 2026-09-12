import { z } from "zod";

export const studentStatusEnum = z.enum(["STUDYING", "ON_LEAVE", "GRADUATED", "RETIRED"]);
export type StudentStatus = z.infer<typeof studentStatusEnum>;

export type AcademicRiskLevel = "NORMAL" | "WARNING" | "CRITICAL";

export function computeRiskLevel(gpa: number): AcademicRiskLevel {
  if (gpa < 2.0) return "CRITICAL";
  if (gpa < 2.5) return "WARNING";
  return "NORMAL";
}

export const createStudentSchema = z.object({
  studentCode: z.string().min(4, "รหัสนิสิตต้องมีความยาวอย่างน้อย 4 ตัวอักษร").max(50),
  title: z.string().min(1).max(50).default("นาย"),
  firstNameTh: z.string().min(1, "กรุณากรอกชื่อภาษาไทย").max(100),
  lastNameTh: z.string().min(1, "กรุณากรอกนามสกุลภาษาไทย").max(100),
  firstNameEn: z.string().min(1, "กรุณากรอกชื่อภาษาอังกฤษ").max(100),
  lastNameEn: z.string().min(1, "กรุณากรอกนามสกุลภาษาอังกฤษ").max(100),
  programId: z.string().uuid("กรุณาเลือกหลักสูตรที่ถูกต้อง"),
  advisorId: z.string().uuid().nullable().optional(),
  admissionYear: z.coerce.number().int().min(2500).max(2650).default(2569),
  status: studentStatusEnum.default("STUDYING"),
  gpa: z.coerce.number().min(0.0).max(4.0).default(0.0),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").nullable().optional().or(z.literal("")),
  phone: z.string().max(50).nullable().optional(),
  avatarUrl: z.string().max(500).nullable().optional().or(z.literal("")),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  id: z.string().uuid(),
  studentCode: z.string().min(4).max(50),
  title: z.string().min(1).max(50),
  firstNameTh: z.string().min(1).max(100),
  lastNameTh: z.string().min(1).max(100),
  firstNameEn: z.string().min(1).max(100),
  lastNameEn: z.string().min(1).max(100),
  programId: z.string().uuid(),
  advisorId: z.string().uuid().nullable().optional(),
  admissionYear: z.coerce.number().int().min(2500).max(2650),
  status: studentStatusEnum,
  gpa: z.coerce.number().min(0.0).max(4.0),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().max(50).nullable().optional(),
  avatarUrl: z.string().max(500).nullable().optional().or(z.literal("")),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const batchAssignAdvisorSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, "กรุณาเลือกนิสิตอย่างน้อย 1 คน"),
  advisorId: z.string().uuid().nullable(),
});

export type BatchAssignAdvisorInput = z.infer<typeof batchAssignAdvisorSchema>;

export const createAdvisingRecordSchema = z.object({
  studentId: z.string().uuid(),
  advisorId: z.string().uuid(),
  topic: z.string().min(1, "กรุณากรอกหัวข้อการปรึกษา").max(255),
  detail: z.string().min(1, "กรุณากรอกรายละเอียดการปรึกษา"),
  actionPlan: z.string().nullable().optional(),
  isConfidential: z.boolean().default(false),
  date: z.string().optional(),
});

export type CreateAdvisingRecordInput = z.infer<typeof createAdvisingRecordSchema>;

export const createScholarshipSchema = z.object({
  studentId: z.string().uuid(),
  scholarshipName: z.string().min(1, "กรุณากรอกชื่อทุนการศึกษา").max(255),
  academicYear: z.coerce.number().int().min(2500).max(2650),
  amount: z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
});

export type CreateScholarshipInput = z.infer<typeof createScholarshipSchema>;

export const importStudentItemSchema = z.object({
  studentCode: z.string().min(4).max(50),
  title: z.string().default("นาย"),
  firstNameTh: z.string().min(1),
  lastNameTh: z.string().min(1),
  firstNameEn: z.string().min(1),
  lastNameEn: z.string().min(1),
  admissionYear: z.coerce.number().int().min(2500).max(2650).default(2569),
  gpa: z.coerce.number().min(0.0).max(4.0).default(0.0),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const importStudentsSchema = z.object({
  programId: z.string().uuid("กรุณาเลือกหลักสูตรสำหรับชุดข้อมูลที่นำเข้า"),
  advisorId: z.string().uuid().nullable().optional(),
  items: z.array(importStudentItemSchema).min(1, "ต้องมีข้อมูลนิสิตอย่างน้อย 1 รายการ"),
});

export type ImportStudentsInput = z.infer<typeof importStudentsSchema>;
