import type { PermissionDef } from "@/shared/lib/permission-def";

export const ATTENDANCE_P = {
  attendanceRead: "attendance:read",
  attendanceCheckin: "attendance:checkin",
  attendanceManage: "attendance:manage",
  leaveRequest: "leave:request",
  leaveApprove: "leave:approve",
} as const;

export const ATTENDANCE_PERMISSIONS: readonly PermissionDef[] = [
  { code: ATTENDANCE_P.attendanceRead, module: "attendance", action: "read" },
  { code: ATTENDANCE_P.attendanceCheckin, module: "attendance", action: "checkin" },
  { code: ATTENDANCE_P.attendanceManage, module: "attendance", action: "manage" },
  { code: ATTENDANCE_P.leaveRequest, module: "leave", action: "request" },
  { code: ATTENDANCE_P.leaveApprove, module: "leave", action: "approve" },
];
