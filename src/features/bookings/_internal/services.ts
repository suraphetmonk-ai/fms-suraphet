import { prisma } from "@/shared/lib/infra/prisma";
import type { Prisma } from "@/generated/prisma";
import { errors } from "@/shared/lib/errors";
import { writeAudit } from "@/features/identity/server";
import type {
  CreateBookingInput,
  ApproveBookingInput,
  RejectBookingInput,
  CancelBookingInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateVehicleInput,
  UpdateVehicleInput,
} from "./validations";

export interface BookingDto {
  id: string;
  tenantId: string;
  bookingCode: string;
  resourceType: "ROOM" | "VEHICLE";
  roomId: string | null;
  vehicleId: string | null;
  userId: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  participantCount: number;
  contactName: string;
  contactPhone: string;
  department: string | null;
  destination: string | null;
  driverRequired: boolean;
  specialRequests: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  approvedById: string | null;
  approvedByName?: string | null;
  approvedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  room?: {
    id: string;
    roomCode: string;
    nameTh: string;
    nameEn: string;
    building: string;
    floor: number;
    capacity: number;
    roomType: string;
    facilities: string[];
  } | null;
  vehicle?: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
    vehicleType: string;
    capacity: number;
    driverName: string | null;
    driverPhone: string | null;
  } | null;
}

