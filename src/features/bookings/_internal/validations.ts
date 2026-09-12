import { z } from "zod";

export const createBookingSchema = z
  .object({
    resourceType: z.enum(["ROOM", "VEHICLE"]),
    roomId: z.string().uuid().optional().nullable(),
    vehicleId: z.string().uuid().optional().nullable(),
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(255),
    startDateTime: z.string().or(z.date()),
    endDateTime: z.string().or(z.date()),
    participantCount: z.coerce.number().int().min(1).default(1),
    contactName: z.string().trim().min(2).max(150),
    contactPhone: z.string().trim().min(9).max(50),
    department: z.string().trim().max(150).optional().nullable(),
    destination: z.string().trim().max(255).optional().nullable(),
    driverRequired: z.boolean().default(true),
    specialRequests: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDateTime).getTime();
      const end = new Date(data.endDateTime).getTime();
      return !isNaN(start) && !isNaN(end) && end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endDateTime"],
    }
  )
  .refine(
    (data) => {
      if (data.resourceType === "ROOM") return !!data.roomId;
      if (data.resourceType === "VEHICLE") return !!data.vehicleId;
      return true;
    },
    {
      message: "Resource ID (roomId or vehicleId) is required for selected type",
      path: ["resourceType"],
    }
  );

export const approveBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

export const rejectBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters"),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

export const createRoomSchema = z.object({
  roomCode: z.string().trim().min(2).max(50),
  nameTh: z.string().trim().min(2).max(200),
  nameEn: z.string().trim().min(2).max(200),
  building: z.string().trim().min(2).max(100),
  floor: z.coerce.number().int().min(1).max(50).default(1),
  capacity: z.coerce.number().int().min(1).default(10),
  roomType: z.enum(["MEETING_ROOM", "CONFERENCE_ROOM", "COMPUTER_LAB", "SEMINAR_HALL"]).default("MEETING_ROOM"),
  facilities: z.array(z.string()).default([]),
  imageUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "INACTIVE"]).default("AVAILABLE"),
  orderIndex: z.coerce.number().int().default(0),
});

export const updateRoomSchema = createRoomSchema.extend({
  id: z.string().uuid(),
});

export const createVehicleSchema = z.object({
  plateNumber: z.string().trim().min(2).max(50),
  brand: z.string().trim().min(2).max(100),
  model: z.string().trim().min(2).max(100),
  vehicleType: z.enum(["VAN", "SEDAN", "SUV", "BUS", "PICKUP"]).default("VAN"),
  capacity: z.coerce.number().int().min(1).default(4),
  driverName: z.string().trim().max(150).optional().nullable().or(z.literal("")),
  driverPhone: z.string().trim().max(50).optional().nullable().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "INACTIVE"]).default("AVAILABLE"),
  orderIndex: z.coerce.number().int().default(0),
});

export const updateVehicleSchema = createVehicleSchema.extend({
  id: z.string().uuid(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ApproveBookingInput = z.infer<typeof approveBookingSchema>;
export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
