-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "course_category" VARCHAR(100);

-- AlterTable
ALTER TABLE "personnel_profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "chaya" VARCHAR(50),
ADD COLUMN     "citizen_id_encrypted" TEXT,
ADD COLUMN     "citizen_id_masked" VARCHAR(30),
ADD COLUMN     "monastic_title" VARCHAR(100),
ADD COLUMN     "pali_degree" VARCHAR(30),
ADD COLUMN     "personnel_code" VARCHAR(50),
ADD COLUMN     "phone" VARCHAR(50),
ADD COLUMN     "temple_name" VARCHAR(255);

-- CreateTable
CREATE TABLE "teaching_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "personnel_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "program_id" UUID,
    "academic_year" INTEGER NOT NULL DEFAULT 2569,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "role" VARCHAR(50) NOT NULL DEFAULT 'PRIMARY',
    "section" VARCHAR(20) NOT NULL DEFAULT '01',
    "hours_per_week" INTEGER NOT NULL DEFAULT 3,
    "student_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teaching_assignments_tenant_id_academic_year_semester_idx" ON "teaching_assignments"("tenant_id", "academic_year", "semester");

-- CreateIndex
CREATE INDEX "teaching_assignments_personnel_id_idx" ON "teaching_assignments"("personnel_id");

-- CreateIndex
CREATE INDEX "teaching_assignments_course_id_idx" ON "teaching_assignments"("course_id");

-- CreateIndex
CREATE INDEX "teaching_assignments_program_id_idx" ON "teaching_assignments"("program_id");

-- CreateIndex
CREATE INDEX "personnel_profiles_tenant_id_personnel_code_idx" ON "personnel_profiles"("tenant_id", "personnel_code");

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
