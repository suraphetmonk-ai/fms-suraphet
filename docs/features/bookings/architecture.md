# Technical Architecture & Flow: ระบบจองห้องประชุมและยานพาหนะ (`bookings`)

## 1. Folder Structure
```
src/features/bookings/
├── index.ts                      # Client-safe exports (Types, Constants)
├── server.ts                     # Server-only exports (Data queries)
├── actions.ts                    # Server Actions public re-exports
├── permissions.ts                # RBAC permissions
├── messages.ts                   # i18n dictionaries (th/en)
└── _internal/
    ├── validations.ts            # Zod validation schemas with conflict rules
    ├── validations.test.ts       # Vitest unit tests
    ├── services.ts               # Core business services & conflict checker
    └── actions.ts                # Server Actions wrapped in runAction
```

## 2. Route Mapping
- **Public Portal Route:** `src/app/(public)/bookings/page.tsx` (`/bookings`)
  - ตารางปฏิทินและสถานะความพร้อมใช้งานของห้องประชุมและยานพาหนะ (Whitelisted ใน `src/proxy.ts`)
- **Admin Console Route:** `src/app/(admin)/admin/bookings/page.tsx` (`/admin/bookings`)
  - คอนโซลบริหารจัดการ 5 แท็บ: คำขอด่วนรออนุมัติ, ตารางปฏิทินรวม, ประวัติการจองทั้งหมด, จัดการห้องประชุม, จัดการยานพาหนะ

## 3. State Machine & Booking Lifecycle
```
[ยื่นคำขอจอง / SUBMIT]
         │
         ▼
     [PENDING] ─── (เจ้าหน้าที่ตรวจสอบตาราง & อนุมัติ) ───► [APPROVED]
         │                                                      │
         ├─── (เจ้าหน้าที่ปฏิเสธ / ระบุเหตุผล) ───► [REJECTED]       │
         │                                                      │
         └─── (ผู้ขอยกเลิกคำขอ) ─────────────────► [CANCELLED] ◄─┘ (ยกเลิกก่อนเริ่ม)
                                                                │
                                                                ▼
                                                          [COMPLETED]
```

## 4. Conflict Detection Logic (ป้องกันการจองซ้อน)
สำหรับทรัพยากร $R$ (ไม่ว่าจะเป็น `roomId` หรือ `vehicleId`) การจองใหม่ช่วง $[S_{new}, E_{new}]$ จะเกิดข้อขัดแย้ง (Conflict) ก็ต่อเมื่อมีเรคอร์ดเดิมที่มีสถานะ `APPROVED` หรือ `PENDING` ในช่วงเวลา:
$$\text{Overlap} \iff (S_{existing} < E_{new}) \land (E_{existing} > S_{new})$$

## 5. Central Registration
- **Permissions:** ลงทะเบียนใน `src/permissions.ts`
- **i18n:** ลงทะเบียนใน `src/i18n/index.ts`
- **Sidebar:** ลงทะเบียนใน `src/components/layout/sidebar-nav.ts`
