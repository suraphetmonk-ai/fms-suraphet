"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Printer,
  Calendar,
  Clock,
  Building,
  AlertTriangle,
  LayoutGrid,
  List,
  User,
  Coffee,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  LiyonCard,
  LiyonField,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import type { ClassScheduleDto, ScheduleConflictCheckResult } from "@/features/curriculum";
import {
  createClassScheduleAction,
  updateClassScheduleAction,
  deleteClassScheduleAction,
  listClassSchedulesAction,
  checkScheduleConflictAction,
} from "@/features/curriculum/actions";

interface PersonnelItem {
  id: string;
  personnelCode: string | null;
  fullNameTh: string;
  monasticTitle: string | null;
  academicRank: string | null;
}

interface CourseItem {
  courseId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  credits: string;
  courseCategory?: string | null;
}

interface Props {
  program: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
    degreeNameTh: string;
  };
  courses: CourseItem[];
  personnelList: PersonnelItem[];
  initialSchedules: ClassScheduleDto[];
  canUpdate: boolean;
  academicYear: number;
  semester: number;
}

const DAYS = [
  { id: 1, nameTh: "วันจันทร์", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { id: 2, nameTh: "วันอังคาร", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30" },
  { id: 3, nameTh: "วันพุธ", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { id: 4, nameTh: "วันพฤหัสบดี", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  { id: 5, nameTh: "วันศุกร์", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { id: 6, nameTh: "วันเสาร์", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { id: 7, nameTh: "วันอาทิตย์", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
];

export function ScheduleAdminClient({
  program,
  courses,
  personnelList,
  initialSchedules,
  canUpdate,
  academicYear: initialYear,
  semester: initialSem,
}: Props) {
  const [academicYear, setAcademicYear] = useState(initialYear);
  const [semester, setSemester] = useState(initialSem);
  const [selectedYearLevel, setSelectedYearLevel] = useState<number | "ALL">("ALL");
  const [schedules, setSchedules] = useState<ClassScheduleDto[]>(initialSchedules);
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassScheduleDto | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    scheduleCode: "",
    courseId: courses[0]?.courseId || "",
    personnelId: personnelList[0]?.id || "",
    yearLevel: 1,
    dayOfWeek: 1,
    startTime: "08:30",
    endTime: "11:15",
    room: "ห้อง 301",
    building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
    section: "01",
    classType: "LECTURE" as "LECTURE" | "PRACTICE" | "MEDITATION" | "SEMINAR",
    notes: "",
  });

  const [conflictResult, setConflictResult] = useState<ScheduleConflictCheckResult | null>(null);

  const refreshSchedules = async (yr = academicYear, sem = semester, yl = selectedYearLevel) => {
    const res = await listClassSchedulesAction({
      programId: program.id,
      academicYear: yr,
      semester: sem,
      ...(yl !== "ALL" ? { yearLevel: yl } : {}),
    });
    if (res.ok) {
      setSchedules(res.data);
    }
  };

  const handleFilterChange = (yr: number, sem: number, yl: number | "ALL") => {
    setAcademicYear(yr);
    setSemester(sem);
    setSelectedYearLevel(yl);
    startTransition(async () => {
      await refreshSchedules(yr, sem, yl);
    });
  };

  // Real-time conflict checking when form values change
  useEffect(() => {
    if (!dialogMode) {
      return;
    }

    const timer = setTimeout(async () => {
      if (!formData.courseId || !formData.personnelId || !formData.room.trim()) return;

      const res = await checkScheduleConflictAction({
        id: dialogMode === "edit" ? formData.id : undefined,
        programId: program.id,
        personnelId: formData.personnelId,
        academicYear,
        semester,
        yearLevel: formData.yearLevel,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room,
        section: formData.section,
      });

      if (res.ok) {
        setConflictResult(res.data);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    formData.personnelId,
    formData.room,
    formData.dayOfWeek,
    formData.startTime,
    formData.endTime,
    formData.yearLevel,
    formData.section,
    dialogMode,
  ]);

  const handleOpenCreate = () => {
    setFormData({
      id: "",
      scheduleCode: "",
      courseId: courses[0]?.courseId || "",
      personnelId: personnelList[0]?.id || "",
      yearLevel: selectedYearLevel === "ALL" ? 1 : selectedYearLevel,
      dayOfWeek: 1,
      startTime: "08:30",
      endTime: "11:15",
      room: "ห้อง 301",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
      notes: "",
    });
    setConflictResult(null);
    setDialogMode("create");
  };

  const handleOpenEdit = (s: ClassScheduleDto) => {
    setFormData({
      id: s.id,
      scheduleCode: s.scheduleCode,
      courseId: s.courseId,
      personnelId: s.personnelId,
      yearLevel: s.yearLevel,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      building: s.building || "",
      section: s.section,
      classType: (s.classType as "LECTURE" | "PRACTICE" | "MEDITATION" | "SEMINAR") || "LECTURE",
      notes: s.notes || "",
    });
    setConflictResult(null);
    setDialogMode("edit");
  };

  const handleSave = () => {
    if (!formData.courseId || !formData.personnelId || !formData.room.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (conflictResult?.hasConflict) {
      toast.error(conflictResult.conflictMessage || "เกิดข้อขัดแย้งในตารางสอน");
      return;
    }

    startTransition(async () => {
      if (dialogMode === "create") {
        const res = await createClassScheduleAction({
          programId: program.id,
          courseId: formData.courseId,
          personnelId: formData.personnelId,
          academicYear,
          semester,
          yearLevel: formData.yearLevel,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          room: formData.room,
          building: formData.building || undefined,
          section: formData.section,
          classType: formData.classType,
          notes: formData.notes || undefined,
        });

        if (res.ok) {
          toast.success("บันทึกตารางสอนเรียบร้อยแล้ว");
          setDialogMode(null);
          await refreshSchedules();
        } else {
          toast.error(res.error.message || "เกิดข้อผิดพลาดในการบันทึก");
        }
      } else if (dialogMode === "edit") {
        const res = await updateClassScheduleAction({
          id: formData.id,
          programId: program.id,
          courseId: formData.courseId,
          personnelId: formData.personnelId,
          academicYear,
          semester,
          yearLevel: formData.yearLevel,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          room: formData.room,
          building: formData.building || undefined,
          section: formData.section,
          classType: formData.classType,
          notes: formData.notes || undefined,
        });

        if (res.ok) {
          toast.success("แก้ไขตารางสอนเรียบร้อยแล้ว");
          setDialogMode(null);
          await refreshSchedules();
        } else {
          toast.error(res.error.message || "เกิดข้อผิดพลาดในการแก้ไข");
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await deleteClassScheduleAction(deleteTarget.id, program.id);
      if (res.ok) {
        toast.success("ลบคาบเรียนออกจากตารางแล้ว");
        setDeleteTarget(null);
        await refreshSchedules();
      } else {
        toast.error(res.error.message || "ไม่สามารถลบได้");
      }
    });
  };

  const filteredSchedules = schedules.filter((s) => {
    if (selectedYearLevel !== "ALL" && s.yearLevel !== selectedYearLevel) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/programs"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> กลับหน้ารายการหลักสูตร
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              ระบบบริหารจัดการตารางสอนและตารางเรียน
            </h1>
            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
              {program.code}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {program.nameTh} ({program.degreeNameTh}) วิทยาลัยสงฆ์นครพนม
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/programs/${program.id}/schedule/report?year=${academicYear}&semester=${semester}${selectedYearLevel !== "ALL" ? `&yearLevel=${selectedYearLevel}` : ""}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted shadow-sm transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            พิมพ์รายงานตารางสอน / บันทึก PDF
          </Link>

          {canUpdate && (
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              เพิ่มคาบเรียนในตาราง
            </Button>
          )}
        </div>
      </div>

      {/* Filter and View Modes Bar */}
      <LiyonCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>ปีการศึกษา:</span>
            </div>
            <select
              value={academicYear}
              onChange={(e) => handleFilterChange(Number(e.target.value), semester, selectedYearLevel)}
              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold"
            >
              <option value={2567}>2567</option>
              <option value={2568}>2568</option>
              <option value={2569}>2569</option>
              <option value={2570}>2570</option>
            </select>

            <span className="text-xs text-muted-foreground">ภาคการศึกษา:</span>
            <select
              value={semester}
              onChange={(e) => handleFilterChange(academicYear, Number(e.target.value), selectedYearLevel)}
              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold"
            >
              <option value={1}>ภาคเรียนที่ 1</option>
              <option value={2}>ภาคเรียนที่ 2</option>
              <option value={3}>ภาคฤดูร้อน</option>
            </select>

            <span className="text-xs text-muted-foreground">ระดับชั้นปี:</span>
            <select
              value={selectedYearLevel}
              onChange={(e) =>
                handleFilterChange(
                  academicYear,
                  semester,
                  e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                )
              }
              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold"
            >
              <option value="ALL">-- ทุกชั้นปี (ปี 1 - 4) --</option>
              <option value={1}>ชั้นปีที่ ๑ (Year 1)</option>
              <option value={2}>ชั้นปีที่ ๒ (Year 2)</option>
              <option value={3}>ชั้นปีที่ ๓ (Year 3)</option>
              <option value={4}>ชั้นปีที่ ๔ (Year 4)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/30">
            <button
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === "matrix"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> ตารางรวม (Matrix)
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" /> บัญชีรายการ (Ledger)
            </button>
          </div>
        </div>
      </LiyonCard>

      {/* Monastic Lunch Notice Banner */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300">
        <Coffee className="h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <span className="font-semibold">ช่วงเวลาฉันภัตตาหารเพล (Monastic Lunch Buffer):</span>{" "}
          11:15 - 13:00 น. เป็นเวลาฉันเพลและทำสรีรกิจของพระภิกษุสามเณรตามระเบียบวิทยาลัยสงฆ์นครพนม
        </div>
      </div>

      {/* Matrix View */}
      {viewMode === "matrix" && (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySchedules = filteredSchedules.filter((s) => s.dayOfWeek === day.id);

            return (
              <LiyonCard key={day.id} className="overflow-hidden border-l-4">
                <div className={`px-4 py-2 border-b flex items-center justify-between ${day.color}`}>
                  <span className="font-semibold text-sm">{day.nameTh}</span>
                  <span className="text-xs opacity-80">{daySchedules.length} คาบเรียน</span>
                </div>

                <div className="p-4">
                  {daySchedules.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic py-3 text-center">
                      - ไม่มีตารางเรียนในวันนี้ -
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {daySchedules.map((s) => (
                        <div
                          key={s.id}
                          className="rounded-lg border border-border p-3 bg-muted/20 hover:bg-muted/40 transition-colors relative group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                                {s.scheduleCode}
                              </span>
                              <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-medium">
                                ปี {s.yearLevel} (Sec.{s.section})
                              </span>
                            </div>

                            {canUpdate && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenEdit(s)}
                                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                                  title="แก้ไขคาบเรียน"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(s)}
                                  className="p-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded"
                                  title="ลบคาบเรียน"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="font-semibold text-foreground text-xs mb-1">
                            {s.course?.code} {s.course?.nameTh}
                          </div>

                          <div className="space-y-1 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5 font-mono text-foreground font-medium">
                              <Clock className="h-3 w-3 text-primary" />
                              {s.startTime} - {s.endTime} น.
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              {s.room} {s.building ? `(${s.building})` : ""}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-foreground font-medium">
                                {s.personnel?.fullNameTh}
                              </span>
                            </div>
                          </div>

                          {s.notes && (
                            <div className="mt-2 pt-1.5 border-t text-[10px] text-muted-foreground/80 italic">
                              หมายเหตุ: {s.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </LiyonCard>
            );
          })}
        </div>
      )}

      {/* List View / Ledger */}
      {viewMode === "list" && (
        <LiyonCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 w-28">เลขที่ตาราง</th>
                  <th className="px-4 py-3 w-24">วันในสัปดาห์</th>
                  <th className="px-4 py-3 w-32">เวลา</th>
                  <th className="px-4 py-3">รหัส / ชื่อรายวิชา</th>
                  <th className="px-4 py-3 w-20 text-center">ชั้นปี / กลุ่ม</th>
                  <th className="px-4 py-3">ห้องเรียน / อาคาร</th>
                  <th className="px-4 py-3">อาจารย์ผู้สอน</th>
                  <th className="px-4 py-3 text-right w-24">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                      ยังไม่มีข้อมูลตารางสอนที่ตรงกับตัวกรองที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">
                        {s.scheduleCode}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium whitespace-nowrap">
                        {s.dayNameTh}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap">
                        {s.startTime} - {s.endTime} น.
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-xs text-foreground">
                          {s.course?.code} {s.course?.nameTh}
                        </div>
                        <div className="text-[11px] text-muted-foreground italic">
                          {s.course?.nameEn}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border">
                          ปี {s.yearLevel} / {s.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">{s.room}</div>
                        <div className="text-[11px]">{s.building || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">
                        {s.personnel?.fullNameTh}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canUpdate && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded"
                              title="แก้ไข"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(s)}
                              className="p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive rounded"
                              title="ลบ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </LiyonCard>
      )}

      {/* Create / Edit Schedule Dialog */}
      {dialogMode && (
        <LiyonDialog open onOpenChange={(o) => !o && setDialogMode(null)}>
          <LiyonDialogHeader
            title={dialogMode === "create" ? "เพิ่มคาบเรียนในตารางสอน" : "แก้ไขข้อมูลตารางสอน"}
            description={`ประจำปีการศึกษา ${academicYear} ภาคการศึกษาที่ ${semester}`}
          />
          <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            {/* Conflict / Warning Alert Banner */}
            {conflictResult?.hasConflict && (
              <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">ตรวจพบข้อขัดแย้งในตารางสอน:</div>
                  <div>{conflictResult.conflictMessage}</div>
                </div>
              </div>
            )}

            {conflictResult?.hasLunchWarning && !conflictResult?.hasConflict && (
              <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <Coffee className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <div className="font-bold">แจ้งเตือนเวลาฉันเพล:</div>
                  <div>{conflictResult.lunchWarningMessage}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label="รายวิชาที่สอน">
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.code} - {c.nameTh} ({c.credits})
                    </option>
                  ))}
                </select>
              </LiyonField>

              <LiyonField label="อาจารย์ผู้สอน">
                <select
                  value={formData.personnelId}
                  onChange={(e) => setFormData({ ...formData, personnelId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.personnelCode ? `[${p.personnelCode}] ` : ""}
                      {p.fullNameTh}
                    </option>
                  ))}
                </select>
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <LiyonField label="วันในสัปดาห์">
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameTh}
                    </option>
                  ))}
                </select>
              </LiyonField>

              <LiyonField label="เวลาเริ่มสอน">
                <input
                  type="text"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  placeholder="เช่น 08:30"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
                />
              </LiyonField>

              <LiyonField label="เวลาสิ้นสุด">
                <input
                  type="text"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  placeholder="เช่น 11:15"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label="ห้องเรียน (Room)">
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="เช่น ห้อง 301, ห้องปฏิบัติธรรม"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </LiyonField>

              <LiyonField label="อาคารสถานที่ (Building)">
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="เช่น อาคารเฉลิมพระเกียรติ 84 พรรษา"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <LiyonField label="ระดับชั้นปี">
                <select
                  value={formData.yearLevel}
                  onChange={(e) => setFormData({ ...formData, yearLevel: Number(e.target.value) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value={1}>ชั้นปีที่ ๑</option>
                  <option value={2}>ชั้นปีที่ ๒</option>
                  <option value={3}>ชั้นปีที่ ๓</option>
                  <option value={4}>ชั้นปีที่ ๔</option>
                </select>
              </LiyonField>

              <LiyonField label="กลุ่มเรียน (Section)">
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="เช่น 01, 02"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </LiyonField>

              <LiyonField label="รูปแบบการเรียน">
                <select
                  value={formData.classType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      classType: e.target.value as "LECTURE" | "PRACTICE" | "MEDITATION" | "SEMINAR",
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="LECTURE">บรรยาย (Lecture)</option>
                  <option value="PRACTICE">ปฏิบัติการ (Practice)</option>
                  <option value="MEDITATION">กรรมฐาน/ภาวนา (Meditation)</option>
                  <option value="SEMINAR">สัมมนา (Seminar)</option>
                </select>
              </LiyonField>
            </div>

            <LiyonField label="หมายเหตุ / หัวข้อ">
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="เช่น บรรยายภาคทฤษฎีและแปลบาลี"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              />
            </LiyonField>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogMode(null)}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || conflictResult?.hasConflict}
            >
              {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูลตาราง"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <LiyonDialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <LiyonDialogHeader
            title="ยืนยันการลบคาบเรียนในตารางสอน"
            description={`ต้องการลบคาบเรียน "${deleteTarget.course?.code} ${deleteTarget.course?.nameTh}" (${deleteTarget.dayNameTh} ${deleteTarget.startTime}-${deleteTarget.endTime}) หรือไม่?`}
          />
          <LiyonDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
              {isPending ? "กำลังลบ..." : "ยืนยันลบ"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}
    </div>
  );
}
