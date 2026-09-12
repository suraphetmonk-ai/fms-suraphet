import { describe, it, expect } from "vitest";
import {
  checkInSchema,
  leaveRequestSchema,
  workShiftSchema,
  adjustAttendanceSchema,
} from "./validations";

describe("attendance validations", () => {
  it("validates valid check-in input", () => {
    const input = {
      checkInType: "ON_SITE",
      latitude: 13.736717,
      longitude: 100.523186,
      locationName: "อาคาร 1 คณะวิทยาการจัดการ",
      remarks: "เข้างานปกติ",
    };
    const result = checkInSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates check-in default type", () => {
    const input = {};
    const result = checkInSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkInType).toBe("ON_SITE");
    }
  });

  it("validates leave request valid date range", () => {
    const input = {
      leaveType: "SICK",
      startDate: "2026-09-15",
      endDate: "2026-09-16",
      isHalfDay: false,
      reason: "ไข้หวัดใหญ่ แพทย์สั่งพัก",
    };
    const result = leaveRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects leave request when endDate is before startDate", () => {
    const input = {
      leaveType: "ANNUAL",
      startDate: "2026-09-20",
      endDate: "2026-09-18",
      isHalfDay: false,
      reason: "พักผ่อน",
    };
    const result = leaveRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("requires reason when adjusting attendance", () => {
    const input = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      date: "2026-09-12",
      status: "ON_TIME",
      checkInType: "ON_SITE",
      adjustReason: "", // invalid: empty
    };
    const result = adjustAttendanceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("validates work shift time format", () => {
    const validShift = {
      code: "STANDARD",
      nameTh: "กะเวลาปกติ",
      nameEn: "Standard Shift",
      startTime: "08:30",
      endTime: "16:30",
      lateThresholdMinutes: 15,
      isDefault: true,
    };
    expect(workShiftSchema.safeParse(validShift).success).toBe(true);

    const invalidShift = {
      ...validShift,
      startTime: "8:30", // missing leading zero
    };
    expect(workShiftSchema.safeParse(invalidShift).success).toBe(false);
  });
});
