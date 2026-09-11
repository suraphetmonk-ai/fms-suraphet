import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/shared/lib/i18n/server";
import { getProgramDetail } from "@/features/curriculum/server";
import { prisma } from "@/shared/lib/infra/prisma";
import {
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  Briefcase,
  FileDown,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const isTh = locale === "th";

  const tenant = await prisma.tenant.findFirst();
  const tenantId = tenant?.id ?? "";

  const program = await getProgramDetail(tenantId, id);
  if (!program || program.status !== "ACTIVE") {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground">
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4" />
            <span>{isTh ? "กลับหน้ารวมหลักสูตร" : "Back to Programs"}</span>
          </Link>
        </Button>
      </div>

      {/* Program Header */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-primary/10 text-primary">
            {program.code}
          </span>
          <span className="rounded bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {program.degreeLevel === "BACHELOR"
              ? isTh ? "ปริญญาตรี" : "Bachelor's"
              : program.degreeLevel === "MASTER"
              ? isTh ? "ปริญญาโท" : "Master's"
              : isTh ? "ปริญญาเอก" : "Doctoral"}
          </span>
          {program.isOpenAdmission && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isTh ? "เปิดรับสมัครนิสิตใหม่" : "Open for Admissions"}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {isTh ? program.nameTh : program.nameEn}
          </h1>
          <p className="text-base text-primary font-medium mt-1">
            {isTh ? program.degreeNameTh : program.degreeNameEn}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isTh ? program.departmentNameTh : program.departmentNameEn}
          </p>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t text-sm">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">{isTh ? "จำนวนหน่วยกิตรวม" : "Total Credits"}</span>
            <div className="font-bold text-foreground">{program.totalCredits} หน่วยกิต</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">{isTh ? "ระยะเวลาการศึกษา" : "Duration"}</span>
            <div className="font-bold text-foreground">{program.durationYears} ปี</div>
          </div>
          {program.tuitionFee && (
            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-xs text-muted-foreground">{isTh ? "ค่าธรรมเนียมการศึกษา" : "Tuition Fee"}</span>
              <div className="font-bold text-foreground">{program.tuitionFee}</div>
            </div>
          )}
        </div>

        {program.pdfUrl && (
          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={program.pdfUrl} target="_blank" rel="noreferrer">
                <FileDown className="h-4 w-4" />
                <span>{isTh ? "ดาวน์โหลดเอกสารหลักสูตร (มคอ.2)" : "Download Curriculum PDF"}</span>
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Description & Career Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {program.descriptionTh && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>{isTh ? "ปรัชญาและความสำคัญของหลักสูตร" : "Curriculum Overview"}</span>
              </h2>
              <div className="rounded-xl border bg-card p-5 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {isTh ? program.descriptionTh : program.descriptionEn || program.descriptionTh}
              </div>
            </div>
          )}

          {/* Curriculum Structure / Study Plans */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span>{isTh ? "โครงสร้างและแผนการศึกษา" : "Curriculum Structure & Study Plans"}</span>
            </h2>

            {program.studyPlans && program.studyPlans.length > 0 ? (
              <div className="space-y-3">
                {program.studyPlans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border bg-card p-4">
                    <h3 className="font-bold text-sm text-foreground">
                      {isTh ? plan.nameTh : plan.nameEn}
                    </h3>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                {isTh
                  ? "โครงสร้างหลักสูตรประกอบด้วย หมวดวิชาศึกษาทั่วไป, หมวดวิชาเฉพาะ (วิชาแกน/วิชาเอก), และหมวดวิชาเลือกเสรี ตามเกณฑ์มาตรฐานอุดมศึกษา"
                  : "The curriculum consists of General Education courses, Specialized Core & Major courses, and Free Electives complying with Higher Education standards."}
              </div>
            )}
          </div>
        </div>

        {/* Career Opportunities Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>{isTh ? "แนวทางการประกอบอาชีพ" : "Career Opportunities"}</span>
            </h3>
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {isTh
                ? program.careerOpportunitiesTh || "นักพัฒนาซอฟต์แวร์, นักวิเคราะห์ระบบ, ผู้ดูแลระบบเครือข่าย, นักวิทยาศาสตร์ข้อมูล"
                : program.careerOpportunitiesEn || program.careerOpportunitiesTh || "Software Engineer, System Analyst, Network Administrator, Data Scientist"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
