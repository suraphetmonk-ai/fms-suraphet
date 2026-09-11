"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { revealCitizenIdAction } from "@/features/personnel/actions";
import type { ProgramTeachingDossierDto } from "@/features/curriculum";

interface Props {
  dossier: ProgramTeachingDossierDto;
  tenantName: string;
  canManagePersonnel: boolean;
}

export function CurriculumReportView({ dossier, tenantName, canManagePersonnel }: Props) {
  const [unmaskedCids, setUnmaskedCids] = useState<Record<string, string>>({});
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const toggleRevealSingle = async (personnelId: string) => {
    if (unmaskedCids[personnelId]) {
      const next = { ...unmaskedCids };
      delete next[personnelId];
      setUnmaskedCids(next);
      return;
    }

    setRevealingId(personnelId);
    try {
      const res = await revealCitizenIdAction(personnelId);
      if (res.ok && res.data) {
        setUnmaskedCids((prev) => ({ ...prev, [personnelId]: res.data }));
      }
    } finally {
      setRevealingId(null);
    }
  };

  const toggleRevealAll = async () => {
    if (isRevealingAll) {
      setUnmaskedCids({});
      setIsRevealingAll(false);
      return;
    }

    setIsRevealingAll(true);
    const newMap: Record<string, string> = {};
    for (const inst of dossier.instructors) {
      const res = await revealCitizenIdAction(inst.id);
      if (res.ok && res.data) {
        newMap[inst.id] = res.data;
      }
    }
    setUnmaskedCids(newMap);
  };

  const currentYear = dossier.academicYear;
  const currentSemester = dossier.semester;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans print:bg-white print:text-black">
      {/* ==================================================== */}
      {/* Non-printable Control Toolbar                        */}
      {/* ==================================================== */}
      <header className="no-print sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/programs"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับหน้ารายการหลักสูตร
            </Link>
            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
            <Link
              href={`/admin/programs/${dossier.program.id}/teaching`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Users className="h-4 w-4" />
              จัดการภาระงานสอน
            </Link>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {canManagePersonnel && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleRevealAll}
                className="text-xs h-8 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                title="สำหรับเจ้าหน้าที่ฝ่ายบุคคล/ผู้มีสิทธิ์ เพื่อพิมพ์รายงานที่มีเลข ปชช. ครบถ้วน"
              >
                {isRevealingAll ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1" /> ซ่อนเลขบัตร ปชช. (PDPA Mask)
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1" /> แสดงเลขบัตร ปชช. เต็ม (Unmask)
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handlePrint}
              size="sm"
              className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              พิมพ์รายงาน / บันทึกเป็น PDF
            </Button>
          </div>
        </div>
      </header>

      {/* ==================================================== */}
      {/* Printable Report Document (A4 Form Factor)           */}
      {/* ==================================================== */}
      <main className="max-w-[210mm] mx-auto my-6 p-8 sm:p-12 bg-white text-black shadow-lg rounded-sm print:m-0 print:p-0 print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Document Header */}
        <div className="text-center border-b-2 border-neutral-900 pb-4 mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Dharmachakra Symbol / Emblem */}
            <div className="w-14 h-14 rounded-full border-2 border-amber-800 flex items-center justify-center text-amber-800 bg-amber-50/50 print:bg-transparent">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current" aria-label="MCU Wheel">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.636 5.636l4.243 4.243M14.121 14.121l4.243 4.243M5.636 18.364l4.243-4.243M14.121 9.879l4.243-4.243" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-950 font-serif">
                {tenantName}
              </h1>
              <h2 className="text-sm font-semibold text-neutral-800">
                {dossier.program.departmentNameTh || "สาขาวิชาพระพุทธศาสนา"} วิทยาลัยสงฆ์นครพนม
              </h2>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900">
              รายงานข้อมูลหลักสูตรและการมอบหมายภาระงานสอน (มคอ.๒)
            </h3>
            <p className="text-xs text-neutral-700 mt-0.5">
              ภาคการศึกษาที่ {currentSemester} ปีการศึกษา {currentYear}
            </p>
          </div>
        </div>

        {/* Section 1: ข้อมูลทั่วไปของหลักสูตร */}
        <section className="mb-6 break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-neutral-300 pb-1 mb-2">
            <BookOpen className="h-4 w-4 text-neutral-800" />
            <h4 className="text-sm font-bold uppercase text-neutral-900">
              หมวดที่ ๑: ข้อมูลทั่วไปของหลักสูตร
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs border border-neutral-300 p-3 rounded bg-neutral-50/50 print:bg-transparent">
            <div>
              <span className="font-semibold text-neutral-700">รหัสหลักสูตร:</span>{" "}
              <span className="font-mono font-bold text-neutral-900">{dossier.program.code}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">ระดับการศึกษา:</span>{" "}
              <span className="text-neutral-900">
                {dossier.program.degreeLevel === "BACHELOR"
                  ? "ปริญญาตรี (๔ ปี)"
                  : dossier.program.degreeLevel}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold text-neutral-700">ชื่อหลักสูตร (ไทย):</span>{" "}
              <span className="font-semibold text-neutral-900">{dossier.program.nameTh}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold text-neutral-700">ชื่อหลักสูตร (อังกฤษ):</span>{" "}
              <span className="text-neutral-800 italic">{dossier.program.nameEn}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">ชื่อปริญญา (ไทย):</span>{" "}
              <span className="text-neutral-900">{dossier.program.degreeNameTh}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">ชื่อปริญญา (อังกฤษ):</span>{" "}
              <span className="text-neutral-800">{dossier.program.degreeNameEn}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">จำนวนหน่วยกิตรวมตลอดหลักสูตร:</span>{" "}
              <span className="font-bold text-neutral-900">{dossier.program.totalCredits} หน่วยกิต</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">ระยะเวลาการศึกษาตามแผน:</span>{" "}
              <span className="text-neutral-900">{dossier.program.durationYears} ปี</span>
            </div>
          </div>
        </section>

        {/* Section 2: คณาจารย์และบุคลากรผู้รับผิดชอบหลักสูตร */}
        <section className="mb-6">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1 mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-800" />
              <h4 className="text-sm font-bold uppercase text-neutral-900">
                หมวดที่ ๒: บัญชีรายชื่อคณาจารย์ผู้รับผิดชอบหลักสูตรและอาจารย์ประจำ
              </h4>
            </div>
            <span className="text-[11px] text-neutral-600">
              รวม {dossier.instructors.length} ท่าน
            </span>
          </div>

          <div className="overflow-x-auto border border-neutral-300 rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 border-b border-neutral-300 text-neutral-800 font-semibold print:bg-neutral-100">
                <tr>
                  <th className="py-2 px-2 text-center w-8 border-r border-neutral-300">ที่</th>
                  <th className="py-2 px-2 w-20 border-r border-neutral-300">เลขที่บุคลากร</th>
                  <th className="py-2 px-2 w-32 border-r border-neutral-300">
                    เลขประจำตัวประชาชน
                  </th>
                  <th className="py-2 px-2 border-r border-neutral-300">
                    สมณศักดิ์ / ชื่อ-นามสกุล / ฉายา / เปรียญ
                  </th>
                  <th className="py-2 px-2 border-r border-neutral-300">วัดต้นสังกัด / พำนัก / ที่อยู่</th>
                  <th className="py-2 px-2 w-24 border-r border-neutral-300">การติดต่อ</th>
                  <th className="py-2 px-2 text-center w-14">ภาระสอน (ชม.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-900">
                {dossier.instructors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-neutral-500 italic">
                      ยังไม่มีข้อมูลการมอบหมายคณาจารย์ในภาคการศึกษานี้
                    </td>
                  </tr>
                ) : (
                  dossier.instructors.map((inst, idx) => {
                    const cidDisplay = unmaskedCids[inst.id] || inst.citizenIdMasked || "-";
                    return (
                      <tr key={inst.id} className="break-inside-avoid">
                        <td className="py-2 px-2 text-center font-mono border-r border-neutral-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 font-mono font-medium border-r border-neutral-200">
                          {inst.personnelCode || "-"}
                        </td>
                        <td className="py-2 px-2 font-mono text-[11px] border-r border-neutral-200">
                          <div className="flex items-center justify-between gap-1">
                            <span>{cidDisplay}</span>
                            {canManagePersonnel && (
                              <button
                                type="button"
                                onClick={() => toggleRevealSingle(inst.id)}
                                className="no-print p-0.5 text-neutral-400 hover:text-neutral-800"
                                title="เปิดดู/ปิดเลขเต็ม"
                              >
                                {unmaskedCids[inst.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 border-r border-neutral-200">
                          <div className="font-semibold text-neutral-950">
                            {inst.fullNameTh}
                          </div>
                          <div className="text-[11px] text-neutral-600 italic">
                            {inst.fullNameEn}
                          </div>
                        </td>
                        <td className="py-2 px-2 border-r border-neutral-200 text-[11px]">
                          {inst.templeName && (
                            <div className="font-medium text-neutral-900">{inst.templeName}</div>
                          )}
                          <div className="text-neutral-600">{inst.address || "-"}</div>
                        </td>
                        <td className="py-2 px-2 border-r border-neutral-200 text-[11px]">
                          {inst.phone && <div>{inst.phone}</div>}
                          {inst.email && (
                            <div className="text-neutral-600 truncate max-w-[120px]">
                              {inst.email}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-bold font-mono text-neutral-950">
                          {inst.totalAssignedHours}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: โครงสร้างรายวิชาและการมอบหมายภาระงานสอน */}
        <section className="mb-6">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1 mb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-neutral-800" />
              <h4 className="text-sm font-bold uppercase text-neutral-900">
                หมวดที่ ๓: แผนโครงสร้างรายวิชาและบัญชีการมอบหมายผู้สอน
              </h4>
            </div>
            <span className="text-[11px] text-neutral-600">
              วิชาที่เปิดสอน {dossier.summary.assignedCourses} จาก {dossier.summary.totalCourses} รายวิชา
            </span>
          </div>

          <div className="overflow-x-auto border border-neutral-300 rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 border-b border-neutral-300 text-neutral-800 font-semibold print:bg-neutral-100">
                <tr>
                  <th className="py-2 px-2 text-center w-8 border-r border-neutral-300">ชั้นปี/เทอม</th>
                  <th className="py-2 px-2 w-20 border-r border-neutral-300">รหัสวิชา</th>
                  <th className="py-2 px-2 border-r border-neutral-300">ชื่อรายวิชา / หมวดวิชา</th>
                  <th className="py-2 px-2 text-center w-16 border-r border-neutral-300">หน่วยกิต</th>
                  <th className="py-2 px-2 border-r border-neutral-300">อาจารย์ผู้สอน</th>
                  <th className="py-2 px-2 text-center w-12 border-r border-neutral-300">กลุ่ม</th>
                  <th className="py-2 px-2 text-center w-14 border-r border-neutral-300">นิสิต (คน)</th>
                  <th className="py-2 px-2 text-center w-14">ชม./สัปดาห์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-900">
                {dossier.courses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-neutral-500 italic">
                      ยังไม่มีโครงสร้างรายวิชาที่กำหนดในหลักสูตรนี้
                    </td>
                  </tr>
                ) : (
                  dossier.courses.map((course) => {
                    const hasAssignment = course.assignments.length > 0;
                    return (
                      <tr key={course.id} className="break-inside-avoid">
                        <td className="py-2 px-2 text-center font-mono text-[11px] border-r border-neutral-200">
                          {course.yearLevel}/{course.semester}
                        </td>
                        <td className="py-2 px-2 font-mono font-bold text-neutral-950 border-r border-neutral-200">
                          {course.code}
                        </td>
                        <td className="py-2 px-2 border-r border-neutral-200">
                          <div className="font-semibold text-neutral-950">{course.nameTh}</div>
                          <div className="text-[11px] text-neutral-600 italic">{course.nameEn}</div>
                          {course.courseCategory && (
                            <span className="inline-block mt-0.5 text-[10px] bg-neutral-100 text-neutral-700 px-1 rounded border border-neutral-200">
                              {course.courseCategory}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-medium border-r border-neutral-200">
                          {course.credits}
                        </td>
                        <td className="py-2 px-2 border-r border-neutral-200">
                          {hasAssignment ? (
                            <div className="space-y-1">
                              {course.assignments.map((a) => (
                                <div key={a.id} className="text-xs">
                                  <span className="font-medium text-neutral-950">
                                    {a.personnel?.fullNameTh}
                                  </span>
                                  <span className="ml-1 text-[10px] text-neutral-600">
                                    (
                                    {a.role === "COORDINATOR"
                                      ? "ผู้รับผิดชอบวิชา"
                                      : a.role === "PRIMARY"
                                      ? "ผู้สอนหลัก"
                                      : a.role === "CO_INSTRUCTOR"
                                      ? "ผู้สอนร่วม"
                                      : "อาจารย์พิเศษ"}
                                    )
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic text-[11px]">
                              - ยังไม่ได้มอบหมายผู้สอน -
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-mono border-r border-neutral-200">
                          {hasAssignment ? course.assignments[0]?.section : "-"}
                        </td>
                        <td className="py-2 px-2 text-center font-mono border-r border-neutral-200">
                          {hasAssignment ? course.assignments[0]?.studentCount : "-"}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-neutral-950">
                          {hasAssignment
                            ? course.assignments.reduce((sum, a) => sum + a.hoursPerWeek, 0)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: สรุปภาระงานและการลงนามรับรอง */}
        <section className="mb-8 break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-neutral-300 pb-1 mb-3">
            <CheckCircle2 className="h-4 w-4 text-neutral-800" />
            <h4 className="text-sm font-bold uppercase text-neutral-900">
              หมวดที่ ๔: สรุปภาระงานสอนและการลงนามรับรองความถูกต้อง
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border border-neutral-300 p-3 rounded bg-neutral-50/50 print:bg-transparent mb-6">
            <div className="border-r border-neutral-200 last:border-r-0">
              <div className="text-[11px] text-neutral-600">รายวิชาทั้งหมดในหลักสูตร</div>
              <div className="text-base font-bold font-mono text-neutral-950">
                {dossier.summary.totalCourses} รายวิชา
              </div>
            </div>
            <div className="border-r border-neutral-200 last:border-r-0">
              <div className="text-[11px] text-neutral-600">วิชาที่มอบหมายแล้ว</div>
              <div className="text-base font-bold font-mono text-emerald-700">
                {dossier.summary.assignedCourses} รายวิชา
              </div>
            </div>
            <div className="border-r border-neutral-200 last:border-r-0">
              <div className="text-[11px] text-neutral-600">จำนวนคณาจารย์ผู้สอน</div>
              <div className="text-base font-bold font-mono text-neutral-950">
                {dossier.summary.totalInstructors} รูป/ท่าน
              </div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-600">รวมภาระชั่วโมงสอนต่อสัปดาห์</div>
              <div className="text-base font-bold font-mono text-primary">
                {dossier.summary.totalTeachingHours} ชม./สัปดาห์
              </div>
            </div>
          </div>

          {/* Official Sign-off Blocks */}
          <div className="grid grid-cols-3 gap-6 text-center text-xs mt-8">
            <div className="flex flex-col items-center">
              <p className="text-neutral-700 mb-10">ขอรับรองว่าข้อมูลถูกต้อง</p>
              <div className="w-44 border-b border-dotted border-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-950">
                ( พระมหาปิยะวัฒน์ โสภณวาที, ดร. )
              </p>
              <p className="text-[11px] text-neutral-600">
                ประธานหลักสูตรสาขาวิชาพระพุทธศาสนา
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                วันที่ ......... / ......... / ................
              </p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-neutral-700 mb-10">ได้ตรวจสอบความครบถ้วนตามเกณฑ์ มคอ.</p>
              <div className="w-44 border-b border-dotted border-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-950">
                ( พระครูวิสุทธิ์ธีรคุณ รศ.ดร. )
              </p>
              <p className="text-[11px] text-neutral-600">
                หัวหน้าฝ่ายวิชาการและวิจัย
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                วันที่ ......... / ......... / ................
              </p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-neutral-700 mb-10">อนุมัติการมอบหมายภาระงานสอน</p>
              <div className="w-44 border-b border-dotted border-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-950">
                ( พระราชสิริวัฒน์ ผศ.ดร. )
              </p>
              <p className="text-[11px] text-neutral-600">
                ผู้อำนวยการวิทยาลัยสงฆ์นครพนม
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                วันที่ ......... / ......... / ................
              </p>
            </div>
          </div>
        </section>

        {/* Document Security Footer */}
        <footer className="border-t border-neutral-300 pt-3 flex items-center justify-between text-[10px] text-neutral-500">
          <div>
            วิทยาลัยสงฆ์นครพนม มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (เอกสารทางการ - ห้ามดัดแปลงแก้ไข)
          </div>
          <div>
            พิมพ์เมื่อ: {new Date().toLocaleString("th-TH")} | ระบบบริหารจัดการหลักสูตรและภาระงานสอน
          </div>
        </footer>
      </main>
    </div>
  );
}
