import Link from "next/link";
import { auth, getTenantSettings } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { getLocale } from "@/shared/lib/i18n/server";
import { PortalNavbar } from "@/components/layout/portal-navbar";
import { GraduationCap } from "lucide-react";

export default async function PublicPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth().catch(() => null);
  const locale = await getLocale();

  const isTh = locale === "th";
  const tenantId =
    session?.tenantId ||
    (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
  const tenantSettings = tenantId ? await getTenantSettings(tenantId).catch(() => null) : null;

  const brandName = isTh
    ? tenantSettings?.nameTh || "คณะวิทยาการและเทคโนโลยีสารสนเทศ"
    : tenantSettings?.nameEn || "Faculty of Computing & IT";
  const brandTagline = isTh
    ? "มหาวิทยาลัยแห่งการเรียนรู้และการวิจัย"
    : "University Faculty Portal";

  const contact = tenantSettings?.contact;
  const address = isTh
    ? contact?.addressTh || "อาคารบริหารและเรียนรวม คณะวิทยาการจัดการ มหาวิทยาลัย"
    : contact?.addressEn || contact?.addressTh || "Faculty Management Building, University Campus";
  const phone = contact?.phone || "";
  const email = contact?.email || "";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navbar matching Admin styling with Portal menus & Avatar menu */}
      <PortalNavbar
        initialUser={session?.user}
        brandName={brandName}
        brandTagline={brandTagline}
        logoUrl={tenantSettings?.logoUrl}
      />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 text-muted-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 font-bold text-foreground text-lg">
              {tenantSettings?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenantSettings.logoUrl} alt="" className="h-6 w-6 object-contain rounded-xs" />
              ) : (
                <GraduationCap className="h-6 w-6 text-primary" />
              )}
              <span>{brandName}</span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              {isTh
                ? "มุ่งมั่นผลิตบัณฑิตที่มีทักษะการวิจัย นวัตกรรมซอฟต์แวร์ และปัญญาประดิษฐ์ เพื่อขับเคลื่อนสังคมและเศรษฐกิจดิจิทัลระดับสากล"
                : "Dedicated to producing graduates with advanced research, software innovation, and AI capabilities for the global digital economy."}
            </p>
            <div className="text-xs text-muted-foreground/90 space-y-1.5 pt-2">
              <div className="flex items-start gap-1.5">
                <span className="shrink-0 text-primary">📍</span>
                <span>{address}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {phone && (
                  <a href={`tel:${phone}`} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    <span>📞</span>
                    <span>{phone}</span>
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    <span>✉️</span>
                    <span>{email}</span>
                  </a>
                )}
                {contact?.officeHours && (
                  <div className="inline-flex items-center gap-1 text-muted-foreground/80">
                    <span>🕒</span>
                    <span>{contact.officeHours}</span>
                  </div>
                )}
              </div>
              {(contact?.facebook || contact?.lineId) && (
                <div className="flex items-center gap-2 pt-1">
                  {contact.facebook && (
                    <a
                      href={contact.facebook.startsWith("http") ? contact.facebook : `https://${contact.facebook}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      <span>Facebook</span>
                    </a>
                  )}
                  {contact.lineId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <span>Line: {contact.lineId}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-3">
              {isTh ? "ลิงก์ด่วน" : "Quick Links"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/news" className="hover:text-primary transition-colors">
                  {isTh ? "ข่าวประชาสัมพันธ์" : "Announcements"}
                </Link>
              </li>
              <li>
                <Link href="/personnel" className="hover:text-primary transition-colors">
                  {isTh ? "ทำเนียบคณาจารย์" : "Faculty Directory"}
                </Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-primary transition-colors">
                  {isTh ? "หลักสูตรการศึกษา" : "Degree Programs"}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary font-medium text-primary transition-colors">
                  {isTh ? "📞 ติดต่อเราและสถานที่ตั้ง" : "📞 Contact & Location"}
                </Link>
              </li>
              <li>
                <Link href="/verify-student" className="hover:text-primary font-medium text-primary/90 transition-colors">
                  {isTh ? "🎓 ตรวจสอบสถานะนิสิต/วุฒิการศึกษา" : "🎓 Verify Student Status"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-3">
              {isTh ? "สำหรับบุคลากร" : "Staff Services"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  {isTh ? "เข้าสู่ระบบจัดการ (Admin Console)" : "Admin Console"}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  {isTh ? "ล็อกอินอาจารย์/เจ้าหน้าที่" : "Faculty Sign In"}
                </Link>
              </li>
              <li>
                <span className="text-xs text-muted-foreground/60 block pt-2">
                  VibeCore Modular Monolith v1.0
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {isTh ? "คณะวิทยาการและเทคโนโลยีสารสนเทศ. สงวนลิขสิทธิ์ทุกประการ" : "Faculty of Computing & IT. All rights reserved."}
        </div>
      </footer>
    </div>
  );
}
