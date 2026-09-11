"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "../permissions";
import { createProgramSchema, updateProgramSchema } from "./validations";
import {
  createProgram,
  updateProgram,
  deleteProgram,
  listPrograms,
  type ProgramDto,
} from "./services";

export async function getProgramsAction(): Promise<ActionResult<ProgramDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    return listPrograms(ctx.tenantId);
  });
}

export async function createProgramAction(input: unknown): Promise<ActionResult<ProgramDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumCreate);
    const parsed = createProgramSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createProgram(ctx.tenantId, parsed);
    revalidatePath("/programs");
    revalidatePath("/");
    return result;
  });
}

export async function updateProgramAction(input: unknown): Promise<ActionResult<ProgramDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumUpdate);
    const parsed = updateProgramSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateProgram(ctx.tenantId, parsed);
    revalidatePath("/programs");
    revalidatePath("/");
    return result;
  });
}

export async function deleteProgramAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumDelete);
    await deleteProgram(ctx.tenantId, id);
    revalidatePath("/programs");
    revalidatePath("/");
  });
}

export async function listTeachingAssignmentsAction(filters?: {
  programId?: string;
  academicYear?: number;
  semester?: number;
  personnelId?: string;
}) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    const { listTeachingAssignments } = await import("./services/teaching-assignment.service");
    return listTeachingAssignments(ctx.tenantId, filters);
  });
}

export async function assignInstructorAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumUpdate);
    const { assignInstructorSchema } = await import("./validations");
    const { assignInstructor } = await import("./services/teaching-assignment.service");
    const parsed = assignInstructorSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await assignInstructor(ctx.tenantId, parsed);
    if (parsed.programId) {
      revalidatePath(`/admin/programs/${parsed.programId}/teaching`);
      revalidatePath(`/admin/programs/${parsed.programId}/report`);
    }
    revalidatePath("/admin/programs");
    return result;
  });
}

export async function removeTeachingAssignmentAction(id: string, programId?: string) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumUpdate);
    const { removeTeachingAssignment } = await import("./services/teaching-assignment.service");
    await removeTeachingAssignment(ctx.tenantId, id);
    if (programId) {
      revalidatePath(`/admin/programs/${programId}/teaching`);
      revalidatePath(`/admin/programs/${programId}/report`);
    }
    revalidatePath("/admin/programs");
  });
}

export async function getProgramTeachingDossierAction(
  programId: string,
  academicYear: number = 2569,
  semester: number = 1
) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    const { getProgramTeachingDossier } = await import("./services/teaching-assignment.service");
    return getProgramTeachingDossier(ctx.tenantId, programId, academicYear, semester);
  });
}

export async function listClassSchedulesAction(filters?: {
  programId?: string;
  academicYear?: number;
  semester?: number;
  yearLevel?: number;
  personnelId?: string;
  dayOfWeek?: number;
  room?: string;
}) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    const { listClassSchedules } = await import("./services/timetable.service");
    return listClassSchedules(ctx.tenantId, filters);
  });
}

export async function checkScheduleConflictAction(input: {
  id?: string;
  personnelId: string;
  room: string;
  programId: string;
  yearLevel: number;
  section: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  academicYear: number;
  semester: number;
}) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    const { checkScheduleConflict } = await import("./services/timetable.service");
    return checkScheduleConflict(ctx.tenantId, input);
  });
}

export async function createClassScheduleAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumUpdate);
    const { createScheduleSchema } = await import("./validations");
    const { createClassSchedule } = await import("./services/timetable.service");
    const parsed = createScheduleSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createClassSchedule(ctx.tenantId, parsed);
    revalidatePath(`/admin/programs/${parsed.programId}/schedule`);
    revalidatePath(`/admin/programs/${parsed.programId}/schedule/report`);
    revalidatePath("/admin/programs");
    return result;
  });
}

export async function updateClassScheduleAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumUpdate);
    const { updateScheduleSchema } = await import("./validations");
    const { updateClassSchedule } = await import("./services/timetable.service");
    const parsed = updateScheduleSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateClassSchedule(ctx.tenantId, parsed);
    revalidatePath(`/admin/programs/${parsed.programId}/schedule`);
    revalidatePath(`/admin/programs/${parsed.programId}/schedule/report`);
    revalidatePath("/admin/programs");
    return result;
  });
}

export async function deleteClassScheduleAction(id: string, programId?: string) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumUpdate);
    const { deleteClassSchedule } = await import("./services/timetable.service");
    await deleteClassSchedule(ctx.tenantId, id);
    if (programId) {
      revalidatePath(`/admin/programs/${programId}/schedule`);
      revalidatePath(`/admin/programs/${programId}/schedule/report`);
    }
    revalidatePath("/admin/programs");
  });
}

export async function getProgramTimetableDossierAction(
  programId: string,
  academicYear: number = 2569,
  semester: number = 1,
  yearLevel?: number
) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    const { getProgramTimetableDossier } = await import("./services/timetable.service");
    return getProgramTimetableDossier(ctx.tenantId, programId, academicYear, semester, yearLevel);
  });
}


