import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/shared/lib/i18n/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { getTenantSettings } from "@/features/identity/server";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Navigation,
  Globe,
  MessageSquare,
  Share2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "ติดต่อเรา | Contact Us",
  description: "ข้อมูลการติดต่อ สถานที่ตั้ง แผนที่ และช่องทางการสื่อสาร",
};

export default async function ContactPage() {
  const locale = await getLocale();
  const isTh = locale === "th";

  // Resolve tenant and settings
  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  const tenantId = tenant?.id;
  const tenantSettings = tenantId ? await getTenantSettings(tenantId).catch(() => null) : null;

  const contact = tenantSettings?.contact;
  const brandName = isTh
    ? tenantSettings?.nameTh || "คณะวิทยาการจัดการ"
    : tenantSettings?.nameEn || "Faculty of Management Science";

  const address = isTh
    ? contact?.addressTh || "เลขที่ 123 อาคารเรียนรวมและบริหาร คณะวิทยาการจัดการ มหาวิทยาลัยนครพนม ต.ขามเฒ่า อ.เมือง จ.นครพนม 48000"
    : contact?.addressEn || contact?.addressTh || "123 Academic & Administration Building, Faculty of Management Science, Nakhon Phanom University, 48000";

  const phone = contact?.phone || "042-532-xxx";
  const email = contact?.email || "contact@fms.npu.ac.th";
  const fax = contact?.fax;
  const officeHours = contact?.officeHours || (isTh ? "วันจันทร์ - วันศุกร์: 08:30 - 16:30 น. (หยุดวันเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์)" : "Monday - Friday: 08:30 - 16:30 (Closed on weekends & holidays)");
  const facebook = contact?.facebook;
  const lineId = contact?.lineId;
  const mapEmbedUrl = contact?.mapEmbedUrl;

  const isEmbedIframe = mapEmbedUrl && mapEmbedUrl.includes("embed");

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-12 sm:py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              {isTh ? "หน้าแรก" : "Home"}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{isTh ? "ติดต่อเรา" : "Contact Us"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {isTh ? "ติดต่อเราและสถานที่ตั้ง" : "Contact & Location"}
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            {isTh
              ? `ยินดีต้อนรับสู่ ${brandName} สอบถามข้อมูลการศึกษา การสมัครเข้าศึกษา หรือติดต่อหน่วยงานภายใน`
              : `Welcome to ${brandName}. Inquire about admissions, academic programs, or campus visits.`}
          </p>
        </div>
      </section>

      {/* 2. Contact Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Location */}
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-xs hover:border-primary/50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">
                {isTh ? "สถานที่ตั้ง" : "Campus Location"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {address}
              </p>
            </div>
            {mapEmbedUrl && (
              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a href={mapEmbedUrl.startsWith("http") ? mapEmbedUrl : `https://${mapEmbedUrl}`} target="_blank" rel="noreferrer">
                    <Navigation className="h-3.5 w-3.5" />
                    <span>{isTh ? "นำทางด้วย Google Maps" : "Directions"}</span>
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Card 2: Telephone */}
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-xs hover:border-primary/50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Phone className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">
                {isTh ? "โทรศัพท์ติดต่อ" : "Phone & Fax"}
              </h3>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">{isTh ? "เบอร์หลัก: " : "Main: "}</span>
                  <a href={`tel:${phone}`} className="font-medium text-foreground hover:text-primary">
                    {phone}
                  </a>
                </div>
                {fax && (
                  <div>
                    <span className="text-muted-foreground">{isTh ? "โทรสาร: " : "Fax: "}</span>
                    <span className="font-medium text-foreground">{fax}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-2">
              <Button asChild size="sm" className="w-full gap-1.5 text-xs">
                <a href={`tel:${phone}`}>
                  <Phone className="h-3.5 w-3.5" />
                  <span>{isTh ? "โทรออกทันที" : "Call Now"}</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Card 3: Email */}
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-xs hover:border-primary/50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">
                {isTh ? "อีเมลสำหรับติดต่อ" : "Email Inquiries"}
              </h3>
              <p className="text-xs text-muted-foreground break-all">
                {email}
              </p>
              <p className="text-[11px] text-muted-foreground/80 pt-1">
                {isTh ? "ตอบกลับภายใน 1-2 วันทำการ" : "Response within 1-2 business days"}
              </p>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <a href={`mailto:${email}`}>
                  <Mail className="h-3.5 w-3.5" />
                  <span>{isTh ? "ส่งอีเมลสอบถาม" : "Send Email"}</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Card 4: Office Hours */}
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-xs hover:border-primary/50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">
                {isTh ? "วันและเวลาทำการ" : "Office Hours"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {officeHours}
              </p>
            </div>
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isTh ? "เปิดให้บริการตามเวลาราชการ" : "Open during official hours"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Social & Online Channels */}
      {(facebook || lineId) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-semibold text-sm">
                <Share2 className="h-4 w-4" />
                <span>{isTh ? "ช่องทางออนไลน์และโซเชียลมีเดีย" : "Online & Social Media"}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {isTh ? "ติดตามข่าวสารและติดต่อผ่านสื่อสังคมออนไลน์" : "Connect with us on social networks"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isTh ? "อัปเดตกิจกรรม ข่าวสาร และรับการแจ้งเตือนแบบเรียลไทม์" : "Get real-time announcements and university updates"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {facebook && (
                <Button asChild variant="outline" className="gap-2 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                  <a
                    href={facebook.startsWith("http") ? facebook : `https://${facebook}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span>Facebook: {facebook.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, "") || "Official Page"}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </Button>
              )}
              {lineId && (
                <Button asChild variant="outline" className="gap-2 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                  <a
                    href={lineId.startsWith("http") ? lineId : `https://line.me/R/ti/p/${lineId.replace(/^@/, "%40")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>Line Official: {lineId}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isTh ? "แผนที่และการเดินทาง" : "Campus Map & Location"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isTh ? "ที่ตั้งของคณะและเส้นทางการเดินทาง" : "Map and travel directions to the faculty"}
            </p>
          </div>
          {mapEmbedUrl && (
            <Button asChild variant="ghost" size="sm" className="gap-1 text-primary text-xs">
              <a href={mapEmbedUrl.startsWith("http") ? mapEmbedUrl : `https://${mapEmbedUrl}`} target="_blank" rel="noreferrer">
                <span>{isTh ? "เปิดใน Google Maps" : "View on Google Maps"}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>

        <div className="rounded-xl border overflow-hidden bg-muted shadow-sm h-80 sm:h-96 relative">
          {isEmbedIframe ? (
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Campus Map"
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-muted/40">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="h-7 w-7" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="font-semibold text-base text-foreground">{brandName}</h4>
                <p className="text-xs text-muted-foreground">{address}</p>
              </div>
              {mapEmbedUrl ? (
                <Button asChild className="gap-2">
                  <a href={mapEmbedUrl.startsWith("http") ? mapEmbedUrl : `https://${mapEmbedUrl}`} target="_blank" rel="noreferrer">
                    <Navigation className="h-4 w-4" />
                    <span>{isTh ? "เปิดนำทางด้วย Google Maps" : "Open in Google Maps"}</span>
                  </a>
                </Button>
              ) : (
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>{isTh ? "ค้นหาใน Google Maps" : "Search in Google Maps"}</span>
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
