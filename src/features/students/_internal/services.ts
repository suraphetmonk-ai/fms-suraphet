import { prisma } from "@/shared/lib/infra/prisma";
import type { Prisma } from "@/generated/prisma";
import { writeAudit } from "@/features/identity/server";
import type {
  CreateStudentInput,
  UpdateStudentInput,
  BatchAssignAdvisorInput,
  CreateAdvisingRecordInput,
  CreateScholarshipInput,
  ImportStudentsInput,
  StudentStatus,
} from "./validations";

export type AcademicRiskLevel = "NORMAL" | "WARNING" | "CRITICAL";

export interface StudentDto {
  id: string;
  tenantId: string;
  studentCode: string;
  title: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  fullNameTh: string;
  fullNameEn: string;
  programId: string;
  programNameTh?: string;
  programNameEn?: string;
  advisorId: string | null;
  advisorNameTh?: string;
  advisorNameEn?: string;
  admissionYear: number;
  status: StudentStatus;
  gpa: number;
  riskLevel: AcademicRiskLevel;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdvisingRecordDto {
  id: string;
  tenantId: string;
  studentId: string;
  studentCode?: string;
  studentNameTh?: string;
  advisorId: string;
  advisorNameTh?: string;
  advisorNameEn?: string;
  date: string;
  topic: string;
  detail: string;
  actionPlan: string | null;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentScholarshipDto {
  id: string;
  tenantId: string;
  studentId: string;
  scholarshipName: string;
  academicYear: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStudentVerificationDto {
  studentCode: string;
  title: string;
  fullNameTh: string;
  fullNameEn: string;
  programNameTh: string;
  programNameEn: string;
  admissionYear: number;
  status: StudentStatus;
  isGraduated: boolean;
}

export function computeRiskLevel(gpa: number): AcademicRiskLevel {
  if (gpa < 2.0) return "CRITICAL";
  if (gpa < 2.5) return "WARNING";
  return "NORMAL";
}

type StudentWithRelations = Prisma.StudentGetPayload<{
  include: { program?: true; advisor?: true };
}>;

function mapStudentToDto(s: StudentWithRelations): StudentDto {
  const gpa = Number(s.gpa ?? 0);
  const fullNameTh = `${s.title} ${s.firstNameTh} ${s.lastNameTh}`.trim();
  const fullNameEn = `${s.firstNameEn} ${s.lastNameEn}`.trim();

  let advisorNameTh: string | undefined;
  let advisorNameEn: string | undefined;
  if (s.advisor) {
    advisorNameTh = `${s.advisor.academicRank ?? ""} ${s.advisor.firstNameTh} ${s.advisor.lastNameTh}`.trim();
    advisorNameEn = `${s.advisor.firstNameEn} ${s.advisor.lastNameEn}`.trim();
  }

  return {
    id: s.id,
    tenantId: s.tenantId,
    studentCode: s.studentCode,
    title: s.title,
    firstNameTh: s.firstNameTh,
    lastNameTh: s.lastNameTh,
    firstNameEn: s.firstNameEn,
    lastNameEn: s.lastNameEn,
    fullNameTh,
    fullNameEn,
    programId: s.programId,
    programNameTh: s.program?.nameTh,
    programNameEn: s.program?.nameEn,
    advisorId: s.advisorId,
    advisorNameTh,
    advisorNameEn,
    admissionYear: s.admissionYear,
    status: s.status as StudentStatus,
    gpa,
    riskLevel: computeRiskLevel(gpa),
    email: s.email,
    phone: s.phone,
    avatarUrl: s.avatarUrl,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function verifyStudentByCode(
  tenantId: string,
  studentCode: string
): Promise<PublicStudentVerificationDto | null> {
  const student = await prisma.student.findUnique({
    where: { tenantId_studentCode: { tenantId, studentCode: studentCode.trim() } },
    include: { program: true },
  });

  if (!student) return null;

  return {
    studentCode: student.studentCode,
    title: student.title,
    fullNameTh: `${student.title} ${student.firstNameTh} ${student.lastNameTh}`.trim(),
    fullNameEn: `${student.firstNameEn} ${student.lastNameEn}`.trim(),
    programNameTh: student.program.nameTh,
    programNameEn: student.program.nameEn,
    admissionYear: student.admissionYear,
    status: student.status as StudentStatus,
    isGraduated: student.status === "GRADUATED",
  };
}

export async function listStudents(
  tenantId: string,
  filter?: {
    programId?: string;
    status?: string;
    admissionYear?: number;
    search?: string;
    advisorId?: string;
  }
): Promise<StudentDto[]> {
  const where: Prisma.StudentWhereInput = { tenantId };

  if (filter?.programId) where.programId = filter.programId;
  if (filter?.status) where.status = filter.status;
  if (filter?.admissionYear) where.admissionYear = filter.admissionYear;
  if (filter?.advisorId) where.advisorId = filter.advisorId;

  if (filter?.search) {
    const q = filter.search.trim();
    where.OR = [
      { studentCode: { contains: q, mode: "insensitive" } },
      { firstNameTh: { contains: q, mode: "insensitive" } },
      { lastNameTh: { contains: q, mode: "insensitive" } },
      { firstNameEn: { contains: q, mode: "insensitive" } },
      { lastNameEn: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.student.findMany({
    where,
    include: {
      program: true,
      advisor: true,
    },
    orderBy: [{ admissionYear: "desc" }, { studentCode: "asc" }],
  });

  return items.map(mapStudentToDto);
}

export async function listMyAdvisees(tenantId: string, advisorId: string): Promise<StudentDto[]> {
  const items = await prisma.student.findMany({
    where: { tenantId, advisorId },
    include: {
      program: true,
      advisor: true,
    },
    orderBy: [{ status: "asc" }, { gpa: "asc" }],
  });

  return items.map(mapStudentToDto);
}

export async function getStudentById(
  tenantId: string,
  id: string,
  canViewConfidential: boolean
): Promise<
  | (StudentDto & {
      advisingRecords: AdvisingRecordDto[];
      scholarships: StudentScholarshipDto[];
    })
  | null
> {
  const s = await prisma.student.findUnique({
    where: { id },
    include: {
      program: true,
      advisor: true,
      scholarships: {
        orderBy: { academicYear: "desc" },
      },
      advisingRecords: {
        where: canViewConfidential ? undefined : { isConfidential: false },
        include: { advisor: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!s || s.tenantId !== tenantId) return null;

  const base = mapStudentToDto(s);
  return {
    ...base,
    scholarships: s.scholarships.map((sc) => ({
      id: sc.id,
      tenantId: sc.tenantId,
      studentId: sc.studentId,
      scholarshipName: sc.scholarshipName,
      academicYear: sc.academicYear,
      amount: Number(sc.amount),
      createdAt: sc.createdAt.toISOString(),
      updatedAt: sc.updatedAt.toISOString(),
    })),
    advisingRecords: s.advisingRecords.map((ar) => ({
      id: ar.id,
      tenantId: ar.tenantId,
      studentId: ar.studentId,
      advisorId: ar.advisorId,
      advisorNameTh: ar.advisor ? `${ar.advisor.firstNameTh} ${ar.advisor.lastNameTh}` : undefined,
      advisorNameEn: ar.advisor ? `${ar.advisor.firstNameEn} ${ar.advisor.lastNameEn}` : undefined,
      date: ar.date.toISOString(),
      topic: ar.topic,
      detail: ar.detail,
      actionPlan: ar.actionPlan,
      isConfidential: ar.isConfidential,
      createdAt: ar.createdAt.toISOString(),
      updatedAt: ar.updatedAt.toISOString(),
    })),
  };
}

export async function createStudent(
  tenantId: string,
  input: CreateStudentInput,
  actorId?: string
): Promise<StudentDto> {
  const created = await prisma.student.create({
    data: {
      tenantId,
      studentCode: input.studentCode.trim(),
      title: input.title.trim(),
      firstNameTh: input.firstNameTh.trim(),
      lastNameTh: input.lastNameTh.trim(),
      firstNameEn: input.firstNameEn.trim(),
      lastNameEn: input.lastNameEn.trim(),
      programId: input.programId,
      advisorId: input.advisorId || null,
      admissionYear: input.admissionYear,
      status: input.status,
      gpa: input.gpa,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      avatarUrl: input.avatarUrl?.trim() || null,
    },
    include: { program: true, advisor: true },
  });

  if (actorId) {
    await writeAudit({
      tenantId,
      actorId,
      action: "student.create",
      entity: "student",
      entityId: created.id,
      after: {
        studentCode: created.studentCode,
        fullNameTh: `${created.title} ${created.firstNameTh} ${created.lastNameTh}`,
        status: created.status,
        programId: created.programId,
      },
    });
  }

  return mapStudentToDto(created);
}

export async function updateStudent(
  tenantId: string,
  input: UpdateStudentInput,
  actorId?: string
): Promise<StudentDto> {
  const before = await prisma.student.findUnique({
    where: { id: input.id },
  });

  if (!before || before.tenantId !== tenantId) {
    throw new Error("Student not found");
  }

  const updated = await prisma.student.update({
    where: { id: input.id },
    data: {
      studentCode: input.studentCode.trim(),
      title: input.title.trim(),
      firstNameTh: input.firstNameTh.trim(),
      lastNameTh: input.lastNameTh.trim(),
      firstNameEn: input.firstNameEn.trim(),
      lastNameEn: input.lastNameEn.trim(),
      programId: input.programId,
      advisorId: input.advisorId || null,
      admissionYear: input.admissionYear,
      status: input.status,
      gpa: input.gpa,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      avatarUrl: input.avatarUrl?.trim() || null,
    },
    include: { program: true, advisor: true },
  });

  // Business Rule 4: การเปลี่ยนแปลงสถานะนิสิตเป็น GRADUATED หรือ RETIRED ต้องบันทึก Audit Log
  const isStatusCriticalChange =
    before.status !== updated.status &&
    (updated.status === "GRADUATED" || updated.status === "RETIRED" || before.status === "GRADUATED" || before.status === "RETIRED");

  if (actorId) {
    await writeAudit({
      tenantId,
      actorId,
      action: isStatusCriticalChange ? "student.status_change" : "student.update",
      entity: "student",
      entityId: updated.id,
      before: { status: before.status, gpa: Number(before.gpa), advisorId: before.advisorId },
      after: { status: updated.status, gpa: Number(updated.gpa), advisorId: updated.advisorId },
    });
  }

  return mapStudentToDto(updated);
}

export async function deleteStudent(tenantId: string, id: string, actorId?: string): Promise<void> {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenantId) throw new Error("Student not found");

  await prisma.student.delete({ where: { id } });

  if (actorId) {
    await writeAudit({
      tenantId,
      actorId,
      action: "student.delete",
      entity: "student",
      entityId: id,
      before: { studentCode: existing.studentCode, status: existing.status },
    });
  }
}

export async function batchAssignAdvisor(
  tenantId: string,
  input: BatchAssignAdvisorInput,
  actorId?: string
): Promise<{ count: number }> {
  const res = await prisma.student.updateMany({
    where: {
      tenantId,
      id: { in: input.studentIds },
    },
    data: {
      advisorId: input.advisorId,
    },
  });

  if (actorId) {
    await writeAudit({
      tenantId,
      actorId,
      action: "student.batch_assign_advisor",
      entity: "student",
      entityId: input.advisorId ?? "unassigned",
      after: {
        advisorId: input.advisorId,
        studentCount: res.count,
        studentIds: input.studentIds,
      },
    });
  }

  return { count: res.count };
}

export async function createAdvisingRecord(
  tenantId: string,
  input: CreateAdvisingRecordInput,
  actorId?: string
): Promise<AdvisingRecordDto> {
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
  });
  if (!student || student.tenantId !== tenantId) throw new Error("Student not found");

  const recordDate = input.date ? new Date(input.date) : new Date();

  const record = await prisma.advisingRecord.create({
    data: {
      tenantId,
      studentId: input.studentId,
      advisorId: input.advisorId,
      date: recordDate,
      topic: input.topic.trim(),
      detail: input.detail.trim(),
      actionPlan: input.actionPlan?.trim() || null,
      isConfidential: input.isConfidential ?? false,
    },
    include: { advisor: true },
  });

  if (actorId) {
    await writeAudit({
      tenantId,
      actorId,
      action: "student.advising_log",
      entity: "advising_record",
      entityId: record.id,
      after: {
        studentId: record.studentId,
        advisorId: record.advisorId,
        isConfidential: record.isConfidential,
        topic: record.topic,
      },
    });
  }

  return {
    id: record.id,
    tenantId: record.tenantId,
    studentId: record.studentId,
    advisorId: record.advisorId,
    advisorNameTh: record.advisor ? `${record.advisor.firstNameTh} ${record.advisor.lastNameTh}` : undefined,
    advisorNameEn: record.advisor ? `${record.advisor.firstNameEn} ${record.advisor.lastNameEn}` : undefined,
    date: record.date.toISOString(),
    topic: record.topic,
    detail: record.detail,
    actionPlan: record.actionPlan,
    isConfidential: record.isConfidential,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listAdvisingRecordsForStudent(
  tenantId: string,
  studentId: string,
  canViewConfidential: boolean
): Promise<AdvisingRecordDto[]> {
  const records = await prisma.advisingRecord.findMany({
    where: {
      tenantId,
      studentId,
      ...(canViewConfidential ? {} : { isConfidential: false }),
    },
    include: { advisor: true },
    orderBy: { date: "desc" },
  });

  return records.map((ar) => ({
    id: ar.id,
    tenantId: ar.tenantId,
    studentId: ar.studentId,
    advisorId: ar.advisorId,
    advisorNameTh: ar.advisor ? `${ar.advisor.firstNameTh} ${ar.advisor.lastNameTh}` : undefined,
    advisorNameEn: ar.advisor ? `${ar.advisor.firstNameEn} ${ar.advisor.lastNameEn}` : undefined,
    date: ar.date.toISOString(),
    topic: ar.topic,
    detail: ar.detail,
    actionPlan: ar.actionPlan,
    isConfidential: ar.isConfidential,
    createdAt: ar.createdAt.toISOString(),
    updatedAt: ar.updatedAt.toISOString(),
  }));
}

export async function createScholarship(
  tenantId: string,
  input: CreateScholarshipInput
): Promise<StudentScholarshipDto> {
  const created = await prisma.studentScholarship.create({
    data: {
      tenantId,
      studentId: input.studentId,
      scholarshipName: input.scholarshipName.trim(),
      academicYear: input.academicYear,
      amount: input.amount,
    },
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    studentId: created.studentId,
    scholarshipName: created.scholarshipName,
    academicYear: created.academicYear,
    amount: Number(created.amount),
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function importStudents(
  tenantId: string,
  input: ImportStudentsInput,
  actorId?: string
): Promise<{ created: number }> {
  let createdCount = 0;

  for (const item of input.items) {
    const existing = await prisma.student.findUnique({
      where: {
        tenantId_studentCode: {
          tenantId,
          studentCode: item.studentCode.trim(),
        },
      },
    });

    if (!existing) {
      await prisma.student.create({
        data: {
          tenantId,
          studentCode: item.studentCode.trim(),
          title: item.title.trim(),
          firstNameTh: item.firstNameTh.trim(),
          lastNameTh: item.lastNameTh.trim(),
          firstNameEn: item.firstNameEn.trim(),
          lastNameEn: item.lastNameEn.trim(),
          programId: input.programId,
          advisorId: input.advisorId || null,
          admissionYear: item.admissionYear,
          status: "STUDYING",
          gpa: item.gpa,
          email: item.email?.trim() || null,
          phone: item.phone?.trim() || null,
        },
      });
      createdCount++;
    }
  }

  if (actorId && createdCount > 0) {
    await writeAudit({
      tenantId,
      actorId,
      action: "student.batch_import",
      entity: "student",
      entityId: input.programId,
      after: {
        importedCount: createdCount,
        programId: input.programId,
      },
    });
  }

  return { created: createdCount };
}

export async function getStudentStats(
  tenantId: string,
  advisorId?: string
): Promise<{ total: number; advisees: number; probation: number; graduated: number }> {
  const total = await prisma.student.count({ where: { tenantId } });
  const probation = await prisma.student.count({
    where: {
      tenantId,
      status: "STUDYING",
      gpa: { lt: 2.0 },
    },
  });
  const graduated = await prisma.student.count({
    where: { tenantId, status: "GRADUATED" },
  });
  const advisees = advisorId
    ? await prisma.student.count({ where: { tenantId, advisorId } })
    : 0;

  return { total, advisees, probation, graduated };
}
