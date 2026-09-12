"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  FileText,
  Users,
  Download,
  Plus,
  Home,
  Briefcase,
  GraduationCap,
  Building,
  Check,
  X,
  Edit2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/shared/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  LiyonCard,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  StatusPill,
} from "@/shared/components/liyon";
import type {
  AttendanceRecordDto,
  LeaveRequestDto,
  WorkShiftDto,
  AttendanceMetricsDto,
  CheckInInput,
  LeaveRequestInput,
  AdjustAttendanceInput,
} from "@/features/attendance";
import {
  checkInAction,
  checkOutAction,
  adjustAttendanceAction,
  createLeaveRequestAction,
  reviewLeaveRequestAction,
  upsertWorkShiftAction,
  exportAttendanceCsvAction,
  getAttendanceListAction,
  getAttendanceMetricsAction,
  getLeaveRequestsAction,
} from "@/features/attendance/actions";

interface Props {
  initialTodayAttendance: AttendanceRecordDto | null;
  initialUserHistory: AttendanceRecordDto[];
  initialMetrics: AttendanceMetricsDto;
  initialAllRecords: AttendanceRecordDto[];
  initialLeaveRequests: LeaveRequestDto[];
  initialShifts: WorkShiftDto[];
  currentUserId: string;
  canManage: boolean;
  canApprove: boolean;
  canCheckin: boolean;
  canRequestLeave: boolean;
}

