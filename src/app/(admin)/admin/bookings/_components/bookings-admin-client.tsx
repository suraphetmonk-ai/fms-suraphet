"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Building2,
  Car,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Edit3,
  MapPin,
  Users,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonField,
} from "@/shared/components/liyon";
import type {
  BookingDto,
  BookingMetricsDto,
  RoomDto,
  VehicleDto,
} from "@/features/bookings";
import {
  getBookingsAction,
  getBookingMetricsAction,
  getRoomsAction,
  getVehiclesAction,
  checkConflictAction,
  createBookingAction,
  approveBookingAction,
  rejectBookingAction,
  cancelBookingAction,
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
  createVehicleAction,
  updateVehicleAction,
  deleteVehicleAction,
} from "@/features/bookings/actions";

interface RoomFormState {
  roomCode: string;
  nameTh: string;
  nameEn: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: "MEETING_ROOM" | "CONFERENCE_ROOM" | "SEMINAR_HALL" | "COMPUTER_LAB";
  facilitiesText: string;
  imageUrl: string;
  status: "AVAILABLE" | "MAINTENANCE" | "INACTIVE";
  orderIndex: number;
}

interface VehicleFormState {
  plateNumber: string;
  brand: string;
  model: string;
  vehicleType: "VAN" | "SEDAN" | "SUV" | "BUS" | "PICKUP";
  capacity: number;
  driverName: string;
  driverPhone: string;
  imageUrl: string;
  status: "AVAILABLE" | "MAINTENANCE" | "INACTIVE";
  orderIndex: number;
}

interface Props {
  initialBookings: BookingDto[];
  initialMetrics: BookingMetricsDto;
  initialRooms: RoomDto[];
  initialVehicles: VehicleDto[];
  currentUserId: string;
  canCreate: boolean;
  canApprove: boolean;
  canManage: boolean;
}

