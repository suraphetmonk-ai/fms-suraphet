"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "../permissions";
import {
  checkInSchema,
  checkOutSchema,
  adjustAttendanceSchema,
  leaveRequestSchema,
  leaveReviewSchema,
  workShiftSchema,
  type CheckInInput,
  type CheckOutInput,
  type AdjustAttendanceInput,
  type LeaveRequestInput,
  type LeaveReviewInput,
  type WorkShiftInput,
} from "./validations";
import {
  checkIn,
  checkOut,
  adjustAttendance,
  createLeaveRequest,
  reviewLeaveRequest,
  cancelLeaveRequest,
  upsertWorkShift,
  exportAttendanceCsv,
  listAllAttendance,
  getAttendanceMetrics,
  listLeaveRequests,
  type AttendanceRecordDto,
  type LeaveRequestDto,
  type WorkShiftDto,
  type AttendanceMetricsDto,
} from "./services";

export async function checkInAction(rawInput: CheckInInput): Promise<ActionResult<AttendanceRecordDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.attendanceCheckin);
    const locale = await getLocale();
    const input = checkInSchema.parse(rawInput, { error: zodErrorMap(locale) });
    const record = await checkIn(ctx.tenantId, ctx.userId, input);
    revalidatePath("/admin/attendance");
    return record;
  });
}

export async function checkOutAction(rawInput: CheckOutInput): Promise<ActionResult<AttendanceRecordDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.attendanceCheckin);
    const locale = await getLocale();
    const input = checkOutSchema.parse(rawInput, { error: zodErrorMap(locale) });
    const record = await checkOut(ctx.tenantId, ctx.userId, input);
    revalidatePath("/admin/attendance");
    return record;
  });
}

export async function adjustAttendanceAction(rawInput: AdjustAttendanceInput): Promise<ActionResult<AttendanceRecordDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.attendanceManage);
    const locale = await getLocale();
    const input = adjustAttendanceSchema.parse(rawInput, { error: zodErrorMap(locale) });
    const record = await adjustAttendance(ctx.tenantId, ctx.userId, input);
    revalidatePath("/admin/attendance");
    return record;
  });
}

export async function createLeaveRequestAction(rawInput: LeaveRequestInput): Promise<ActionResult<LeaveRequestDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.leaveRequest);
    const locale = await getLocale();
    const input = leaveRequestSchema.parse(rawInput, { error: zodErrorMap(locale) });
    const request = await createLeaveRequest(ctx.tenantId, ctx.userId, input);
    revalidatePath("/admin/attendance");
    return request;
  });
}

export async function reviewLeaveRequestAction(rawInput: LeaveReviewInput): Promise<ActionResult<LeaveRequestDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.leaveApprove);
    const locale = await getLocale();
    const input = leaveReviewSchema.parse(rawInput, { error: zodErrorMap(locale) });
    const request = await reviewLeaveRequest(ctx.tenantId, ctx.userId, input);
    revalidatePath("/admin/attendance");
    return request;
  });
}

export async function cancelLeaveRequestAction(requestId: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.leaveRequest);
    await cancelLeaveRequest(ctx.tenantId, ctx.userId, requestId);
    revalidatePath("/admin/attendance");
  });
}

export async function upsertWorkShiftAction(rawInput: WorkShiftInput): Promise<ActionResult<WorkShiftDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.attendanceManage);
    const locale = await getLocale();
    const input = workShiftSchema.parse(rawInput, { error: zodErrorMap(locale) });
    const shift = await upsertWorkShift(ctx.tenantId, input);
    revalidatePath("/admin/attendance");
    return shift;
  });
}

export async function exportAttendanceCsvAction(dateStr?: string): Promise<ActionResult<string>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.attendanceRead);
    return exportAttendanceCsv(ctx.tenantId, dateStr);
  });
}

export async function getAttendanceListAction(filters?: {
  date?: string;
  departmentId?: string;
  status?: string;
  search?: string;
}): Promise<ActionResult<AttendanceRecordDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.attendanceRead);
    return listAllAttendance(ctx.tenantId, filters);
  });
}

export async function getAttendanceMetricsAction(dateStr?: string): Promise<ActionResult<AttendanceMetricsDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.attendanceRead);
    return getAttendanceMetrics(ctx.tenantId, dateStr);
  });
}

export async function getLeaveRequestsAction(filters?: {
  userId?: string;
  status?: string;
  leaveType?: string;
}): Promise<ActionResult<LeaveRequestDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(ATTENDANCE_P.attendanceRead);
    return listLeaveRequests(ctx.tenantId, filters);
  });
}
