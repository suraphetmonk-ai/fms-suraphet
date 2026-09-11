import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/shared/lib/i18n/server";
import { getPersonnelDetail } from "@/features/personnel/server";
import { prisma } from "@/shared/lib/infra/prisma";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  BookOpen,
  Award,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicPersonnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const isTh = locale === "th";

  const tenant = await prisma.tenant.findFirst();
  const tenantId = tenant?.id ?? "";

  const person = await getPersonnelDetail(tenantId, id);
  if (!person || !person.isActive) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground">
          <Link href="/personnel">
            <ArrowLeft className="h-4 w-4" />
            <span>{isTh ? "กลับหน้ารายชื่อบุคลากร" : "Back to Directory"}</span>
          </Link>
        </Button>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
          <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-2xl overflow-hidden border-2 border-primary/20 bg-muted shrink-0 shadow-sm">
            {person.avatarUrl ? (
              <img
                src={person.avatarUrl}
                alt={person.fullNameTh}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                <Users className="h-16 w-16" />
              </div>
            )}
          </div>

          <div className="space-y-3 flex-1">
            <div>
              <span className="inline-flex rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {isTh ? person.departmentNameTh : person.departmentNameEn}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
                {isTh ? person.fullNameTh : person.fullNameEn}
              </h1>
              <p className="text-sm text-muted-foreground">{person.fullNameEn}</p>
            </div>

            <div className="text-sm font-medium text-primary">
              {isTh ? person.positionTh : person.positionEn}
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
              {person.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span>{person.email}</span>
                </div>
              )}
              {person.phoneExt && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>ต่อ {person.phoneExt}</span>
                </div>
              )}
              {person.roomNumber && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>ห้องพัก: {person.roomNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expertise & Bio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Expertise */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <span>{isTh ? "ความเชี่ยวชาญเฉพาะทาง" : "Areas of Expertise"}</span>
          </h2>

          {person.expertise && person.expertise.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {person.expertise.map((exp, i) => (
                <span
                  key={i}
                  className="rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  {exp}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{isTh ? "ไม่ได้ระบุ" : "Not specified"}</p>
          )}
        </div>

        {/* Right: Biography & Works */}
        <div className="md:col-span-2 space-y-6">
          {/* Biography */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span>{isTh ? "ประวัติการศึกษาและการทำงาน" : "Biography & Background"}</span>
            </h2>
            <div className="rounded-xl border bg-card p-5 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {isTh
                ? person.biographyTh || "อยู่ระหว่างการปรับปรุงข้อมูลประวัติ"
                : person.biographyEn || person.biographyTh || "Biography is being updated."}
            </div>
          </div>

          {/* Academic Publications */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>{isTh ? "ผลงานทางวิชาการและงานวิจัย" : "Academic Publications & Research"}</span>
            </h2>

            {!person.works || person.works.length === 0 ? (
              <div className="rounded-xl border bg-card p-6 text-center text-xs text-muted-foreground">
                {isTh ? "ยังไม่มีข้อมูลผลงานวิชาการที่บันทึกไว้" : "No publications listed yet."}
              </div>
            ) : (
              <div className="space-y-3">
                {person.works.map((w) => (
                  <div key={w.id} className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {w.workType}
                      </span>
                      {w.year && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {w.year}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm text-foreground leading-snug">{w.title}</div>
                    {w.citationText && (
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        {w.citationText}
                      </p>
                    )}
                    {w.url && (
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1"
                      >
                        <span>{isTh ? "อ่านบทความต้นฉบับ" : "View Publication"}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
