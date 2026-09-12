import "server-only";

export {
  listDocuments,
  listPendingMyApprovals,
  listMySubmissions,
  getDocumentDetail,
  getDocumentMetrics,
  generateNextDocumentNumber,
  createDocument,
  approveDocument,
  rejectDocument,
  listEligibleApprovers,
  type DocumentDto,
  type DocumentApprovalDto,
  type DocumentHistoryDto,
  type DocumentDetailDto,
  type DocumentMetricsDto,
  type ApproverOptionDto,
} from "./_internal/services";
export { DOCUMENT_P, DOCUMENT_PERMISSIONS } from "./permissions";
