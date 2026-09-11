import Link from "next/link";
import { getLocale } from "@/shared/lib/i18n/server";
import { listPublicPersonnel, listDepartments } from "@/features/personnel/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { Users, Mail, MapPin, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicPersonnelListPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string; type?: string }>;
}) {
  const { dept, type } = await searchParams;
  const locale = await getLocale();
  const isTh = locale === "th";

  const tenant = await prisma.tenant.findFirst();
  const tenantId = tenant?.id ?? "";

  const [personnelList, departments] = await Promise.all([
    listPublicPersonnel(tenantId),
    listDepartments(tenantId),
  ]);

  const filtered = personnelList.filter((p) => {
    const matchDept = !dept || p.departmentId === dept;
    const matchType = !type || p.personnelType === type;
    return matchDept && matchType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {isTh ? "ทำเนียบคณาจารย์และบุคลากร" : "Faculty & Staff Directory"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isTh
            ? "รายนามคณาจารย์ผู้ทรงคุณวุฒิ นักวิจัย และบุคลากรสายสนับสนุนประจำคณะ"
            : "Directory of faculty members, researchers, and professional support staff"}
        </p>
      </div>

      {/* Department & Type Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          asChild
          variant={!dept ? "default" : "outline"}
          size="sm"
          className="rounded-full"
        >
          <Link href="/personnel">{isTh ? "ทั้งหมด" : "All Departments"}</Link>
        </Button>
        {departments.map((d) => (
          <Button
            key={d.id}
            asChild
            variant={dept === d.id ? "default" : "outline"}
            size="sm"
            className="rounded-full"
          >
            <Link href={`/personnel?dept=${d.id}${type ? `&type=${type}` : ""}`}>
              {isTh ? d.nameTh : d.nameEn}
            </Link>
          </Button>
        ))}
      </div>

      {/* Personnel Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card text-muted-foreground">
          {isTh ? "ไม่พบบุคลากรในกลุ่มนี้" : "No personnel found in this category."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col justify-between rounded-xl border bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-primary/50"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20 bg-muted shrink-0">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.fullNameTh}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                        <Users className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-snug">
                      {isTh ? p.fullNameTh : p.fullNameEn}
                    </h3>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      {isTh ? p.positionTh : p.positionEn}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isTh ? p.departmentNameTh : p.departmentNameEn}
                    </p>
                  </div>
                </div>

                {/* Expertise Badges */}
                {p.expertise && p.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.expertise.slice(0, 3).map((exp, i) => (
                      <span
                        key={i}
                        className="rounded bg-secondary/80 px-2 py-0.5 text-[10px] text-secondary-foreground font-medium"
                      >
                        {exp}
                      </span>
                    ))}
                    {p.expertise.length > 3 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{p.expertise.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Contact Info */}
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  {p.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.roomNumber && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{p.roomNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {p.works?.length || 0} {isTh ? "ผลงานวิจัย" : "Works"}
                </span>
                <Link
                  href={`/personnel/${p.id}`}
                  className="font-medium text-primary inline-flex items-center gap-1 group-hover:underline"
                >
                  <span>{isTh ? "ดูประวัติเต็ม" : "Full Profile"}</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
