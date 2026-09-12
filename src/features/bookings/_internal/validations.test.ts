import { describe, it, expect } from "vitest";
import {
  createBookingSchema,
  approveBookingSchema,
  rejectBookingSchema,
  createRoomSchema,
  createVehicleSchema,
} from "./validations";

const VALID_ROOM_ID = "11111111-1111-4111-8111-111111111111";
const VALID_VEHICLE_ID = "22222222-2222-4222-8222-222222222222";
const VALID_BOOKING_ID = "33333333-3333-4333-8333-333333333333";

describe("Booking Validations", () => {
  it("ผ่านเมื่อข้อมูลการจองห้องประชุมถูกต้องและเวลาสิ้นสุดหลังเวลาเริ่มต้น", () => {
    const validData = {
      resourceType: "ROOM" as const,
      roomId: VALID_ROOM_ID,
      title: "ประชุมอาจารย์ประจำภาควิชา",
      startDateTime: "2026-10-15T09:00:00.000Z",
      endDateTime: "2026-10-15T12:00:00.000Z",
      participantCount: 20,
      contactName: "อ.ดร. นันทวัน รักษ์วิชา",
      contactPhone: "081-123-4567",
      department: "ภาควิชาวิทยาการคอมพิวเตอร์",
      specialRequests: "ขอจอ 4K และไมค์ 2 ตัว",
    };

    const result = createBookingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("ผ่านเมื่อข้อมูลการจองยานพาหนะถูกต้อง", () => {
    const validVehicleData = {
      resourceType: "VEHICLE" as const,
      vehicleId: VALID_VEHICLE_ID,
      title: "ไปราชการประชุมวิชาการ",
      startDateTime: "2026-10-20T06:00:00.000Z",
      endDateTime: "2026-10-20T18:00:00.000Z",
      participantCount: 8,
      contactName: "นายสมชาย ใจดี",
      contactPhone: "089-876-5432",
      destination: "มหาวิทยาลัยเชียงใหม่",
      driverRequired: true,
    };

    const result = createBookingSchema.safeParse(validVehicleData);
    expect(result.success).toBe(true);
  });

  it("ไม่ผ่านเมื่อเวลาสิ้นสุดมาก่อนหรือเท่ากับเวลาเริ่มต้น", () => {
    const invalidTimeData = {
      resourceType: "ROOM" as const,
      roomId: VALID_ROOM_ID,
      title: "ประชุมสัมมนา",
      startDateTime: "2026-10-15T12:00:00.000Z",
      endDateTime: "2026-10-15T09:00:00.000Z",
      participantCount: 10,
      contactName: "อ.สมใจ",
      contactPhone: "081-000-0000",
    };

    const result = createBookingSchema.safeParse(invalidTimeData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("End time must be after start time");
    }
  });

  it("ไม่ผ่านเมื่อเลือกประเภท ROOM แต่ไม่ได้ระบุ roomId", () => {
    const missingRoomIdData = {
      resourceType: "ROOM" as const,
      title: "ประชุมสัมมนา",
      startDateTime: "2026-10-15T09:00:00.000Z",
      endDateTime: "2026-10-15T12:00:00.000Z",
      participantCount: 10,
      contactName: "อ.สมใจ",
      contactPhone: "081-000-0000",
    };

    const result = createBookingSchema.safeParse(missingRoomIdData);
    expect(result.success).toBe(false);
  });

  it("ตรวจสอบการอนุมัติและการปฏิเสธคำขอ", () => {
    const approveResult = approveBookingSchema.safeParse({ bookingId: VALID_BOOKING_ID });
    expect(approveResult.success).toBe(true);

    const validReject = rejectBookingSchema.safeParse({
      bookingId: VALID_BOOKING_ID,
      reason: "ห้องติดภารกิจงานพระราชทานปริญญาบัตร",
    });
    expect(validReject.success).toBe(true);

    const invalidReject = rejectBookingSchema.safeParse({
      bookingId: VALID_BOOKING_ID,
      reason: "no", // สั้นเกินไป < 3 chars
    });
    expect(invalidReject.success).toBe(false);
  });

  it("ตรวจสอบข้อมูลการสร้างห้องประชุมและยานพาหนะ", () => {
    const validRoom = createRoomSchema.safeParse({
      roomCode: "MR-505",
      nameTh: "ห้องประชุมสารสนเทศ",
      nameEn: "Information Room 505",
      building: "อาคารนวัตกรรม",
      floor: 5,
      capacity: 30,
      roomType: "MEETING_ROOM",
      facilities: ["Projector", "Mic"],
      status: "AVAILABLE",
    });
    expect(validRoom.success).toBe(true);

    const validVehicle = createVehicleSchema.safeParse({
      plateNumber: "ฮฮ 9999 กทม.",
      brand: "Toyota",
      model: "Alphard VIP",
      vehicleType: "VAN",
      capacity: 6,
      driverName: "นายชลิต",
      driverPhone: "081-999-8888",
      status: "AVAILABLE",
    });
    expect(validVehicle.success).toBe(true);
  });
});
