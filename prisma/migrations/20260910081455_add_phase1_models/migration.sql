-- CreateTable
CREATE TABLE "article_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title_th" VARCHAR(255) NOT NULL,
    "title_en" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt_th" TEXT,
    "excerpt_en" TEXT,
    "content_th" TEXT NOT NULL,
    "content_en" TEXT NOT NULL,
    "cover_image_url" VARCHAR(500),
    "author_id" UUID,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_attachments" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" INTEGER,
    "file_type" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name_th" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_profiles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "academic_rank" VARCHAR(50),
    "first_name_th" VARCHAR(100) NOT NULL,
    "last_name_th" VARCHAR(100) NOT NULL,
    "first_name_en" VARCHAR(100) NOT NULL,
    "last_name_en" VARCHAR(100) NOT NULL,
    "department_id" UUID,
    "position_th" VARCHAR(150) NOT NULL,
    "position_en" VARCHAR(150) NOT NULL,
    "personnel_type" VARCHAR(30) NOT NULL DEFAULT 'ACADEMIC',
    "email" VARCHAR(255),
    "phone_ext" VARCHAR(50),
    "room_number" VARCHAR(50),
    "avatar_url" VARCHAR(500),
    "biography_th" TEXT,
    "biography_en" TEXT,
    "expertise" JSONB NOT NULL DEFAULT '[]',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "personnel_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_works" (
    "id" UUID NOT NULL,
    "personnel_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "work_type" VARCHAR(50) NOT NULL DEFAULT 'JOURNAL',
    "year" INTEGER,
    "citation_text" TEXT,
    "url" VARCHAR(500),
    "doi" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "academic_works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "department_id" UUID,
    "code" VARCHAR(50) NOT NULL,
    "name_th" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255) NOT NULL,
    "degree_level" VARCHAR(30) NOT NULL,
    "degree_name_th" VARCHAR(255) NOT NULL,
    "degree_name_en" VARCHAR(255) NOT NULL,
    "total_credits" INTEGER NOT NULL,
    "tuition_fee" VARCHAR(100),
    "duration_years" INTEGER NOT NULL DEFAULT 4,
    "description_th" TEXT,
    "description_en" TEXT,
    "career_opportunities_th" TEXT,
    "career_opportunities_en" TEXT,
    "pdf_url" VARCHAR(500),
    "is_open_admission" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_study_plans" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name_th" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255) NOT NULL,
    "credits" VARCHAR(30) NOT NULL,
    "description_th" TEXT,
    "description_en" TEXT,
    "prerequisite" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_courses" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "course_group" VARCHAR(100) NOT NULL,
    "year_level" INTEGER NOT NULL DEFAULT 1,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_categories_tenant_id_idx" ON "article_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_categories_tenant_id_slug_key" ON "article_categories"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "articles_tenant_id_status_published_at_idx" ON "articles"("tenant_id", "status", "published_at");

-- CreateIndex
CREATE INDEX "articles_tenant_id_is_pinned_idx" ON "articles"("tenant_id", "is_pinned");

-- CreateIndex
CREATE UNIQUE INDEX "articles_tenant_id_slug_key" ON "articles"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "article_attachments_article_id_idx" ON "article_attachments"("article_id");

-- CreateIndex
CREATE INDEX "departments_tenant_id_idx" ON "departments"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_tenant_id_code_key" ON "departments"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "personnel_profiles_tenant_id_is_active_order_index_idx" ON "personnel_profiles"("tenant_id", "is_active", "order_index");

-- CreateIndex
CREATE INDEX "personnel_profiles_department_id_idx" ON "personnel_profiles"("department_id");

-- CreateIndex
CREATE INDEX "academic_works_personnel_id_idx" ON "academic_works"("personnel_id");

-- CreateIndex
CREATE INDEX "programs_tenant_id_status_degree_level_idx" ON "programs"("tenant_id", "status", "degree_level");

-- CreateIndex
CREATE UNIQUE INDEX "programs_tenant_id_code_key" ON "programs"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "program_study_plans_program_id_idx" ON "program_study_plans"("program_id");

-- CreateIndex
CREATE INDEX "courses_tenant_id_idx" ON "courses"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_tenant_id_code_key" ON "courses"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "program_courses_program_id_year_level_semester_idx" ON "program_courses"("program_id", "year_level", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "program_courses_program_id_course_id_key" ON "program_courses"("program_id", "course_id");

-- AddForeignKey
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "article_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_attachments" ADD CONSTRAINT "article_attachments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_profiles" ADD CONSTRAINT "personnel_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_profiles" ADD CONSTRAINT "personnel_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_profiles" ADD CONSTRAINT "personnel_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_works" ADD CONSTRAINT "academic_works_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_study_plans" ADD CONSTRAINT "program_study_plans_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
