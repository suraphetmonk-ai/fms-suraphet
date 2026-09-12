# Data Model & Validations: ระบบจองห้องประชุมและยานพาหนะ (`bookings`)

## 1. Prisma Models

```prisma
model Room {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  roomCode    String   @map("room_code")
  nameTh      String   @map("name_th")
  nameEn      String   @map("name_en")
  building    String
  floor       Int
  capacity    Int
  roomType    String   @default("MEETING_ROOM") @map("room_type")
  facilities  String[] @default([])
  imageUrl    String?  @map("image_url")
  status      String   @default("AVAILABLE")
  orderIndex  Int      @default(0) @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  bookings    Booking[]

  @@unique([tenantId, roomCode])
  @@index([tenantId, status])
  @@map("rooms")
}

model Vehicle {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  plateNumber String   @map("plate_number")
  brand       String
  model       String
  vehicleType String   @default("VAN") @map("vehicle_type")
  capacity    Int
  driverName  String?  @map("driver_name")
  driverPhone String?  @map("driver_phone")
  imageUrl    String?  @map("image_url")
  status      String   @default("AVAILABLE")
  orderIndex  Int      @default(0) @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  bookings    Booking[]

  @@unique([tenantId, plateNumber])
  @@index([tenantId, status])
  @@map("vehicles")
}

model Booking {
  id               String    @id @default(uuid()) @db.Uuid
  tenantId         String    @map("tenant_id") @db.Uuid
  bookingCode      String    @map("booking_code")
  resourceType     String    @map("resource_type") // "ROOM" | "VEHICLE"
  roomId           String?   @map("room_id") @db.Uuid
  vehicleId        String?   @map("vehicle_id") @db.Uuid
  userId           String    @map("user_id") @db.Uuid
  title            String
  startDateTime    DateTime  @map("start_date_time")
  endDateTime      DateTime  @map("end_date_time")
  participantCount Int       @default(1) @map("participant_count")
  contactName      String    @map("contact_name")
  contactPhone     String    @map("contact_phone")
  department       String?
  destination      String?
  driverRequired   Boolean   @default(true) @map("driver_required")
  specialRequests  String?   @map("special_requests") @db.Text
  status           String    @default("PENDING") // "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED"
  approvedById     String?   @map("approved_by_id") @db.Uuid
  approvedAt       DateTime? @map("approved_at")
  rejectReason     String?   @map("reject_reason") @db.Text
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  room             Room?     @relation(fields: [roomId], references: [id], onDelete: SetNull)
  vehicle          Vehicle?  @relation(fields: [vehicleId], references: [id], onDelete: SetNull)
  user             User      @relation("UserBookings", fields: [userId], references: [id], onDelete: Cascade)
  approvedBy       User?     @relation("UserApprovedBookings", fields: [approvedById], references: [id], onDelete: SetNull)

  @@unique([tenantId, bookingCode])
  @@index([tenantId, resourceType, status])
  @@index([roomId, startDateTime, endDateTime])
  @@index([vehicleId, startDateTime, endDateTime])
  @@map("bookings")
}
```

## 2. Zod Validation Schemas
- `createBookingSchema`: ตรวจสอบ `resourceType`, `startDateTime`, `endDateTime`, ความสัมพันธ์กับ `roomId` หรือ `vehicleId`, และตรวจสอบว่า `endDateTime > startDateTime`
- `approveBookingSchema`: ตรวจสอบ `bookingId`
- `rejectBookingSchema`: ตรวจสอบ `bookingId`, `reason` (ความยาวอย่างน้อย 3 ตัวอักษร)
- `cancelBookingSchema`: ตรวจสอบ `bookingId`
- `createRoomSchema`, `updateRoomSchema`: รหัสห้อง, ชื่อ, ความจุ, อุปกรณ์
- `createVehicleSchema`, `updateVehicleSchema`: ทะเบียน, รุ่น, คนขับ, เบอร์
