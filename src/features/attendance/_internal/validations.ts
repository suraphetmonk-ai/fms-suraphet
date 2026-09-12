import { z } from "zod";

export const checkInSchema = z.object({
  checkInType: z.enum(["ON_SITE", "WFH", "FIELD_WORK", "TEACHING"]).default("ON_SITE"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  locationName: z.string().max(255).optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
});

export type CheckOutInput = z.infer<typeof checkOutSchema>;

export const adjustAttendanceSchema = z.object({
  recordId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid(),
  date: z.string().min(10), // YYYY-MM-DD
  checkInTime: z.string().optional().nullable(), // ISO or "HH:mm"
  checkOutTime: z.string().optional().nullable(),
  status: z.enum(["ON_TIME", "LATE", "EARLY_LEAVE", "ABSENT", "ON_LEAVE", "HOLIDAY", "OVERTIME"]).default("ON_TIME"),
  checkInType: z.enum(["ON_SITE", "WFH", "FIELD_WORK", "TEACHING"]).default("ON_SITE"),
  adjustReason: z.string().min(3, "ต้องระบุเหตุผลในการปรับแก้เวลา"),
});

export type AdjustAttendanceInput = z.infer<typeof adjustAttendanceSchema>;

export const leaveRequestSchema = z.object({
  leaveType: z.enum(["SICK", "PERSONAL", "ANNUAL", "OFFICIAL", "MATERNITY", "MILITARY", "OTHER"]),
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(["MORNING", "AFTERNOON"]).optional().nullable(),
  reason: z.string().min(3, "โปรดระบุเหตุผลในการลา"),
  contactPhone: z.string().max(50).optional().nullable(),
  contactAddress: z.string().max(500).optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable().or(z.literal("")),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น", path: ["endDate"] }
);

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const leaveReviewSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectReason: z.string().optional().nullable(),
});

export type LeaveReviewInput = z.infer<typeof leaveReviewSchema>;

export const workShiftSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(2).max(50),
  nameTh: z.string().min(2).max(150),
  nameEn: z.string().min(2).max(150),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "รูปแบบเวลาไม่ถูกต้อง เช่น 08:30"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "รูปแบบเวลาไม่ถูกต้อง เช่น 16:30"),
  lateThresholdMinutes: z.number().int().min(0).max(240).default(15),
  isDefault: z.boolean().default(false),
});

export type WorkShiftInput = z.infer<typeof workShiftSchema>;
