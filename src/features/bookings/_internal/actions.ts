"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { BOOKING_P } from "../permissions";
import {
  createBookingSchema,
  approveBookingSchema,
  rejectBookingSchema,
  cancelBookingSchema,
  createRoomSchema,
  updateRoomSchema,
  createVehicleSchema,
  updateVehicleSchema,
  type CreateBookingInput,
  type ApproveBookingInput,
  type RejectBookingInput,
  type CancelBookingInput,
  type CreateRoomInput,
  type UpdateRoomInput,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from "./validations";
import {
  listBookings,
  getBookingMetrics,
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  createBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  checkResourceConflict,
  type BookingDto,
  type BookingMetricsDto,
  type RoomDto,
  type VehicleDto,
} from "./services";

export async function getBookingsAction(filters?: {
  resourceType?: string;
  status?: string;
  search?: string;
}): Promise<ActionResult<BookingDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    return listBookings(ctx.tenantId, filters);
  });
}

export async function getBookingMetricsAction(): Promise<ActionResult<BookingMetricsDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    return getBookingMetrics(ctx.tenantId);
  });
}

export async function getRoomsAction(): Promise<ActionResult<RoomDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    return listRooms(ctx.tenantId);
  });
}

export async function getVehiclesAction(): Promise<ActionResult<VehicleDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    return listVehicles(ctx.tenantId);
  });
}

export async function checkConflictAction(params: {
  resourceType: "ROOM" | "VEHICLE";
  roomId?: string | null;
  vehicleId?: string | null;
  startDateTime: string;
  endDateTime: string;
  excludeBookingId?: string;
}): Promise<ActionResult<{ hasConflict: boolean; conflictTitle?: string }>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    const result = await checkResourceConflict(ctx.tenantId, {
      resourceType: params.resourceType,
      roomId: params.roomId,
      vehicleId: params.vehicleId,
      startDateTime: new Date(params.startDateTime),
      endDateTime: new Date(params.endDateTime),
      excludeBookingId: params.excludeBookingId,
    });

    return {
      hasConflict: result.hasConflict,
      conflictTitle: result.conflictBooking
        ? `${result.conflictBooking.bookingCode}: ${result.conflictBooking.title}`
        : undefined,
    };
  });
}

export async function createBookingAction(
  rawInput: CreateBookingInput
): Promise<ActionResult<BookingDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingCreate);
    const locale = await getLocale();
    const input = createBookingSchema.parse(rawInput, {
      error: zodErrorMap(locale),
    });

    const created = await createBooking(ctx.tenantId, ctx.userId, input);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return created;
  });
}

export async function approveBookingAction(
  rawInput: ApproveBookingInput
): Promise<ActionResult<{ success: true }>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingApprove);
    const locale = await getLocale();
    const input = approveBookingSchema.parse(rawInput, {
      error: zodErrorMap(locale),
    });

    await approveBooking(ctx.tenantId, ctx.userId, input);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return { success: true };
  });
}

export async function rejectBookingAction(
  rawInput: RejectBookingInput
): Promise<ActionResult<{ success: true }>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingApprove);
    const locale = await getLocale();
    const input = rejectBookingSchema.parse(rawInput, {
      error: zodErrorMap(locale),
    });

    await rejectBooking(ctx.tenantId, ctx.userId, input);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return { success: true };
  });
}

export async function cancelBookingAction(
  rawInput: CancelBookingInput
): Promise<ActionResult<{ success: true }>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingCancel);
    const locale = await getLocale();
    const input = cancelBookingSchema.parse(rawInput, {
      error: zodErrorMap(locale),
    });

    await cancelBooking(ctx.tenantId, ctx.userId, input, ctx.permissions.includes(BOOKING_P.bookingManage));
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return { success: true };
  });
}

export async function createRoomAction(
  rawInput: CreateRoomInput
): Promise<ActionResult<RoomDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    const locale = await getLocale();
    const input = createRoomSchema.parse(rawInput, {
      error: zodErrorMap(locale),
    });

    const room = await createRoom(ctx.tenantId, input);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return room;
  });
}

export async function updateRoomAction(
  rawInput: UpdateRoomInput
): Promise<ActionResult<RoomDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    const locale = await getLocale();
    const input = updateRoomSchema.parse(rawInput, {
      error: zodErrorMap(locale),
    });

    const room = await updateRoom(ctx.tenantId, input);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return room;
  });
}

export async function deleteRoomAction(
  roomId: string
): Promise<ActionResult<{ success: true }>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    await deleteRoom(ctx.tenantId, roomId);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return { success: true };
  });
}

export async function createVehicleAction(
  rawInput: CreateVehicleInput
): Promise<ActionResult<VehicleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    const locale = await getLocale();
    const input = createVehicleSchema.parse(rawInput, {
      error: zodErrorMap(locale),
    });

    const vehicle = await createVehicle(ctx.tenantId, input);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return vehicle;
  });
}

export async function updateVehicleAction(
  rawInput: UpdateVehicleInput
): Promise<ActionResult<VehicleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    const locale = await getLocale();
    const input = updateVehicleSchema.parse(rawInput, {
      error: zodErrorMap(locale),
    });

    const vehicle = await updateVehicle(ctx.tenantId, input);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return vehicle;
  });
}

export async function deleteVehicleAction(
  vehicleId: string
): Promise<ActionResult<{ success: true }>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    await deleteVehicle(ctx.tenantId, vehicleId);
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return { success: true };
  });
}
