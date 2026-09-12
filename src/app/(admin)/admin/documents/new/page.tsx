import { requirePermission } from "@/features/identity/server";
import {
  DOCUMENT_P,
  listEligibleApprovers,
  generateNextDocumentNumber,
} from "@/features/documents/server";
import { listDepartments } from "@/features/personnel/server";
import { CreateDocumentClient } from "./_components/create-document-client";

export default async function NewDocumentPage() {
  const ctx = await requirePermission(DOCUMENT_P.documentCreate);

  const [departments, approvers, defaultDocNumber] = await Promise.all([
    listDepartments(ctx.tenantId),
    listEligibleApprovers(ctx.tenantId),
    generateNextDocumentNumber(ctx.tenantId, "MEMO"),
  ]);

  return (
    <CreateDocumentClient
      departments={departments}
      approvers={approvers}
      defaultDocNumber={defaultDocNumber}
      currentUserName={ctx.userName || "เจ้าหน้าที่"}
    />
  );
}
