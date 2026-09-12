"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderCheck,
  Send,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonField,
} from "@/shared/components/liyon";
import type {
  DocumentDto,
  DocumentMetricsDto,
} from "@/features/documents";
import type { DepartmentDto } from "@/features/personnel";
import {
  getDocumentsAction,
  getPendingMyApprovalsAction,
  getMySubmissionsAction,
  getDocumentMetricsAction,
  approveDocumentAction,
  rejectDocumentAction,
} from "@/features/documents/actions";

interface Props {
  initialAllDocs: DocumentDto[];
  initialPendingDocs: DocumentDto[];
  initialMyDocs: DocumentDto[];
  initialMetrics: DocumentMetricsDto;
  departments: DepartmentDto[];
  currentUserId: string;
  canCreate: boolean;
  canApprove: boolean;
  canManage: boolean;
}

export function DocumentsAdminClient({
  initialAllDocs,
  initialPendingDocs,
  initialMyDocs,
  initialMetrics,
  canCreate,
  canApprove,
}: Props) {
  const t = useT();
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<"pending" | "all" | "my">(
    initialPendingDocs.length > 0 ? "pending" : "all"
  );
  const [allDocs, setAllDocs] = useState<DocumentDto[]>(initialAllDocs);
  const [pendingDocs, setPendingDocs] = useState<DocumentDto[]>(initialPendingDocs);
  const [myDocs, setMyDocs] = useState<DocumentDto[]>(initialMyDocs);
  const [metrics, setMetrics] = useState<DocumentMetricsDto>(initialMetrics);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isPending, startTransition] = useTransition();

  // Quick Action Modal states
  const [approveTarget, setApproveTarget] = useState<DocumentDto | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DocumentDto | null>(null);
  const [actionComment, setActionComment] = useState("");

  const refresh = async () => {
    const [dRes, pRes, mRes, mtRes] = await Promise.all([
      getDocumentsAction(),
      getPendingMyApprovalsAction(),
      getMySubmissionsAction(),
      getDocumentMetricsAction(),
    ]);
    if (dRes.ok) setAllDocs(dRes.data);
    if (pRes.ok) setPendingDocs(pRes.data);
    if (mRes.ok) setMyDocs(mRes.data);
    if (mtRes.ok) setMetrics(mtRes.data);
  };

  const handleApprove = async () => {
    if (!approveTarget) return;

    // Fetch the document detail to find the active pending approval ID
    startTransition(async () => {
      try {
        const res = await approveDocumentAction({
          documentId: approveTarget.id,
          approvalId: approveTarget.id,
          comment: actionComment.trim(),
        });

        if (res.ok) {
          toast.success(t("documents.approveSuccess"));
          setApproveTarget(null);
          setActionComment("");
          await refresh();
        } else {
          toast.error(res.error.message || "เกิดข้อผิดพลาดในการอนุมัติเอกสาร");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    });
  };

  const handleReject = async () => {
    if (!rejectTarget || !actionComment.trim()) {
      toast.error("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      return;
    }

    startTransition(async () => {
      try {
        const res = await rejectDocumentAction({
          documentId: rejectTarget.id,
          approvalId: rejectTarget.id,
          comment: actionComment.trim(),
        });

        if (res.ok) {
          toast.success(t("documents.rejectSuccess"));
          setRejectTarget(null);
          setActionComment("");
          await refresh();
        } else {
          toast.error(res.error.message || "เกิดข้อผิดพลาดในการปฏิเสธเอกสาร");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    });
  };

  // Filtered lists
  const filterList = (list: DocumentDto[]) => {
    return list.filter((doc) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        doc.documentNumber.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        doc.senderName.toLowerCase().includes(q) ||
        doc.recipientName.toLowerCase().includes(q);

      const matchCat = categoryFilter === "ALL" || doc.category === categoryFilter;
      const matchUrg = urgencyFilter === "ALL" || doc.urgency === urgencyFilter;
      const matchStat = statusFilter === "ALL" || doc.status === statusFilter;

      return matchSearch && matchCat && matchUrg && matchStat;
    });
  };

  const displayedDocs =
    activeTab === "pending"
      ? filterList(pendingDocs)
      : activeTab === "my"
      ? filterList(myDocs)
      : filterList(allDocs);

  // Helper labels
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "MEMO":
        return t("documents.category.memo");
      case "ORDER":
        return t("documents.category.order");
      case "ANNOUNCEMENT":
        return t("documents.category.announcement");
      case "CIRCULAR":
        return t("documents.category.circular");
      case "REQUEST":
        return t("documents.category.request");
      default:
        return t("documents.category.general");
    }
  };

  const getUrgencyBadge = (urg: string) => {
    switch (urg) {
      case "MOST_URGENT":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-3 w-3" />
            {t("documents.urgency.mostUrgent")}
          </span>
        );
      case "VERY_URGENT":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-400">
            {t("documents.urgency.veryUrgent")}
          </span>
        );
      case "URGENT":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            {t("documents.urgency.urgent")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t("documents.urgency.normal")}
          </span>
        );
    }
  };

  const getStatusTone = (status: string): "ok" | "warn" | "bad" | "info" | "off" => {
    switch (status) {
      case "APPROVED":
        return "ok";
      case "IN_PROGRESS":
      case "SUBMITTED":
        return "warn";
      case "REJECTED":
        return "bad";
      default:
        return "off";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return t("documents.status.approved");
      case "IN_PROGRESS":
        return t("documents.status.inProgress");
      case "SUBMITTED":
        return t("documents.status.submitted");
      case "REJECTED":
        return t("documents.status.rejected");
      default:
        return t("documents.status.draft");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-primary" />
            {t("documents.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("documents.subtitle")}
          </p>
        </div>

        {canCreate && (
          <Link href="/admin/documents/new">
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              {t("documents.create")}
            </Button>
          </Link>
        )}
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          role="button"
          tabIndex={0}
          className="text-left"
          onClick={() => setActiveTab("pending")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("pending")}
        >
          <LiyonCard
            className={`p-4 cursor-pointer transition-all hover:border-primary/50 h-full ${
              activeTab === "pending" ? "ring-2 ring-primary bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
              {metrics.pendingCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white animate-pulse">
                  ด่วน
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">{metrics.pendingCount}</div>
              <div className="text-xs text-muted-foreground">{t("documents.metric.pending")}</div>
            </div>
          </LiyonCard>
        </div>

        <div
          role="button"
          tabIndex={0}
          className="text-left"
          onClick={() => setActiveTab("all")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("all")}
        >
          <LiyonCard
            className={`p-4 cursor-pointer transition-all hover:border-primary/50 h-full ${
              activeTab === "all" ? "ring-2 ring-primary bg-primary/5" : ""
            }`}
          >
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400 w-fit">
              <Send className="h-6 w-6" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">{metrics.inProgressCount}</div>
              <div className="text-xs text-muted-foreground">{t("documents.metric.inProgress")}</div>
            </div>
          </LiyonCard>
        </div>

        <LiyonCard className="p-4 h-full">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400 w-fit">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">{metrics.approvedCount}</div>
            <div className="text-xs text-muted-foreground">{t("documents.metric.approved")}</div>
          </div>
        </LiyonCard>

        <div
          role="button"
          tabIndex={0}
          className="text-left"
          onClick={() => setActiveTab("my")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("my")}
        >
          <LiyonCard
            className={`p-4 cursor-pointer transition-all hover:border-primary/50 h-full ${
              activeTab === "my" ? "ring-2 ring-primary bg-primary/5" : ""
            }`}
          >
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400 w-fit">
              <FolderCheck className="h-6 w-6" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">{allDocs.length}</div>
              <div className="text-xs text-muted-foreground">{t("documents.metric.total")}</div>
            </div>
          </LiyonCard>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-border">
        <div className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-4 w-4" />
            {t("documents.tab.pending")}
            {pendingDocs.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-xs font-bold text-amber-700 dark:text-amber-400">
                {pendingDocs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            {t("documents.tab.all")}
            <span className="rounded-full bg-muted px-2 py-0.2 text-xs text-muted-foreground">
              {allDocs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "my"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderCheck className="h-4 w-4" />
            {t("documents.tab.mySubmissions")}
            <span className="rounded-full bg-muted px-2 py-0.2 text-xs text-muted-foreground">
              {myDocs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <LiyonCard className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาตามเลขที่หนังสือ, ชื่อเรื่อง, ผู้เสนอ หรือผู้รับ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกประเภทเอกสาร --</option>
              <option value="MEMO">{t("documents.category.memo")}</option>
              <option value="ORDER">{t("documents.category.order")}</option>
              <option value="ANNOUNCEMENT">{t("documents.category.announcement")}</option>
              <option value="CIRCULAR">{t("documents.category.circular")}</option>
              <option value="REQUEST">{t("documents.category.request")}</option>
              <option value="GENERAL">{t("documents.category.general")}</option>
            </select>
          </div>

          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกระดับความเร่งด่วน --</option>
              <option value="NORMAL">{t("documents.urgency.normal")}</option>
              <option value="URGENT">{t("documents.urgency.urgent")}</option>
              <option value="VERY_URGENT">{t("documents.urgency.veryUrgent")}</option>
              <option value="MOST_URGENT">{t("documents.urgency.mostUrgent")}</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกสถานะ --</option>
              <option value="IN_PROGRESS">{t("documents.status.inProgress")}</option>
              <option value="APPROVED">{t("documents.status.approved")}</option>
              <option value="REJECTED">{t("documents.status.rejected")}</option>
              <option value="DRAFT">{t("documents.status.draft")}</option>
            </select>
          </div>
        </div>
      </LiyonCard>

      {/* Documents List / Table */}
      {displayedDocs.length === 0 ? (
        <LiyonCard className="p-12 text-center text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-base font-medium">
            {activeTab === "pending" ? t("documents.noPending") : t("documents.empty")}
          </p>
        </LiyonCard>
      ) : (
        <div className="space-y-4">
          {displayedDocs.map((doc) => (
            <LiyonCard
              key={doc.id}
              className={`p-5 transition-all hover:shadow-md border-l-4 ${
                doc.urgency === "MOST_URGENT"
                  ? "border-l-rose-500"
                  : doc.urgency === "VERY_URGENT"
                  ? "border-l-orange-500"
                  : doc.urgency === "URGENT"
                  ? "border-l-amber-500"
                  : "border-l-blue-500"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Document Information */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      {doc.documentNumber}
                    </span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-medium">
                      {getCategoryLabel(doc.category)}
                    </span>
                    {getUrgencyBadge(doc.urgency)}
                    <StatusPill tone={getStatusTone(doc.status)}>
                      {getStatusLabel(doc.status)}
                    </StatusPill>
                  </div>

                  <h2 className="text-base font-bold text-foreground hover:text-primary transition-colors">
                    <Link href={`/admin/documents/${doc.id}`} className="hover:underline">
                      {doc.title}
                    </Link>
                  </h2>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {doc.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span>
                      <strong>จาก:</strong> {doc.senderName}
                    </span>
                    <span>
                      <strong>เรียน:</strong> {doc.recipientName}
                    </span>
                    {doc.departmentNameTh && (
                      <span>
                        <strong>สังกัด:</strong>{" "}
                        {locale === "en" ? doc.departmentNameEn : doc.departmentNameTh}
                      </span>
                    )}
                    {doc.currentApproverTitle && (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <UserCheck className="h-3.5 w-3.5" />
                        รอพิจารณา: {doc.currentApproverTitle} (ขั้นที่ {doc.currentStep}/{doc.totalSteps})
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  {doc.attachmentUrl && (
                    <a
                      href={doc.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-xs flex items-center gap-1"
                      title="เปิดไฟล์แนบ PDF"
                    >
                      <ExternalLink className="h-4 w-4" />
                      PDF
                    </a>
                  )}

                  <Link href={`/admin/documents/${doc.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      {t("documents.view")}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>

                  {activeTab === "pending" && canApprove && (
                    <Link href={`/admin/documents/${doc.id}`}>
                      <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("documents.approve")}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </LiyonCard>
          ))}
        </div>
      )}

      {/* Quick Approve Dialog */}
      <LiyonDialog
        open={approveTarget !== null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <LiyonDialogHeader
          title={t("documents.approve")}
          description={approveTarget ? `พิจารณาอนุมัติ/ลงนาม: ${approveTarget.documentNumber}` : undefined}
        />
        <LiyonDialogBody className="space-y-4 py-4">
          {approveTarget && (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
              <div><strong>เรื่อง:</strong> {approveTarget.title}</div>
              <div><strong>จาก:</strong> {approveTarget.senderName}</div>
            </div>
          )}
          <LiyonField label={t("documents.comment")}>
            <textarea
              rows={3}
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder="ระบุข้อคิดเห็นหรือข้อสั่งการ (ถ้ามี)..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </LiyonField>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button
            variant="outline"
            onClick={() => setApproveTarget(null)}
            disabled={isPending}
          >
            {t("documents.cancel")}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? "กำลังบันทึก..." : t("documents.approve")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Quick Reject Dialog */}
      <LiyonDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <LiyonDialogHeader
          title={t("documents.reject")}
          description={rejectTarget ? `ปฏิเสธการอนุมัติ: ${rejectTarget.documentNumber}` : undefined}
        />
        <LiyonDialogBody className="space-y-4 py-4">
          <LiyonField label={`${t("documents.comment")} *`}>
            <textarea
              rows={3}
              required
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติ..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </LiyonField>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button
            variant="outline"
            onClick={() => setRejectTarget(null)}
            disabled={isPending}
          >
            {t("documents.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isPending || !actionComment.trim()}
          >
            {isPending ? "กำลังบันทึก..." : t("documents.reject")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
