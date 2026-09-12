import { describe, it, expect } from "vitest";
import { createUserSchema, updateUserSchema, importUsersSchema } from "./users";

const ROLE_A = "11111111-1111-4111-8111-111111111111";
const ROLE_B = "22222222-2222-4222-8222-222222222222";
const assign = (roleId: string) => ({ roleId, scopeType: "ALL" as const, scopeId: null });

/**
 * B4 — `@@unique([userTenantId, roleId, scopeType, scopeId])` ไม่ dedupe เมื่อ `scope_id` เป็น NULL
 * (มาตรฐาน SQL: NULL ≠ NULL) `createMany` จึงแทรก (roleId, ALL, null) ซ้ำได้ ผลคือ memberCount ของ
 * บทบาทพองเกินจริงและลบบทบาทนั้นไม่ได้อีกเลย — ฐานข้อมูลกันให้ไม่ได้ ต้องกันที่ชั้น validation
 */
describe("roleAssignments — กันบทบาทซ้ำในคำขอเดียว", () => {
  it("createUser: บทบาทเดียวกันสองครั้ง → validation ล้ม", () => {
    const r = createUserSchema.safeParse({ email: "a@b.co", name: "A", roles: [assign(ROLE_A), assign(ROLE_A)] });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.message === "duplicate_role_assignment")).toBe(true);
  });

  it("createUser: บทบาทต่างกัน → ผ่าน", () => {
    expect(createUserSchema.safeParse({ email: "a@b.co", name: "A", roles: [assign(ROLE_A), assign(ROLE_B)] }).success).toBe(true);
  });

  it("updateUser: กฎเดียวกันเมื่อส่ง roles มาด้วย และไม่บังคับเมื่อไม่ส่ง", () => {
    expect(updateUserSchema.safeParse({ userId: ROLE_A, roles: [assign(ROLE_B), assign(ROLE_B)] }).success).toBe(false);
    expect(updateUserSchema.safeParse({ userId: ROLE_A, name: "A" }).success).toBe(true);
  });
});

describe("importUsersSchema — ตรวจสอบโครงสร้างข้อมูลนำเข้าจาก CSV", () => {
  it("แถวข้อมูลถูกต้อง → ผ่าน", () => {
    const r = importUsersSchema.safeParse({
      rows: [
        { name: "สมชาย ใจดี", email: "somchai@example.com", roleCode: "ADMIN", status: "active" },
        { name: "สมหญิง รักเรียน", email: "somying@example.com", roleCode: "STAFF", status: "inactive" },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("อีเมลผิดรูปแบบ → validation ล้ม", () => {
    const r = importUsersSchema.safeParse({
      rows: [{ name: "สมชาย", email: "invalid-email", roleCode: "ADMIN" }],
    });
    expect(r.success).toBe(false);
  });

  it("ชื่อว่างเปล่า → validation ล้ม", () => {
    const r = importUsersSchema.safeParse({
      rows: [{ name: "   ", email: "user@example.com", roleCode: "STAFF" }],
    });
    expect(r.success).toBe(false);
  });

  it("ไม่มีแถวข้อมูล (empty rows) → validation ล้ม", () => {
    const r = importUsersSchema.safeParse({ rows: [] });
    expect(r.success).toBe(false);
  });
});
