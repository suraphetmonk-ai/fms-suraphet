import { prisma } from "@/shared/lib/infra/prisma";
import type { CreateProgramInput, UpdateProgramInput } from "./validations";

export interface ProgramDto {
  id: string;
  tenantId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  degreeLevel: string;
  degreeNameTh: string;
  degreeNameEn: string;
  departmentId: string | null;
  departmentNameTh?: string;
  departmentNameEn?: string;
  totalCredits: number;
  tuitionFee: string | null;
  durationYears: number;
  descriptionTh: string | null;
  descriptionEn: string | null;
  careerOpportunitiesTh: string | null;
  careerOpportunitiesEn: string | null;
  pdfUrl: string | null;
  isOpenAdmission: boolean;
  status: string;
  studyPlans?: { id: string; nameTh: string; nameEn: string }[];
  courses?: {
    id: string;
    courseGroup: string;
    yearLevel: number;
    semester: number;
    course: {
      id: string;
      code: string;
      nameTh: string;
      nameEn: string;
      credits: string;
      descriptionTh: string | null;
      descriptionEn: string | null;
      prerequisite: string | null;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export async function listPrograms(tenantId: string): Promise<ProgramDto[]> {
  const rows = await prisma.program.findMany({
    where: { tenantId },
    include: { department: true },
    orderBy: [{ degreeLevel: "asc" }, { code: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    code: r.code,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    degreeLevel: r.degreeLevel,
    degreeNameTh: r.degreeNameTh,
    degreeNameEn: r.degreeNameEn,
    departmentId: r.departmentId,
    departmentNameTh: r.department?.nameTh,
    departmentNameEn: r.department?.nameEn,
    totalCredits: r.totalCredits,
    tuitionFee: r.tuitionFee,
    durationYears: r.durationYears,
    descriptionTh: r.descriptionTh,
    descriptionEn: r.descriptionEn,
    careerOpportunitiesTh: r.careerOpportunitiesTh,
    careerOpportunitiesEn: r.careerOpportunitiesEn,
    pdfUrl: r.pdfUrl,
    isOpenAdmission: r.isOpenAdmission,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function listPublicPrograms(tenantId: string, degreeLevel?: string): Promise<ProgramDto[]> {
  const rows = await prisma.program.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      ...(degreeLevel ? { degreeLevel } : {}),
    },
    include: { department: true },
    orderBy: [{ degreeLevel: "asc" }, { code: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    code: r.code,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    degreeLevel: r.degreeLevel,
    degreeNameTh: r.degreeNameTh,
    degreeNameEn: r.degreeNameEn,
    departmentId: r.departmentId,
    departmentNameTh: r.department?.nameTh,
    departmentNameEn: r.department?.nameEn,
    totalCredits: r.totalCredits,
    tuitionFee: r.tuitionFee,
    durationYears: r.durationYears,
    descriptionTh: r.descriptionTh,
    descriptionEn: r.descriptionEn,
    careerOpportunitiesTh: r.careerOpportunitiesTh,
    careerOpportunitiesEn: r.careerOpportunitiesEn,
    pdfUrl: r.pdfUrl,
    isOpenAdmission: r.isOpenAdmission,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getProgramDetail(tenantId: string, id: string): Promise<ProgramDto | null> {
  const r = await prisma.program.findUnique({
    where: { id, tenantId },
    include: {
      department: true,
      studyPlans: { orderBy: { orderIndex: "asc" } },
      programCourses: {
        include: { course: true },
        orderBy: [{ yearLevel: "asc" }, { semester: "asc" }, { courseGroup: "asc" }],
      },
    },
  });
  if (!r) return null;

  return {
    id: r.id,
    tenantId: r.tenantId,
    code: r.code,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    degreeLevel: r.degreeLevel,
    degreeNameTh: r.degreeNameTh,
    degreeNameEn: r.degreeNameEn,
    departmentId: r.departmentId,
    departmentNameTh: r.department?.nameTh,
    departmentNameEn: r.department?.nameEn,
    totalCredits: r.totalCredits,
    tuitionFee: r.tuitionFee,
    durationYears: r.durationYears,
    descriptionTh: r.descriptionTh,
    descriptionEn: r.descriptionEn,
    careerOpportunitiesTh: r.careerOpportunitiesTh,
    careerOpportunitiesEn: r.careerOpportunitiesEn,
    pdfUrl: r.pdfUrl,
    isOpenAdmission: r.isOpenAdmission,
    status: r.status,
    studyPlans: r.studyPlans.map((p) => ({
      id: p.id,
      nameTh: p.nameTh,
      nameEn: p.nameEn,
    })),
    courses: r.programCourses.map((pc) => ({
      id: pc.id,
      courseGroup: pc.courseGroup,
      yearLevel: pc.yearLevel,
      semester: pc.semester,
      course: {
        id: pc.course.id,
        code: pc.course.code,
        nameTh: pc.course.nameTh,
        nameEn: pc.course.nameEn,
        credits: pc.course.credits,
        descriptionTh: pc.course.descriptionTh,
        descriptionEn: pc.course.descriptionEn,
        prerequisite: pc.course.prerequisite,
      },
    })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createProgram(tenantId: string, input: CreateProgramInput): Promise<ProgramDto> {
  const created = await prisma.program.create({
    data: {
      tenantId,
      code: input.code,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      degreeLevel: input.degreeLevel,
      degreeNameTh: input.degreeNameTh,
      degreeNameEn: input.degreeNameEn,
      departmentId: input.departmentId || null,
      totalCredits: input.totalCredits,
      tuitionFee: input.tuitionFee || null,
      durationYears: input.durationYears,
      descriptionTh: input.descriptionTh || null,
      descriptionEn: input.descriptionEn || null,
      careerOpportunitiesTh: input.careerOpportunitiesTh || null,
      careerOpportunitiesEn: input.careerOpportunitiesEn || null,
      pdfUrl: input.pdfUrl || null,
      isOpenAdmission: input.isOpenAdmission,
      status: input.status,
    },
    include: { department: true },
  });

  return getProgramDetail(tenantId, created.id) as Promise<ProgramDto>;
}

export async function updateProgram(tenantId: string, input: UpdateProgramInput): Promise<ProgramDto> {
  const updated = await prisma.program.update({
    where: { id: input.id, tenantId },
    data: {
      code: input.code,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      degreeLevel: input.degreeLevel,
      degreeNameTh: input.degreeNameTh,
      degreeNameEn: input.degreeNameEn,
      departmentId: input.departmentId || null,
      totalCredits: input.totalCredits,
      tuitionFee: input.tuitionFee || null,
      durationYears: input.durationYears,
      descriptionTh: input.descriptionTh || null,
      descriptionEn: input.descriptionEn || null,
      careerOpportunitiesTh: input.careerOpportunitiesTh || null,
      careerOpportunitiesEn: input.careerOpportunitiesEn || null,
      pdfUrl: input.pdfUrl || null,
      isOpenAdmission: input.isOpenAdmission,
      status: input.status,
    },
    include: { department: true },
  });

  return getProgramDetail(tenantId, updated.id) as Promise<ProgramDto>;
}

export async function deleteProgram(tenantId: string, id: string): Promise<void> {
  await prisma.program.delete({
    where: { id, tenantId },
  });
}
