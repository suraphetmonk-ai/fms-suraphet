import { describe, it, expect } from "vitest";
import { timeToMinutes, isTimeOverlapping } from "./timetable.service";
import { createScheduleSchema } from "../validations";

describe("Timetable Conflict Logic & Time Calculations", () => {
  it("แปลงรูปแบบเวลา HH:mm เป็นจำนวนนาทีได้ถูกต้อง", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("08:30")).toBe(8 * 60 + 30); // 510
    expect(timeToMinutes("11:15")).toBe(11 * 60 + 15); // 675
    expect(timeToMinutes("13:00")).toBe(13 * 60); // 780
    expect(timeToMinutes("16:30")).toBe(16 * 60 + 30); // 990
  });

  it("ตรวจจับการทับซ้อนของเวลา (Time Overlap) ได้อย่างถูกต้อง", () => {
    // ซ้อนทับกันเต็ม/บางส่วน
    expect(isTimeOverlapping("08:30", "11:15", "09:00", "10:30")).toBe(true);
    expect(isTimeOverlapping("08:30", "11:15", "10:00", "12:00")).toBe(true);
    expect(isTimeOverlapping("08:30", "11:15", "08:00", "09:00")).toBe(true);

    // ต่อเนื่องกันที่จุดขอบเวลาพอดี (ไม่ถือว่าชน)
    expect(isTimeOverlapping("08:30", "11:15", "11:15", "13:00")).toBe(false);
    expect(isTimeOverlapping("11:15", "13:00", "13:00", "16:00")).toBe(false);

    // ห่างกันชัดเจน
    expect(isTimeOverlapping("08:30", "11:15", "13:00", "15:45")).toBe(false);
  });

  it("ตรวจจับการคาบเกี่ยวกับช่วงเวลาฉันภัตตาหารเพล (11:15 - 13:00 น.)", () => {
    // ภาคเช้า 08:30 - 11:15 ไม่คาบเกี่ยว
    expect(isTimeOverlapping("08:30", "11:15", "11:15", "13:00")).toBe(false);

    // ภาคบ่าย 13:00 - 15:45 ไม่คาบเกี่ยว
    expect(isTimeOverlapping("13:00", "15:45", "11:15", "13:00")).toBe(false);

    // คาบเกี่ยว เช่น สอน 10:00 - 12:00 น.
    expect(isTimeOverlapping("10:00", "12:00", "11:15", "13:00")).toBe(true);

    // คาบเกี่ยว เช่น สอน 12:30 - 14:30 น.
    expect(isTimeOverlapping("12:30", "14:30", "11:15", "13:00")).toBe(true);
  });

  it("ตรวจสอบความถูกต้องของ createScheduleSchema ด้วย Zod", () => {
    const validPayload = {
      programId: "2972fe70-2a1e-458d-a7eb-eb2a68b03aa0",
      courseId: "2972fe70-2a1e-458d-a7eb-eb2a68b03aa1",
      personnelId: "2972fe70-2a1e-458d-a7eb-eb2a68b03aa2",
      academicYear: 2569,
      semester: 1,
      yearLevel: 1,
      dayOfWeek: 1,
      startTime: "08:30",
      endTime: "11:15",
      room: "ห้อง 301",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
    };

    const parsed = createScheduleSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);

    // ทดสอบเวลาไม่ตรง Regex เช่น "8:30" (ต้องมี 0 นำหน้าเป็น "08:30")
    const invalidTime = { ...validPayload, startTime: "8:30" };
    const invalidTimeResult = createScheduleSchema.safeParse(invalidTime);
    expect(invalidTimeResult.success).toBe(false);

    // ทดสอบวันในสัปดาห์เกิน 7
    const invalidDay = { ...validPayload, dayOfWeek: 8 };
    const invalidDayResult = createScheduleSchema.safeParse(invalidDay);
    expect(invalidDayResult.success).toBe(false);
  });
});
