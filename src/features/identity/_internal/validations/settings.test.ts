import { describe, it, expect } from "vitest";
import { updateSettingsSchema } from "./settings";

describe("updateSettingsSchema", () => {
  it("ยอมรับ URL เต็ม (http / https)", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      logoUrl: "https://example.com/logo.png",
      palette: "blue",
    });
    expect(r.success).toBe(true);
  });

  it("ยอมรับ relative path สำหรับไฟล์ที่อัปโหลด (ขึ้นต้นด้วย /)", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      logoUrl: "/uploads/logos/logo-123.png",
      palette: "blue",
    });
    expect(r.success).toBe(true);
  });

  it("ยอมรับค่าว่าง (ไม่มีโลโก้)", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      logoUrl: "",
      palette: "blue",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.logoUrl).toBe("");
  });

  it("ยอมรับ null และแปลงเป็นค่าว่าง", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      logoUrl: null,
      palette: "blue",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.logoUrl).toBe("");
  });

  it("ยอมรับ undefined และแปลงเป็นค่าว่าง", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      palette: "blue",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.logoUrl).toBe("");
  });

  it("ปฏิเสธค่าที่ไม่ใช่ URL หรือไม่ขึ้นต้นด้วย /", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      logoUrl: "javascript:alert(1)",
      palette: "blue",
    });
    expect(r.success).toBe(false);
  });

  it("ปฏิเสธข้อความที่เกิน 500 ตัวอักษร", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      logoUrl: "/" + "a".repeat(501),
      palette: "blue",
    });
    expect(r.success).toBe(false);
  });

  it("ยอมรับการตั้งค่า Gmail SMTP ที่ถูกต้อง", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      palette: "blue",
      smtp: {
        provider: "gmail",
        enabled: true,
        user: "admin@gmail.com",
        pass: "abcd efgh ijkl mnop",
        fromName: "Admin FMS",
        port: 465,
        secure: true,
      },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.smtp?.enabled).toBe(true);
      expect(r.data.smtp?.user).toBe("admin@gmail.com");
    }
  });

  it("ปฏิเสธเมื่อกรอกอีเมล Gmail ผู้ส่งไม่ถูกต้อง", () => {
    const r = updateSettingsSchema.safeParse({
      nameTh: "มหาวิทยาลัย",
      nameEn: "University",
      palette: "blue",
      smtp: {
        provider: "gmail",
        enabled: true,
        user: "invalid-email",
      },
    });
    expect(r.success).toBe(false);
  });
});

