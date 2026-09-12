import { prisma } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import { writeAudit } from "@/features/identity/server";
import type {
  CheckInInput,
  CheckOutInput,
  AdjustAttendanceInput,
  LeaveRequestInput,
  LeaveReviewInput,
  WorkShiftInput,
} from "./validations";

export interface AttendanceRecordDto {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  departmentName?: string;
  positionTh?: string;
  personnelType?: string;
  shiftId: string | null;
  shiftName?: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // ISO
  checkOutTime: string | null; // ISO
  status: string; // ON_TIME, LATE, EARLY_LEAVE, ABSENT, ON_LEAVE, HOLIDAY, OVERTIME
  checkInType: string; // ON_SITE, WFH, FIELD_WORK, TEACHING
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInLocationName: string | null;
  checkInRemarks: string | null;
  checkOutRemarks: string | null;
  workHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  isAdjusted: boolean;
  adjustReason: string | null;
  adjustedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestDto {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  departmentName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod: string | null;
  totalDays: number;
  reason: string;
  contactAddress: string | null;
  contactPhone: string | null;
  attachmentUrl: string | null;
  status: string;
  approverId: string | null;
  approverName?: string | null;
  approvedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkShiftDto {
  id: string;
  tenantId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  startTime: string;
  endTime: string;
  lateThresholdMinutes: number;
  halfDayMinutes: number;
  workDays: number[];
  isDefault: boolean;
  isActive: boolean;
}

export interface AttendanceMetricsDto {
  totalStaff: number;
  presentToday: number;
  lateToday: number;
  onLeaveToday: number;
  wfhToday: number;
  onTimeToday: number;
  attendanceRate: number;
  avgWorkHours: number;
}

function normalizeDate(d: Date | string): Date {
  const dateObj = typeof d === "string" ? new Date(d) : new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

function formatDateString(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ----------------------------------------------------
// WorkShift Services
// ----------------------------------------------------
export async function getOrCreateDefaultShift(tenantId: string): Promise<WorkShiftDto> {
  let shift = await prisma.workShift.findFirst({
    where: { tenantId, isActive: true, isDefault: true },
  });

  if (!shift) {
    shift = await prisma.workShift.findFirst({
      where: { tenantId, isActive: true },
    });
  }

  if (!shift) {
    shift = await prisma.workShift.create({
      data: {
        tenantId,
        code: "DEFAULT",
        nameTh: "กะเวลาปกติ (08:30 - 16:30)",
        nameEn: "Standard Office Shift (08:30 - 16:30)",
        startTime: "08:30",
        endTime: "16:30",
        lateThresholdMinutes: 15,
        halfDayMinutes: 240,
        workDays: [1, 2, 3, 4, 5],
        isDefault: true,
        isActive: true,
      },
    });
  }

  return {
    id: shift.id,
    tenantId: shift.tenantId,
    code: shift.code,
    nameTh: shift.nameTh,
    nameEn: shift.nameEn,
    startTime: shift.startTime,
    endTime: shift.endTime,
    lateThresholdMinutes: shift.lateThresholdMinutes,
    halfDayMinutes: shift.halfDayMinutes,
    workDays: shift.workDays,
    isDefault: shift.isDefault,
    isActive: shift.isActive,
  };
}

export async function listWorkShifts(tenantId: string): Promise<WorkShiftDto[]> {
  await getOrCreateDefaultShift(tenantId);
  const shifts = await prisma.workShift.findMany({
    where: { tenantId },
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });

  return shifts.map((s) => ({
    id: s.id,
    tenantId: s.tenantId,
    code: s.code,
    nameTh: s.nameTh,
    nameEn: s.nameEn,
    startTime: s.startTime,
    endTime: s.endTime,
    lateThresholdMinutes: s.lateThresholdMinutes,
    halfDayMinutes: s.halfDayMinutes,
    workDays: s.workDays,
    isDefault: s.isDefault,
    isActive: s.isActive,
  }));
}

export async function upsertWorkShift(tenantId: string, input: WorkShiftInput): Promise<WorkShiftDto> {
  if (input.isDefault) {
    await prisma.workShift.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const shift = await prisma.workShift.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: input.code,
      },
    },
    update: {
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      startTime: input.startTime,
      endTime: input.endTime,
      lateThresholdMinutes: input.lateThresholdMinutes,
      isDefault: input.isDefault,
    },
    create: {
      tenantId,
      code: input.code,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      startTime: input.startTime,
      endTime: input.endTime,
      lateThresholdMinutes: input.lateThresholdMinutes,
      isDefault: input.isDefault,
      isActive: true,
    },
  });

  return {
    id: shift.id,
    tenantId: shift.tenantId,
    code: shift.code,
    nameTh: shift.nameTh,
    nameEn: shift.nameEn,
    startTime: shift.startTime,
    endTime: shift.endTime,
    lateThresholdMinutes: shift.lateThresholdMinutes,
    halfDayMinutes: shift.halfDayMinutes,
    workDays: shift.workDays,
    isDefault: shift.isDefault,
    isActive: shift.isActive,
  };
}

// ----------------------------------------------------
// Attendance Services
// ----------------------------------------------------
export async function getTodayAttendance(tenantId: string, userId: string): Promise<AttendanceRecordDto | null> {
  const today = normalizeDate(new Date());
  const record = await prisma.attendanceRecord.findUnique({
    where: {
      tenantId_userId_date: {
        tenantId,
        userId,
        date: today,
      },
    },
    include: {
      shift: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!record) return null;

  return {
    id: record.id,
    tenantId: record.tenantId,
    userId: record.userId,
    userName: record.user.name,
    userEmail: record.user.email,
    shiftId: record.shiftId,
    shiftName: record.shift?.nameTh,
    date: formatDateString(record.date),
    checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
    checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
    status: record.status,
    checkInType: record.checkInType,
    checkInLatitude: record.checkInLatitude,
    checkInLongitude: record.checkInLongitude,
    checkInLocationName: record.checkInLocationName,
    checkInRemarks: record.checkInRemarks,
    checkOutRemarks: record.checkOutRemarks,
    workHours: record.workHours,
    lateMinutes: record.lateMinutes,
    earlyLeaveMinutes: record.earlyLeaveMinutes,
    isAdjusted: record.isAdjusted,
    adjustReason: record.adjustReason,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function checkIn(tenantId: string, userId: string, input: CheckInInput): Promise<AttendanceRecordDto> {
  const now = new Date();
  const today = normalizeDate(now);

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      tenantId_userId_date: {
        tenantId,
        userId,
        date: today,
      },
    },
  });

  if (existing && existing.checkInTime) {
    throw errors.conflict("คุณได้ลงเวลาเข้างานของวันนี้แล้ว");
  }

  const shift = await getOrCreateDefaultShift(tenantId);

  // Compute late minutes
  const [startH, startM] = shift.startTime.split(":").map(Number);
  const thresholdDate = new Date(now);
  thresholdDate.setHours(startH, startM + shift.lateThresholdMinutes, 0, 0);

  let status = "ON_TIME";
  let lateMinutes = 0;
  if (now > thresholdDate) {
    status = "LATE";
    lateMinutes = Math.max(1, Math.floor((now.getTime() - thresholdDate.getTime()) / 60000));
  }

  const record = await prisma.attendanceRecord.upsert({
    where: {
      tenantId_userId_date: {
        tenantId,
        userId,
        date: today,
      },
    },
    update: {
      shiftId: shift.id,
      checkInTime: now,
      status,
      checkInType: input.checkInType,
      checkInLatitude: input.latitude,
      checkInLongitude: input.longitude,
      checkInLocationName: input.locationName,
      checkInRemarks: input.remarks,
      lateMinutes,
    },
    create: {
      tenantId,
      userId,
      shiftId: shift.id,
      date: today,
      checkInTime: now,
      status,
      checkInType: input.checkInType,
      checkInLatitude: input.latitude,
      checkInLongitude: input.longitude,
      checkInLocationName: input.locationName,
      checkInRemarks: input.remarks,
      lateMinutes,
    },
    include: {
      shift: true,
      user: { select: { name: true, email: true } },
    },
  });

  return {
    id: record.id,
    tenantId: record.tenantId,
    userId: record.userId,
    userName: record.user.name,
    userEmail: record.user.email,
    shiftId: record.shiftId,
    shiftName: record.shift?.nameTh,
    date: formatDateString(record.date),
    checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
    checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
    status: record.status,
    checkInType: record.checkInType,
    checkInLatitude: record.checkInLatitude,
    checkInLongitude: record.checkInLongitude,
    checkInLocationName: record.checkInLocationName,
    checkInRemarks: record.checkInRemarks,
    checkOutRemarks: record.checkOutRemarks,
    workHours: record.workHours,
    lateMinutes: record.lateMinutes,
    earlyLeaveMinutes: record.earlyLeaveMinutes,
    isAdjusted: record.isAdjusted,
    adjustReason: record.adjustReason,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function checkOut(tenantId: string, userId: string, input: CheckOutInput): Promise<AttendanceRecordDto> {
  const now = new Date();
  const today = normalizeDate(now);

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      tenantId_userId_date: {
        tenantId,
        userId,
        date: today,
      },
    },
    include: { shift: true },
  });

  if (!existing || !existing.checkInTime) {
    throw errors.validation("ยังไม่พบข้อมูลการลงเวลาเข้างานของวันนี้ กรุณาลงเวลาเข้างานก่อน");
  }

  if (existing.checkOutTime) {
    throw errors.conflict("คุณได้ลงเวลาเลิกงานของวันนี้แล้ว");
  }

  // Calculate work hours
  const diffMs = now.getTime() - existing.checkInTime.getTime();
  const workHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);

