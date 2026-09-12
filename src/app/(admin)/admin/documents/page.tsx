import { requirePermission, hasPermission } from "@/features/identity/server";
import {
  DOCUMENT_P,
  listDocuments,
  listPendingMyApprovals,
  listMySubmissions,
  getDocumentMetrics,
} from "@/features/documents/server";
import { listDepartments } from "@/features/personnel/server";
import { DocumentsAdminClient } from "./_components/documents-admin-client";

export default async function DocumentsAdminPage() {
  const ctx = await requirePermission(DOCUMENT_P.documentRead);

  const [allDocs, pendingDocs, myDocs, metrics, departments] = await Promise.all([
    listDocuments(ctx.tenantId),
    listPendingMyApprovals(ctx.tenantId, ctx.userId),
    listMySubmissions(ctx.tenantId, ctx.userId),
    getDocumentMetrics(ctx.tenantId, ctx.userId),
    listDepartments(ctx.tenantId),
  ]);

  return (
    <DocumentsAdminClient
      initialAllDocs={allDocs}
      initialPendingDocs={pendingDocs}
      initialMyDocs={myDocs}
      initialMetrics={metrics}
      departments={departments}
      currentUserId={ctx.userId}
      canCreate={hasPermission(ctx, DOCUMENT_P.documentCreate)}
      canApprove={hasPermission(ctx, DOCUMENT_P.documentApprove)}
      canManage={hasPermission(ctx, DOCUMENT_P.documentManage)}
    />
  );
}
