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
  GraduationCap,
  Users,
  Award,
  ChevronRight,
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

  // Fetch department faculty members
  const facultyMembers = program.departmentId
    ? await prisma.personnelProfile.findMany({
        where: { tenantId, departmentId: program.departmentId, isActive: true },
        orderBy: { orderIndex: "asc" },
      })
    : [];

  // Group courses by courseGroup
  const allCourses = program.courses || [];
  type CourseItem = NonNullable<typeof program.courses>[number];
  const coursesByGroup = allCourses.reduce<Record<string, CourseItem[]>>((acc, item) => {
    const grp = item.courseGroup || (isTh ? "รายวิชาในหลักสูตร" : "Curriculum Courses");
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(item);
    return acc;
  }, {});

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
              ? isTh ? "ปริญญาตรี (๔ ปี)" : "Bachelor's (4 Years)"
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
                <span>{isTh ? "ดาวน์โหลดเอกสารหลักสูตร (มคอ.๒)" : "Download Curriculum PDF (TQF 2)"}</span>
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Description & Career Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Description / Philosophy / PLOs */}
          {program.descriptionTh && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>{isTh ? "ปรัชญา วัตถุประสงค์ และผลลัพธ์การเรียนรู้ (PLOs)" : "Philosophy & Learning Outcomes (PLOs)"}</span>
              </h2>
              <div className="rounded-xl border bg-card p-5 sm:p-6 text-sm text-foreground/90 leading-relaxed whitespace-pre-line shadow-xs">
                {isTh ? program.descriptionTh : program.descriptionEn || program.descriptionTh}
              </div>
            </div>
          )}

          {/* Curriculum Structure / Study Plans */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span>{isTh ? "โครงสร้างและแผนการศึกษา ๔ ชั้นปี (YLOs)" : "Study Plans & Year Learning Outcomes (YLOs)"}</span>
            </h2>

            {program.studyPlans && program.studyPlans.length > 0 ? (
              <div className="space-y-3">
                {program.studyPlans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border bg-card p-4 flex items-start gap-3 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">
                        {isTh ? plan.nameTh : plan.nameEn}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                {isTh
                  ? "โครงสร้างหลักสูตรประกอบด้วย หมวดวิชาศึกษาทั่วไป, หมวดวิชาเฉพาะ (วิชาแกน/วิชาเอก), และหมวดวิชาเลือกเสรี ตามเกณฑ์มาตรฐานอุดมศึกษา"
                  : "The curriculum consists of General Education courses, Core & Major courses, and Free Electives complying with Higher Education standards."}
              </div>
            )}
          </div>

          {/* Course Syllabus / List */}
          {Object.keys(coursesByGroup).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>{isTh ? `รายวิชาในหลักสูตร (${allCourses.length} วิชา)` : `Curriculum Courses (${allCourses.length} Courses)`}</span>
              </h2>

              <div className="space-y-6">
                {Object.entries(coursesByGroup).map(([groupName, groupCourses]) => (
                  <div key={groupName} className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-primary border-b pb-1.5">
                      <Award className="h-4 w-4" />
                      <span>{groupName}</span>
                      <span className="text-xs text-muted-foreground font-normal">({groupCourses.length} วิชา)</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {groupCourses.map((item) => (
                        <div key={item.id} className="rounded-lg border bg-card p-3.5 space-y-1 shadow-xs hover:border-primary/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono text-xs font-semibold text-primary mr-2">
                                {item.course.code}
                              </span>
                              <span className="font-semibold text-sm text-foreground">
                                {isTh ? item.course.nameTh : item.course.nameEn}
                              </span>
                            </div>
                            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {item.course.credits}
                            </span>
                          </div>
                          {item.course.descriptionTh && (
                            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                              {isTh ? item.course.descriptionTh : item.course.descriptionEn || item.course.descriptionTh}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Career Info & Faculty */}
        <div className="space-y-6">
          {/* Career Opportunities */}
          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-xs">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>{isTh ? "แนวทางการประกอบอาชีพ" : "Career Opportunities"}</span>
            </h3>
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {isTh
                ? program.careerOpportunitiesTh || "นักวิชาการศาสนา, ครูผู้สอนสังคมศึกษาและพระพุทธศาสนา, พระสอนศีลธรรม"
                : program.careerOpportunitiesEn || program.careerOpportunitiesTh}
            </div>
          </div>

          {/* Program Faculty Committee */}
          {facultyMembers.length > 0 && (
            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>{isTh ? "คณาจารย์ประจำหลักสูตร" : "Curriculum Faculty"}</span>
              </h3>
              <div className="space-y-3">
                {facultyMembers.map((f) => (
                  <Link
                    key={f.id}
                    href={`/personnel/${f.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0 border">
                      {f.avatarUrl ? (
                        <img src={f.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {isTh
                          ? `${f.monasticTitle ? f.monasticTitle + " " : ""}${f.academicRank ? f.academicRank + " " : ""}${f.monasticTitle?.includes(f.firstNameTh) ? "" : f.firstNameTh + " "}${f.chaya ? "(" + f.chaya + ") " : ""}${f.lastNameTh}`
                          : `${f.academicRank ? f.academicRank + " " : ""}${f.firstNameEn} ${f.lastNameEn}`}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {isTh ? f.positionTh : f.positionEn}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
