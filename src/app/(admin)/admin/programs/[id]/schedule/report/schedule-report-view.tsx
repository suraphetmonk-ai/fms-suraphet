"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  LayoutGrid,
  List,
  CheckCircle2,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgramTimetableDossierDto } from "@/features/curriculum";

interface Props {
  dossier: ProgramTimetableDossierDto;
  tenantName: string;
}

export function ScheduleReportView({ dossier, tenantName }: Props) {
  const [printMode, setPrintMode] = useState<"matrix" | "ledger">("matrix");

  const handlePrint = () => {
    window.print();
  };

  const currentYear = dossier.academicYear;
  const currentSemester = dossier.semester;
  const yearLevelLabel = dossier.yearLevelFilter
    ? `ชั้นปีที่ ${dossier.yearLevelFilter}`
    : "ทุกชั้นปี (ปี ๑ - ๔)";

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans print:bg-white print:text-black">
      {/* ==================================================== */}
      {/* Non-printable Control Toolbar                        */}
      {/* ==================================================== */}
      <header className="no-print sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/programs/${dossier.program.id}/schedule`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าจัดการตารางสอน
            </Link>
            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
            <span className="text-xs text-neutral-500">
              {dossier.program.code} - {dossier.program.nameTh}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-neutral-300 dark:border-neutral-700 p-0.5 bg-neutral-100 dark:bg-neutral-800">
              <button
                onClick={() => setPrintMode("matrix")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  printMode === "matrix"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> ตารางรวม (Matrix)
              </button>
              <button
                onClick={() => setPrintMode("ledger")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  printMode === "ledger"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                }`}
              >
                <List className="h-3.5 w-3.5" /> บัญชีรายการ (Ledger)
              </button>
            </div>

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
      <main
        className={`mx-auto my-6 p-8 sm:p-12 bg-white text-black shadow-lg rounded-sm print:m-0 print:p-0 print:shadow-none print:rounded-none print:w-full print:max-w-none ${
          printMode === "matrix" ? "max-w-[297mm]" : "max-w-[210mm]"
        }`}
      >
        {/* Document Header */}
        <div className="text-center border-b-2 border-neutral-900 pb-4 mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Dharmachakra Symbol / Emblem */}
            <div className="w-14 h-14 rounded-full border-2 border-amber-800 flex items-center justify-center text-amber-800 bg-amber-50/50 print:bg-transparent">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current" aria-label="MCU Wheel">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <path
                  d="M12 3v6M12 15v6M3 12h6M15 12h6M5.636 5.636l4.243 4.243M14.121 14.121l4.243 4.243M5.636 18.364l4.243-4.243M14.121 9.879l4.243-4.243"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
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
              ตารางสอนและตารางเรียนประจำภาคการศึกษา (Course Timetable & Teaching Schedule)
            </h3>
            <p className="text-xs text-neutral-700 mt-0.5">
              {dossier.program.nameTh} ({dossier.program.code}) | ภาคการศึกษาที่ {currentSemester} ปีการศึกษา {currentYear} ({yearLevelLabel})
            </p>
          </div>
        </div>

        {/* ==================================================== */}
        {/* Mode 1: Weekly Matrix View                           */}
        {/* ==================================================== */}
        {printMode === "matrix" && (
          <section className="mb-6">
            <div className="overflow-x-auto border-2 border-neutral-900 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100 border-b-2 border-neutral-900 font-semibold text-neutral-900 print:bg-neutral-100">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-28 border-r border-neutral-400">
                      วันในสัปดาห์
                    </th>
                    <th className="py-2.5 px-3 border-r border-neutral-400 text-center w-5/12">
                      <div>ภาคเช้า (Morning Session)</div>
                      <div className="text-[10px] font-mono font-normal text-neutral-600">
                        08:30 - 11:15 น.
                      </div>
                    </th>
                    <th className="py-2.5 px-2 text-center w-28 border-r border-neutral-400 bg-amber-50 print:bg-amber-50">
                      <div className="text-[11px] font-bold text-amber-900">เวลาฉันเพล</div>
                      <div className="text-[9px] font-mono text-amber-800">11:15 - 13:00 น.</div>
                    </th>
                    <th className="py-2.5 px-3 border-r border-neutral-400 text-center w-5/12">
                      <div>ภาคบ่าย (Afternoon Session)</div>
                      <div className="text-[10px] font-mono font-normal text-neutral-600">
                        13:00 - 16:30 น.
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-center w-40">
                      <div>ภาคค่ำ/ปฏิบัติธรรม</div>
                      <div className="text-[10px] font-mono font-normal text-neutral-600">
                        16:30 - 18:00 น.
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-300 text-neutral-900">
                  {dossier.days.map((day) => {
                    const morningSlots = day.schedules.filter((s) => s.startTime < "12:00");
                    const afternoonSlots = day.schedules.filter(
                      (s) => s.startTime >= "12:00" && s.startTime < "16:30"
                    );
                    const eveningSlots = day.schedules.filter((s) => s.startTime >= "16:30");

                    return (
                      <tr key={day.dayOfWeek} className="break-inside-avoid">
                        {/* Day Column */}
                        <td className="py-3 px-3 font-semibold text-center bg-neutral-50 print:bg-neutral-50 border-r border-neutral-300">
                          <div className="text-sm text-neutral-950">{day.dayNameTh}</div>
                          <div className="text-[10px] text-neutral-600 font-mono italic">
                            {day.dayNameEn}
                          </div>
                        </td>

                        {/* Morning Column */}
                        <td className="py-2 px-2.5 border-r border-neutral-300 align-top">
                          {morningSlots.length === 0 ? (
                            <div className="text-center text-neutral-400 italic text-[11px] py-2">
                              -
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {morningSlots.map((s) => (
                                <div
                                  key={s.id}
                                  className="p-2 rounded border border-neutral-300 bg-neutral-50/70 print:bg-transparent text-xs"
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-mono font-bold text-neutral-950">
                                      {s.scheduleCode}
                                    </span>
                                    <span className="font-mono text-[10px] text-neutral-700 bg-neutral-200/80 px-1 rounded">
                                      {s.startTime} - {s.endTime} น.
                                    </span>
                                  </div>
                                  <div className="font-semibold text-neutral-950">
                                    {s.course?.code} {s.course?.nameTh}
                                  </div>
                                  <div className="text-[11px] text-neutral-700 mt-0.5">
                                    ผู้สอน:{" "}
                                    <span className="font-medium text-neutral-950">
                                      {s.personnel?.fullNameTh}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-neutral-600 mt-1 pt-1 border-t border-neutral-200">
                                    <span>ห้อง: {s.room}</span>
                                    <span>
                                      ปี {s.yearLevel} (Sec.{s.section})
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Lunch Buffer Column */}
                        <td className="py-2 px-2 text-center border-r border-neutral-300 bg-amber-50/40 print:bg-amber-50/40 align-middle text-[10px] text-amber-900">
                          <div className="flex flex-col items-center justify-center h-full">
                            <Coffee className="h-4 w-4 mb-1 text-amber-700 opacity-60" />
                            <span>ฉันเพล</span>
                            <span>พักกลางวัน</span>
                          </div>
                        </td>

                        {/* Afternoon Column */}
                        <td className="py-2 px-2.5 border-r border-neutral-300 align-top">
                          {afternoonSlots.length === 0 ? (
                            <div className="text-center text-neutral-400 italic text-[11px] py-2">
                              -
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {afternoonSlots.map((s) => (
                                <div
                                  key={s.id}
                                  className="p-2 rounded border border-neutral-300 bg-neutral-50/70 print:bg-transparent text-xs"
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-mono font-bold text-neutral-950">
                                      {s.scheduleCode}
                                    </span>
                                    <span className="font-mono text-[10px] text-neutral-700 bg-neutral-200/80 px-1 rounded">
                                      {s.startTime} - {s.endTime} น.
                                    </span>
                                  </div>
                                  <div className="font-semibold text-neutral-950">
                                    {s.course?.code} {s.course?.nameTh}
                                  </div>
                                  <div className="text-[11px] text-neutral-700 mt-0.5">
                                    ผู้สอน:{" "}
                                    <span className="font-medium text-neutral-950">
                                      {s.personnel?.fullNameTh}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-neutral-600 mt-1 pt-1 border-t border-neutral-200">
                                    <span>ห้อง: {s.room}</span>
                                    <span>
                                      ปี {s.yearLevel} (Sec.{s.section})
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Evening / Meditation Column */}
                        <td className="py-2 px-2.5 align-top">
                          {eveningSlots.length === 0 ? (
                            <div className="text-center text-neutral-400 italic text-[11px] py-2">
                              -
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {eveningSlots.map((s) => (
                                <div
                                  key={s.id}
                                  className="p-2 rounded border border-neutral-300 bg-neutral-50/70 print:bg-transparent text-xs"
                                >
                                  <div className="font-mono font-bold text-[11px] text-neutral-950">
                                    {s.startTime} - {s.endTime}
                                  </div>
                                  <div className="font-semibold text-neutral-950 text-[11px]">
                                    {s.course?.code}
                                  </div>
                                  <div className="text-[10px] text-neutral-700">
                                    {s.personnel?.fullNameTh}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ==================================================== */}
        {/* Mode 2: Detailed Ledger View                         */}
        {/* ==================================================== */}
        {printMode === "ledger" && (
          <section className="mb-6">
            <div className="overflow-x-auto border border-neutral-400 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100 border-b border-neutral-400 font-semibold text-neutral-900 print:bg-neutral-100">
                  <tr>
                    <th className="py-2 px-2 text-center w-8 border-r border-neutral-300">ที่</th>
                    <th className="py-2 px-2 w-24 border-r border-neutral-300">เลขที่ตาราง</th>
                    <th className="py-2 px-2 w-20 border-r border-neutral-300">วัน</th>
                    <th className="py-2 px-2 w-28 border-r border-neutral-300">เวลา</th>
                    <th className="py-2 px-2 border-r border-neutral-300">รหัส / ชื่อรายวิชา</th>
                    <th className="py-2 px-2 text-center w-12 border-r border-neutral-300">นก.</th>
                    <th className="py-2 px-2 text-center w-14 border-r border-neutral-300">ชั้นปี/กลุ่ม</th>
                    <th className="py-2 px-2 border-r border-neutral-300">ห้องเรียน / อาคาร</th>
                    <th className="py-2 px-2">อาจารย์ผู้สอน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-900">
                  {dossier.schedules.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-4 text-center text-neutral-500 italic">
                        ไม่พบข้อมูลตารางสอน
                      </td>
                    </tr>
                  ) : (
                    dossier.schedules.map((s, idx) => (
                      <tr key={s.id} className="break-inside-avoid">
                        <td className="py-2 px-2 text-center font-mono text-[11px] border-r border-neutral-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 font-mono font-bold text-neutral-950 border-r border-neutral-200">
                          {s.scheduleCode}
                        </td>
                        <td className="py-2 px-2 font-medium border-r border-neutral-200">
                          {s.dayNameTh}
                        </td>
                        <td className="py-2 px-2 font-mono text-[11px] border-r border-neutral-200">
                          {s.startTime} - {s.endTime}
                        </td>
                        <td className="py-2 px-2 border-r border-neutral-200">
                          <div className="font-semibold text-neutral-950">
                            {s.course?.code} {s.course?.nameTh}
                          </div>
                          <div className="text-[10px] text-neutral-600 italic">
                            {s.course?.nameEn}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center font-mono border-r border-neutral-200">
                          {s.course?.credits}
                        </td>
                        <td className="py-2 px-2 text-center font-mono border-r border-neutral-200">
                          ปี {s.yearLevel}/{s.section}
                        </td>
                        <td className="py-2 px-2 text-[11px] border-r border-neutral-200">
                          <div className="font-medium text-neutral-950">{s.room}</div>
                          <div className="text-neutral-600">{s.building || "-"}</div>
                        </td>
                        <td className="py-2 px-2 text-xs font-semibold text-neutral-950">
                          {s.personnel?.fullNameTh}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section: สรุปข้อมูลตารางสอนและการลงนามรับรอง */}
        <section className="mb-8 break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-neutral-300 pb-1 mb-3">
            <CheckCircle2 className="h-4 w-4 text-neutral-800" />
            <h4 className="text-sm font-bold uppercase text-neutral-900">
              สรุปสถิติการจัดการเรียนการสอนและการลงนามรับรอง
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center border border-neutral-300 p-3 rounded bg-neutral-50/50 print:bg-transparent mb-6">
            <div className="border-r border-neutral-200 last:border-r-0">
              <div className="text-[11px] text-neutral-600">จำนวนคาบเรียนทั้งหมด</div>
              <div className="text-base font-bold font-mono text-neutral-950">
                {dossier.summary.totalSchedules} คาบ
              </div>
            </div>
            <div className="border-r border-neutral-200 last:border-r-0">
              <div className="text-[11px] text-neutral-600">จำนวนรายวิชาที่เปิดสอน</div>
              <div className="text-base font-bold font-mono text-neutral-950">
                {dossier.summary.totalCourses} รายวิชา
              </div>
            </div>
            <div className="border-r border-neutral-200 last:border-r-0">
              <div className="text-[11px] text-neutral-600">อาจารย์ผู้ปฏิบัติงานสอน</div>
              <div className="text-base font-bold font-mono text-neutral-950">
                {dossier.summary.totalInstructors} รูป/ท่าน
              </div>
            </div>
            <div className="border-r border-neutral-200 last:border-r-0">
              <div className="text-[11px] text-neutral-600">ห้องเรียนที่ใช้งาน</div>
              <div className="text-base font-bold font-mono text-neutral-950">
                {dossier.summary.totalRooms} ห้อง
              </div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-600">รวมชั่วโมงสอน/สัปดาห์</div>
              <div className="text-base font-bold font-mono text-primary">
                {dossier.summary.totalHoursPerWeek} ชม./สัปดาห์
              </div>
            </div>
          </div>

          {/* Official Sign-off Blocks */}
          <div className="grid grid-cols-3 gap-6 text-center text-xs mt-8">
            <div className="flex flex-col items-center">
              <p className="text-neutral-700 mb-10">ขอรับรองว่าจัดตารางสอนถูกต้องตามเกณฑ์</p>
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
              <p className="text-neutral-700 mb-10">ได้ตรวจสอบห้องเรียนและภาระงานสอน</p>
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
              <p className="text-neutral-700 mb-10">อนุมัติตารางสอนและตารางเรียน</p>
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
            วิทยาลัยสงฆ์นครพนม มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (เอกสารตารางสอนทางการ - ห้ามดัดแปลงแก้ไข)
          </div>
          <div>
            พิมพ์เมื่อ: {new Date().toLocaleString("th-TH")} | ระบบบริหารจัดการตารางสอนและตารางเรียน
          </div>
        </footer>
      </main>
    </div>
  );
}
