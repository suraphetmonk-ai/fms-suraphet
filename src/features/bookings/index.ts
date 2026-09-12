export type {
  CreateBookingInput,
  ApproveBookingInput,
  RejectBookingInput,
  CancelBookingInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateVehicleInput,
  UpdateVehicleInput,
} from "./_internal/validations";

export type {
  BookingDto,
  BookingMetricsDto,
  RoomDto,
  VehicleDto,
} from "./_internal/services";

export { BOOKING_P } from "./permissions";