export interface RoomDto {
  id: string;
  tenantId: string;
  roomCode: string;
  nameTh: string;
  nameEn: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: string;
  facilities: string[];
  imageUrl: string | null;
  status: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleDto {
  id: string;
  tenantId: string;
  plateNumber: string;
  brand: string;
  model: string;
  vehicleType: string;
  capacity: number;
  driverName: string | null;
  driverPhone: string | null;
  imageUrl: string | null;
  status: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingMetricsDto {
  pendingCount: number;
  todayActiveCount: number;
  roomsCount: number;
  vehiclesCount: number;
}

/**
 * ตรวจสอบความขัดแย้งของช่วงเวลาการจอง (Conflict Detection)
 */
export async function checkResourceConflict(
  tenantId: string,
  params: {
    resourceType: "ROOM" | "VEHICLE";
    roomId?: string | null;
    vehicleId?: string | null;
    startDateTime: Date;
    endDateTime: Date;
    excludeBookingId?: string;
  }
) {
  const conflict = await prisma.booking.findFirst({
    where: {
      tenantId,
      status: { in: ["APPROVED", "PENDING"] },
      id: params.excludeBookingId ? { not: params.excludeBookingId } : undefined,
      ...(params.resourceType === "ROOM" && params.roomId ? { roomId: params.roomId } : {}),
      ...(params.resourceType === "VEHICLE" && params.vehicleId ? { vehicleId: params.vehicleId } : {}),
      startDateTime: { lt: params.endDateTime },
      endDateTime: { gt: params.startDateTime },
    },
    include: {
      room: true,
      vehicle: true,
      user: { select: { name: true, email: true } },
    },
  });

  return {
    hasConflict: !!conflict,
    conflictBooking: conflict,
  };
}

/**
 * สร้างรหัสใบจองอัตโนมัติ เช่น BK-2569-0001
 */
export async function generateBookingCode(tenantId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const buddhistYear = currentYear + 543;
  const prefix = `BK-${buddhistYear}-`;

  const lastBooking = await prisma.booking.findFirst({
    where: {
      tenantId,
      bookingCode: { startsWith: prefix },
    },
    orderBy: { bookingCode: "desc" },
    select: { bookingCode: true },
  });

  let nextSequence = 1;
  if (lastBooking?.bookingCode) {
    const parts = lastBooking.bookingCode.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  return `${prefix}${nextSequence.toString().padStart(4, "0")}`;
}

/**
 * สรุปตัวเลขสถิติสำหรับ Dashboard
 */
export async function getBookingMetrics(tenantId: string): Promise<BookingMetricsDto> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const [pendingCount, todayActiveCount, roomsCount, vehiclesCount] = await Promise.all([
    prisma.booking.count({
      where: { tenantId, status: "PENDING" },
    }),
    prisma.booking.count({
      where: {
        tenantId,
        status: "APPROVED",
        startDateTime: { lte: endOfDay },
        endDateTime: { gte: startOfDay },
      },
    }),
    prisma.room.count({
      where: { tenantId, status: "AVAILABLE" },
    }),
    prisma.vehicle.count({
      where: { tenantId, status: "AVAILABLE" },
    }),
  ]);

  return {
    pendingCount,
    todayActiveCount,
    roomsCount,
    vehiclesCount,
  };
}

/**
 * ค้นหาและดึงรายการจองพร้อมความสัมพันธ์
 */
export async function listBookings(
  tenantId: string,
  options?: {
    resourceType?: string;
    status?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    take?: number;
    skip?: number;
  }
): Promise<BookingDto[]> {
  const where: Prisma.BookingWhereInput = { tenantId };

  if (options?.resourceType && options.resourceType !== "ALL") {
    where.resourceType = options.resourceType;
  }

  if (options?.status && options.status !== "ALL") {
    where.status = options.status;
  }

  if (options?.startDate || options?.endDate) {
    const andList: Prisma.BookingWhereInput[] = [];
    if (options.startDate) {
      andList.push({ endDateTime: { gte: options.startDate } });
    }
    if (options.endDate) {
      andList.push({ startDateTime: { lte: options.endDate } });
    }
    where.AND = andList;
  }

  if (options?.search?.trim()) {
    const q = options.search.trim();
    where.OR = [
      { bookingCode: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { department: { contains: q, mode: "insensitive" } },
      { room: { nameTh: { contains: q, mode: "insensitive" } } },
      { vehicle: { plateNumber: { contains: q, mode: "insensitive" } } },
    ];
  }

  const items = await prisma.booking.findMany({
    where,
    include: {
      room: true,
      vehicle: true,
      user: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { startDateTime: "desc" },
    take: options?.take ?? 100,
    skip: options?.skip ?? 0,
  });

  return items.map((b) => ({
    id: b.id,
    tenantId: b.tenantId,
    bookingCode: b.bookingCode,
    resourceType: b.resourceType as "ROOM" | "VEHICLE",
    roomId: b.roomId,
    vehicleId: b.vehicleId,
    userId: b.userId,
    title: b.title,
    startDateTime: b.startDateTime.toISOString(),
    endDateTime: b.endDateTime.toISOString(),
    participantCount: b.participantCount,
    contactName: b.contactName,
    contactPhone: b.contactPhone,
    department: b.department,
    destination: b.destination,
    driverRequired: b.driverRequired,
    specialRequests: b.specialRequests,
    status: b.status as BookingDto["status"],
    approvedById: b.approvedById,
    approvedByName: b.approvedBy?.name ?? null,
    approvedAt: b.approvedAt ? b.approvedAt.toISOString() : null,
    rejectReason: b.rejectReason,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    user: b.user,
    room: b.room
      ? {
          id: b.room.id,
          roomCode: b.room.roomCode,
          nameTh: b.room.nameTh,
          nameEn: b.room.nameEn,
          building: b.room.building,
          floor: b.room.floor,
          capacity: b.room.capacity,
          roomType: b.room.roomType,
          facilities: b.room.facilities,
        }
      : null,
    vehicle: b.vehicle
      ? {
          id: b.vehicle.id,
          plateNumber: b.vehicle.plateNumber,
          brand: b.vehicle.brand,
          model: b.vehicle.model,
          vehicleType: b.vehicle.vehicleType,
          capacity: b.vehicle.capacity,
          driverName: b.vehicle.driverName,
          driverPhone: b.vehicle.driverPhone,
        }
      : null,
  }));
}

/**
 * ดึงข้อมูลตารางการจองสำหรับ Public Portal (ไม่แสดงข้อมูลติดต่อส่วนบุคคล)
 */
export async function getPublicSchedule(
  tenantId: string,
  options?: { startDate?: Date; endDate?: Date }
) {
  const where: Prisma.BookingWhereInput = {
    tenantId,
    status: { in: ["APPROVED"] },
  };

  if (options?.startDate || options?.endDate) {
    const andList: Prisma.BookingWhereInput[] = [];
    if (options.startDate) {
      andList.push({ endDateTime: { gte: options.startDate } });
    }
    if (options.endDate) {
      andList.push({ startDateTime: { lte: options.endDate } });
    }
    where.AND = andList;
  }

  const items = await prisma.booking.findMany({
    where,
    include: {
      room: true,
      vehicle: true,
    },
    orderBy: { startDateTime: "asc" },
  });

  return items.map((b) => ({
    id: b.id,
    bookingCode: b.bookingCode,
    resourceType: b.resourceType,
    title: b.title,
    startDateTime: b.startDateTime.toISOString(),
    endDateTime: b.endDateTime.toISOString(),
    department: b.department,
    destination: b.destination,
    room: b.room
      ? {
          roomCode: b.room.roomCode,
          nameTh: b.room.nameTh,
          nameEn: b.room.nameEn,
          building: b.room.building,
          floor: b.room.floor,
          capacity: b.room.capacity,
        }
      : null,
    vehicle: b.vehicle
      ? {
          plateNumber: b.vehicle.plateNumber,
          brand: b.vehicle.brand,
          model: b.vehicle.model,
          vehicleType: b.vehicle.vehicleType,
        }
      : null,
  }));
}

/**
 * สร้างคำขอจองห้องประชุมหรือยานพาหนะใหม่
 */
export async function createBooking(
  tenantId: string,
  userId: string,
  input: CreateBookingInput
): Promise<BookingDto> {
  const start = new Date(input.startDateTime);
  const end = new Date(input.endDateTime);

  // ตรวจสอบ Conflict
  const { hasConflict, conflictBooking } = await checkResourceConflict(tenantId, {
    resourceType: input.resourceType,
    roomId: input.roomId,
    vehicleId: input.vehicleId,
    startDateTime: start,
    endDateTime: end,
  });

  if (hasConflict && conflictBooking) {
    const resourceName =
      conflictBooking.room?.nameTh || conflictBooking.vehicle?.plateNumber || "ทรัพยากรที่เลือก";
    throw errors.conflict(
      `เกิดการจองซ้อน! ${resourceName} มีการจองแล้วในช่วงเวลาดังกล่าว (${conflictBooking.bookingCode}: ${conflictBooking.title})`
    );
  }

  const bookingCode = await generateBookingCode(tenantId);

  const booking = await prisma.booking.create({
    data: {
      tenantId,
      bookingCode,
      resourceType: input.resourceType,
      roomId: input.resourceType === "ROOM" ? input.roomId : null,
      vehicleId: input.resourceType === "VEHICLE" ? input.vehicleId : null,
      userId,
      title: input.title,
      startDateTime: start,
      endDateTime: end,
      participantCount: input.participantCount,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      department: input.department ?? null,
      destination: input.destination ?? null,
      driverRequired: input.driverRequired,
      specialRequests: input.specialRequests ?? null,
      status: "PENDING",
    },
    include: {
      room: true,
      vehicle: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    ...booking,
    resourceType: booking.resourceType as "ROOM" | "VEHICLE",
    status: booking.status as BookingDto["status"],
    startDateTime: booking.startDateTime.toISOString(),
    endDateTime: booking.endDateTime.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    approvedAt: null,
    approvedByName: null,
  };
}

/**
 * อนุมัติคำขอจอง
 */
export async function approveBooking(
  tenantId: string,
  approverId: string,
  input: ApproveBookingInput
): Promise<void> {
  const booking = await prisma.booking.findFirst({
    where: { id: input.bookingId, tenantId },
    include: { room: true, vehicle: true },
  });

  if (!booking) {
    throw errors.not_found("ไม่พบข้อมูลการจอง");
  }

  if (booking.status !== "PENDING") {
    throw errors.validation("สามารถอนุมัติได้เฉพาะคำขอที่อยู่ในสถานะรอพิจารณาเท่านั้น");
  }

  // Double-check conflict before approving
  const { hasConflict, conflictBooking } = await checkResourceConflict(tenantId, {
    resourceType: booking.resourceType as "ROOM" | "VEHICLE",
    roomId: booking.roomId,
    vehicleId: booking.vehicleId,
    startDateTime: booking.startDateTime,
    endDateTime: booking.endDateTime,
    excludeBookingId: booking.id,
  });

  if (hasConflict && conflictBooking?.status === "APPROVED") {
    throw errors.conflict(
      `ไม่สามารถอนุมัติได้เนื่องจากมีคำขออื่นได้รับการอนุมัติในช่วงเวลานี้ไปแล้ว (${conflictBooking.bookingCode})`
    );
  }

  const now = new Date();
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "APPROVED",
      approvedById: approverId,
      approvedAt: now,
    },
  });

  await writeAudit({
    tenantId,
    actorId: approverId,
    action: "booking.approve",
    entity: "booking",
    entityId: booking.id,
    before: { status: booking.status },
    after: { status: "APPROVED", bookingCode: booking.bookingCode },
  });
}

/**
 * ปฏิเสธคำขอจอง
 */
export async function rejectBooking(
  tenantId: string,
  approverId: string,
  input: RejectBookingInput
): Promise<void> {
  const booking = await prisma.booking.findFirst({
    where: { id: input.bookingId, tenantId },
  });

  if (!booking) {
    throw errors.not_found("ไม่พบข้อมูลการจอง");
  }

  if (booking.status !== "PENDING") {
    throw errors.validation("สามารถปฏิเสธได้เฉพาะคำขอที่อยู่ในสถานะรอพิจารณาเท่านั้น");
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "REJECTED",
      approvedById: approverId,
      rejectReason: input.reason,
    },
  });

  await writeAudit({
    tenantId,
    actorId: approverId,
    action: "booking.reject",
    entity: "booking",
    entityId: booking.id,
    before: { status: booking.status },
    after: { status: "REJECTED", rejectReason: input.reason },
  });
}

/**
 * ยกเลิกการจอง (โดยเจ้าของคำขอ หรือ Admin)
 */
export async function cancelBooking(
  tenantId: string,
  userId: string,
  input: CancelBookingInput,
  isAdmin = false
): Promise<void> {
  const booking = await prisma.booking.findFirst({
    where: { id: input.bookingId, tenantId },
  });

  if (!booking) {
    throw errors.not_found("ไม่พบข้อมูลการจอง");
  }

  if (!isAdmin && booking.userId !== userId) {
    throw errors.forbidden("คุณไม่มีสิทธิ์ยกเลิกรายการจองของผู้อื่น");
  }

  if (booking.status === "CANCELLED" || booking.status === "REJECTED") {
    throw errors.validation("รายการนี้ถูกยกเลิกหรือไม่อนุมัติไปแล้ว");
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
    },
  });

  await writeAudit({
    tenantId,
    actorId: userId,
    action: "booking.cancel",
    entity: "booking",
    entityId: booking.id,
    before: { status: booking.status },
    after: { status: "CANCELLED" },
  });
}

