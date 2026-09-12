# AI Coding Instructions & Rules: ระบบจองห้องประชุมและยานพาหนะ (`bookings`)

## 1. กฎเกณฑ์สถาปัตยกรรม (Architectural Rules)
- พัฒนาภายในขอบเขตโมดูล `src/features/bookings/` เท่านั้น
- โครงสร้างโมดูลต้องปฏิบัติตามมาตรฐาน Modular Monolith:
  - `src/features/bookings/index.ts`: Public Client-safe Types & Helpers
  - `src/features/bookings/server.ts`: Server-only data queries สำหรับ Server Components
  - `src/features/bookings/actions.ts`: Server Actions re-export (ห้ามมี `"use server";` ใน re-export file นี้)
  - `src/features/bookings/_internal/`: ซ่อน Internal Logic ทั้งหมด ห้ามโมดูลภายนอก import ตรงจากโฟลเดอร์นี้เด็ดขาด
- รัน Server Actions ผ่าน `runAction` และบังคับตรวจสิทธิ์ด้วย `requirePermission`
- ข้อมูลทุกเรคอร์ดต้องผูกกับ `ctx.tenantId` จาก Session เสมอ ห้ามรับ `tenantId` จาก Client DTO

## 2. การจัดการ UI และการออกแบบ (Liyon Design System)
- ใช้ Components จาก `@/shared/components/liyon` (LiyonButton, LiyonInput, LiyonSelect, LiyonDialog, LiyonBadge, LiyonCard)
- ห้ามใส่ `onClick` หรือ `style` ตรงลงใน `LiyonCard` (หากต้องการ ให้ห่อด้วย `div` หรือใช้ Tailwind classes)
- ห้ามฮาร์ดโค้ดข้อความภาษาใน UI: ทุกข้อความต้องดึงจากพจนานุกรมผ่าน `t("bookings.*")`
- จัดการเวลาและวันที่โดยใช้ `formatDate` เพื่อรองรับปี พ.ศ. (TH) และ ค.ศ. (EN)

## 3. กฎเกณฑ์ทางเทคนิคและ Quality Gates
- ห้ามเขียน JSX ภายในบล็อก `try/catch` ใน Server Components
- ใช้ `zodErrorMap(locale)` ใน Zod Validation เสมอ
- ต้องผ่าน `npm run check` (type-check, lint, deps:check, test) 100%