  // Calculate early leave if applicable
  let earlyLeaveMinutes = 0;
  if (existing.shift) {
    const [endH, endM] = existing.shift.endTime.split(":").map(Number);
    const shiftEndDate = new Date(now);
    shiftEndDate.setHours(endH, endM, 0, 0);
    if (now < shiftEndDate) {
      earlyLeaveMinutes = Math.max(1, Math.floor((shiftEndDate.getTime() - now.getTime()) / 60000));
    }
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: existing.id },
    data: {
      checkOutTime: now,
      checkOutLatitude: input.latitude,
      checkOutLongitude: input.longitude,
      checkOutRemarks: input.remarks,
      workHours,
      earlyLeaveMinutes,
    },
    include: {
      shift: true,
      user: { select: { name: true, email: true } },
    },
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    userId: updated.userId,
    userName: updated.user.name,
    userEmail: updated.user.email,
    shiftId: updated.shiftId,
    shiftName: updated.shift?.nameTh,
    date: formatDateString(updated.date),
    checkInTime: updated.checkInTime ? updated.checkInTime.toISOString() : null,
    checkOutTime: updated.checkOutTime ? updated.checkOutTime.toISOString() : null,
    status: updated.status,
    checkInType: updated.checkInType,
    checkInLatitude: updated.checkInLatitude,
    checkInLongitude: updated.checkInLongitude,
    checkInLocationName: updated.checkInLocationName,
    checkInRemarks: updated.checkInRemarks,
    checkOutRemarks: updated.checkOutRemarks,
    workHours: updated.workHours,
    lateMinutes: updated.lateMinutes,
    earlyLeaveMinutes: updated.earlyLeaveMinutes,
    isAdjusted: updated.isAdjusted,
    adjustReason: updated.adjustReason,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function listUserAttendanceHistory(
  tenantId: string,
  userId: string,
  year?: number,
  month?: number
): Promise<AttendanceRecordDto[]> {
  let dateFilter = {};
  if (year && month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    dateFilter = { gte: start, lte: end };
  } else {
    // Default last 60 days
    const start = new Date();
    start.setDate(start.getDate() - 60);
    dateFilter = { gte: normalizeDate(start) };
  }

  const records = await prisma.attendanceRecord.findMany({
    where: {
      tenantId,
      userId,
      date: dateFilter,
    },
    include: {
      shift: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { date: "desc" },
  });

  return records.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    shiftId: r.shiftId,
    shiftName: r.shift?.nameTh,
    date: formatDateString(r.date),
    checkInTime: r.checkInTime ? r.checkInTime.toISOString() : null,
    checkOutTime: r.checkOutTime ? r.checkOutTime.toISOString() : null,
    status: r.status,
    checkInType: r.checkInType,
    checkInLatitude: r.checkInLatitude,
    checkInLongitude: r.checkInLongitude,
    checkInLocationName: r.checkInLocationName,
    checkInRemarks: r.checkInRemarks,
    checkOutRemarks: r.checkOutRemarks,
    workHours: r.workHours,
    lateMinutes: r.lateMinutes,
    earlyLeaveMinutes: r.earlyLeaveMinutes,
    isAdjusted: r.isAdjusted,
    adjustReason: r.adjustReason,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function listAllAttendance(
  tenantId: string,
  filters?: {
    date?: string;
    departmentId?: string;
    status?: string;
    search?: string;
  }
): Promise<AttendanceRecordDto[]> {
  const targetDate = filters?.date ? normalizeDate(filters.date) : normalizeDate(new Date());

  const records = await prisma.attendanceRecord.findMany({
    where: {
      tenantId,
      date: targetDate,
      ...(filters?.status && filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(filters?.search
        ? {
            user: {
              OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: {
      shift: true,
      user: {
        select: {
          name: true,
          email: true,
          personnelProfiles: {
            select: {
              positionTh: true,
              personnelType: true,
              department: { select: { nameTh: true } },
            },
          },
        },
      },
      adjustedBy: { select: { name: true } },
    },
    orderBy: [{ checkInTime: "asc" }, { user: { name: "asc" } }],
  });

  return records.map((r) => {
    const profile = r.user.personnelProfiles[0];
    return {
      id: r.id,
      tenantId: r.tenantId,
      userId: r.userId,
      userName: r.user.name,
      userEmail: r.user.email,
      departmentName: profile?.department?.nameTh || "-",
      positionTh: profile?.positionTh || "-",
      personnelType: profile?.personnelType || "ACADEMIC",
      shiftId: r.shiftId,
      shiftName: r.shift?.nameTh,
      date: formatDateString(r.date),
      checkInTime: r.checkInTime ? r.checkInTime.toISOString() : null,
      checkOutTime: r.checkOutTime ? r.checkOutTime.toISOString() : null,
      status: r.status,
      checkInType: r.checkInType,
      checkInLatitude: r.checkInLatitude,
      checkInLongitude: r.checkInLongitude,
      checkInLocationName: r.checkInLocationName,
      checkInRemarks: r.checkInRemarks,
      checkOutRemarks: r.checkOutRemarks,
      workHours: r.workHours,
      lateMinutes: r.lateMinutes,
      earlyLeaveMinutes: r.earlyLeaveMinutes,
      isAdjusted: r.isAdjusted,
      adjustReason: r.adjustReason,
      adjustedByName: r.adjustedBy?.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

export async function getAttendanceMetrics(tenantId: string, dateStr?: string): Promise<AttendanceMetricsDto> {
  const targetDate = dateStr ? normalizeDate(dateStr) : normalizeDate(new Date());

  const [totalStaff, records] = await Promise.all([
    prisma.userTenant.count({ where: { tenantId, isActive: true } }),
    prisma.attendanceRecord.findMany({
      where: { tenantId, date: targetDate },
      select: { status: true, checkInType: true, workHours: true, checkInTime: true },
    }),
  ]);

  const presentRecords = records.filter((r) => r.checkInTime !== null);
  const presentToday = presentRecords.length;
  const lateToday = records.filter((r) => r.status === "LATE").length;
  const onLeaveToday = records.filter((r) => r.status === "ON_LEAVE").length;
  const wfhToday = records.filter((r) => r.checkInType === "WFH").length;
  const onTimeToday = records.filter((r) => r.status === "ON_TIME").length;

  const totalHours = presentRecords.reduce((sum, r) => sum + r.workHours, 0);
  const avgWorkHours = presentToday > 0 ? Math.round((totalHours / presentToday) * 10) / 10 : 0;
  const attendanceRate = totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0;

  return {
    totalStaff,
    presentToday,
    lateToday,
    onLeaveToday,
    wfhToday,
    onTimeToday,
    attendanceRate,
    avgWorkHours,
  };
}

export async function adjustAttendance(
  tenantId: string,
  actorId: string,
  input: AdjustAttendanceInput
): Promise<AttendanceRecordDto> {
  const targetDate = normalizeDate(input.date);

  const checkInDate = input.checkInTime ? new Date(input.checkInTime) : null;
  const checkOutDate = input.checkOutTime ? new Date(input.checkOutTime) : null;

  let workHours = 0;
  if (checkInDate && checkOutDate) {
    const diff = checkOutDate.getTime() - checkInDate.getTime();
    workHours = Math.max(0, Math.round((diff / (1000 * 60 * 60)) * 10) / 10);
  }

  const record = await prisma.attendanceRecord.upsert({
    where: {
      tenantId_userId_date: {
        tenantId,
        userId: input.userId,
        date: targetDate,
      },
    },
    update: {
      checkInTime: checkInDate,
      checkOutTime: checkOutDate,
      status: input.status,
      checkInType: input.checkInType,
      workHours,
      isAdjusted: true,
      adjustedById: actorId,
      adjustReason: input.adjustReason,
    },
    create: {
      tenantId,
      userId: input.userId,
      date: targetDate,
      checkInTime: checkInDate,
      checkOutTime: checkOutDate,
      status: input.status,
      checkInType: input.checkInType,
      workHours,
      isAdjusted: true,
      adjustedById: actorId,
      adjustReason: input.adjustReason,
    },
    include: {
      shift: true,
      user: { select: { name: true, email: true } },
      adjustedBy: { select: { name: true } },
    },
  });

  await writeAudit(
    {
      tenantId,
      actorId,
      action: "ATTENDANCE_ADJUSTED",
      entity: "AttendanceRecord",
      entityId: record.id,
      after: { targetUserId: input.userId, date: input.date, reason: input.adjustReason },
    },
    prisma
  );

  return {
    id: record.id,
    tenantId: record.tenantId,
    userId: record.userId,
    userName: record.user.name,
    userEmail: record.user.email,
    shiftId: record.shiftId,
    shiftName: record.shift?.nameTh,
    date: formatDateString(record.date),
    checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
    checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
    status: record.status,
    checkInType: record.checkInType,
    checkInLatitude: record.checkInLatitude,
    checkInLongitude: record.checkInLongitude,
    checkInLocationName: record.checkInLocationName,
    checkInRemarks: record.checkInRemarks,
    checkOutRemarks: record.checkOutRemarks,
    workHours: record.workHours,
    lateMinutes: record.lateMinutes,
    earlyLeaveMinutes: record.earlyLeaveMinutes,
    isAdjusted: record.isAdjusted,
    adjustReason: record.adjustReason,
    adjustedByName: record.adjustedBy?.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

// ----------------------------------------------------
// Leave Request Services
// ----------------------------------------------------
export async function listLeaveRequests(
  tenantId: string,
  filters?: { userId?: string; status?: string; leaveType?: string }
): Promise<LeaveRequestDto[]> {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      tenantId,
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.status && filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(filters?.leaveType && filters.leaveType !== "ALL" ? { leaveType: filters.leaveType } : {}),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          personnelProfiles: { select: { department: { select: { nameTh: true } } } },
        },
      },
      approver: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    departmentName: r.user.personnelProfiles[0]?.department?.nameTh || "-",
    leaveType: r.leaveType,
    startDate: formatDateString(r.startDate),
    endDate: formatDateString(r.endDate),
    isHalfDay: r.isHalfDay,
    halfDayPeriod: r.halfDayPeriod,
    totalDays: r.totalDays,
    reason: r.reason,
    contactAddress: r.contactAddress,
    contactPhone: r.contactPhone,
    attachmentUrl: r.attachmentUrl,
    status: r.status,
    approverId: r.approverId,
    approverName: r.approver?.name,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectReason: r.rejectReason,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createLeaveRequest(
  tenantId: string,
  userId: string,
  input: LeaveRequestInput
): Promise<LeaveRequestDto> {
  const startDate = normalizeDate(input.startDate);
  const endDate = normalizeDate(input.endDate);

  let totalDays = 1;
  if (input.isHalfDay) {
    totalDays = 0.5;
  } else {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      tenantId,
      userId,
      leaveType: input.leaveType,
      startDate,
      endDate,
      isHalfDay: input.isHalfDay,
      halfDayPeriod: input.halfDayPeriod,
      totalDays,
      reason: input.reason,
      contactPhone: input.contactPhone,
      contactAddress: input.contactAddress,
      attachmentUrl: input.attachmentUrl || null,
      status: "PENDING",
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  await writeAudit(
    {
      tenantId,
      actorId: userId,
      action: "LEAVE_REQUEST_CREATED",
      entity: "LeaveRequest",
      entityId: leave.id,
      after: { leaveType: input.leaveType, startDate: input.startDate, totalDays },
    },
    prisma
  );

  return {
    id: leave.id,
    tenantId: leave.tenantId,
    userId: leave.userId,
    userName: leave.user.name,
    userEmail: leave.user.email,
    leaveType: leave.leaveType,
    startDate: formatDateString(leave.startDate),
    endDate: formatDateString(leave.endDate),
    isHalfDay: leave.isHalfDay,
    halfDayPeriod: leave.halfDayPeriod,
    totalDays: leave.totalDays,
    reason: leave.reason,
    contactAddress: leave.contactAddress,
    contactPhone: leave.contactPhone,
    attachmentUrl: leave.attachmentUrl,
    status: leave.status,
    approverId: null,
    approvedAt: null,
    rejectReason: null,
    createdAt: leave.createdAt.toISOString(),
    updatedAt: leave.updatedAt.toISOString(),
  };
}

export async function reviewLeaveRequest(
  tenantId: string,
  approverId: string,
  input: LeaveReviewInput
): Promise<LeaveRequestDto> {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: input.requestId },
  });

  if (!leave || leave.tenantId !== tenantId) {
    throw errors.not_found("ไม่พบข้อมูลคำขอลา");
  }

  if (leave.status !== "PENDING") {
    throw errors.validation("คำขอนี้ได้รับการพิจารณาไปแล้ว");
  }

  const isApproved = input.action === "APPROVE";
  const now = new Date();

  const updated = await prisma.leaveRequest.update({
    where: { id: leave.id },
    data: {
      status: isApproved ? "APPROVED" : "REJECTED",
      approverId,
      approvedAt: now,
      rejectReason: input.rejectReason || null,
    },
    include: {
      user: { select: { name: true, email: true } },
      approver: { select: { name: true } },
    },
  });

  // If approved, synchronize AttendanceRecord for each day in range
  if (isApproved) {
    const cur = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    while (cur <= end) {
      const dayDate = normalizeDate(cur);
      await prisma.attendanceRecord.upsert({
        where: {
          tenantId_userId_date: {
            tenantId,
            userId: leave.userId,
            date: dayDate,
          },
        },
        update: {
          status: "ON_LEAVE",
          checkInRemarks: `ลาหยุด (${leave.leaveType}): ${leave.reason}`,
        },
        create: {
          tenantId,
          userId: leave.userId,
          date: dayDate,
          status: "ON_LEAVE",
          checkInRemarks: `ลาหยุด (${leave.leaveType}): ${leave.reason}`,
        },
      });

      cur.setDate(cur.getDate() + 1);
    }
  }

  await writeAudit(
    {
      tenantId,
      actorId: approverId,
      action: isApproved ? "LEAVE_REQUEST_APPROVED" : "LEAVE_REQUEST_REJECTED",
      entity: "LeaveRequest",
      entityId: updated.id,
      after: { targetUserId: leave.userId, status: updated.status, rejectReason: input.rejectReason },
    },
    prisma
  );

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    userId: updated.userId,
    userName: updated.user.name,
    userEmail: updated.user.email,
    leaveType: updated.leaveType,
    startDate: formatDateString(updated.startDate),
    endDate: formatDateString(updated.endDate),
    isHalfDay: updated.isHalfDay,
    halfDayPeriod: updated.halfDayPeriod,
    totalDays: updated.totalDays,
    reason: updated.reason,
    contactAddress: updated.contactAddress,
    contactPhone: updated.contactPhone,
    attachmentUrl: updated.attachmentUrl,
    status: updated.status,
    approverId: updated.approverId,
    approverName: updated.approver?.name,
    approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
    rejectReason: updated.rejectReason,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function cancelLeaveRequest(tenantId: string, userId: string, requestId: string): Promise<void> {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
  });

  if (!leave || leave.tenantId !== tenantId || leave.userId !== userId) {
    throw errors.not_found("ไม่พบข้อมูลคำขอลา");
  }

  if (leave.status !== "PENDING") {
    throw errors.validation("ไม่สามารถยกเลิกคำขอที่ดำเนินการแล้วได้");
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });
}

// ----------------------------------------------------
// Export CSV Helper
// ----------------------------------------------------
export async function exportAttendanceCsv(tenantId: string, dateStr?: string): Promise<string> {
  const targetDate = dateStr ? normalizeDate(dateStr) : normalizeDate(new Date());

  const records = await prisma.attendanceRecord.findMany({
    where: { tenantId, date: targetDate },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          personnelProfiles: {
            select: {
              personnelCode: true,
              positionTh: true,
              department: { select: { nameTh: true } },
            },
          },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const headers = [
    "วันที่",
    "รหัสบุคลากร",
    "ชื่อ-นามสกุล",
    "สังกัด/สาขาวิชา",
    "ตำแหน่ง",
    "เวลาเข้างาน",
    "เวลาออกงาน",
    "ชั่วโมงทำงาน",
    "สถานะ",
    "สาย (นาที)",
    "ประเภทการทำงาน",
    "หมายเหตุ",
  ];

  const rows = records.map((r) => {
    const profile = r.user.personnelProfiles[0];
    const checkIn = r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("th-TH") : "-";
    const checkOut = r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("th-TH") : "-";

    return [
      `"${formatDateString(r.date)}"`,
      `"${profile?.personnelCode || "-"}"`,
      `"${r.user.name}"`,
      `"${profile?.department?.nameTh || "-"}"`,
      `"${profile?.positionTh || "-"}"`,
      `"${checkIn}"`,
      `"${checkOut}"`,
      `"${r.workHours}"`,
      `"${r.status}"`,
      `"${r.lateMinutes}"`,
      `"${r.checkInType}"`,
      `"${r.checkInRemarks || ""}"`,
    ].join(",");
  });

  // UTF-8 BOM for Thai Excel
  return "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
}