/**
 * ดึงรายการห้องประชุมทั้งหมด
 */
export async function listRooms(tenantId: string): Promise<RoomDto[]> {
  const rooms = await prisma.room.findMany({
    where: { tenantId },
    orderBy: [{ orderIndex: "asc" }, { roomCode: "asc" }],
  });

  return rooms.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    roomCode: r.roomCode,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    building: r.building,
    floor: r.floor,
    capacity: r.capacity,
    roomType: r.roomType,
    facilities: r.facilities,
    imageUrl: r.imageUrl,
    status: r.status,
    orderIndex: r.orderIndex,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/**
 * เพิ่มห้องประชุมใหม่
 */
export async function createRoom(tenantId: string, input: CreateRoomInput): Promise<RoomDto> {
  const existing = await prisma.room.findUnique({
    where: { tenantId_roomCode: { tenantId, roomCode: input.roomCode } },
  });

  if (existing) {
    throw errors.conflict(`รหัสห้อง ${input.roomCode} มีอยู่ในระบบแล้ว`);
  }

  const room = await prisma.room.create({
    data: {
      tenantId,
      roomCode: input.roomCode,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      building: input.building,
      floor: input.floor,
      capacity: input.capacity,
      roomType: input.roomType,
      facilities: input.facilities,
      imageUrl: input.imageUrl || null,
      status: input.status,
      orderIndex: input.orderIndex,
    },
  });

  return {
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

/**
 * แก้ไขข้อมูลห้องประชุม
 */
export async function updateRoom(tenantId: string, input: UpdateRoomInput): Promise<RoomDto> {
  const existing = await prisma.room.findFirst({
    where: { id: input.id, tenantId },
  });

  if (!existing) {
    throw errors.not_found("ไม่พบข้อมูลห้องประชุม");
  }

  if (input.roomCode !== existing.roomCode) {
    const dup = await prisma.room.findUnique({
      where: { tenantId_roomCode: { tenantId, roomCode: input.roomCode } },
    });
    if (dup && dup.id !== input.id) {
      throw errors.conflict(`รหัสห้อง ${input.roomCode} มีอยู่ในระบบแล้ว`);
    }
  }

  const updated = await prisma.room.update({
    where: { id: input.id },
    data: {
      roomCode: input.roomCode,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      building: input.building,
      floor: input.floor,
      capacity: input.capacity,
      roomType: input.roomType,
      facilities: input.facilities,
      imageUrl: input.imageUrl || null,
      status: input.status,
      orderIndex: input.orderIndex,
    },
  });

  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

/**
 * ลบห้องประชุม (ตรวจสอบการจองที่ผูกอยู่ก่อน)
 */
export async function deleteRoom(tenantId: string, roomId: string): Promise<void> {
  const room = await prisma.room.findFirst({
    where: { id: roomId, tenantId },
    include: { _count: { select: { bookings: true } } },
  });

  if (!room) {
    throw errors.not_found("ไม่พบข้อมูลห้องประชุม");
  }

  if (room._count.bookings > 0) {
    throw errors.validation("ไม่สามารถลบห้องประชุมที่มีประวัติการจองได้ (แนะนำให้เปลี่ยนสถานะเป็นระงับการใช้งาน)");
  }

  await prisma.room.delete({ where: { id: roomId } });
}

/**
 * ดึงรายการยานพาหนะทั้งหมด
 */
export async function listVehicles(tenantId: string): Promise<VehicleDto[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId },
    orderBy: [{ orderIndex: "asc" }, { plateNumber: "asc" }],
  });

  return vehicles.map((v) => ({
    id: v.id,
    tenantId: v.tenantId,
    plateNumber: v.plateNumber,
    brand: v.brand,
    model: v.model,
    vehicleType: v.vehicleType,
    capacity: v.capacity,
    driverName: v.driverName,
    driverPhone: v.driverPhone,
    imageUrl: v.imageUrl,
    status: v.status,
    orderIndex: v.orderIndex,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }));
}

/**
 * เพิ่มยานพาหนะใหม่
 */
export async function createVehicle(tenantId: string, input: CreateVehicleInput): Promise<VehicleDto> {
  const existing = await prisma.vehicle.findUnique({
    where: { tenantId_plateNumber: { tenantId, plateNumber: input.plateNumber } },
  });

  if (existing) {
    throw errors.conflict(`หมายเลขทะเบียน ${input.plateNumber} มีอยู่ในระบบแล้ว`);
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId,
      plateNumber: input.plateNumber,
      brand: input.brand,
      model: input.model,
      vehicleType: input.vehicleType,
      capacity: input.capacity,
      driverName: input.driverName || null,
      driverPhone: input.driverPhone || null,
      imageUrl: input.imageUrl || null,
      status: input.status,
      orderIndex: input.orderIndex,
    },
  });

  return {
    ...vehicle,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}

