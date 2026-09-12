import { prisma } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import type {
  CreateDocumentInput,
  ApproveDocumentInput,
  RejectDocumentInput,
} from "./validations";

export interface DocumentDto {
  id: string;
  tenantId: string;
  documentNumber: string;
  title: string;
  category: string;
  urgency: string;
  confidentiality: string;
  senderName: string;
  recipientName: string;
  summary: string;
  attachmentUrl: string | null;
  status: string;
  departmentId: string | null;
  departmentNameTh?: string;
  departmentNameEn?: string;
  createdById: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  currentStep?: number;
  totalSteps?: number;
  currentApproverTitle?: string;
}

export interface DocumentApprovalDto {
  id: string;
  documentId: string;
  approverId: string;
  approverName?: string;
  approverEmail?: string;
  stepOrder: number;
  roleTitle: string;
  status: string;
  comment: string | null;
  signatureUrl: string | null;
  actedAt: string | null;
  createdAt: string;
}

export interface DocumentHistoryDto {
  id: string;
  documentId: string;
  actorId: string;
  actorName?: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface DocumentDetailDto extends DocumentDto {
  approvals: DocumentApprovalDto[];
  histories: DocumentHistoryDto[];
}

export interface DocumentMetricsDto {
  pendingCount: number;
  inProgressCount: number;
  approvedCount: number;
  totalCount: number;
}

/**
 * คำนวณปี พ.ศ. และเลขรันอัตโนมัติ
 */
export async function generateNextDocumentNumber(
  tenantId: string,
  category: string
): Promise<string> {
  const currentYearBE = new Date().getFullYear() + 543;
  const count = await prisma.document.count({
    where: { tenantId },
  });
  const seq = String(count + 1).padStart(4, "0");

  switch (category) {
    case "ORDER":
      return `คำสั่ง คณะ วจ. ที่ ${count + 1}/${currentYearBE}`;
    case "ANNOUNCEMENT":
      return `ประกาศ คณะ วจ. ที่ ${count + 1}/${currentYearBE}`;
    case "MEMO":
      return `ศธ 0514.01/ว${seq}`;
    case "REQUEST":
      return `ศธ 0514.02/ว${seq}`;
    case "CIRCULAR":
      return `ว ${seq}/${currentYearBE}`;
    default:
      return `เอกสาร วจ. ${seq}/${currentYearBE}`;
  }
}

/**
 * ดึงรายการเอกสารทั้งหมด
 */
export async function listDocuments(
  tenantId: string,
  filters?: {
    category?: string;
    urgency?: string;
    status?: string;
    search?: string;
  }
): Promise<DocumentDto[]> {
  const where: Record<string, unknown> = { tenantId };

  if (filters?.category && filters.category !== "ALL") {
    where.category = filters.category;
  }
  if (filters?.urgency && filters.urgency !== "ALL") {
    where.urgency = filters.urgency;
  }
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { documentNumber: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { senderName: { contains: q, mode: "insensitive" } },
      { recipientName: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.document.findMany({
    where,
    include: {
      department: { select: { nameTh: true, nameEn: true } },
      creator: { select: { name: true } },
      approvals: {
        select: { stepOrder: true, status: true, roleTitle: true },
        orderBy: { stepOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => {
    const currentApproval = r.approvals.find((a) => a.status === "PENDING") || r.approvals[r.approvals.length - 1];
    return {
      id: r.id,
      tenantId: r.tenantId,
      documentNumber: r.documentNumber,
      title: r.title,
      category: r.category,
      urgency: r.urgency,
      confidentiality: r.confidentiality,
      senderName: r.senderName,
      recipientName: r.recipientName,
      summary: r.summary,
      attachmentUrl: r.attachmentUrl,
      status: r.status,
      departmentId: r.departmentId,
      departmentNameTh: r.department?.nameTh,
      departmentNameEn: r.department?.nameEn,
      createdById: r.createdById,
      creatorName: r.creator.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      currentStep: currentApproval ? currentApproval.stepOrder : 1,
      totalSteps: r.approvals.length,
      currentApproverTitle: currentApproval ? currentApproval.roleTitle : undefined,
    };
  });
}

/**
 * แฟ้มเสนอเอกสารรอฉันอนุมัติ
 */
export async function listPendingMyApprovals(
  tenantId: string,
  userId: string
): Promise<DocumentDto[]> {
  const pendingApprovals = await prisma.documentApproval.findMany({
    where: {
      tenantId,
      approverId: userId,
      status: "PENDING",
      document: {
        status: { in: ["SUBMITTED", "IN_PROGRESS"] },
      },
    },
    include: {
      document: {
        include: {
          department: { select: { nameTh: true, nameEn: true } },
          creator: { select: { name: true } },
          approvals: {
            select: { stepOrder: true, status: true, roleTitle: true },
            orderBy: { stepOrder: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return pendingApprovals.map((pa) => {
    const r = pa.document;
    return {
      id: r.id,
      tenantId: r.tenantId,
      documentNumber: r.documentNumber,
      title: r.title,
      category: r.category,
      urgency: r.urgency,
      confidentiality: r.confidentiality,
      senderName: r.senderName,
      recipientName: r.recipientName,
      summary: r.summary,
      attachmentUrl: r.attachmentUrl,
      status: r.status,
      departmentId: r.departmentId,
      departmentNameTh: r.department?.nameTh,
      departmentNameEn: r.department?.nameEn,
      createdById: r.createdById,
      creatorName: r.creator.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      currentStep: pa.stepOrder,
      totalSteps: r.approvals.length,
      currentApproverTitle: pa.roleTitle,
    };
  });
}

/**
 * เอกสารที่ฉันเป็นผู้ยื่นเสนอ
 */
export async function listMySubmissions(
  tenantId: string,
  userId: string
): Promise<DocumentDto[]> {
  const rows = await prisma.document.findMany({
    where: { tenantId, createdById: userId },
    include: {
      department: { select: { nameTh: true, nameEn: true } },
      creator: { select: { name: true } },
      approvals: {
        select: { stepOrder: true, status: true, roleTitle: true },
        orderBy: { stepOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => {
    const currentApproval = r.approvals.find((a) => a.status === "PENDING") || r.approvals[r.approvals.length - 1];
    return {
      id: r.id,
      tenantId: r.tenantId,
      documentNumber: r.documentNumber,
      title: r.title,
      category: r.category,
      urgency: r.urgency,
      confidentiality: r.confidentiality,
      senderName: r.senderName,
      recipientName: r.recipientName,
      summary: r.summary,
      attachmentUrl: r.attachmentUrl,
      status: r.status,
      departmentId: r.departmentId,
      departmentNameTh: r.department?.nameTh,
      departmentNameEn: r.department?.nameEn,
      createdById: r.createdById,
      creatorName: r.creator.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      currentStep: currentApproval ? currentApproval.stepOrder : 1,
      totalSteps: r.approvals.length,
      currentApproverTitle: currentApproval ? currentApproval.roleTitle : undefined,
    };
  });
}

/**
 * รายละเอียดเอกสารเดี่ยว พร้อมสายการอนุมัติและประวัติไทม์ไลน์
 */
export async function getDocumentDetail(
  tenantId: string,
  id: string
): Promise<DocumentDetailDto> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      department: { select: { nameTh: true, nameEn: true } },
      creator: { select: { name: true } },
      approvals: {
        include: { approver: { select: { name: true, email: true } } },
        orderBy: { stepOrder: "asc" },
      },
      histories: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!doc || doc.tenantId !== tenantId) {
    throw errors.not_found();
  }

  const currentApproval = doc.approvals.find((a) => a.status === "PENDING") || doc.approvals[doc.approvals.length - 1];

  return {
    id: doc.id,
    tenantId: doc.tenantId,
    documentNumber: doc.documentNumber,
    title: doc.title,
    category: doc.category,
    urgency: doc.urgency,
    confidentiality: doc.confidentiality,
    senderName: doc.senderName,
    recipientName: doc.recipientName,
    summary: doc.summary,
    attachmentUrl: doc.attachmentUrl,
    status: doc.status,
    departmentId: doc.departmentId,
    departmentNameTh: doc.department?.nameTh,
    departmentNameEn: doc.department?.nameEn,
    createdById: doc.createdById,
    creatorName: doc.creator.name,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    currentStep: currentApproval ? currentApproval.stepOrder : 1,
    totalSteps: doc.approvals.length,
    currentApproverTitle: currentApproval ? currentApproval.roleTitle : undefined,
    approvals: doc.approvals.map((a) => ({
      id: a.id,
      documentId: a.documentId,
      approverId: a.approverId,
      approverName: a.approver.name,
      approverEmail: a.approver.email,
      stepOrder: a.stepOrder,
      roleTitle: a.roleTitle,
      status: a.status,
      comment: a.comment,
      signatureUrl: a.signatureUrl,
      actedAt: a.actedAt ? a.actedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    })),
    histories: doc.histories.map((h) => ({
      id: h.id,
      documentId: h.documentId,
      actorId: h.actorId,
      actorName: h.actor.name,
      action: h.action,
      description: h.description,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

/**
 * สถิติภาพรวมเอกสาร
 */
export async function getDocumentMetrics(
  tenantId: string,
  userId: string
): Promise<DocumentMetricsDto> {
  const [pendingCount, inProgressCount, approvedCount, totalCount] = await Promise.all([
    prisma.documentApproval.count({
      where: {
        tenantId,
        approverId: userId,
        status: "PENDING",
        document: { status: { in: ["SUBMITTED", "IN_PROGRESS"] } },
      },
    }),
    prisma.document.count({
      where: { tenantId, status: { in: ["SUBMITTED", "IN_PROGRESS"] } },
    }),
    prisma.document.count({
      where: { tenantId, status: "APPROVED" },
    }),
    prisma.document.count({
      where: { tenantId },
    }),
  ]);

  return {
    pendingCount,
    inProgressCount,
    approvedCount,
    totalCount,
  };
}

/**
 * สร้างและยื่นเสนอเอกสารใหม่
 */
export async function createDocument(
  tenantId: string,
  userId: string,
  input: CreateDocumentInput
): Promise<DocumentDetailDto> {
  let docNumber = input.documentNumber?.trim();
  if (!docNumber) {
    docNumber = await generateNextDocumentNumber(tenantId, input.category);
  }

  // Check duplicate
  const existing = await prisma.document.findUnique({
    where: {
      tenantId_documentNumber: { tenantId, documentNumber: docNumber },
    },
  });
  if (existing) {
    throw new Error(`เลขที่หนังสือ ${docNumber} มีอยู่ในระบบแล้ว`);
  }

  const created = await prisma.document.create({
    data: {
      tenantId,
      documentNumber: docNumber,
      title: input.title.trim(),
      category: input.category,
      urgency: input.urgency,
      confidentiality: input.confidentiality,
      senderName: input.senderName.trim(),
      recipientName: input.recipientName.trim(),
      summary: input.summary.trim(),
      attachmentUrl: input.attachmentUrl?.trim() || null,
      status: "IN_PROGRESS",
      departmentId: input.departmentId || null,
      createdById: userId,
      approvals: {
        create: input.approvers.map((step, idx) => ({
          tenantId,
          approverId: step.approverId,
          stepOrder: idx + 1,
          roleTitle: step.roleTitle.trim(),
          status: "PENDING",
        })),
      },
      histories: {
        create: {
          tenantId,
          actorId: userId,
          action: "SUBMITTED",
          description: `ยื่นเสนอเอกสาร ${docNumber}: "${input.title}" เข้าสู่สายการพิจารณา`,
        },
      },
    },
  });

  return getDocumentDetail(tenantId, created.id);
}

/**
 * พิจารณาลงนามอนุมัติเอกสาร
 */
export async function approveDocument(
  tenantId: string,
  userId: string,
  input: ApproveDocumentInput
): Promise<DocumentDetailDto> {
  const approval = await prisma.documentApproval.findUnique({
    where: { id: input.approvalId },
    include: { document: { include: { approvals: { orderBy: { stepOrder: "asc" } } } } },
  });

  if (!approval || approval.tenantId !== tenantId) {
    throw errors.not_found();
  }
  if (approval.approverId !== userId) {
    throw errors.forbidden();
  }
  if (approval.status !== "PENDING") {
    throw new Error("ขั้นตอนนี้ได้รับการพิจารณาไปแล้ว");
  }

  // Update current approval step
  await prisma.documentApproval.update({
    where: { id: input.approvalId },
    data: {
      status: "APPROVED",
      comment: input.comment?.trim() || null,
      signatureUrl: input.signatureUrl || null,
      actedAt: new Date(),
    },
  });

  // Check if all steps approved
  const allApprovals = approval.document.approvals;
  const isLastStep = approval.stepOrder === allApprovals.length;

  let newDocStatus = "IN_PROGRESS";
  if (isLastStep) {
    newDocStatus = "APPROVED";
  }

  await prisma.document.update({
    where: { id: approval.documentId },
    data: { status: newDocStatus },
  });

  // Log history
  await prisma.documentHistory.create({
    data: {
      tenantId,
      documentId: approval.documentId,
      actorId: userId,
      action: "APPROVED",
      description: `ผู้พิจารณาตำแหน่ง ${approval.roleTitle} ลงนามอนุมัติเอกสาร ${isLastStep ? "(อนุมัติสมบูรณ์)" : `(ส่งต่อไปยังขั้นตอนที่ ${approval.stepOrder + 1})`}${input.comment ? `: "${input.comment}"` : ""}`,
    },
  });

  return getDocumentDetail(tenantId, approval.documentId);
}

/**
 * ปฏิเสธเอกสาร
 */
export async function rejectDocument(
  tenantId: string,
  userId: string,
  input: RejectDocumentInput
): Promise<DocumentDetailDto> {
  const approval = await prisma.documentApproval.findUnique({
    where: { id: input.approvalId },
  });

  if (!approval || approval.tenantId !== tenantId) {
    throw errors.not_found();
  }
  if (approval.approverId !== userId) {
    throw errors.forbidden();
  }
  if (approval.status !== "PENDING") {
    throw new Error("ขั้นตอนนี้ได้รับการพิจารณาไปแล้ว");
  }

  await prisma.documentApproval.update({
    where: { id: input.approvalId },
    data: {
      status: "REJECTED",
      comment: input.comment.trim(),
      actedAt: new Date(),
    },
  });

  await prisma.document.update({
    where: { id: approval.documentId },
    data: { status: "REJECTED" },
  });

  await prisma.documentHistory.create({
    data: {
      tenantId,
      documentId: approval.documentId,
      actorId: userId,
      action: "REJECTED",
      description: `ผู้พิจารณาตำแหน่ง ${approval.roleTitle} ปฏิเสธการอนุมัติ: "${input.comment.trim()}"`,
    },
  });

  return getDocumentDetail(tenantId, approval.documentId);
}

export interface ApproverOptionDto {
  id: string;
  name: string;
  email: string;
  departmentNameTh?: string;
}

export async function listEligibleApprovers(tenantId: string): Promise<ApproverOptionDto[]> {
  const users = await prisma.user.findMany({
    where: {
      userTenants: { some: { tenantId } },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      personnelProfiles: {
        where: { tenantId },
        select: { department: { select: { nameTh: true } } },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    departmentNameTh: u.personnelProfiles[0]?.department?.nameTh,
  }));
}
