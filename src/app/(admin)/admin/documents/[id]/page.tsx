import { notFound } from "next/navigation";
import { requirePermission, hasPermission } from "@/features/identity/server";
import {
  DOCUMENT_P,
  getDocumentDetail,
  type DocumentDetailDto,
} from "@/features/documents/server";
import { DocumentDetailClient } from "./_components/document-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await requirePermission(DOCUMENT_P.documentRead);

  let document: DocumentDetailDto | null = null;
  try {
    document = await getDocumentDetail(ctx.tenantId, id);
  } catch {
    notFound();
  }

  if (!document) {
    notFound();
  }

  return (
    <DocumentDetailClient
      initialDoc={document}
      currentUserId={ctx.userId}
      canApprove={hasPermission(ctx, DOCUMENT_P.documentApprove)}
      canManage={hasPermission(ctx, DOCUMENT_P.documentManage)}
    />
  );
}
