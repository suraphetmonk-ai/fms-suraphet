"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { PERSONNEL_P } from "../permissions";
import {
  createPersonnelSchema,
  updatePersonnelSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./validations";
import {
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  listPersonnel,
  listDepartments,
  listDepartmentsWithDetails,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  revealCitizenId,
  type PersonnelDto,
  type DepartmentDto,
} from "./services";

export async function getPersonnelListAction(): Promise<ActionResult<PersonnelDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelRead);
    return listPersonnel(ctx.tenantId);
  });
}

export async function getDepartmentsAction(): Promise<ActionResult<DepartmentDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelRead);
    return listDepartments(ctx.tenantId);
  });
}

export async function createPersonnelAction(input: unknown): Promise<ActionResult<PersonnelDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    const parsed = createPersonnelSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createPersonnel(ctx.tenantId, parsed);
    revalidatePath("/personnel");
    revalidatePath("/");
    return result;
  });
}

export async function updatePersonnelAction(input: unknown): Promise<ActionResult<PersonnelDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    const parsed = updatePersonnelSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updatePersonnel(ctx.tenantId, parsed);
    revalidatePath("/personnel");
    revalidatePath("/");
    return result;
  });
}

export async function deletePersonnelAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    await deletePersonnel(ctx.tenantId, id);
    revalidatePath("/personnel");
    revalidatePath("/");
  });
}

export async function revealCitizenIdAction(id: string): Promise<ActionResult<string>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    return revealCitizenId(ctx.tenantId, id, ctx.userId);
  });
}

export async function getDepartmentsWithDetailsAction(): Promise<ActionResult<DepartmentDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelRead);
    return listDepartmentsWithDetails(ctx.tenantId);
  });
}

export async function createDepartmentAction(input: unknown): Promise<ActionResult<DepartmentDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    const locale = await getLocale();
    const parsed = createDepartmentSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await createDepartment(ctx.tenantId, parsed);
    revalidatePath("/admin/departments");
    revalidatePath("/admin/programs");
    revalidatePath("/admin/personnel");
    return result;
  });
}

export async function updateDepartmentAction(input: unknown): Promise<ActionResult<DepartmentDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    const locale = await getLocale();
    const parsed = updateDepartmentSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await updateDepartment(ctx.tenantId, parsed);
    revalidatePath("/admin/departments");
    revalidatePath("/admin/programs");
    revalidatePath("/admin/personnel");
    return result;
  });
}

export async function deleteDepartmentAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    await deleteDepartment(ctx.tenantId, id);
    revalidatePath("/admin/departments");
    revalidatePath("/admin/programs");
    revalidatePath("/admin/personnel");
  });
}

