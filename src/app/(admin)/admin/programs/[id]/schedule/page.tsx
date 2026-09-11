import { notFound } from "next/navigation";
import { requirePermission, hasPermission } from "@/features/identity/server";
import { CURRICULUM_P, listClassSchedules } from "@/features/curriculum/server";
import { listPersonnel } from "@/features/personnel/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { ScheduleAdminClient } from "./schedule-admin-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; semester?: string; yearLevel?: string }>;
}

export default async function ProgramSchedulePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const academicYear = sp.year ? parseInt(sp.year, 10) : 2569;
  const semester = sp.semester ? parseInt(sp.semester, 10) : 1;
  const yearLevel = sp.yearLevel ? parseInt(sp.yearLevel, 10) : undefined;

  const ctx = await requirePermission(CURRICULUM_P.curriculumRead);

  const [program, personnelList, initialSchedules] = await Promise.all([
    prisma.program.findUnique({
      where: { id, tenantId: ctx.tenantId },
      include: {
        programCourses: {
          include: { course: true },
          orderBy: [{ yearLevel: "asc" }, { semester: "asc" }, { course: { code: "asc" } }],
        },
      },
    }),
    listPersonnel(ctx.tenantId),
    listClassSchedules(ctx.tenantId, {
      programId: id,
      academicYear,
      semester,
      ...(yearLevel ? { yearLevel } : {}),
    }),
  ]);

  if (!program) {
    notFound();
  }

  const courses = program.programCourses.map((pc) => ({
    courseId: pc.courseId,
    code: pc.course.code,
    nameTh: pc.course.nameTh,
    nameEn: pc.course.nameEn,
    credits: pc.course.credits,
    courseCategory: pc.course.courseCategory,
  }));

  const mappedPersonnel = personnelList.map((p) => ({
    id: p.id,
    personnelCode: p.personnelCode,
    fullNameTh: p.fullNameTh,
    monasticTitle: p.monasticTitle,
    academicRank: p.academicRank,
  }));

  return (
    <ScheduleAdminClient
      program={{
        id: program.id,
        code: program.code,
        nameTh: program.nameTh,
        nameEn: program.nameEn,
        degreeNameTh: program.degreeNameTh,
      }}
      courses={courses}
      personnelList={mappedPersonnel}
      initialSchedules={initialSchedules}
      canUpdate={hasPermission(ctx, CURRICULUM_P.curriculumUpdate)}
      academicYear={academicYear}
      semester={semester}
    />
  );
}
