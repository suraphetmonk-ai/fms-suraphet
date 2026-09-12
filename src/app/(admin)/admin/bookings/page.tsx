import { requirePermission, hasPermission } from "@/features/identity/server";
import {
  BOOKING_P,
  listBookings,
  getBookingMetrics,
  listRooms,
  listVehicles,
} from "@/features/bookings/server";
import { BookingsAdminClient } from "./_components/bookings-admin-client";

export default async function BookingsAdminPage() {
  const ctx = await requirePermission(BOOKING_P.bookingRead);

  const [bookings, metrics, rooms, vehicles] = await Promise.all([
    listBookings(ctx.tenantId),
    getBookingMetrics(ctx.tenantId),
    listRooms(ctx.tenantId),
    listVehicles(ctx.tenantId),
  ]);

  return (
    <BookingsAdminClient
      initialBookings={bookings}
      initialMetrics={metrics}
      initialRooms={rooms}
      initialVehicles={vehicles}
      currentUserId={ctx.userId}
      canCreate={hasPermission(ctx, BOOKING_P.bookingCreate)}
      canApprove={hasPermission(ctx, BOOKING_P.bookingApprove)}
      canManage={hasPermission(ctx, BOOKING_P.bookingManage)}
    />
  );
}
