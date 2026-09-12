-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "room_code" VARCHAR(50) NOT NULL,
    "name_th" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200) NOT NULL,
    "building" VARCHAR(100) NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "room_type" VARCHAR(50) NOT NULL DEFAULT 'MEETING_ROOM',
    "facilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" VARCHAR(500),
    "status" VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plate_number" VARCHAR(50) NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "vehicle_type" VARCHAR(50) NOT NULL DEFAULT 'VAN',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "driver_name" VARCHAR(150),
    "driver_phone" VARCHAR(50),
    "image_url" VARCHAR(500),
    "status" VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_code" VARCHAR(50) NOT NULL,
    "resource_type" VARCHAR(20) NOT NULL,
    "room_id" UUID,
    "vehicle_id" UUID,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "start_date_time" TIMESTAMPTZ NOT NULL,
    "end_date_time" TIMESTAMPTZ NOT NULL,
    "participant_count" INTEGER NOT NULL DEFAULT 1,
    "contact_name" VARCHAR(150) NOT NULL,
    "contact_phone" VARCHAR(50) NOT NULL,
    "department" VARCHAR(150),
    "destination" VARCHAR(255),
    "driver_required" BOOLEAN NOT NULL DEFAULT true,
    "special_requests" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ,
    "reject_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rooms_tenant_id_status_idx" ON "rooms"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_tenant_id_room_code_key" ON "rooms"("tenant_id", "room_code");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_status_idx" ON "vehicles"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_plate_number_key" ON "vehicles"("tenant_id", "plate_number");

-- CreateIndex
CREATE INDEX "bookings_tenant_id_resource_type_status_idx" ON "bookings"("tenant_id", "resource_type", "status");

-- CreateIndex
CREATE INDEX "bookings_room_id_start_date_time_end_date_time_idx" ON "bookings"("room_id", "start_date_time", "end_date_time");

-- CreateIndex
CREATE INDEX "bookings_vehicle_id_start_date_time_end_date_time_idx" ON "bookings"("vehicle_id", "start_date_time", "end_date_time");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_tenant_id_booking_code_key" ON "bookings"("tenant_id", "booking_code");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
