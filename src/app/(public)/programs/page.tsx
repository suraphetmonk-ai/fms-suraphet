import Link from "next/link";
import { getLocale } from "@/shared/lib/i18n/server";
import { listPublicPrograms } from "@/features/curriculum/server";
import { prisma } from "@/shared/lib/infra/prisma";
import {
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicProgramsListPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level } = await searchParams;
  const locale = await getLocale();
  const isTh = locale === "th";

  const tenant = await prisma.tenant.findFirst();
  const tenantId = tenant?.id ?? "";

  const programs = await listPublicPrograms(tenantId);

  const filtered = level ? programs.filter((p) => p.degreeLevel === level) : programs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {isTh ? "หลักสูตรการศึกษาที่เปิดสอน" : "Academic Programs"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isTh
            ? "ค้นหาหลักสูตรระดับปริญญาตรี ปริญญาโท และปริญญาเอก เพื่อเตรียมความพร้อมสู่อาชีพแห่งอนาคต"
            : "Explore undergraduate and graduate degree programs designed for next-generation technology careers"}
        </p>
      </div>

      {/* Degree Level Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          asChild
          variant={!level ? "default" : "outline"}
          size="sm"
          className="rounded-full"
        >
          <Link href="/programs">{isTh ? "ทุกระดับการศึกษา" : "All Degrees"}</Link>
        </Button>
        <Button
          asChild
          variant={level === "BACHELOR" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
        >
          <Link href="/programs?level=BACHELOR">{isTh ? "ปริญญาตรี" : "Bachelor's"}</Link>
        </Button>
        <Button
          asChild
          variant={level === "MASTER" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
        >
          <Link href="/programs?level=MASTER">{isTh ? "ปริญญาโท" : "Master's"}</Link>
        </Button>
        <Button
          asChild
          variant={level === "DOCTORAL" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
        >
          <Link href="/programs?level=DOCTORAL">{isTh ? "ปริญญาเอก" : "Doctoral"}</Link>
        </Button>
      </div>

      {/* Programs Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card text-muted-foreground">
          {isTh ? "ไม่พบหลักสูตรในระดับนี้" : "No degree programs found in this level."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prog) => (
            <div
              key={prog.id}
              className="group flex flex-col justify-between rounded-xl border bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-primary/50"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-primary/10 text-primary">
                    {prog.code}
                  </span>
                  {prog.isOpenAdmission ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {isTh ? "เปิดรับสมัคร" : "Admissions Open"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      {isTh ? "ปิดรับสมัคร" : "Closed"}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {isTh ? prog.nameTh : prog.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTh ? prog.degreeNameTh : prog.degreeNameEn}
                  </p>
                  <p className="text-[11px] text-primary/80 mt-0.5">
                    {isTh ? prog.departmentNameTh : prog.departmentNameEn}
                  </p>
                </div>

                {prog.descriptionTh && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {isTh ? prog.descriptionTh : prog.descriptionEn || prog.descriptionTh}
                  </p>
                )}

                <div className="space-y-1.5 pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{isTh ? "จำนวนหน่วยกิต:" : "Total Credits:"}</span>
                    <span className="font-medium text-foreground">{prog.totalCredits} หน่วยกิต</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{isTh ? "ระยะเวลาศึกษา:" : "Duration:"}</span>
                    <span className="font-medium text-foreground">{prog.durationYears} ปี</span>
                  </div>
                  {prog.tuitionFee && (
                    <div className="flex items-center justify-between">
                      <span>{isTh ? "ค่าธรรมเนียม:" : "Tuition Fee:"}</span>
                      <span className="font-medium text-foreground">{prog.tuitionFee}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t flex items-center justify-end">
                <Link
                  href={`/programs/${prog.id}`}
                  className="font-semibold text-xs text-primary inline-flex items-center gap-1 group-hover:underline"
                >
                  <span>{isTh ? "ดูโครงสร้างและแผนการเรียน" : "View Curriculum"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