export function AttendanceClient({
  initialTodayAttendance,
  initialUserHistory,
  initialMetrics,
  initialAllRecords,
  initialLeaveRequests,
  initialShifts,
  currentUserId,
  canManage,
  canApprove,
  canCheckin,
  canRequestLeave,
}: Props) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"my" | "all" | "leave" | "reports" | "shifts">("my");

  // State
  const [todayRecord, setTodayRecord] = useState<AttendanceRecordDto | null>(initialTodayAttendance);
  const [userHistory, setUserHistory] = useState<AttendanceRecordDto[]>(initialUserHistory);
  const [metrics, setMetrics] = useState<AttendanceMetricsDto>(initialMetrics);
  const [allRecords, setAllRecords] = useState<AttendanceRecordDto[]>(initialAllRecords);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>(initialLeaveRequests);
  const [shifts, setShifts] = useState<WorkShiftDto[]>(initialShifts);

  // Live Digital Clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setCurrentTime(new Date()), 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(timer);
    };
  }, []);

  // Check-in form state
  const [checkInType, setCheckInType] = useState<"ON_SITE" | "WFH" | "FIELD_WORK" | "TEACHING">("ON_SITE");
  const [checkInRemarks, setCheckInRemarks] = useState("");
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Filter states
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("ALL");

  // Dialog states
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState<LeaveRequestInput>({
    leaveType: "SICK",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    isHalfDay: false,
    halfDayPeriod: "MORNING",
    reason: "",
    contactPhone: "",
    contactAddress: "",
    attachmentUrl: "",
  });

  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<AttendanceRecordDto | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustAttendanceInput>({
    userId: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
    status: "ON_TIME",
    checkInType: "ON_SITE",
    adjustReason: "",
  });

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<LeaveRequestDto | null>(null);
  const [reviewActionType, setReviewActionType] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectReason, setRejectReason] = useState("");

  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    code: "DEFAULT",
    nameTh: "กะเวลาปกติ (08:30 - 16:30)",
    nameEn: "Standard Shift",
    startTime: "08:30",
    endTime: "16:30",
    lateThresholdMinutes: 15,
    isDefault: true,
  });

  // Handle GPS detect
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error("เบราว์เซอร์ไม่รองรับการระบุพิกัด GPS");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsDetectingGps(false);
        toast.success("ระบุตำแหน่ง GPS เรียบร้อย");
      },
      (err) => {
        setIsDetectingGps(false);
        toast.error("ไม่สามารถดึงตำแหน่งพิกัดได้: " + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Perform Check In
  const handleCheckIn = () => {
    startTransition(async () => {
      const payload: CheckInInput = {
        checkInType,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        locationName:
          checkInType === "ON_SITE"
            ? "คณะวิทยาการจัดการ"
            : checkInType === "WFH"
            ? "ปฏิบัติงานที่บ้าน (WFH)"
            : checkInType === "FIELD_WORK"
            ? "นอกสถานที่ / ไปราชการ"
            : "ปฏิบัติการสอน",
        remarks: checkInRemarks || undefined,
      };

      const res = await checkInAction(payload);
      if (res.ok) {
        setTodayRecord(res.data);
        setUserHistory((prev) => [res.data, ...prev.filter((p) => p.id !== res.data.id)]);
        toast.success(t("attendance.clock.success_in"));
        refreshDashboard();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Perform Check Out
  const handleCheckOut = () => {
    startTransition(async () => {
      const payload = {
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        remarks: checkInRemarks || undefined,
      };

      const res = await checkOutAction(payload);
      if (res.ok) {
        setTodayRecord(res.data);
        setUserHistory((prev) => [res.data, ...prev.filter((p) => p.id !== res.data.id)]);
        toast.success(t("attendance.clock.success_out"));
        refreshDashboard();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Submit Leave Request
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLeaveRequestAction(leaveForm);
      if (res.ok) {
        setLeaveRequests((prev) => [res.data, ...prev]);
        setIsLeaveDialogOpen(false);
        toast.success("ยื่นคำขอลาเรียบร้อยแล้ว รอการอนุมัติ");
        // Reset form
        setLeaveForm({
          leaveType: "SICK",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          isHalfDay: false,
          halfDayPeriod: "MORNING",
          reason: "",
          contactPhone: "",
          contactAddress: "",
          attachmentUrl: "",
        });
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Submit Leave Review (Approve/Reject)
  const handleSubmitReview = () => {
    if (!reviewTarget) return;
    startTransition(async () => {
      const res = await reviewLeaveRequestAction({
        requestId: reviewTarget.id,
        action: reviewActionType,
        rejectReason: reviewActionType === "REJECT" ? rejectReason : undefined,
      });

      if (res.ok) {
        setLeaveRequests((prev) => prev.map((item) => (item.id === res.data.id ? res.data : item)));
        setIsReviewDialogOpen(false);
        setReviewTarget(null);
        toast.success(reviewActionType === "APPROVE" ? "อนุมัติคำขอลาเรียบร้อยแล้ว" : "ปฏิเสธคำขอลาแล้ว");
        refreshDashboard();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Submit Attendance Adjustment
  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await adjustAttendanceAction(adjustForm);
      if (res.ok) {
        setAllRecords((prev) => prev.map((r) => (r.id === res.data.id ? res.data : r)));
        setIsAdjustDialogOpen(false);
        setAdjustTarget(null);
        toast.success(t("adjust.dialog.success"));
        refreshDashboard();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Save Shift
  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await upsertWorkShiftAction(shiftForm);
      if (res.ok) {
        setShifts((prev) => {
          const idx = prev.findIndex((s) => s.code === res.data.code);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.data;
            return next;
          }
          return [...prev, res.data];
        });
        setIsShiftDialogOpen(false);
        toast.success(t("shifts.save_success"));
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    startTransition(async () => {
      const res = await exportAttendanceCsvAction(selectedDate);
      if (res.ok) {
        const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `attendance-${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("ส่งออกไฟล์ CSV สำเร็จ");
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Refresh lists
  const refreshDashboard = async () => {
    const [recs, mets, leaves] = await Promise.all([
      getAttendanceListAction({ date: selectedDate, status: statusFilter, search: searchQuery }),
      getAttendanceMetricsAction(selectedDate),
      getLeaveRequestsAction(canManage || canApprove ? undefined : { userId: currentUserId }),
    ]);
    if (recs.ok) setAllRecords(recs.data);
    if (mets.ok) setMetrics(mets.data);
    if (leaves.ok) setLeaveRequests(leaves.data);
  };

  const activeShift = shifts.find((s) => s.isDefault) || shifts[0];

  // Helper status color / pill tone
  const getStatusTone = (status: string): "ok" | "warn" | "bad" | "info" | "off" => {
    switch (status) {
      case "ON_TIME":
        return "ok";
      case "LATE":
        return "warn";
      case "ON_LEAVE":
        return "info";
      case "ABSENT":
        return "bad";
      case "EARLY_LEAVE":
        return "warn";
      default:
        return "off";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ON_TIME":
        return t("attendance.status.on_time");
      case "LATE":
        return t("attendance.status.late");
      case "ON_LEAVE":
        return t("attendance.status.on_leave");
      case "ABSENT":
        return t("attendance.status.absent");
      case "EARLY_LEAVE":
        return t("attendance.status.early_leave");
      case "OVERTIME":
        return t("attendance.status.overtime");
      default:
        return status;
    }
  };

  const getCheckInTypeLabel = (type: string) => {
    switch (type) {
      case "ON_SITE":
        return t("attendance.type.on_site");
      case "WFH":
        return t("attendance.type.wfh");
      case "FIELD_WORK":
        return t("attendance.type.field_work");
      case "TEACHING":
        return t("attendance.type.teaching");
      default:
        return type;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "SICK":
        return t("leave.type.sick");
      case "PERSONAL":
        return t("leave.type.personal");
      case "ANNUAL":
        return t("leave.type.annual");
      case "OFFICIAL":
        return t("leave.type.official");
      case "MATERNITY":
        return t("leave.type.maternity");
      case "MILITARY":
        return t("leave.type.military");
      default:
        return t("leave.type.other");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("attendance.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("attendance.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canRequestLeave && (
            <Button
              variant="outline"
              onClick={() => setIsLeaveDialogOpen(true)}
              className="flex items-center gap-1.5"
            >
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t("attendance.action.request_leave")}</span>
            </Button>
          )}
          {canManage && (
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={isPending}
              className="flex items-center gap-1.5"
            >
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>{t("attendance.action.export_csv")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <LiyonCard className="p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t("attendance.metric.total_staff")}</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalStaff}
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex flex-col justify-between border-l-4 border-emerald-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t("attendance.metric.present_today")}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.presentToday}
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex flex-col justify-between border-l-4 border-amber-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t("attendance.metric.late_today")}</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metrics.lateToday}
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex flex-col justify-between border-l-4 border-blue-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t("attendance.metric.wfh_today")}</span>
            <Home className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.wfhToday}
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex flex-col justify-between border-l-4 border-purple-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t("attendance.metric.on_leave_today")}</span>
            <FileText className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.onLeaveToday}
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex flex-col justify-between border-l-4 border-sky-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t("attendance.metric.attendance_rate")}</span>
            <span className="text-xs font-semibold text-sky-600">{metrics.attendanceRate}%</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-700 dark:text-sky-300">
            {metrics.attendanceRate}%
          </div>
        </LiyonCard>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("my")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "my"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Clock className="h-4 w-4" />
            {t("attendance.tab.my")}
          </button>

          {(canManage || canApprove) && (
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "all"
                  ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <Users className="h-4 w-4" />
              {t("attendance.tab.all")}
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {allRecords.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("leave")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "leave"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <FileText className="h-4 w-4" />
            {t("attendance.tab.leave")}
            {leaveRequests.some((r) => r.status === "PENDING") && (
              <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                {leaveRequests.filter((r) => r.status === "PENDING").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "reports"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Calendar className="h-4 w-4" />
            {t("attendance.tab.reports")}
          </button>

          {canManage && (
            <button
              onClick={() => setActiveTab("shifts")}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "shifts"
                  ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              {t("attendance.tab.shifts")}
            </button>
          )}
        </nav>
      </div>

      {/* TAB 1: My Attendance */}
      {activeTab === "my" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Clock & Check-in widget */}
          <div className="lg:col-span-1 space-y-6">
            <LiyonCard className="p-6 text-center shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("attendance.clock.current_time")}
              </div>

              {/* Digital Clock Display */}
              <div className="my-4 font-mono text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currentTime ? currentTime.toLocaleTimeString("th-TH") : "--:--:--"}
              </div>

              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {currentTime
                  ? currentTime.toLocaleDateString("th-TH", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "กำลังโหลด..."}
              </div>

              {activeShift && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {activeShift.nameTh}: {activeShift.startTime} - {activeShift.endTime} น.
                  </span>
                </div>
              )}

              {/* Status Notice */}
              <div className="my-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                {todayRecord?.checkInTime ? (
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <div className="flex items-center justify-center gap-1.5 font-semibold text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{t("attendance.clock.already_checked_in")}</span>
                    </div>
                    <div className="mt-1 text-xs">
                      เวลาเข้า: {new Date(todayRecord.checkInTime).toLocaleTimeString("th-TH")} น. (
                      {getStatusLabel(todayRecord.status)})
                    </div>
                    {todayRecord.checkOutTime && (
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        เวลาออก: {new Date(todayRecord.checkOutTime).toLocaleTimeString("th-TH")} น. • รวม{" "}
                        {todayRecord.workHours} ชม.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
                    ท่านยังไม่ได้ลงเวลาเข้างานของวันนี้
                  </div>
                )}
              </div>

              {/* Check-in options when not yet checked in */}
              {!todayRecord?.checkInTime && (
                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("attendance.clock.select_type")}
                    </label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckInType("ON_SITE")}
                        className={`flex items-center gap-1.5 rounded-md border p-2 text-xs font-medium transition-colors ${
                          checkInType === "ON_SITE"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Building className="h-3.5 w-3.5" />
                        <span>ในคณะ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckInType("WFH")}
                        className={`flex items-center gap-1.5 rounded-md border p-2 text-xs font-medium transition-colors ${
                          checkInType === "WFH"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Home className="h-3.5 w-3.5" />
                        <span>WFH (บ้าน)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckInType("FIELD_WORK")}
                        className={`flex items-center gap-1.5 rounded-md border p-2 text-xs font-medium transition-colors ${
                          checkInType === "FIELD_WORK"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>ไปราชการ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckInType("TEACHING")}
                        className={`flex items-center gap-1.5 rounded-md border p-2 text-xs font-medium transition-colors ${
                          checkInType === "TEACHING"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>สอนหนังสือ</span>
                      </button>
                    </div>
                  </div>

                  {/* GPS Detector */}
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("attendance.clock.location")}
                      </span>
                      <button
                        type="button"
                        onClick={handleDetectGps}
                        disabled={isDetectingGps}
                        className="flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{isDetectingGps ? "กำลังค้นหา..." : t("attendance.clock.get_location")}</span>
                      </button>
                    </div>
                    {gpsLocation ? (
                      <div className="mt-1 text-xs text-slate-500 font-mono">
                        GPS: {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-400">ยังไม่ได้ระบุพิกัด GPS (เลือกได้)</div>
                    )}
                  </div>

                  {/* Remarks */}
                  <div>
                    <input
                      type="text"
                      value={checkInRemarks}
                      onChange={(e) => setCheckInRemarks(e.target.value)}
                      placeholder={t("attendance.clock.remarks_placeholder")}
                      className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6">
                {!todayRecord?.checkInTime ? (
                  <Button
                    onClick={handleCheckIn}
                    disabled={isPending || !canCheckin}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 shadow-sm text-sm"
                  >
                    {isPending ? "กำลังบันทึก..." : t("attendance.clock.check_in_btn")}
                  </Button>
                ) : !todayRecord?.checkOutTime ? (
                  <Button
                    onClick={handleCheckOut}
                    disabled={isPending || !canCheckin}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 shadow-sm text-sm"
                  >
                    {isPending ? "กำลังบันทึก..." : t("attendance.clock.check_out_btn")}
                  </Button>
                ) : (
                  <div className="text-center font-medium text-xs text-emerald-600 dark:text-emerald-400">
                    ✓ ลงเวลาการปฏิบัติงานของวันนี้ครบถ้วนแล้ว
                  </div>
                )}
              </div>
            </LiyonCard>
          </div>

          {/* Right: Personal Attendance History */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                ประวัติการลงเวลาล่าสุดของฉัน
              </h2>
              <div className="text-xs text-slate-500">แสดงรายการ 30 วันล่าสุด</div>
            </div>

            <LiyonCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">{t("attendance.th.date")}</th>
                      <th className="px-4 py-3">{t("attendance.th.type")}</th>
                      <th className="px-4 py-3">{t("attendance.th.check_in")}</th>
                      <th className="px-4 py-3">{t("attendance.th.check_out")}</th>
                      <th className="px-4 py-3">{t("attendance.th.hours")}</th>
                      <th className="px-4 py-3">{t("attendance.th.status")}</th>
                      <th className="px-4 py-3">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                    {userHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                          ยังไม่มีประวัติการลงเวลา
                        </td>
                      </tr>
                    ) : (
                      userHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-medium text-xs text-slate-900 dark:text-white">
                            {item.date}
                          </td>
                          <td className="px-4 py-3 text-xs">{getCheckInTypeLabel(item.checkInType)}</td>
                          <td className="px-4 py-3 text-xs font-mono">
                            {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString("th-TH") : "-"}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono">
                            {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString("th-TH") : "-"}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            {item.workHours > 0 ? `${item.workHours} ชม.` : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill tone={getStatusTone(item.status)}>
                              {getStatusLabel(item.status)}
                            </StatusPill>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                            {item.checkInRemarks || item.checkOutRemarks || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </LiyonCard>
          </div>
        </div>
      )}

      {/* TAB 2: All Records (HR / Manager) */}
      {activeTab === "all" && (canManage || canApprove) && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">วันที่:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  startTransition(() => {
                    getAttendanceListAction({
                      date: e.target.value,
                      status: statusFilter,
                      search: searchQuery,
                    }).then((res) => res.ok && setAllRecords(res.data));
                    getAttendanceMetricsAction(e.target.value).then(
                      (res) => res.ok && setMetrics(res.data)
                    );
                  });
                }}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">สถานะ:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  startTransition(() => {
                    getAttendanceListAction({
                      date: selectedDate,
                      status: e.target.value,
                      search: searchQuery,
                    }).then((res) => res.ok && setAllRecords(res.data));
                  });
                }}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="ON_TIME">ตรงเวลา</option>
                <option value="LATE">มาสาย</option>
                <option value="ON_LEAVE">ลางาน</option>
                <option value="EARLY_LEAVE">กลับก่อน</option>
              </select>
            </div>

            <div className="flex flex-1 items-center gap-2 min-w-[200px]">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  startTransition(() => {
                    getAttendanceListAction({
                      date: selectedDate,
                      status: statusFilter,
                      search: e.target.value,
                    }).then((res) => res.ok && setAllRecords(res.data));
                  });
                }}
                placeholder="ค้นหาชื่อ หรืออีเมล..."
                className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshDashboard}
              disabled={isPending}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span>รีเฟรช</span>
            </Button>
          </div>

          {/* Table */}
          <LiyonCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">{t("attendance.th.name")}</th>
                    <th className="px-4 py-3">{t("attendance.th.department")}</th>
                    <th className="px-4 py-3">{t("attendance.th.type")}</th>
                    <th className="px-4 py-3">{t("attendance.th.check_in")}</th>
                    <th className="px-4 py-3">{t("attendance.th.check_out")}</th>
                    <th className="px-4 py-3">{t("attendance.th.hours")}</th>
                    <th className="px-4 py-3">{t("attendance.th.status")}</th>
                    <th className="px-4 py-3">{t("attendance.th.late_duration")}</th>
                    {canManage && <th className="px-4 py-3 text-right">{t("attendance.th.actions")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                  {allRecords.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 9 : 8} className="px-4 py-8 text-center text-xs text-slate-400">
                        ไม่พบบันทึกการลงเวลาในวันที่เลือก
                      </td>
                    </tr>
                  ) : (
                    allRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white">
                            {r.userName}
                          </div>
                          <div className="text-[11px] text-slate-400">{r.userEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div>{r.departmentName}</div>
                          <div className="text-[10px] text-slate-400">{r.positionTh}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">{getCheckInTypeLabel(r.checkInType)}</td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("th-TH") : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("th-TH") : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold">
                          {r.workHours > 0 ? `${r.workHours} ชม.` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill tone={getStatusTone(r.status)}>
                            {getStatusLabel(r.status)}
                          </StatusPill>
                          {r.isAdjusted && (
                            <span className="ml-1 text-[10px] text-blue-500 font-medium" title={r.adjustReason || ""}>
                              (ปรับแก้)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-amber-600 font-mono">
                          {r.lateMinutes > 0 ? `${r.lateMinutes} นาที` : "-"}
                        </td>
                        {canManage && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAdjustTarget(r);
                                setAdjustForm({
                                  recordId: r.id,
                                  userId: r.userId,
                                  date: r.date,
                                  checkInTime: r.checkInTime ? r.checkInTime.slice(11, 16) : "08:30",
                                  checkOutTime: r.checkOutTime ? r.checkOutTime.slice(11, 16) : "16:30",
                                  status: (["ON_TIME", "LATE", "EARLY_LEAVE", "ABSENT", "ON_LEAVE", "HOLIDAY", "OVERTIME"].includes(r.status) ? r.status : "ON_TIME") as AdjustAttendanceInput["status"],
                                  checkInType: (["ON_SITE", "WFH", "FIELD_WORK", "TEACHING"].includes(r.checkInType) ? r.checkInType : "ON_SITE") as AdjustAttendanceInput["checkInType"],
                                  adjustReason: "",
                                });
                                setIsAdjustDialogOpen(true);
                              }}
                              className="h-7 text-xs px-2"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              ปรับแก้
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </LiyonCard>
        </div>
      )}

      {/* TAB 3: Leave Requests */}
      {activeTab === "leave" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">สถานะคำขอ:</label>
              <select
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="PENDING">รออนุมัติ</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
                <option value="REJECTED">ไม่อนุมัติ</option>
              </select>
            </div>

            {canRequestLeave && (
              <Button
                onClick={() => setIsLeaveDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("attendance.action.request_leave")}
              </Button>
            )}
          </div>

          <LiyonCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ผู้ยื่นคำขอ</th>
                    <th className="px-4 py-3">{t("leave.form.type")}</th>
                    <th className="px-4 py-3">ช่วงวันที่ลา</th>
                    <th className="px-4 py-3">{t("leave.form.total_days")}</th>
                    <th className="px-4 py-3">{t("leave.form.reason")}</th>
                    <th className="px-4 py-3">ติดต่อ</th>
                    <th className="px-4 py-3">สถานะ</th>
                    {(canApprove || canManage) && <th className="px-4 py-3 text-right">การพิจารณา</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                  {leaveRequests
                    .filter((r) => leaveStatusFilter === "ALL" || r.status === leaveStatusFilter)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white">
                            {item.userName}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.departmentName}</div>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium">
                          {getLeaveTypeLabel(item.leaveType)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {item.startDate} ถึง {item.endDate}
                          {item.isHalfDay && (
                            <span className="ml-1 text-[10px] text-amber-600 font-semibold">
                              (ครึ่งวัน {item.halfDayPeriod === "MORNING" ? "เช้า" : "บ่าย"})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-emerald-600">
                          {item.totalDays} วัน
                        </td>
                        <td className="px-4 py-3 text-xs max-w-xs truncate">{item.reason}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {item.contactPhone || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill
                            tone={
                              item.status === "APPROVED"
                                ? "ok"
                                : item.status === "REJECTED"
                                ? "bad"
                                : "warn"
                            }
                          >
                            {item.status === "APPROVED"
                              ? t("leave.status.approved")
                              : item.status === "REJECTED"
                              ? t("leave.status.rejected")
                              : t("leave.status.pending")}
                          </StatusPill>
                        </td>
                        {(canApprove || canManage) && (
                          <td className="px-4 py-3 text-right">
                            {item.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReviewTarget(item);
                                    setReviewActionType("APPROVE");
                                    setIsReviewDialogOpen(true);
                                  }}
                                  className="h-7 text-xs px-2 text-emerald-600 hover:bg-emerald-50 border-emerald-300"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  อนุมัติ
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReviewTarget(item);
                                    setReviewActionType("REJECT");
                                    setRejectReason("");
                                    setIsReviewDialogOpen(true);
                                  }}
                                  className="h-7 text-xs px-2 text-red-600 hover:bg-red-50 border-red-300"
                                >
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  ปฏิเสธ
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                {item.approverName ? `โดย ${item.approverName}` : "-"}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </LiyonCard>
        </div>
      )}

      {/* TAB 4: Reports & Analytics */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LiyonCard className="p-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                สรุปสัดส่วนการปฏิบัติงานวันนี้
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">ตรงเวลา</span>
                    <span className="font-semibold text-emerald-600">{metrics.onTimeToday} คน</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${metrics.totalStaff > 0 ? (metrics.onTimeToday / metrics.totalStaff) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">มาสาย</span>
                    <span className="font-semibold text-amber-600">{metrics.lateToday} คน</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{
                        width: `${metrics.totalStaff > 0 ? (metrics.lateToday / metrics.totalStaff) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">ปฏิบัติงานที่บ้าน (WFH)</span>
                    <span className="font-semibold text-blue-600">{metrics.wfhToday} คน</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${metrics.totalStaff > 0 ? (metrics.wfhToday / metrics.totalStaff) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">ลางาน</span>
                    <span className="font-semibold text-purple-600">{metrics.onLeaveToday} คน</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${metrics.totalStaff > 0 ? (metrics.onLeaveToday / metrics.totalStaff) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </LiyonCard>

            <LiyonCard className="p-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                ดัชนีชี้วัดประสิทธิภาพ (KPIs)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <div className="text-xs text-slate-500 mb-1">{t("attendance.metric.avg_work_hours")}</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {metrics.avgWorkHours}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">ชั่วโมง / คน</div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <div className="text-xs text-slate-500 mb-1">{t("attendance.metric.attendance_rate")}</div>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.attendanceRate}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">เป้าหมาย &ge; 95%</div>
                </div>
              </div>
            </LiyonCard>
          </div>
        </div>
      )}

      {/* TAB 5: Work Shifts (Admin) */}
      {activeTab === "shifts" && canManage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("shifts.title")}
            </h2>
            <Button
              onClick={() => {
                setShiftForm({
                  code: `SHIFT_${shifts.length + 1}`,
                  nameTh: "กะเวลาใหม่",
                  nameEn: "New Shift",
                  startTime: "08:30",
                  endTime: "16:30",
                  lateThresholdMinutes: 15,
                  isDefault: false,
                });
                setIsShiftDialogOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              เพิ่มกะเวลา
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((s) => (
              <LiyonCard key={s.id} className="p-5 relative">
                {s.isDefault && (
                  <span className="absolute top-4 right-4 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    กะเริ่มต้น
                  </span>
                )}
                <div className="font-semibold text-sm text-slate-900 dark:text-white">
                  {s.nameTh}
                </div>
                <div className="text-xs text-slate-400 mb-3">{s.nameEn}</div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>เวลาทำงาน:</span>
                    <span className="font-semibold">
                      {s.startTime} - {s.endTime} น.
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ระยะเวลายกเว้นมาสาย:</span>
                    <span className="font-semibold">{s.lateThresholdMinutes} นาที</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShiftForm({
                        code: s.code,
                        nameTh: s.nameTh,
                        nameEn: s.nameEn,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        lateThresholdMinutes: s.lateThresholdMinutes,
                        isDefault: s.isDefault,
                      });
                      setIsShiftDialogOpen(true);
                    }}
                    className="text-xs h-7 px-2"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    แก้ไข
                  </Button>
                </div>
              </LiyonCard>
            ))}
          </div>
        </div>
      )}

      {/* DIALOG: Leave Request */}
      <LiyonDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <LiyonDialogHeader title={t("leave.form.title")} />
        <form onSubmit={handleSubmitLeave}>
          <LiyonDialogBody className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("leave.form.type")} *
              </label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveRequestInput["leaveType"] })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="SICK">{t("leave.type.sick")}</option>
                <option value="PERSONAL">{t("leave.type.personal")}</option>
                <option value="ANNUAL">{t("leave.type.annual")}</option>
                <option value="OFFICIAL">{t("leave.type.official")}</option>
                <option value="MATERNITY">{t("leave.type.maternity")}</option>
                <option value="MILITARY">{t("leave.type.military")}</option>
                <option value="OTHER">{t("leave.type.other")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("leave.form.start_date")} *
                </label>
                <input
                  type="date"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("leave.form.end_date")} *
                </label>
                <input
                  type="date"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHalfDay"
                checked={leaveForm.isHalfDay}
                onChange={(e) => setLeaveForm({ ...leaveForm, isHalfDay: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600"
              />
              <label htmlFor="isHalfDay" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t("leave.form.is_half_day")} (0.5 วัน)
              </label>

              {leaveForm.isHalfDay && (
                <select
                  value={leaveForm.halfDayPeriod || "MORNING"}
                  onChange={(e) => setLeaveForm({ ...leaveForm, halfDayPeriod: e.target.value as "MORNING" | "AFTERNOON" })}
                  className="ml-3 rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="MORNING">{t("leave.form.morning")}</option>
                  <option value="AFTERNOON">{t("leave.form.afternoon")}</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("leave.form.reason")} *
              </label>
              <textarea
                required
                rows={3}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="ระบุรายละเอียดความจำเป็นในการลา..."
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("leave.form.phone")}
                </label>
                <input
                  type="text"
                  value={leaveForm.contactPhone || ""}
                  onChange={(e) => setLeaveForm({ ...leaveForm, contactPhone: e.target.value })}
                  placeholder="08X-XXX-XXXX"
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("leave.form.attachment")}
                </label>
                <input
                  type="url"
                  value={leaveForm.attachmentUrl || ""}
                  onChange={(e) => setLeaveForm({ ...leaveForm, attachmentUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLeaveDialogOpen(false)}
            >
              {t("attendance.action.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? "กำลังบันทึก..." : t("leave.form.submit")}
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* DIALOG: Adjust Attendance (Admin) */}
      <LiyonDialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <LiyonDialogHeader title={t("adjust.dialog.title")} />
        <form onSubmit={handleSubmitAdjustment}>
          <LiyonDialogBody className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">บุคลากร</label>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {adjustTarget?.userName} ({adjustTarget?.departmentName})
              </div>
              <div className="text-xs text-slate-500">วันที่: {adjustTarget?.date}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("attendance.th.check_in")}
                </label>
                <input
                  type="time"
                  value={adjustForm.checkInTime || ""}
                  onChange={(e) => setAdjustForm({ ...adjustForm, checkInTime: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("attendance.th.check_out")}
                </label>
                <input
                  type="time"
                  value={adjustForm.checkOutTime || ""}
                  onChange={(e) => setAdjustForm({ ...adjustForm, checkOutTime: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("attendance.th.status")}
                </label>
                <select
                  value={adjustForm.status}
                  onChange={(e) => setAdjustForm({ ...adjustForm, status: e.target.value as AdjustAttendanceInput["status"] })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="ON_TIME">ตรงเวลา</option>
                  <option value="LATE">มาสาย</option>
                  <option value="EARLY_LEAVE">กลับก่อน</option>
                  <option value="ON_LEAVE">ลางาน</option>
                  <option value="ABSENT">ขาดงาน</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("attendance.th.type")}
                </label>
                <select
                  value={adjustForm.checkInType}
                  onChange={(e) => setAdjustForm({ ...adjustForm, checkInType: e.target.value as AdjustAttendanceInput["checkInType"] })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="ON_SITE">ในคณะ</option>
                  <option value="WFH">WFH (บ้าน)</option>
                  <option value="FIELD_WORK">ไปราชการ</option>
                  <option value="TEACHING">ปฏิบัติการสอน</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("adjust.dialog.reason")} *
              </label>
              <textarea
                required
                rows={2}
                value={adjustForm.adjustReason}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustReason: e.target.value })}
                placeholder={t("adjust.dialog.reason_placeholder")}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdjustDialogOpen(false)}
            >
              {t("attendance.action.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? "กำลังบันทึก..." : t("attendance.action.save")}
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* DIALOG: Review Leave Request (Approve / Reject) */}
      <LiyonDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <LiyonDialogHeader
          title={reviewActionType === "APPROVE" ? "ยืนยันการอนุมัติคำขอลา" : "ยืนยันการไม่อนุมัติคำขอลา"}
        />
        <LiyonDialogBody className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1 dark:bg-slate-800">
            <div>
              <span className="font-semibold">ผู้ขอลา:</span> {reviewTarget?.userName}
            </div>
            <div>
              <span className="font-semibold">ประเภท:</span>{" "}
              {reviewTarget && getLeaveTypeLabel(reviewTarget.leaveType)}
            </div>
            <div>
              <span className="font-semibold">ช่วงวันที่:</span> {reviewTarget?.startDate} ถึง{" "}
              {reviewTarget?.endDate} ({reviewTarget?.totalDays} วัน)
            </div>
            <div>
              <span className="font-semibold">เหตุผล:</span> {reviewTarget?.reason}
            </div>
          </div>

          {reviewActionType === "REJECT" && (
            <div>
              <label className="text-xs font-semibold text-red-600 dark:text-red-400">
                {t("leave.form.reject_reason")} (ถ้ามี)
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผลในการไม่อนุมัติ..."
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          )}
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsReviewDialogOpen(false)}
          >
            {t("attendance.action.cancel")}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleSubmitReview}
            className={
              reviewActionType === "APPROVE"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }
          >
            {reviewActionType === "APPROVE" ? "อนุมัติ" : "ไม่อนุมัติ"}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* DIALOG: Work Shift Edit */}
      <LiyonDialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
        <LiyonDialogHeader title="ตั้งค่ากะเวลาทำงาน" />
        <form onSubmit={handleSaveShift}>
          <LiyonDialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("shifts.name_th")} *
                </label>
                <input
                  type="text"
                  required
                  value={shiftForm.nameTh}
                  onChange={(e) => setShiftForm({ ...shiftForm, nameTh: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("shifts.name_en")} *
                </label>
                <input
                  type="text"
                  required
                  value={shiftForm.nameEn}
                  onChange={(e) => setShiftForm({ ...shiftForm, nameEn: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("shifts.start_time")} * (HH:mm)
                </label>
                <input
                  type="text"
                  required
                  pattern="^([01]\d|2[0-3]):[0-5]\d$"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("shifts.end_time")} * (HH:mm)
                </label>
                <input
                  type="text"
                  required
                  pattern="^([01]\d|2[0-3]):[0-5]\d$"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("shifts.late_threshold")}
              </label>
              <input
                type="number"
                min={0}
                max={240}
                value={shiftForm.lateThresholdMinutes}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, lateThresholdMinutes: parseInt(e.target.value) || 0 })
                }
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsShiftDialogOpen(false)}
            >
              {t("attendance.action.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t("attendance.action.save")}
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>
    </div>
  );
}
