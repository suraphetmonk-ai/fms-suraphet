# Implementation Plan: ระบบจองห้องประชุมและยานพาหนะ (`bookings`)

## Task-by-Task Execution Checklist

- [ ] **Step 1: Database Model & Migration**
  - [ ] เพิ่มโมเดล `Room`, `Vehicle`, `Booking` และ relations กับ `User` ใน `prisma/schema.prisma`
  - [ ] รัน Migration `add_bookings_and_facilities`
  - [ ] สร้าง Seed file `prisma/seed-bookings.ts` และรัน Seed ข้อมูลจำลอง

- [ ] **Step 2: Internal Services & Validations**
  - [ ] กำหนดสิทธิ์ใน `src/features/bookings/permissions.ts` และลงทะเบียนใน `src/permissions.ts`
  - [ ] สร้างพจนานุกรมคำแปลใน `src/features/bookings/messages.ts` และลงทะเบียนใน `src/i18n/index.ts`
  - [ ] สร้าง Zod validation schemas ใน `src/features/bookings/_internal/validations.ts`
  - [ ] สร้าง Services & Conflict Detection ใน `src/features/bookings/_internal/services.ts`
  - [ ] สร้าง Unit Tests ใน `src/features/bookings/_internal/validations.test.ts`

- [ ] **Step 3: Server Actions & Public APIs**
  - [ ] สร้าง Server Actions ใน `src/features/bookings/_internal/actions.ts` ด้วย `runAction` & `requirePermission`
  - [ ] ส่งออก Public API ใน `index.ts`, `server.ts`, `actions.ts`

- [ ] **Step 4: UI Development (Portal & Admin)**
  - [ ] สร้าง Admin Console `src/app/(admin)/admin/bookings/` (5 แท็บการทำงาน)
  - [ ] สร้าง Public Portal `src/app/(public)/bookings/page.tsx`
  - [ ] เชื่อมต่อเส้นทางใน `src/proxy.ts` และเพิ่มเมนูใน `src/components/layout/sidebar-nav.ts`

- [ ] **Step 5: Quality Gates & Verification**
  - [ ] รัน `npm run type-check` (0 errors)
  - [ ] รัน `npm run lint` และ `npm run deps:check` (0 violations)
  - [ ] รัน `npm run test` (All tests pass 100%)
  - [ ] รัน `npm run build` (Turbopack compile passes)