export function BookingsAdminClient({
  initialBookings,
  initialMetrics,
  initialRooms,
  initialVehicles,
  currentUserId: _currentUserId,
  canCreate,
  canApprove,
  canManage,
}: Props) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"pending" | "schedule" | "all" | "rooms" | "vehicles">("pending");
  const [bookings, setBookings] = useState<BookingDto[]>(initialBookings);
  const [metrics, setMetrics] = useState<BookingMetricsDto>(initialMetrics);
  const [rooms, setRooms] = useState<RoomDto[]>(initialRooms);
  const [vehicles, setVehicles] = useState<VehicleDto[]>(initialVehicles);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Room Modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomDto | null>(null);
  const [roomFormData, setRoomFormData] = useState<RoomFormState>({
    roomCode: "",
    nameTh: "",
    nameEn: "",
    building: "",
    floor: 1,
    capacity: 20,
    roomType: "MEETING_ROOM",
    facilitiesText: "",
    imageUrl: "",
    status: "AVAILABLE",
    orderIndex: 0,
  });

  // Vehicle Modal
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleDto | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState<VehicleFormState>({
    plateNumber: "",
    brand: "",
    model: "",
    vehicleType: "VAN",
    capacity: 10,
    driverName: "",
    driverPhone: "",
    imageUrl: "",
    status: "AVAILABLE",
    orderIndex: 0,
  });

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    resourceType: "ROOM" as "ROOM" | "VEHICLE",
    roomId: initialRooms[0]?.id || "",
    vehicleId: initialVehicles[0]?.id || "",
    title: "",
    startDate: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endDate: new Date().toISOString().slice(0, 10),
    endTime: "12:00",
    participantCount: 1,
    contactName: "",
    contactPhone: "",
    department: "",
    destination: "",
    driverRequired: true,
    specialRequests: "",
  });

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Real-time conflict check
  useEffect(() => {
    if (!isNewBookingOpen) return;

    const timer = setTimeout(async () => {
      const startStr = `${bookingForm.startDate}T${bookingForm.startTime}:00`;
      const endStr = `${bookingForm.endDate}T${bookingForm.endTime}:00`;

      const s = new Date(startStr);
      const e = new Date(endStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
        setConflictWarning(null);
        return;
      }

      const res = await checkConflictAction({
        resourceType: bookingForm.resourceType,
        roomId: bookingForm.resourceType === "ROOM" ? bookingForm.roomId : undefined,
        vehicleId: bookingForm.resourceType === "VEHICLE" ? bookingForm.vehicleId : undefined,
        startDateTime: s.toISOString(),
        endDateTime: e.toISOString(),
      });

      if (res.ok && res.data.hasConflict) {
        setConflictWarning(
          `คำเตือน: ช่วงเวลานี้มีการจองอยู่แล้ว (${res.data.conflictTitle}) หากยื่นจองอาจถูกปฏิเสธ`
        );
      } else {
        setConflictWarning(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    isNewBookingOpen,
    bookingForm.resourceType,
    bookingForm.roomId,
    bookingForm.vehicleId,
    bookingForm.startDate,
    bookingForm.startTime,
    bookingForm.endDate,
    bookingForm.endTime,
  ]);

  const refreshData = () => {
    startTransition(async () => {
      const [resBookings, resMetrics, resRooms, resVehicles] = await Promise.all([
        getBookingsAction({
          resourceType: resourceFilter,
          status: statusFilter,
          search: searchQuery,
        }),
        getBookingMetricsAction(),
        getRoomsAction(),
        getVehiclesAction(),
      ]);

      if (resBookings.ok) setBookings(resBookings.data);
      if (resMetrics.ok) setMetrics(resMetrics.data);
      if (resRooms.ok) setRooms(resRooms.data);
      if (resVehicles.ok) setVehicles(resVehicles.data);
    });
  };

  const handleCreateBooking = () => {
    startTransition(async () => {
      const startDateTime = new Date(`${bookingForm.startDate}T${bookingForm.startTime}:00`).toISOString();
      const endDateTime = new Date(`${bookingForm.endDate}T${bookingForm.endTime}:00`).toISOString();

      const res = await createBookingAction({
        resourceType: bookingForm.resourceType,
        roomId: bookingForm.resourceType === "ROOM" ? bookingForm.roomId : null,
        vehicleId: bookingForm.resourceType === "VEHICLE" ? bookingForm.vehicleId : null,
        title: bookingForm.title,
        startDateTime,
        endDateTime,
        participantCount: Number(bookingForm.participantCount) || 1,
        contactName: bookingForm.contactName,
        contactPhone: bookingForm.contactPhone,
        department: bookingForm.department || null,
        destination: bookingForm.destination || null,
        driverRequired: bookingForm.driverRequired,
        specialRequests: bookingForm.specialRequests || null,
      });

      if (res.ok) {
        toast.success(t("bookings.alert.success"));
        setIsNewBookingOpen(false);
        setBookingForm({
          resourceType: "ROOM",
          roomId: rooms[0]?.id || "",
          vehicleId: vehicles[0]?.id || "",
          title: "",
          startDate: new Date().toISOString().slice(0, 10),
          startTime: "09:00",
          endDate: new Date().toISOString().slice(0, 10),
          endTime: "12:00",
          participantCount: 1,
          contactName: "",
          contactPhone: "",
          department: "",
          destination: "",
          driverRequired: true,
          specialRequests: "",
        });
        refreshData();
      } else {
        toast.error(res.error?.message || "เกิดข้อผิดพลาดในการจอง");
      }
    });
  };

  const handleApprove = (bookingId: string) => {
    startTransition(async () => {
      const res = await approveBookingAction({ bookingId });
      if (res.ok) {
        toast.success("อนุมัติคำขอจองเรียบร้อยแล้ว");
        refreshData();
      } else {
        toast.error(res.error?.message || "ไม่สามารถอนุมัติได้");
      }
    });
  };

  const handleRejectConfirm = () => {
    if (!selectedBooking) return;
    startTransition(async () => {
      const res = await rejectBookingAction({
        bookingId: selectedBooking.id,
        reason: rejectReason,
      });
      if (res.ok) {
        toast.success("ปฏิเสธคำขอจองเรียบร้อย");
        setIsRejectOpen(false);
        setSelectedBooking(null);
        setRejectReason("");
        refreshData();
      } else {
        toast.error(res.error?.message || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!confirm("คุณต้องการยกเลิกคำขอจองนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await cancelBookingAction({ bookingId });
      if (res.ok) {
        toast.success("ยกเลิกการจองเรียบร้อยแล้ว");
        refreshData();
      } else {
        toast.error(res.error?.message || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleSaveRoom = () => {
    startTransition(async () => {
      const facilities = roomFormData.facilitiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let res;
      if (editingRoom) {
        res = await updateRoomAction({
          id: editingRoom.id,
          roomCode: roomFormData.roomCode,
          nameTh: roomFormData.nameTh,
          nameEn: roomFormData.nameEn,
          building: roomFormData.building,
          floor: Number(roomFormData.floor),
          capacity: Number(roomFormData.capacity),
          roomType: roomFormData.roomType,
          facilities,
          imageUrl: roomFormData.imageUrl || null,
          status: roomFormData.status,
          orderIndex: Number(roomFormData.orderIndex),
        });
      } else {
        res = await createRoomAction({
          roomCode: roomFormData.roomCode,
          nameTh: roomFormData.nameTh,
          nameEn: roomFormData.nameEn,
          building: roomFormData.building,
          floor: Number(roomFormData.floor),
          capacity: Number(roomFormData.capacity),
          roomType: roomFormData.roomType,
          facilities,
          imageUrl: roomFormData.imageUrl || null,
          status: roomFormData.status,
          orderIndex: Number(roomFormData.orderIndex),
        });
      }

      if (res.ok) {
        toast.success("บันทึกข้อมูลห้องประชุมเรียบร้อย");
        setIsRoomModalOpen(false);
        setEditingRoom(null);
        refreshData();
      } else {
        toast.error(res.error?.message || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!confirm("ยืนยันการลบห้องประชุมนี้?")) return;
    startTransition(async () => {
      const res = await deleteRoomAction(roomId);
      if (res.ok) {
        toast.success("ลบห้องประชุมเรียบร้อย");
        refreshData();
      } else {
        toast.error(res.error?.message || "ไม่สามารถลบห้องได้");
      }
    });
  };

  const handleSaveVehicle = () => {
    startTransition(async () => {
      let res;
      if (editingVehicle) {
        res = await updateVehicleAction({
          id: editingVehicle.id,
          plateNumber: vehicleFormData.plateNumber,
          brand: vehicleFormData.brand,
          model: vehicleFormData.model,
          vehicleType: vehicleFormData.vehicleType,
          capacity: Number(vehicleFormData.capacity),
          driverName: vehicleFormData.driverName || null,
          driverPhone: vehicleFormData.driverPhone || null,
          imageUrl: vehicleFormData.imageUrl || null,
          status: vehicleFormData.status,
          orderIndex: Number(vehicleFormData.orderIndex),
        });
      } else {
        res = await createVehicleAction({
          plateNumber: vehicleFormData.plateNumber,
          brand: vehicleFormData.brand,
          model: vehicleFormData.model,
          vehicleType: vehicleFormData.vehicleType,
          capacity: Number(vehicleFormData.capacity),
          driverName: vehicleFormData.driverName || null,
          driverPhone: vehicleFormData.driverPhone || null,
          imageUrl: vehicleFormData.imageUrl || null,
          status: vehicleFormData.status,
          orderIndex: Number(vehicleFormData.orderIndex),
        });
      }

      if (res.ok) {
        toast.success("บันทึกข้อมูลยานพาหนะเรียบร้อย");
        setIsVehicleModalOpen(false);
        setEditingVehicle(null);
        refreshData();
      } else {
        toast.error(res.error?.message || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (!confirm("ยืนยันการลบยานพาหนะนี้?")) return;
    startTransition(async () => {
      const res = await deleteVehicleAction(vehicleId);
      if (res.ok) {
        toast.success("ลบยานพาหนะเรียบร้อย");
        refreshData();
      } else {
        toast.error(res.error?.message || "ไม่สามารถลบได้");
      }
    });
  };

  const formatDateTimeText = (iso: string) => {
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

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const filteredBookings = bookings.filter((b) => {
    if (resourceFilter !== "ALL" && b.resourceType !== resourceFilter) return false;
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchCode = b.bookingCode.toLowerCase().includes(q);
      const matchContact = b.contactName.toLowerCase().includes(q);
      const matchRoom = b.room?.nameTh.toLowerCase().includes(q) || false;
      const matchVehicle = b.vehicle?.plateNumber.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchCode && !matchContact && !matchRoom && !matchVehicle) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            {t("bookings.title")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("bookings.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreate && (
            <Button
              onClick={() => setIsNewBookingOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {t("bookings.action.new")}
            </Button>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiyonCard className="p-5 border-l-4 border-l-amber-500 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("bookings.stats.pending")}
              </p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {metrics.pendingCount}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-5 border-l-4 border-l-emerald-500 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("bookings.stats.today")}
              </p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics.todayActiveCount}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-5 border-l-4 border-l-blue-500 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("bookings.stats.rooms")}
              </p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {metrics.roomsCount}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-5 border-l-4 border-l-purple-500 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("bookings.stats.vehicles")}
              </p>
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {metrics.vehiclesCount}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
              <Car className="h-6 w-6" />
            </div>
          </div>
        </LiyonCard>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "pending"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          <Clock className="h-4 w-4" />
          {t("bookings.tabs.pending")}
          {pendingBookings.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
              {pendingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "schedule"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          <Calendar className="h-4 w-4" />
          {t("bookings.tabs.schedule")}
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "all"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          {t("bookings.tabs.all")}
        </button>

        {canManage && (
          <>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "rooms"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              <Building2 className="h-4 w-4" />
              {t("bookings.tabs.rooms")}
            </button>

            <button
              onClick={() => setActiveTab("vehicles")}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "vehicles"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              <Car className="h-4 w-4" />
              {t("bookings.tabs.vehicles")}
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingBookings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                ไม่มีคำขอจองค้างพิจารณา
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                คำขอจองห้องประชุมและยานพาหนะทั้งหมดได้รับการดำเนินการเรียบร้อยแล้ว
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingBookings.map((b) => (
                <LiyonCard
                  key={b.id}
                  className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {b.bookingCode}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            b.resourceType === "ROOM"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                          }`}
                        >
                          {b.resourceType === "ROOM" ? (
                            <>
                              <Building2 className="h-3 w-3" />
                              {b.room ? `${b.room.roomCode} - ${b.room.nameTh}` : t("bookings.resource.room")}
                            </>
                          ) : (
                            <>
                              <Car className="h-3 w-3" />
                              {b.vehicle ? `${b.vehicle.plateNumber} (${b.vehicle.brand})` : t("bookings.resource.vehicle")}
                            </>
                          )}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-medium">
                          {t("bookings.status.pending")}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {b.title}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          <span>เริ่ม: {formatDateTimeText(b.startDateTime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          <span>สิ้นสุด: {formatDateTimeText(b.endDateTime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-neutral-400" />
                          <span>ผู้ใช้: {b.participantCount} คน</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-neutral-400" />
                          <span>ผู้ขอ: {b.contactName} ({b.department || "คณะ"})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-neutral-400" />
                          <span>โทร: {b.contactPhone}</span>
                        </div>
                        {b.destination && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                            <span>ปลายทาง: {b.destination}</span>
                          </div>
                        )}
                      </div>

                      {b.specialRequests && (
                        <p className="text-xs bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded border border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-200">ความต้องการเพิ่มเติม: </span>
                          {b.specialRequests}
                        </p>
                      )}
                    </div>

                    {canApprove && (
                      <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
                        <Button
                          onClick={() => handleApprove(b.id)}
                          disabled={isPending}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t("bookings.action.approve")}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsRejectOpen(true);
                          }}
                          disabled={isPending}
                          size="sm"
                          variant="outline"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40 flex items-center gap-1.5"
                        >
                          <XCircle className="h-4 w-4" />
                          {t("bookings.action.reject")}
                        </Button>
                      </div>
                    )}
                  </div>
                </LiyonCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Schedule & Calendar Grid */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              กำหนดการใช้งานที่ได้รับอนุมัติแล้ว
            </h3>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {bookings.filter((b) => b.status === "APPROVED").length === 0 ? (
                <p className="text-sm text-neutral-500 py-8 text-center">ไม่มีการจองที่อนุมัติในช่วงเวลานี้</p>
              ) : (
                bookings
                  .filter((b) => b.status === "APPROVED")
                  .map((b) => (
                    <div key={b.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              b.resourceType === "ROOM"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                            }`}
                          >
                            {b.resourceType === "ROOM" ? b.room?.nameTh : b.vehicle?.plateNumber}
                          </span>
                          <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                            {b.title}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center gap-4">
                          <span>🕒 {formatDateTimeText(b.startDateTime)} ถึง {formatDateTimeText(b.endDateTime)}</span>
                          <span>👤 ผู้ติดต่อ: {b.contactName} ({b.contactPhone})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          อนุมัติแล้ว
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: All Bookings Registry */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t("bookings.action.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            >
              <option value="ALL">ทรัพยากรทั้งหมด</option>
              <option value="ROOM">เฉพาะห้องประชุม</option>
              <option value="VEHICLE">เฉพาะยานพาหนะ</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="PENDING">รอพิจารณา</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="REJECTED">ไม่อนุมัติ</option>
              <option value="CANCELLED">ยกเลิกแล้ว</option>
            </select>
          </div>

          {/* Bookings Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">รหัสใบจอง</th>
                  <th className="px-4 py-3">ประเภท & ทรัพยากร</th>
                  <th className="px-4 py-3">หัวข้อ / วัตถุประสงค์</th>
                  <th className="px-4 py-3">วันเวลาที่ใช้</th>
                  <th className="px-4 py-3">ผู้ขอจอง</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                      ไม่พบข้อมูลการจองตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                        {b.bookingCode}
                      </td>
                      <td className="px-4 py-3">
                        {b.resourceType === "ROOM" ? (
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                            <Building2 className="h-4 w-4" />
                            <span>{b.room?.roomCode || "ห้อง"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                            <Car className="h-4 w-4" />
                            <span>{b.vehicle?.plateNumber || "รถ"}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 max-w-xs truncate">
                          {b.title}
                        </div>
                        {b.destination && (
                          <p className="text-xs text-neutral-500 truncate">ปลายทาง: {b.destination}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        <div>{formatDateTimeText(b.startDateTime)}</div>
                        <div>ถึง {formatDateTimeText(b.endDateTime)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">{b.contactName}</div>
                        <div className="text-neutral-500">{b.contactPhone}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {b.status === "APPROVED" && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            อนุมัติแล้ว
                          </span>
                        )}
                        {b.status === "PENDING" && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            รอพิจารณา
                          </span>
                        )}
                        {b.status === "REJECTED" && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" title={b.rejectReason || ""}>
                            ไม่อนุมัติ
                          </span>
                        )}
                        {b.status === "CANCELLED" && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                            ยกเลิกแล้ว
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(b.status === "PENDING" || b.status === "APPROVED") && (
                          <Button
                            onClick={() => handleCancelBooking(b.id)}
                            variant="ghost"
                            size="sm"
                            className="text-neutral-500 hover:text-rose-600 text-xs"
                          >
                            ยกเลิก
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Manage Rooms */}
      {activeTab === "rooms" && canManage && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              รายชื่อห้องประชุมและสิ่งอำนวยความสะดวก ({rooms.length} ห้อง)
            </h3>
            <Button
              onClick={() => {
                setEditingRoom(null);
                setRoomFormData({
                  roomCode: "",
                  nameTh: "",
                  nameEn: "",
                  building: "อาคาร 1",
                  floor: 1,
                  capacity: 20,
                  roomType: "MEETING_ROOM",
                  facilitiesText: "โปรเจกเตอร์, ไวท์บอร์ด, ไมค์",
                  imageUrl: "",
                  status: "AVAILABLE",
                  orderIndex: rooms.length + 1,
                });
                setIsRoomModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {t("bookings.action.addRoom")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((r) => (
              <LiyonCard
                key={r.id}
                className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      {r.roomCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {r.status === "AVAILABLE" ? "พร้อมใช้งาน" : "ปิดปรับปรุง"}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {r.nameTh}
                  </h4>
                  <p className="text-xs text-neutral-500">{r.nameEn}</p>

                  <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                    <p>🏢 {r.building} (ชั้น {r.floor})</p>
                    <p>👥 ความจุ: {r.capacity} ที่นั่ง</p>
                  </div>

                  {r.facilities.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        อุปกรณ์ประจำห้อง:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {r.facilities.map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    onClick={() => {
                      setEditingRoom(r);
                      setRoomFormData({
                        roomCode: r.roomCode,
                        nameTh: r.nameTh,
                        nameEn: r.nameEn,
                        building: r.building,
                        floor: r.floor,
                        capacity: r.capacity,
                        roomType: r.roomType as "MEETING_ROOM" | "CONFERENCE_ROOM" | "SEMINAR_HALL" | "COMPUTER_LAB",
                        facilitiesText: r.facilities.join(", "),
                        imageUrl: r.imageUrl || "",
                        status: r.status as "AVAILABLE" | "MAINTENANCE" | "INACTIVE",
                        orderIndex: r.orderIndex,
                      });
                      setIsRoomModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-neutral-600 flex items-center gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    แก้ไข
                  </Button>
                  <Button
                    onClick={() => handleDeleteRoom(r.id)}
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ลบ
                  </Button>
                </div>
              </LiyonCard>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Manage Vehicles */}
      {activeTab === "vehicles" && canManage && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              รายชื่อยานพาหนะส่วนกลาง ({vehicles.length} คัน)
            </h3>
            <Button
              onClick={() => {
                setEditingVehicle(null);
                setVehicleFormData({
                  plateNumber: "",
                  brand: "Toyota",
                  model: "Commuter VIP",
                  vehicleType: "VAN",
                  capacity: 10,
                  driverName: "",
                  driverPhone: "",
                  imageUrl: "",
                  status: "AVAILABLE",
                  orderIndex: vehicles.length + 1,
                });
                setIsVehicleModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {t("bookings.action.addVehicle")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <LiyonCard
                key={v.id}
                className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                      {v.plateNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        v.status === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {v.status === "AVAILABLE" ? "พร้อมใช้งาน" : "ปรับปรุง/ซ่อมบำรุง"}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {v.brand} {v.model}
                  </h4>

                  <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                    <p>🚐 ประเภท: {v.vehicleType}</p>
                    <p>👥 จำนวนที่นั่ง: {v.capacity} ที่นั่ง</p>
                    <p>👤 พนักงานขับรถ: {v.driverName || "ยังไม่ได้กำหนด"}</p>
                    {v.driverPhone && <p>📞 เบอร์โทร: {v.driverPhone}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    onClick={() => {
                      setEditingVehicle(v);
                      setVehicleFormData({
                        plateNumber: v.plateNumber,
                        brand: v.brand,
                        model: v.model,
                        vehicleType: v.vehicleType as "VAN" | "SEDAN" | "SUV" | "BUS" | "PICKUP",
                        capacity: v.capacity,
                        driverName: v.driverName || "",
                        driverPhone: v.driverPhone || "",
                        imageUrl: v.imageUrl || "",
                        status: v.status as "AVAILABLE" | "MAINTENANCE" | "INACTIVE",
                        orderIndex: v.orderIndex,
                      });
                      setIsVehicleModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-neutral-600 flex items-center gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    แก้ไข
                  </Button>
                  <Button
                    onClick={() => handleDeleteVehicle(v.id)}
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ลบ
                  </Button>
                </div>
              </LiyonCard>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Reservation Form */}
      <LiyonDialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
        <LiyonDialogHeader
          title={t("bookings.action.new")}
          description="กรอกข้อมูลเพื่อยื่นขอใช้ห้องประชุมหรือยานพาหนะส่วนกลาง"
        />
        <LiyonDialogBody className="space-y-4">
          {conflictWarning && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{conflictWarning}</span>
            </div>
          )}

          {/* Resource Type Switcher */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBookingForm((f) => ({ ...f, resourceType: "ROOM" }))}
              className={`p-3 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                bookingForm.resourceType === "ROOM"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500"
                  : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <Building2 className="h-4 w-4" />
              {t("bookings.resource.room")}
            </button>
            <button
              type="button"
              onClick={() => setBookingForm((f) => ({ ...f, resourceType: "VEHICLE" }))}
              className={`p-3 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                bookingForm.resourceType === "VEHICLE"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500"
                  : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <Car className="h-4 w-4" />
              {t("bookings.resource.vehicle")}
            </button>
          </div>

          {/* Resource Select */}
          {bookingForm.resourceType === "ROOM" ? (
            <LiyonField label="เลือกห้องประชุม">
              <select
                value={bookingForm.roomId}
                onChange={(e) => setBookingForm((f) => ({ ...f, roomId: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomCode} - {r.nameTh} ({r.building}, ความจุ {r.capacity} คน)
                  </option>
                ))}
              </select>
            </LiyonField>
          ) : (
            <LiyonField label="เลือกยานพาหนะ">
              <select
                value={bookingForm.vehicleId}
                onChange={(e) => setBookingForm((f) => ({ ...f, vehicleId: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} ({v.brand} {v.model}, {v.capacity} ที่นั่ง)
                  </option>
                ))}
              </select>
            </LiyonField>
          )}

          <LiyonField label={t("bookings.titleLabel")}>
            <input
              type="text"
              value={bookingForm.title}
              onChange={(e) => setBookingForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="เช่น ประชุมคณะกรรมการบริหารคณะ หรือ นำนิสิตศึกษาดูงาน"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
          </LiyonField>

          {/* Date & Times */}
          <div className="grid grid-cols-2 gap-3">
            <LiyonField label="วันที่เริ่มต้น">
              <input
                type="date"
                value={bookingForm.startDate}
                onChange={(e) => setBookingForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label="เวลาเริ่มต้น">
              <input
                type="time"
                value={bookingForm.startTime}
                onChange={(e) => setBookingForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label="วันที่สิ้นสุด">
              <input
                type="date"
                value={bookingForm.endDate}
                onChange={(e) => setBookingForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label="เวลาสิ้นสุด">
              <input
                type="time"
                value={bookingForm.endTime}
                onChange={(e) => setBookingForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          {/* Contacts */}
          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("bookings.contactName")}>
              <input
                type="text"
                value={bookingForm.contactName}
                onChange={(e) => setBookingForm((f) => ({ ...f, contactName: e.target.value }))}
                placeholder="ชื่อ-สกุล ผู้ประสานงาน"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label={t("bookings.contactPhone")}>
              <input
                type="text"
                value={bookingForm.contactPhone}
                onChange={(e) => setBookingForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="08x-xxx-xxxx"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("bookings.department")}>
              <input
                type="text"
                value={bookingForm.department}
                onChange={(e) => setBookingForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="ภาควิชา / สำนักงาน"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label={t("bookings.participantCount")}>
              <input
                type="number"
                min={1}
                value={bookingForm.participantCount}
                onChange={(e) => setBookingForm((f) => ({ ...f, participantCount: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          {bookingForm.resourceType === "VEHICLE" && (
            <div className="space-y-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900/40">
              <LiyonField label={t("bookings.destination")}>
                <input
                  type="text"
                  value={bookingForm.destination}
                  onChange={(e) => setBookingForm((f) => ({ ...f, destination: e.target.value }))}
                  placeholder="เช่น มหาวิทยาลัยเชียงใหม่ จ.เชียงใหม่"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </LiyonField>
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingForm.driverRequired}
                  onChange={(e) => setBookingForm((f) => ({ ...f, driverRequired: e.target.checked }))}
                  className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
                ขอพนักงานขับรถประจำคณะ
              </label>
            </div>
          )}

          <LiyonField label={t("bookings.specialRequests")}>
            <textarea
              rows={2}
              value={bookingForm.specialRequests}
              onChange={(e) => setBookingForm((f) => ({ ...f, specialRequests: e.target.value }))}
              placeholder="เช่น ขอจัดโต๊ะแบบตัวยู หรือต้องการอาหารว่าง 30 ชุด"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
          </LiyonField>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setIsNewBookingOpen(false)}>
            {t("bookings.action.close")}
          </Button>
          <Button
            onClick={handleCreateBooking}
            disabled={isPending || !bookingForm.title || !bookingForm.contactName}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {t("bookings.action.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal: Reject Dialog */}
      <LiyonDialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <LiyonDialogHeader
          title="ไม่อนุมัติคำขอจอง"
          description={selectedBooking ? `${selectedBooking.bookingCode} - ${selectedBooking.title}` : undefined}
        />
        <LiyonDialogBody className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            คุณกำลังไม่อนุมัติคำขอ: <span className="font-bold text-neutral-800 dark:text-neutral-200">{selectedBooking?.bookingCode} - {selectedBooking?.title}</span>
          </p>
          <LiyonField label={t("bookings.rejectReason")}>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผลในการไม่อนุมัติอย่างน้อย 3 ตัวอักษร"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
          </LiyonField>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleRejectConfirm}
            disabled={isPending || rejectReason.trim().length < 3}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            ยืนยันไม่อนุมัติ
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal: Create/Edit Room */}
      <LiyonDialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
        <LiyonDialogHeader
          title={editingRoom ? "แก้ไขห้องประชุม" : "เพิ่มห้องประชุมใหม่"}
          description="กรอกข้อมูลรายละเอียด สิ่งอำนวยความสะดวก และความจุของห้องประชุม"
        />
        <LiyonDialogBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("bookings.room.code")}>
              <input
                type="text"
                value={roomFormData.roomCode}
                onChange={(e) => setRoomFormData((f) => ({ ...f, roomCode: e.target.value }))}
                placeholder="เช่น MR-101"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label={t("bookings.room.capacity")}>
              <input
                type="number"
                value={roomFormData.capacity}
                onChange={(e) => setRoomFormData((f) => ({ ...f, capacity: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          <LiyonField label={t("bookings.room.nameTh")}>
            <input
              type="text"
              value={roomFormData.nameTh}
              onChange={(e) => setRoomFormData((f) => ({ ...f, nameTh: e.target.value }))}
              placeholder="ชื่อห้องภาษาไทย"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
          </LiyonField>

          <LiyonField label={t("bookings.room.nameEn")}>
            <input
              type="text"
              value={roomFormData.nameEn}
              onChange={(e) => setRoomFormData((f) => ({ ...f, nameEn: e.target.value }))}
              placeholder="Room name in English"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
          </LiyonField>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("bookings.room.building")}>
              <input
                type="text"
                value={roomFormData.building}
                onChange={(e) => setRoomFormData((f) => ({ ...f, building: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label={t("bookings.room.floor")}>
              <input
                type="number"
                value={roomFormData.floor}
                onChange={(e) => setRoomFormData((f) => ({ ...f, floor: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          <LiyonField label={t("bookings.room.facilities")}>
            <input
              type="text"
              value={roomFormData.facilitiesText}
              onChange={(e) => setRoomFormData((f) => ({ ...f, facilitiesText: e.target.value }))}
              placeholder="คั่นด้วยเครื่องหมายจุลภาค เช่น โปรเจกเตอร์ 4K, จอสัมผัส, ไมค์ลอย 2 ตัว"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
          </LiyonField>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label="ประเภทห้อง">
              <select
                value={roomFormData.roomType}
                onChange={(e) => setRoomFormData((f) => ({ ...f, roomType: e.target.value as "MEETING_ROOM" | "CONFERENCE_ROOM" | "SEMINAR_HALL" | "COMPUTER_LAB" }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <option value="MEETING_ROOM">ห้องประชุมย่อย</option>
                <option value="CONFERENCE_ROOM">ห้องประชุมคณะ/บอร์ด</option>
                <option value="SEMINAR_HALL">ห้องสัมมนาวิชาการ</option>
                <option value="COMPUTER_LAB">ห้องปฏิบัติการคอมพิวเตอร์</option>
              </select>
            </LiyonField>

            <LiyonField label="สถานะการใช้งาน">
              <select
                value={roomFormData.status}
                onChange={(e) => setRoomFormData((f) => ({ ...f, status: e.target.value as "AVAILABLE" | "MAINTENANCE" | "INACTIVE" }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <option value="AVAILABLE">พร้อมใช้งาน</option>
                <option value="MAINTENANCE">ปิดปรับปรุงชั่วคราว</option>
                <option value="INACTIVE">ระงับการใช้งาน</option>
              </select>
            </LiyonField>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setIsRoomModalOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSaveRoom}
            disabled={isPending || !roomFormData.roomCode || !roomFormData.nameTh}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            บันทึกข้อมูล
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal: Create/Edit Vehicle */}
      <LiyonDialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
        <LiyonDialogHeader
          title={editingVehicle ? "แก้ไขข้อมูลยานพาหนะ" : "เพิ่มยานพาหนะใหม่"}
          description="กรอกข้อมูลยานพาหนะ ทะเบียนรถ และพนักงานขับรถประจำคณะ"
        />
        <LiyonDialogBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("bookings.vehicle.plate")}>
              <input
                type="text"
                value={vehicleFormData.plateNumber}
                onChange={(e) => setVehicleFormData((f) => ({ ...f, plateNumber: e.target.value }))}
                placeholder="เช่น นข 4521 พิษณุโลก"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label={t("bookings.vehicle.capacity")}>
              <input
                type="number"
                value={vehicleFormData.capacity}
                onChange={(e) => setVehicleFormData((f) => ({ ...f, capacity: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("bookings.vehicle.brand")}>
              <input
                type="text"
                value={vehicleFormData.brand}
                onChange={(e) => setVehicleFormData((f) => ({ ...f, brand: e.target.value }))}
                placeholder="เช่น Toyota"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label={t("bookings.vehicle.model")}>
              <input
                type="text"
                value={vehicleFormData.model}
                onChange={(e) => setVehicleFormData((f) => ({ ...f, model: e.target.value }))}
                placeholder="เช่น Commuter VIP 3.0"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("bookings.vehicle.driverName")}>
              <input
                type="text"
                value={vehicleFormData.driverName}
                onChange={(e) => setVehicleFormData((f) => ({ ...f, driverName: e.target.value }))}
                placeholder="ชื่อ-สกุล พนักงานขับรถ"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
            <LiyonField label={t("bookings.vehicle.driverPhone")}>
              <input
                type="text"
                value={vehicleFormData.driverPhone}
                onChange={(e) => setVehicleFormData((f) => ({ ...f, driverPhone: e.target.value }))}
                placeholder="08x-xxx-xxxx"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label="ประเภทรถ">
              <select
                value={vehicleFormData.vehicleType}
                onChange={(e) => setVehicleFormData((f) => ({ ...f, vehicleType: e.target.value as "VAN" | "SEDAN" | "SUV" | "BUS" | "PICKUP" }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <option value="VAN">รถตู้ส่วนกลาง</option>
                <option value="SEDAN">รถเก๋งประจำคณะ</option>
                <option value="SUV">รถยนต์ SUV</option>
                <option value="BUS">รถบัสปรับอากาศ</option>
                <option value="PICKUP">รถกระบะ</option>
              </select>
            </LiyonField>

            <LiyonField label="สถานะการใช้งาน">
              <select
                value={vehicleFormData.status}
                onChange={(e) => setVehicleFormData((f) => ({ ...f, status: e.target.value as "AVAILABLE" | "MAINTENANCE" | "INACTIVE" }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <option value="AVAILABLE">พร้อมใช้งาน</option>
                <option value="MAINTENANCE">ซ่อมบำรุง</option>
                <option value="INACTIVE">ระงับการใช้งาน</option>
              </select>
            </LiyonField>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setIsVehicleModalOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSaveVehicle}
            disabled={isPending || !vehicleFormData.plateNumber}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            บันทึกข้อมูล
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
