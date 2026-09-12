"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission, hasPermission } from "@/features/identity/server";
import { STUDENT_P } from "../permissions";
import {
  createStudentSchema,
  updateStudentSchema,
  batchAssignAdvisorSchema,
  createAdvisingRecordSchema,
  createScholarshipSchema,
  importStudentsSchema,
} from "./validations";
import {
  listStudents,
  listMyAdvisees,
  getStudentById,
  verifyStudentByCode,
  createStudent,
  updateStudent,
  deleteStudent,
  batchAssignAdvisor,
  createAdvisingRecord,
  createScholarship,
  importStudents,
  getStudentStats,
  type StudentDto,
  type AdvisingRecordDto,
  type StudentScholarshipDto,
  type PublicStudentVerificationDto,
} from "./services";

export async function getStudentsAction(filter?: {
  programId?: string;
  status?: string;
  admissionYear?: number;
  search?: string;
  advisorId?: string;
}): Promise<ActionResult<StudentDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentRead);
    return listStudents(ctx.tenantId, filter);
  });
}

export async function getMyAdviseesAction(advisorId: string): Promise<ActionResult<StudentDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentAdviseesRead);
    return listMyAdvisees(ctx.tenantId, advisorId);
  });
}

export async function getStudentDetailAction(
  id: string,
  userPersonnelId?: string
): Promise<
  ActionResult<
    (StudentDto & {
      advisingRecords: AdvisingRecordDto[];
      scholarships: StudentScholarshipDto[];
    }) | null
  >
> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentRead);
    const hasConfidentialPerm = hasPermission(ctx, STUDENT_P.studentConfidentialRead);
    // Student detail can be viewed by anyone with read, but confidential records only by advisor or authorized users
    const student = await getStudentById(ctx.tenantId, id, false);
    const isPrimaryAdvisor = userPersonnelId && student?.advisorId === userPersonnelId;
    const canViewConfidential = hasConfidentialPerm || !!isPrimaryAdvisor;

    return getStudentById(ctx.tenantId, id, canViewConfidential);
  });
}

export async function createStudentAction(input: unknown): Promise<ActionResult<StudentDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentManage);
    const locale = await getLocale();
    const parsed = createStudentSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await createStudent(ctx.tenantId, parsed, ctx.userId);
    revalidatePath("/admin/students");
    return result;
  });
}

export async function updateStudentAction(input: unknown): Promise<ActionResult<StudentDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentManage);
    const locale = await getLocale();
    const parsed = updateStudentSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await updateStudent(ctx.tenantId, parsed, ctx.userId);
    revalidatePath("/admin/students");
    return result;
  });
}

export async function deleteStudentAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentManage);
    await deleteStudent(ctx.tenantId, id, ctx.userId);
    revalidatePath("/admin/students");
  });
}

export async function batchAssignAdvisorAction(input: unknown): Promise<ActionResult<{ count: number }>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentBatchAssign);
    const locale = await getLocale();
    const parsed = batchAssignAdvisorSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await batchAssignAdvisor(ctx.tenantId, parsed, ctx.userId);
    revalidatePath("/admin/students");
    return result;
  });
}

export async function createAdvisingRecordAction(input: unknown): Promise<ActionResult<AdvisingRecordDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentAdvisingLog);
    const locale = await getLocale();
    const parsed = createAdvisingRecordSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await createAdvisingRecord(ctx.tenantId, parsed, ctx.userId);
    revalidatePath("/admin/students");
    return result;
  });
}

export async function createScholarshipAction(input: unknown): Promise<ActionResult<StudentScholarshipDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentScholarshipManage);
    const locale = await getLocale();
    const parsed = createScholarshipSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await createScholarship(ctx.tenantId, parsed);
    revalidatePath("/admin/students");
    return result;
  });
}

export async function importStudentsAction(input: unknown): Promise<ActionResult<{ created: number }>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentManage);
    const locale = await getLocale();
    const parsed = importStudentsSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await importStudents(ctx.tenantId, parsed, ctx.userId);
    revalidatePath("/admin/students");
    return result;
  });
}

export async function verifyStudentPublicAction(
  studentCode: string,
  tenantId: string
): Promise<ActionResult<PublicStudentVerificationDto | null>> {
  return runAction(async () => {
    if (!studentCode || studentCode.trim().length === 0) {
      return null;
    }
    return verifyStudentByCode(tenantId, studentCode.trim());
  });
}

export async function getStudentStatsAction(advisorId?: string): Promise<ActionResult<{ total: number; advisees: number; probation: number; graduated: number }>> {
  return runAction(async () => {
    const ctx = await requirePermission(STUDENT_P.studentRead);
    return getStudentStats(ctx.tenantId, advisorId);
  });
}
