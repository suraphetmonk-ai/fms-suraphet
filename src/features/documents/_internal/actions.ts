"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { DOCUMENT_P } from "../permissions";
import {
  createDocumentSchema,
  approveDocumentSchema,
  rejectDocumentSchema,
} from "./validations";
import {
  listDocuments,
  listPendingMyApprovals,
  listMySubmissions,
  getDocumentDetail,
  getDocumentMetrics,
  createDocument,
  approveDocument,
  rejectDocument,
  generateNextDocumentNumber,
  type DocumentDto,
  type DocumentDetailDto,
  type DocumentMetricsDto,
} from "./services";

export async function getDocumentsAction(filters?: {
  category?: string;
  urgency?: string;
  status?: string;
  search?: string;
}): Promise<ActionResult<DocumentDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentRead);
    return listDocuments(ctx.tenantId, filters);
  });
}

export async function getPendingMyApprovalsAction(): Promise<ActionResult<DocumentDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentRead);
    return listPendingMyApprovals(ctx.tenantId, ctx.userId);
  });
}

export async function getMySubmissionsAction(): Promise<ActionResult<DocumentDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentRead);
    return listMySubmissions(ctx.tenantId, ctx.userId);
  });
}

export async function getDocumentDetailAction(id: string): Promise<ActionResult<DocumentDetailDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentRead);
    return getDocumentDetail(ctx.tenantId, id);
  });
}

export async function getDocumentMetricsAction(): Promise<ActionResult<DocumentMetricsDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentRead);
    return getDocumentMetrics(ctx.tenantId, ctx.userId);
  });
}

export async function generateNextNumberAction(category: string): Promise<ActionResult<string>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentCreate);
    return generateNextDocumentNumber(ctx.tenantId, category);
  });
}

export async function createDocumentAction(input: unknown): Promise<ActionResult<DocumentDetailDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentCreate);
    const locale = await getLocale();
    const parsed = createDocumentSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await createDocument(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/documents");
    return result;
  });
}

export async function approveDocumentAction(input: unknown): Promise<ActionResult<DocumentDetailDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentApprove);
    const locale = await getLocale();
    const parsed = approveDocumentSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await approveDocument(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/${parsed.documentId}`);
    return result;
  });
}

export async function rejectDocumentAction(input: unknown): Promise<ActionResult<DocumentDetailDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENT_P.documentApprove);
    const locale = await getLocale();
    const parsed = rejectDocumentSchema.parse(input, { error: zodErrorMap(locale) });
    const result = await rejectDocument(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/${parsed.documentId}`);
    return result;
  });
}