/**
 * แก้ไขข้อมูลยานพาหนะ
 */
export async function updateVehicle(tenantId: string, input: UpdateVehicleInput): Promise<VehicleDto> {
  const existing = await prisma.vehicle.findFirst({
    where: { id: input.id, tenantId },
  });

  if (!existing) {
    throw errors.not_found("ไม่พบข้อมูลยานพาหนะ");
  }

  if (input.plateNumber !== existing.plateNumber) {
    const dup = await prisma.vehicle.findUnique({
      where: { tenantId_plateNumber: { tenantId, plateNumber: input.plateNumber } },
    });
    if (dup && dup.id !== input.id) {
      throw errors.conflict(`หมายเลขทะเบียน ${input.plateNumber} มีอยู่ในระบบแล้ว`);
    }
  }

  const updated = await prisma.vehicle.update({
    where: { id: input.id },
    data: {
      plateNumber: input.plateNumber,
      brand: input.brand,
      model: input.model,
      vehicleType: input.vehicleType,
      capacity: input.capacity,
      driverName: input.driverName || null,
      driverPhone: input.driverPhone || null,
      imageUrl: input.imageUrl || null,
      status: input.status,
      orderIndex: input.orderIndex,
    },
  });

  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

/**
 * ลบยานพาหนะ
 */
export async function deleteVehicle(tenantId: string, vehicleId: string): Promise<void> {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, tenantId },
    include: { _count: { select: { bookings: true } } },
  });

  if (!vehicle) {
    throw errors.not_found("ไม่พบข้อมูลยานพาหนะ");
  }

  if (vehicle._count.bookings > 0) {
    throw errors.validation("ไม่สามารถลบยานพาหนะที่มีประวัติการจองได้ (แนะนำให้เปลี่ยนสถานะเป็นระงับการใช้งาน)");
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });
}
