"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
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
import type { TeachingAssignmentDto } from "@/features/curriculum";
import {
  assignInstructorAction,
  removeTeachingAssignmentAction,
  listTeachingAssignmentsAction,
} from "@/features/curriculum/actions";

interface PersonnelItem {
  id: string;
  personnelCode: string | null;
  fullNameTh: string;
  fullNameEn: string;
  academicRank: string | null;
  departmentNameTh?: string;
}

interface CourseItem {
  courseId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  credits: string;
  yearLevel: number;
  semester: number;
  courseCategory?: string | null;
}

interface Props {
  program: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
    degreeNameTh: string;
    totalCredits: number;
  };
  courses: CourseItem[];
  personnelList: PersonnelItem[];
  initialAssignments: TeachingAssignmentDto[];
  canUpdate: boolean;
  academicYear: number;
  semester: number;
}

export function TeachingAdminClient({
  program,
  courses,
  personnelList,
  initialAssignments,
  canUpdate,
  academicYear: initialYear,
  semester: initialSem,
}: Props) {
  const [academicYear, setAcademicYear] = useState(initialYear);
  const [semester, setSemester] = useState(initialSem);
  const [assignments, setAssignments] = useState<TeachingAssignmentDto[]>(initialAssignments);
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeachingAssignmentDto | null>(null);

  // Form state
  const [formCourseId, setFormCourseId] = useState(courses[0]?.courseId || "");
  const [formPersonnelId, setFormPersonnelId] = useState(personnelList[0]?.id || "");
  const [formRole, setFormRole] = useState<"COORDINATOR" | "PRIMARY" | "CO_INSTRUCTOR" | "GUEST">("PRIMARY");
  const [formSection, setFormSection] = useState("01");
  const [formHours, setFormHours] = useState(3);
  const [formStudents, setFormStudents] = useState(40);
  const [formNotes, setFormNotes] = useState("");

  const refreshAssignments = async (yr = academicYear, sem = semester) => {
    const res = await listTeachingAssignmentsAction({
      programId: program.id,
      academicYear: yr,
      semester: sem,
    });
    if (res.ok) {
      setAssignments(res.data);
    }
  };

  const handleYearSemChange = (newYear: number, newSem: number) => {
    setAcademicYear(newYear);
    setSemester(newSem);
    startTransition(async () => {
      await refreshAssignments(newYear, newSem);
    });
  };

  const handleOpenAssignModal = (preselectedCourseId?: string) => {
    if (preselectedCourseId) {
      setFormCourseId(preselectedCourseId);
    } else if (courses[0]) {
      setFormCourseId(courses[0].courseId);
    }
    if (personnelList[0]) setFormPersonnelId(personnelList[0].id);
    setFormRole("PRIMARY");
    setFormSection("01");
    setFormHours(3);
    setFormStudents(40);
    setFormNotes("");
    setIsDialogOpen(true);
  };

  const handleSaveAssignment = () => {
    if (!formCourseId || !formPersonnelId) {
      toast.error("กรุณาเลือกรายวิชาและอาจารย์ผู้สอน");
      return;
    }

    startTransition(async () => {
      const res = await assignInstructorAction({
        programId: program.id,
        courseId: formCourseId,
        personnelId: formPersonnelId,
        academicYear,
        semester,
        role: formRole,
        section: formSection,
        hoursPerWeek: formHours,
        studentCount: formStudents,
        notes: formNotes || undefined,
      });

      if (res.ok) {
        toast.success("บันทึกการมอบหมายผู้สอนเรียบร้อยแล้ว");
        setIsDialogOpen(false);
        await refreshAssignments();
      } else {
        toast.error(res.error.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  const handleDeleteAssignment = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await removeTeachingAssignmentAction(deleteTarget.id, program.id);
      if (res.ok) {
        toast.success("ยกเลิกการมอบหมายผู้สอนแล้ว");
        setDeleteTarget(null);
        await refreshAssignments();
      } else {
        toast.error(res.error.message || "ไม่สามารถยกเลิกได้");
      }
    });
  };

  // Map assignments to course ID
  const assignmentsByCourse = new Map<string, TeachingAssignmentDto[]>();
  for (const a of assignments) {
    const list = assignmentsByCourse.get(a.courseId) || [];
    list.push(a);
    assignmentsByCourse.set(a.courseId, list);
  }

  const totalAssignedHours = assignments.reduce((sum, a) => sum + a.hoursPerWeek, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
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
              การมอบหมายภาระงานสอนรายวิชา (Teaching Assignment)
            </h1>
            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
              {program.code}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {program.nameTh} ({program.degreeNameTh})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/programs/${program.id}/report?year=${academicYear}&semester=${semester}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted shadow-sm transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            พิมพ์รายงาน มคอ.๒ / บันทึก PDF
          </Link>

          {canUpdate && (
            <Button
              onClick={() => handleOpenAssignModal()}
              size="sm"
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              มอบหมายผู้สอน
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <LiyonCard className="p-4 sm:col-span-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  ปีการศึกษา
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => handleYearSemChange(Number(e.target.value), semester)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={2567}>2567</option>
                  <option value={2568}>2568</option>
                  <option value={2569}>2569</option>
                  <option value={2570}>2570</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  ภาคการศึกษา
                </label>
                <select
                  value={semester}
                  onChange={(e) => handleYearSemChange(academicYear, Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={1}>ภาคการศึกษาที่ 1</option>
                  <option value={2}>ภาคการศึกษาที่ 2</option>
                  <option value={3}>ภาคฤดูร้อน</option>
                </select>
              </div>
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">วิชาที่มอบหมายแล้ว</div>
            <div className="text-xl font-bold text-foreground">
              {assignmentsByCourse.size}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {courses.length} รายวิชา
              </span>
            </div>
          </div>
          <BookOpen className="h-7 w-7 text-emerald-600/80" />
        </LiyonCard>

        <LiyonCard className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">รวมชั่วโมงสอนสัปดาห์นี้</div>
            <div className="text-xl font-bold text-primary font-mono">
              {totalAssignedHours}{" "}
              <span className="text-xs font-normal text-muted-foreground">ชม./สัปดาห์</span>
            </div>
          </div>
          <Clock className="h-7 w-7 text-primary/80" />
        </LiyonCard>
      </div>

      {/* Courses & Assignments Table */}
      <LiyonCard className="overflow-hidden">
        <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              บัญชีรายวิชาในหลักสูตรและภาระงานสอน
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            ปีการศึกษา {academicYear} ภาคเรียนที่ {semester}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 w-16 text-center">ชั้นปี/เทอม</th>
                <th className="px-4 py-3 w-28">รหัสวิชา</th>
                <th className="px-4 py-3">ชื่อรายวิชา / หมวดวิชา</th>
                <th className="px-4 py-3 text-center w-20">หน่วยกิต</th>
                <th className="px-4 py-3">อาจารย์ผู้สอนประจำวิชา</th>
                <th className="px-4 py-3 text-right w-24">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                    ยังไม่มีข้อมูลรายวิชาในโครงสร้างหลักสูตรนี้
                  </td>
                </tr>
              ) : (
                courses.map((c) => {
                  const courseAssignments = assignmentsByCourse.get(c.courseId) || [];
                  const isAssigned = courseAssignments.length > 0;

                  return (
                    <tr key={c.courseId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                        {c.yearLevel}/{c.semester}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold text-foreground text-xs">{c.nameTh}</div>
                          <div className="text-[11px] text-muted-foreground italic">{c.nameEn}</div>
                          {c.courseCategory && (
                            <span className="inline-block mt-0.5 text-[10px] text-muted-foreground/80">
                              หมวด: {c.courseCategory}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                        {c.credits}
                      </td>
                      <td className="px-4 py-3">
                        {isAssigned ? (
                          <div className="space-y-1.5">
                            {courseAssignments.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between gap-2 p-1.5 rounded bg-muted/40 text-xs border border-border/60"
                              >
                                <div>
                                  <div className="font-medium text-foreground">
                                    {a.personnel?.fullNameTh}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span className="font-medium text-primary">
                                      {a.role === "COORDINATOR"
                                        ? "ผู้รับผิดชอบวิชา"
                                        : a.role === "PRIMARY"
                                        ? "ผู้สอนหลัก"
                                        : a.role === "CO_INSTRUCTOR"
                                        ? "ผู้สอนร่วม"
                                        : "อาจารย์พิเศษ"}
                                    </span>
                                    <span>กลุ่ม {a.section}</span>
                                    <span>{a.studentCount} นิสิต</span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {a.hoursPerWeek} ชม./สัปดาห์
                                    </span>
                                  </div>
                                </div>

                                {canUpdate && (
                                  <button
                                    onClick={() => setDeleteTarget(a)}
                                    className="p-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                    title="ยกเลิกการมอบหมาย"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            - ยังไม่มีผู้สอน -
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canUpdate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAssignModal(c.courseId)}
                            className="text-xs h-7 gap-1"
                          >
                            <Plus className="h-3 w-3" /> เพิ่มผู้สอน
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* Assign Instructor Dialog */}
      {isDialogOpen && (
        <LiyonDialog open onOpenChange={setIsDialogOpen}>
          <LiyonDialogHeader
            title="มอบหมายอาจารย์ผู้สอนประจำวิชา"
            description={`ประจำปีการศึกษา ${academicYear} ภาคการศึกษาที่ ${semester}`}
          />
          <LiyonDialogBody className="space-y-4">
            <LiyonField label="รายวิชา">
              <select
                value={formCourseId}
                onChange={(e) => setFormCourseId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {courses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.code} - {c.nameTh} ({c.credits})
                  </option>
                ))}
              </select>
            </LiyonField>

            <LiyonField label="อาจารย์ผู้สอน (คณาจารย์ประจำสาขา/วิทยาลัยสงฆ์)">
              <select
                value={formPersonnelId}
                onChange={(e) => setFormPersonnelId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.personnelCode ? `[${p.personnelCode}] ` : ""}
                    {p.fullNameTh}
                    {p.departmentNameTh ? ` (${p.departmentNameTh})` : ""}
                  </option>
                ))}
              </select>
            </LiyonField>

            <div className="grid grid-cols-2 gap-3">
              <LiyonField label="บทบาทการสอน">
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "COORDINATOR" | "PRIMARY" | "CO_INSTRUCTOR" | "GUEST")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="COORDINATOR">ผู้รับผิดชอบรายวิชา (Coordinator)</option>
                  <option value="PRIMARY">ผู้สอนหลัก (Primary Instructor)</option>
                  <option value="CO_INSTRUCTOR">ผู้สอนร่วม (Co-Instructor)</option>
                  <option value="GUEST">อาจารย์พิเศษ (Guest Lecturer)</option>
                </select>
              </LiyonField>

              <LiyonField label="กลุ่มเรียน (Section)">
                <input
                  type="text"
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  placeholder="เช่น 01, 02"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <LiyonField label="ชั่วโมงสอนต่อสัปดาห์ (ชม.)">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={formHours}
                  onChange={(e) => setFormHours(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </LiyonField>

              <LiyonField label="จำนวนนิสิตโดยประมาณ (คน)">
                <input
                  type="number"
                  min={0}
                  value={formStudents}
                  onChange={(e) => setFormStudents(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </LiyonField>
            </div>

            <LiyonField label="หมายเหตุ / หัวข้อที่รับผิดชอบสอน">
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="เช่น บรรยายภาคทฤษฎีสัปดาห์ที่ 1-8"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              />
            </LiyonField>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button size="sm" onClick={handleSaveAssignment} disabled={isPending}>
              {isPending ? "กำลังบันทึก..." : "บันทึกการมอบหมาย"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <LiyonDialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <LiyonDialogHeader
            title="ยืนยันการยกเลิกการมอบหมายผู้สอน"
            description={`ต้องการยกเลิกการมอบหมายอาจารย์ "${deleteTarget.personnel?.fullNameTh}" สำหรับวิชานี้หรือไม่?`}
          />
          <LiyonDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAssignment}
              disabled={isPending}
            >
              {isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}
    </div>
  );
}
