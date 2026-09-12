import Link from "next/link";
import { getLocale } from "@/shared/lib/i18n/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { getPublicSchedule, listRooms, listVehicles } from "@/features/bookings/server";
import {
  CalendarCheck,
  Building2,
  Car,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type = "ALL" } = await searchParams;
  const locale = await getLocale();
  const isTh = locale === "th";

  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  const tenantId = tenant?.id ?? "";

  const [schedule, rooms, vehicles] = await Promise.all([
    getPublicSchedule(tenantId),
    listRooms(tenantId),
    listVehicles(tenantId),
  ]);

  const filteredSchedule = schedule.filter((item) => {
    if (type === "ROOM") return item.resourceType === "ROOM";
    if (type === "VEHICLE") return item.resourceType === "VEHICLE";
    return true;
  });

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const dateStr = d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr} น.`;
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-primary/5 via-background to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
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
          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-2 ring-8 ring-indigo-50/50 dark:ring-indigo-950/20 shadow-xs">
            <CalendarCheck className="h-10 w-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {isTh ? "ตารางการใช้ห้องประชุมและยานพาหนะ" : "Room & Vehicle Schedules"}
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isTh
              ? "ตรวจสอบความพร้อมใช้งานและกำหนดการจองห้องประชุมและยานพาหนะส่วนกลางของคณะ แบบเรียลไทม์"
              : "Check real-time facility availability and approved reservations for faculty rooms and vehicles."}
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-muted rounded-xl border">
            <Link
              href="/bookings?type=ALL"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                type === "ALL"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isTh ? "ทั้งหมด" : "All Resources"}
            </Link>
            <Link
              href="/bookings?type=ROOM"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                type === "ROOM"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4 text-blue-500" />
              {isTh ? "ห้องประชุมและสถานที่" : "Rooms & Facilities"}
            </Link>
            <Link
              href="/bookings?type=VEHICLE"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                type === "VEHICLE"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Car className="h-4 w-4 text-purple-500" />
              {isTh ? "ยานพาหนะส่วนกลาง" : "Fleet Vehicles"}
            </Link>
          </div>
        </div>

        {/* Section 1: Upcoming Approved Schedules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              {isTh ? "กำหนดการใช้งานที่ได้รับอนุมัติแล้ว" : "Upcoming Approved Reservations"}
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {filteredSchedule.length} {isTh ? "รายการ" : "entries"}
            </span>
          </div>

          {filteredSchedule.length === 0 ? (
            <div className="p-12 text-center bg-card border rounded-2xl text-muted-foreground space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="font-semibold text-foreground">
                {isTh ? "ไม่มีรายการจองที่อนุมัติในช่วงนี้" : "No approved reservations currently"}
              </p>
              <p className="text-sm">
                {isTh
                  ? "ทรัพยากรส่วนใหญ่ว่างและพร้อมสำหรับการยื่นคำขอใช้งาน"
                  : "Most facilities are available for reservation."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchedule.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border rounded-2xl p-5 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-900 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {item.bookingCode}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          item.resourceType === "ROOM"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            : "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                        }`}
                      >
                        {item.resourceType === "ROOM" ? (
                          <>
                            <Building2 className="h-3 w-3" />
                            {item.room?.roomCode}
                          </>
                        ) : (
                          <>
                            <Car className="h-3 w-3" />
                            {item.vehicle?.plateNumber}
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground leading-snug">
                      {item.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <span>{formatDateTime(item.startDateTime)} - {formatDateTime(item.endDateTime)}</span>
                      </div>
                      {item.room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{item.room.nameTh} ({item.room.building}, ชั้น {item.room.floor})</span>
                        </div>
                      )}
                      {item.destination && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                          <span>{isTh ? "ปลายทาง:" : "Destination:"} {item.destination}</span>
                        </div>
                      )}
                      {item.department && (
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{item.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isTh ? "อนุมัติเรียบร้อย" : "Approved"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Resource Directory & Specs */}
        <div className="space-y-6 pt-6 border-t">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-foreground">
              {isTh ? "ทำเนียบห้องประชุมและยานพาหนะของคณะ" : "Faculty Facilities & Fleet Directory"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isTh
                ? "ข้อมูลสถานที่ ความจุ และสิ่งอำนวยความสะดวก เพื่อประกอบการวางแผนจัดกิจกรรม"
                : "Information on room capacities, amenities, and fleet vehicles"}
            </p>
          </div>

          {/* Rooms Grid */}
          {(type === "ALL" || type === "ROOM") && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                {isTh ? "ห้องประชุมและห้องสัมมนา" : "Meeting Rooms & Lecture Halls"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                          {r.roomCode}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            r.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {r.status === "AVAILABLE" ? "พร้อมใช้" : "ปิดปรับปรุง"}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{r.nameTh}</h4>
                      <p className="text-xs text-muted-foreground">{r.building} (ชั้น {r.floor})</p>
                      <p className="text-xs font-medium text-foreground">👥 ความจุ: {r.capacity} คน</p>

                      {r.facilities.length > 0 && (
                        <div className="pt-2">
                          <div className="flex flex-wrap gap-1">
                            {r.facilities.slice(0, 3).map((f, i) => (
                              <span key={i} className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {f}
                              </span>
                            ))}
                            {r.facilities.length > 3 && (
                              <span className="text-[11px] text-muted-foreground">
                                +{r.facilities.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles Grid */}
          {(type === "ALL" || type === "VEHICLE") && (
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Car className="h-5 w-5 text-purple-500" />
                {isTh ? "ยานพาหนะส่วนกลาง" : "Faculty Fleet Vehicles"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                          {v.plateNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          พร้อมใช้งาน
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{v.brand} {v.model}</h4>
                      <p className="text-xs text-muted-foreground">ประเภท: {v.vehicleType} ({v.capacity} ที่นั่ง)</p>
                      {v.driverName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>👤 คนขับ: {v.driverName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
