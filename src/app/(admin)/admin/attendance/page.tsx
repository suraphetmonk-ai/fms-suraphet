import { requirePermission, hasPermission } from "@/features/identity/server";
import {
  ATTENDANCE_P,
  getTodayAttendance,
  listUserAttendanceHistory,
  listAllAttendance,
  getAttendanceMetrics,
  listLeaveRequests,
  listWorkShifts,
} from "@/features/attendance/server";
import { AttendanceClient } from "./_components/attendance-client";

export default async function AttendancePage() {
  const ctx = await requirePermission(ATTENDANCE_P.attendanceRead);

  const canManage = hasPermission(ctx, ATTENDANCE_P.attendanceManage);
  const canApprove = hasPermission(ctx, ATTENDANCE_P.leaveApprove);
  const canCheckin = hasPermission(ctx, ATTENDANCE_P.attendanceCheckin);
  const canRequestLeave = hasPermission(ctx, ATTENDANCE_P.leaveRequest);

  const [todayAttendance, userHistory, metrics, allRecords, leaveRequests, shifts] = await Promise.all([
    getTodayAttendance(ctx.tenantId, ctx.userId),
    listUserAttendanceHistory(ctx.tenantId, ctx.userId),
    getAttendanceMetrics(ctx.tenantId),
    listAllAttendance(ctx.tenantId),
    listLeaveRequests(ctx.tenantId, canManage || canApprove ? undefined : { userId: ctx.userId }),
    listWorkShifts(ctx.tenantId),
  ]);

  return (
    <AttendanceClient
      initialTodayAttendance={todayAttendance}
      initialUserHistory={userHistory}
      initialMetrics={metrics}
      initialAllRecords={allRecords}
      initialLeaveRequests={leaveRequests}
      initialShifts={shifts}
      currentUserId={ctx.userId}
      canManage={canManage}
      canApprove={canApprove}
      canCheckin={canCheckin}
      canRequestLeave={canRequestLeave}
    />
  );
}
