import { z } from "zod";

export const documentCategoryEnum = z.enum([
  "MEMO",
  "ORDER",
  "ANNOUNCEMENT",
  "CIRCULAR",
  "REQUEST",
  "GENERAL",
]);

export const documentUrgencyEnum = z.enum([
  "NORMAL",
  "URGENT",
  "VERY_URGENT",
  "MOST_URGENT",
]);

export const documentConfidentialityEnum = z.enum([
  "NORMAL",
  "CONFIDENTIAL",
  "TOP_SECRET",
]);

export const documentStatusEnum = z.enum([
  "DRAFT",
  "SUBMITTED",
  "IN_PROGRESS",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const approverStepInputSchema = z.object({
  approverId: z.string().uuid("กรุณาเลือกผู้พิจารณาให้ถูกต้อง"),
  roleTitle: z.string().min(1, "กรุณาระบุตำแหน่งผู้พิจารณา").max(150),
  stepOrder: z.coerce.number().min(1),
});

export const createDocumentSchema = z.object({
  documentNumber: z.string().max(100).optional().nullable(),
  title: z.string().min(1, "กรุณากรอกชื่อเรื่อง").max(255),
  category: documentCategoryEnum.default("GENERAL"),
  urgency: documentUrgencyEnum.default("NORMAL"),
  confidentiality: documentConfidentialityEnum.default("NORMAL"),
  senderName: z.string().min(1, "กรุณาระบุชื่อผู้เสนอ/จาก").max(255),
  recipientName: z.string().min(1, "กรุณาระบุชื่อผู้รับ/เรียน").max(255),
  summary: z.string().min(1, "กรุณากรอกสาระสำคัญของเอกสาร"),
  attachmentUrl: z.string().optional().nullable().or(z.literal("")),
  departmentId: z.string().uuid().optional().nullable(),
  approvers: z.array(approverStepInputSchema).min(1, "กรุณากำหนดผู้พิจารณาอย่างน้อย 1 ท่าน"),
});

export const approveDocumentSchema = z.object({
  documentId: z.string().uuid(),
  approvalId: z.string().uuid(),
  comment: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable(),
});

export const rejectDocumentSchema = z.object({
  documentId: z.string().uuid(),
  approvalId: z.string().uuid(),
  comment: z.string().min(1, "กรุณาระบุเหตุผลหรือข้อสั่งการที่ไม่อนุมัติ"),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type ApproverStepInput = z.infer<typeof approverStepInputSchema>;
export type ApproveDocumentInput = z.infer<typeof approveDocumentSchema>;
export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>;
