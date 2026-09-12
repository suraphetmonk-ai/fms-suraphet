import Link from "next/link";
import { getLocale } from "@/shared/lib/i18n/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { verifyStudentByCode } from "@/features/students/server";
import { ShieldCheck, Search, Award, CheckCircle2, AlertCircle, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicVerifyStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const locale = await getLocale();
  const isTh = locale === "th";

  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  const tenantId = tenant?.id ?? "";

  const student = code ? await verifyStudentByCode(tenantId, code) : null;
  const searched = Boolean(code && code.trim().length > 0);

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-primary/5 via-background to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span>{isTh ? "กลับสู่หน้าหลัก" : "Back to Home"}</span>
            </Link>
          </Button>
        </div>

        {/* Header Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl text-primary mb-2 ring-8 ring-primary/5 shadow-xs">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {isTh ? "ระบบตรวจสอบสถานภาพนิสิตและวุฒิการศึกษา" : "Student & Degree Verification Portal"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {isTh
              ? "บริการสืบค้นและยืนยันความถูกต้องของสถานะความเป็นนิสิตหรือการสำเร็จการศึกษาอย่างเป็นทางการ สำหรับบุคคลภายนอก หน่วยงาน และนายจ้าง"
              : "Official service to verify student enrollment and academic graduation status for public agencies and employers."}
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
          <form method="GET" action="/verify-student" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                name="code"
                defaultValue={code || ""}
                required
                placeholder={isTh ? "กรอกรหัสนิสิต เช่น 66010001" : "Enter Student ID (e.g. 66010001)"}
                className="w-full pl-11 pr-4 py-3 text-base rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 rounded-xl font-semibold gap-2">
              <Search className="h-4 w-4" />
              <span>{isTh ? "ตรวจสอบสถานะ" : "Verify Status"}</span>
            </Button>
          </form>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{isTh ? "ตัวอย่างรหัสทดสอบ: 66010001, 66010002" : "Sample IDs: 66010001, 66010002"}</span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {isTh ? "สำนักทะเบียนคณะฯ" : "Faculty Registrar"}
            </span>
          </div>
        </div>

        {/* Result Area */}
        {searched && (
          <div>
            {student ? (
              <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden">
                {/* Decorative Verified Watermark */}
                <div className="absolute -right-6 -bottom-6 text-primary/5 pointer-events-none select-none">
                  <ShieldCheck className="w-64 h-64" />
                </div>

                <div className="flex items-start justify-between gap-4 border-b pb-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isTh ? "ข้อมูลถูกต้อง ได้รับการยืนยัน" : "Officially Verified"}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground pt-2">
                      {isTh ? student.fullNameTh : student.fullNameEn}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">
                      {isTh ? `รหัสนิสิต: ${student.studentCode}` : `Student ID: ${student.studentCode}`}
                    </p>
                  </div>

                  <div>
                    {student.status === "GRADUATED" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs">
                        <Award className="h-4 w-4" />
                        {isTh ? "สำเร็จการศึกษาแล้ว" : "Graduated"}
                      </span>
                    )}
                    {student.status === "STUDYING" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        {isTh ? "กำลังศึกษาอยู่" : "Currently Enrolled"}
                      </span>
                    )}
                    {student.status === "ON_LEAVE" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-xs">
                        {isTh ? "ลาพักการเรียน" : "On Academic Leave"}
                      </span>
                    )}
                    {student.status === "RETIRED" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-600 text-white shadow-xs">
                        {isTh ? "พ้นสภาพการเป็นนิสิต" : "Dismissed"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted/40 p-4 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                      {isTh ? "หลักสูตร / สาขาวิชา" : "Academic Program"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {isTh ? student.programNameTh : student.programNameEn}
                    </span>
                  </div>

                  <div className="bg-muted/40 p-4 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                      {isTh ? "ปีการศึกษาที่เข้าศึกษา" : "Admission Year"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {isTh ? `พ.ศ. ${student.admissionYear}` : `CE ${student.admissionYear - 543}`}
                    </span>
                  </div>
                </div>

                {/* PDPA Note */}
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {isTh
                      ? "การแสดงข้อมูลนี้เป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) เพื่อประโยชน์ในการตรวจสอบคุณวุฒิทางการศึกษา โดยระบบจะไม่เปิดเผยเกรดเฉลี่ย (GPA) ประวัติการให้คำปรึกษา หรือข้อมูลติดต่อส่วนบุคคลสู่สาธารณะ"
                      : "Verification details are provided in strict accordance with the Personal Data Protection Act (PDPA). Sensitive data such as GPA, advising logs, and private contact info are kept strictly confidential."}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-destructive/20 rounded-2xl p-8 text-center space-y-3">
                <div className="inline-flex items-center justify-center p-3 bg-destructive/10 rounded-full text-destructive mb-1">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {isTh ? "ไม่พบข้อมูลนิสิตตามรหัสที่ระบุ" : "Student Record Not Found"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {isTh
                    ? `ไม่พบประวัตินิสิตที่ตรงกับรหัส "${code}" ในฐานข้อมูลทะเบียนคณะฯ โปรดตรวจสอบรหัสให้ถูกต้อง หรือติดต่อฝ่ายทะเบียนและประมวลผล`
                    : `No record matches the student code "${code}". Please re-check the ID or contact the faculty registrar.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
