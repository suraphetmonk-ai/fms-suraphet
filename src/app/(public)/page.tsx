import Link from "next/link";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { listPublishedArticles } from "@/features/news/server";
import { listPublicPersonnel } from "@/features/personnel/server";
import { listPublicPrograms } from "@/features/curriculum/server";
import { getTenantSettings } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Users,
  Calendar,
  Eye,
  Pin,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicHomePage() {
  const locale = await getLocale();
  const isTh = locale === "th";

  // Resolve tenant
  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  const tenantId = tenant?.id;

  // Parallel fetch public content
  const [articles, personnel, programs, tenantSettings] = tenantId
    ? await Promise.all([
        listPublishedArticles(tenantId, 6),
        listPublicPersonnel(tenantId),
        listPublicPrograms(tenantId),
        getTenantSettings(tenantId).catch(() => null),
      ])
    : [[], [], [], null];

  // Executive members (lowest orderIndex)
  const executives = personnel.slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 sm:py-24 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {isTh
                ? "เปิดรับสมัครนิสิตใหม่ ภาคการศึกษา 2569"
                : "New Student Admission Open for 2026"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            {isTh ? (
              <>
                สู่อนาคตแห่ง <span className="text-primary">นวัตกรรมดิจิทัล</span> และปัญญาประดิษฐ์
              </>
            ) : (
              <>
                Pioneering the Future of <span className="text-primary">Digital Innovation</span> & AI
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isTh
              ? "ศูนย์กลางการศึกษาด้านวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศชั้นนำ บ่มเพาะบัณฑิตสู่การเป็นผู้นำทางเทคโนโลยีระดับสากล"
              : "A leading educational center for computer science and IT, empowering students to become visionary technology leaders worldwide."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="gap-2 shadow-md">
              <Link href="/programs">
                <BookOpen className="h-4 w-4" />
                <span>{isTh ? "ค้นหาหลักสูตรการศึกษา" : "Explore Programs"}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/news">
                <Calendar className="h-4 w-4" />
                <span>{isTh ? "อ่านข่าวประชาสัมพันธ์" : "Latest News"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Key Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-primary">{programs.length || "4"}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{isTh ? "หลักสูตรระดับสากล" : "Degree Programs"}</div>
          </div>
          <div className="text-center space-y-1 border-l">
            <div className="text-2xl sm:text-3xl font-extrabold text-primary">{personnel.length || "25"}+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{isTh ? "คณาจารย์และนักวิจัย" : "Faculty Members"}</div>
          </div>
          <div className="text-center space-y-1 border-l">
            <div className="text-2xl sm:text-3xl font-extrabold text-primary">1,200+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{isTh ? "นิสิตปัจจุบัน" : "Active Students"}</div>
          </div>
          <div className="text-center space-y-1 border-l">
            <div className="text-2xl sm:text-3xl font-extrabold text-primary">98.5%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{isTh ? "อัตราการได้งานทำ" : "Employment Rate"}</div>
          </div>
        </div>
      </section>

      {/* 3. Featured Programs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-primary">
              {isTh ? "การศึกษาและหลักสูตร" : "Academic Programs"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              {isTh ? "หลักสูตรเด่นที่เปิดสอน" : "Featured Degree Programs"}
            </h2>
          </div>
          <Button asChild variant="ghost" className="gap-1 text-primary">
            <Link href="/programs">
              <span>{isTh ? "ดูหลักสูตรทั้งหมด" : "View All Programs"}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.length === 0 ? (
            <div className="col-span-3 text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
              {isTh ? "ยังไม่มีข้อมูลหลักสูตรที่เปิดสอน" : "No programs published yet."}
            </div>
          ) : (
            programs.slice(0, 3).map((prog) => (
              <div
                key={prog.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-primary/50"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {prog.code}
                    </span>
                    {prog.isOpenAdmission && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {isTh ? "เปิดรับสมัคร" : "Admissions Open"}
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
                  </div>

                  {prog.descriptionTh && (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {isTh ? prog.descriptionTh : prog.descriptionEn || prog.descriptionTh}
                    </p>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <div>{prog.totalCredits} {isTh ? "หน่วยกิต" : "Credits"} • {prog.durationYears} {isTh ? "ปี" : "Years"}</div>
                  <Link
                    href={`/programs/${prog.id}`}
                    className="font-medium text-primary inline-flex items-center gap-1 group-hover:underline"
                  >
                    <span>{isTh ? "รายละเอียด" : "Details"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. Latest News & Announcements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-primary">
              {isTh ? "ข่าวประชาสัมพันธ์" : "Latest Updates"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              {isTh ? "ข่าวสารและกิจกรรมล่าสุด" : "News & Faculty Highlights"}
            </h2>
          </div>
          <Button asChild variant="ghost" className="gap-1 text-primary">
            <Link href="/news">
              <span>{isTh ? "ดูข่าวสารทั้งหมด" : "View All News"}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.length === 0 ? (
            <div className="col-span-3 text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
              {isTh ? "ยังไม่มีข่าวสารประชาสัมพันธ์" : "No news articles published yet."}
            </div>
          ) : (
            articles.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all hover:border-primary/50"
              >
                {item.coverImageUrl ? (
                  <div className="h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={item.coverImageUrl}
                      alt={item.titleTh}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-primary/5 flex items-center justify-center text-primary/40">
                    <GraduationCap className="h-12 w-12" />
                  </div>
                )}

                <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {isTh ? item.categoryNameTh : item.categoryNameEn}
                      </span>
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                          <Pin className="h-3 w-3 fill-current" />
                          {isTh ? "ปักหมุด" : "Pinned"}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {isTh ? item.titleTh : item.titleEn}
                    </h3>

                    {item.excerptTh && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {isTh ? item.excerptTh : item.excerptEn || item.excerptTh}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.publishedAt ? formatDate(new Date(item.publishedAt), locale) : "-"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.viewCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 5. Executive Board Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-wider font-semibold text-primary">
            {isTh ? "โครงสร้างการบริหาร" : "Faculty Leadership"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isTh ? "คณะผู้บริหารประจำคณะ" : "Executive Board Members"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isTh
              ? "นำพาคณะสู่ความเป็นเลิศทางวิชาการและการวิจัยระดับมาตรฐานสากล"
              : "Leading the faculty towards academic excellence and international research standards."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {executives.length === 0 ? (
            <div className="col-span-4 text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
              {isTh ? "ยังไม่มีข้อมูลผู้บริหาร" : "No executive personnel published yet."}
            </div>
          ) : (
            executives.map((p) => (
              <div
                key={p.id}
                className="group rounded-xl border bg-card p-5 text-center space-y-3 hover:shadow-md transition-all hover:border-primary/50 flex flex-col items-center"
              >
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.fullNameTh}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                      <Users className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {isTh ? p.fullNameTh : p.fullNameEn}
                  </h4>
                  <div className="text-xs text-primary font-medium mt-0.5">
                    {isTh ? p.positionTh : p.positionEn}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {isTh ? p.departmentNameTh : p.departmentNameEn}
                  </div>
                </div>

                <Link
                  href={`/personnel/${p.id}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 pt-2"
                >
                  <span>{isTh ? "ดูโปรไฟล์" : "View Profile"}</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 6. Campus Contact & Location Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-primary">
              {isTh ? "การเดินทางและการติดต่อ" : "Campus & Contact"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              {isTh ? "ติดต่อเราและสถานที่ตั้ง" : "Visit Us & Get in Touch"}
            </h2>
          </div>
          <Button asChild variant="ghost" className="gap-1 text-primary">
            <Link href="/contact">
              <span>{isTh ? "ดูข้อมูลติดต่อทั้งหมด" : "Full Contact Info"}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-card p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">
              {isTh ? "สถานที่ตั้งคณะ" : "Faculty Location"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isTh
                ? tenantSettings?.contact?.addressTh || "เลขที่ 123 อาคารเรียนรวมและบริหาร คณะวิทยาการจัดการ มหาวิทยาลัยนครพนม ต.ขามเฒ่า อ.เมือง จ.นครพนม 48000"
                : tenantSettings?.contact?.addressEn || tenantSettings?.contact?.addressTh || "123 Management Science Building, Nakhon Phanom University, 48000"}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">
              {isTh ? "โทรศัพท์และเวลาทำการ" : "Telephone & Hours"}
            </h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>📞 {tenantSettings?.contact?.phone || "042-532-xxx"}</div>
              {tenantSettings?.contact?.fax && <div>📠 {tenantSettings.contact.fax}</div>}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{tenantSettings?.contact?.officeHours || (isTh ? "จันทร์ - ศุกร์: 08:30 - 16:30 น." : "Mon - Fri: 08:30 - 16:30")}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">
              {isTh ? "อีเมลและช่องทางออนไลน์" : "Email & Online"}
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="text-muted-foreground">✉️ {tenantSettings?.contact?.email || "contact@fms.npu.ac.th"}</div>
              {tenantSettings?.contact?.facebook && (
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  🌐 Facebook: {tenantSettings.contact.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, "") || "Official Page"}
                </div>
              )}
              {tenantSettings?.contact?.lineId && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  💬 Line: {tenantSettings.contact.lineId}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
