import type { PermissionDef } from "@/shared/lib/permission-def";

export const BOOKING_P = {
  bookingRead: "booking:read",
  bookingCreate: "booking:create",
  bookingCancel: "booking:cancel",
  bookingApprove: "booking:approve",
  bookingManage: "booking:manage",
} as const;

export const BOOKING_PERMISSIONS: readonly PermissionDef[] = [
  { code: BOOKING_P.bookingRead, module: "booking", action: "read" },
  { code: BOOKING_P.bookingCreate, module: "booking", action: "create" },
  { code: BOOKING_P.bookingCancel, module: "booking", action: "cancel" },
  { code: BOOKING_P.bookingApprove, module: "booking", action: "approve" },
  { code: BOOKING_P.bookingManage, module: "booking", action: "manage" },
];
