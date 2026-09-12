import type { PermissionDef } from "@/shared/lib/permission-def";

export const DOCUMENT_P = {
  documentRead: "document:read",
  documentCreate: "document:create",
  documentApprove: "document:approve",
  documentManage: "document:manage",
} as const;

export const DOCUMENT_PERMISSIONS: readonly PermissionDef[] = [
  { code: DOCUMENT_P.documentRead, module: "document", action: "read" },
  { code: DOCUMENT_P.documentCreate, module: "document", action: "create" },
  { code: DOCUMENT_P.documentApprove, module: "document", action: "approve" },
  { code: DOCUMENT_P.documentManage, module: "document", action: "manage" },
];
