-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "student_code" VARCHAR(50) NOT NULL,
    "title" VARCHAR(50) NOT NULL DEFAULT 'นาย',
    "first_name_th" VARCHAR(100) NOT NULL,
    "last_name_th" VARCHAR(100) NOT NULL,
    "first_name_en" VARCHAR(100) NOT NULL,
    "last_name_en" VARCHAR(100) NOT NULL,
    "program_id" UUID NOT NULL,
    "advisor_id" UUID,
    "admission_year" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'STUDYING',
    "gpa" DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "avatar_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advising_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "advisor_id" UUID NOT NULL,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topic" VARCHAR(255) NOT NULL,
    "detail" TEXT NOT NULL,
    "action_plan" TEXT,
    "is_confidential" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "advising_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_scholarships" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "scholarship_name" VARCHAR(255) NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "students_tenant_id_status_idx" ON "students"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "students_tenant_id_admission_year_idx" ON "students"("tenant_id", "admission_year");

-- CreateIndex
CREATE INDEX "students_program_id_idx" ON "students"("program_id");

-- CreateIndex
CREATE INDEX "students_advisor_id_idx" ON "students"("advisor_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_tenant_id_student_code_key" ON "students"("tenant_id", "student_code");

-- CreateIndex
CREATE INDEX "advising_records_tenant_id_student_id_idx" ON "advising_records"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "advising_records_advisor_id_idx" ON "advising_records"("advisor_id");

-- CreateIndex
CREATE INDEX "student_scholarships_tenant_id_student_id_idx" ON "student_scholarships"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "student_scholarships_academic_year_idx" ON "student_scholarships"("academic_year");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "personnel_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advising_records" ADD CONSTRAINT "advising_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advising_records" ADD CONSTRAINT "advising_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advising_records" ADD CONSTRAINT "advising_records_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "personnel_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_scholarships" ADD CONSTRAINT "student_scholarships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_scholarships" ADD CONSTRAINT "student_scholarships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
