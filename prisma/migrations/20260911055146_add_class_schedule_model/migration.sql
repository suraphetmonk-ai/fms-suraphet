-- CreateTable
CREATE TABLE "class_schedules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "schedule_code" VARCHAR(50) NOT NULL,
    "program_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "personnel_id" UUID NOT NULL,
    "academic_year" INTEGER NOT NULL DEFAULT 2569,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "year_level" INTEGER NOT NULL DEFAULT 1,
    "day_of_week" INTEGER NOT NULL,
    "start_time" VARCHAR(10) NOT NULL,
    "end_time" VARCHAR(10) NOT NULL,
    "room" VARCHAR(100) NOT NULL,
    "building" VARCHAR(100),
    "section" VARCHAR(20) NOT NULL DEFAULT '01',
    "class_type" VARCHAR(30) NOT NULL DEFAULT 'LECTURE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_schedules_tenant_id_academic_year_semester_year_level_idx" ON "class_schedules"("tenant_id", "academic_year", "semester", "year_level");

-- CreateIndex
CREATE INDEX "class_schedules_personnel_id_idx" ON "class_schedules"("personnel_id");

-- CreateIndex
CREATE INDEX "class_schedules_course_id_idx" ON "class_schedules"("course_id");

-- CreateIndex
CREATE INDEX "class_schedules_room_idx" ON "class_schedules"("room");

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
