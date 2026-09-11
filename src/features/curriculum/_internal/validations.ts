import { z } from "zod";

export const createProgramSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสหลักสูตร").max(50),
  nameTh: z.string().min(1, "กรุณากรอกชื่อหลักสูตรภาษาไทย").max(255),
  nameEn: z.string().min(1, "Please enter English program name").max(255),
  degreeLevel: z.enum(["BACHELOR", "MASTER", "DOCTORAL"]).default("BACHELOR"),
  degreeNameTh: z.string().min(1, "กรุณากรอกชื่อปริญญาภาษาไทย").max(255),
  degreeNameEn: z.string().min(1, "Please enter English degree title").max(255),
  departmentId: z.string().uuid().optional().nullable(),
  totalCredits: z.coerce.number().min(1, "หน่วยกิตต้องมากกว่า 0"),
  durationYears: z.coerce.number().min(1).default(4),
  tuitionFee: z.string().optional().nullable(),
  descriptionTh: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  careerOpportunitiesTh: z.string().optional().nullable(),
  careerOpportunitiesEn: z.string().optional().nullable(),
  pdfUrl: z.string().optional().nullable(),
  isOpenAdmission: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

export const updateProgramSchema = createProgramSchema.extend({
  id: z.string().uuid(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;

export const assignInstructorSchema = z.object({
  id: z.string().uuid().optional(),
  personnelId: z.string().uuid("กรุณาเลือกอาจารย์ผู้สอน"),
  courseId: z.string().uuid("กรุณาเลือกรายวิชา"),
  programId: z.string().uuid().optional().nullable(),
  academicYear: z.coerce.number().min(2500).default(2569),
  semester: z.coerce.number().min(1).max(3).default(1),
  role: z.enum(["COORDINATOR", "PRIMARY", "CO_INSTRUCTOR", "GUEST"]).default("PRIMARY"),
  section: z.string().default("01"),
  hoursPerWeek: z.coerce.number().min(1).default(3),
  studentCount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export type AssignInstructorInput = z.infer<typeof assignInstructorSchema>;

export const createScheduleSchema = z.object({
  scheduleCode: z.string().max(50).optional(),
  programId: z.string().uuid("กรุณาเลือกหลักสูตร"),
  courseId: z.string().uuid("กรุณาเลือกรายวิชา"),
  personnelId: z.string().uuid("กรุณาเลือกอาจารย์ผู้สอน"),
  academicYear: z.coerce.number().min(2500).default(2569),
  semester: z.coerce.number().min(1).max(3).default(1),
  yearLevel: z.coerce.number().min(1).max(6).default(1),
  dayOfWeek: z.coerce.number().min(1).max(7),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "รูปแบบเวลาไม่ถูกต้อง เช่น 08:30"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "รูปแบบเวลาไม่ถูกต้อง เช่น 11:15"),
  room: z.string().min(1, "กรุณากรอกห้องเรียน").max(100),
  building: z.string().max(100).optional().nullable(),
  section: z.string().default("01"),
  classType: z.enum(["LECTURE", "PRACTICE", "MEDITATION", "SEMINAR"]).default("LECTURE"),
  notes: z.string().optional().nullable(),
});

export const updateScheduleSchema = createScheduleSchema.extend({
  id: z.string().uuid(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

