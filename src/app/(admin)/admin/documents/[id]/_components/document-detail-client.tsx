"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  UserCheck,
  Building2,
  Calendar,
  History,
  AlertTriangle,
  PenTool,
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
import type { DocumentDetailDto } from "@/features/documents";
import {
  getDocumentDetailAction,
  approveDocumentAction,
  rejectDocumentAction,
} from "@/features/documents/actions";

interface Props {
  initialDoc: DocumentDetailDto;
  currentUserId: string;
  canApprove: boolean;
  canManage: boolean;
}

export function DocumentDetailClient({
  initialDoc,
  currentUserId,
  canApprove,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const [doc, setDoc] = useState<DocumentDetailDto>(initialDoc);
  const [isPending, startTransition] = useTransition();

  // Action states
  const [comment, setComment] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Check if current user is the current active pending approver
  const currentPendingStep = doc.approvals.find((a) => a.status === "PENDING");
  const isMyTurn =
    canApprove &&
    currentPendingStep &&
    currentPendingStep.approverId === currentUserId &&
    doc.status === "IN_PROGRESS";

  const refresh = async () => {
    const res = await getDocumentDetailAction(doc.id);
    if (res.ok) setDoc(res.data);
  };

  const handleApprove = async () => {
    if (!currentPendingStep) return;

    startTransition(async () => {
      try {
        const res = await approveDocumentAction({
          documentId: doc.id,
          approvalId: currentPendingStep.id,
          comment: comment.trim() || undefined,
          signatureUrl: signatureName.trim() || undefined,
        });

        if (res.ok) {
          toast.success(t("documents.approveSuccess"));
          setComment("");
          setSignatureName("");
          await refresh();
        } else {
          toast.error(res.error.message || "เกิดข้อผิดพลาดในการอนุมัติ");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    });
  };

  const handleReject = async () => {
    if (!currentPendingStep || !comment.trim()) {
      toast.error("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      return;
    }

    startTransition(async () => {
      try {
        const res = await rejectDocumentAction({
          documentId: doc.id,
          approvalId: currentPendingStep.id,
          comment: comment.trim(),
        });

        if (res.ok) {
          toast.success(t("documents.rejectSuccess"));
          setShowRejectDialog(false);
          setComment("");
          await refresh();
        } else {
          toast.error(res.error.message || "เกิดข้อผิดพลาดในการปฏิเสธ");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "en" ? "en-US" : "th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/documents"
            className="rounded-lg border p-2 hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {doc.title}
            </h1>
          </div>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-end sm:self-center">
          <Calendar className="h-4 w-4" />
          ยื่นเมื่อ {formatDate(doc.createdAt)} โดย {doc.creatorName}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Document Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <LiyonCard className="p-6 space-y-5">
            <h2 className="text-base font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              สาระสำคัญของเอกสาร
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <span className="text-muted-foreground block font-medium">จาก (ผู้เสนอ):</span>
                <span className="text-foreground font-bold text-sm">{doc.senderName}</span>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <span className="text-muted-foreground block font-medium">เรียน (ผู้รับ):</span>
                <span className="text-foreground font-bold text-sm">{doc.recipientName}</span>
              </div>
            </div>

            {doc.departmentNameTh && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" />
                <span>
                  <strong>ภาควิชา/ส่วนงานที่สังกัด:</strong>{" "}
                  {locale === "en" ? doc.departmentNameEn : doc.departmentNameTh}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                เนื้อหา / วัตถุประสงค์
              </label>
              <div className="rounded-lg border bg-background p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {doc.summary}
              </div>
            </div>

            {doc.attachmentUrl && (
              <div className="rounded-lg border bg-muted/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-500/10 p-2.5 text-red-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">ไฟล์แนบเอกสารราชการ</div>
                    <div className="text-xs text-muted-foreground font-mono truncate max-w-xs sm:max-w-md">
                      {doc.attachmentUrl}
                    </div>
                  </div>
                </div>

                <a
                  href={doc.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  เปิดไฟล์ PDF
                </a>
              </div>
            )}
          </LiyonCard>

          {/* Action Decision Box (If active turn) */}
          {isMyTurn && (
            <LiyonCard className="p-6 space-y-4 border-2 border-primary bg-primary/5">
              <div className="flex items-center gap-2 text-primary font-bold text-base border-b border-primary/20 pb-2">
                <PenTool className="h-5 w-5" />
                กล่องพิจารณาลงนามสำหรับคุณ ({currentPendingStep.roleTitle})
              </div>

              <p className="text-xs text-muted-foreground">
                คุณได้รับมอบหมายให้เป็นผู้พิจารณาในลำดับขั้นนี้ โปรดระบุข้อคิดเห็นหรือข้อสั่งการ และลงนาม
              </p>

              <LiyonField label={t("documents.comment")}>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ระบุข้อคิดเห็น หรือข้อสั่งการ เช่น เห็นควรอนุมัติ..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>

              <LiyonField label="ชื่อผู้ลงนามดิจิทัล / ลายเซ็น">
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="ระบุชื่อ-สกุล หรือลายเซ็นกำกับ"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  {t("documents.reject")}
                </Button>

                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isPending ? "กำลังบันทึก..." : t("documents.approve")}
                </Button>
              </div>
            </LiyonCard>
          )}

          {/* Routing History / Audit Trail Timeline */}
          <LiyonCard className="p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              {t("documents.timeline")}
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {doc.histories.map((h) => (
                <div key={h.id} className="relative text-xs space-y-1">
                  <div
                    className={`absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full border-2 bg-background ${
                      h.action === "APPROVED"
                        ? "border-emerald-500 bg-emerald-500"
                        : h.action === "REJECTED"
                        ? "border-rose-500 bg-rose-500"
                        : "border-primary bg-primary"
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {h.actorName || "ผู้ใช้งาน"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(h.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{h.description}</p>
                </div>
              ))}
            </div>
          </LiyonCard>
        </div>

        {/* Right Col: Approval Chain Stepper */}
        <div className="space-y-6">
          <LiyonCard className="p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              สายการพิจารณาอนุมัติ
            </h2>

            <div className="space-y-4">
              {doc.approvals.map((step, idx) => (
                <div
                  key={step.id}
                  className={`rounded-lg border p-4 text-xs space-y-2 transition-all ${
                    step.status === "APPROVED"
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : step.status === "REJECTED"
                      ? "border-rose-500/40 bg-rose-500/5"
                      : step.status === "PENDING" && doc.status === "IN_PROGRESS"
                      ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30"
                      : "bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <StatusPill
                      tone={
                        step.status === "APPROVED"
                          ? "ok"
                          : step.status === "REJECTED"
                          ? "bad"
                          : "warn"
                      }
                    >
                      {step.status === "APPROVED"
                        ? "อนุมัติแล้ว"
                        : step.status === "REJECTED"
                        ? "ไม่อนุมัติ"
                        : "รอพิจารณา"}
                    </StatusPill>
                  </div>

                  <div>
                    <div className="font-bold text-sm text-foreground">
                      {step.roleTitle}
                    </div>
                    <div className="text-muted-foreground">
                      {step.approverName} ({step.approverEmail})
                    </div>
                  </div>

                  {step.comment && (
                    <div className="mt-2 rounded bg-background p-2 border text-[11px] text-foreground">
                      <strong>ความเห็น:</strong> &ldquo;{step.comment}&rdquo;
                    </div>
                  )}

                  {step.actedAt && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                      <Clock className="h-3 w-3" />
                      ดำเนินการเมื่อ {formatDate(step.actedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </LiyonCard>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      <LiyonDialog
        open={showRejectDialog}
        onOpenChange={(open) => !open && setShowRejectDialog(false)}
      >
        <LiyonDialogHeader
          title={
            <span className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("documents.reject")}
            </span>
          }
          description="กรุณาระบุเหตุผลหรือข้อสั่งการเพื่อส่งกลับแจ้งผู้เสนอเอกสาร"
        />

        <LiyonDialogBody className="space-y-4 py-4">
          <LiyonField label={`${t("documents.comment")} *`}>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ระบุเหตุผลที่ไม่อนุมัติอย่างชัดเจน..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </LiyonField>
        </LiyonDialogBody>

        <LiyonDialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowRejectDialog(false)}
            disabled={isPending}
          >
            {t("documents.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isPending || !comment.trim()}
          >
            {isPending ? "กำลังบันทึก..." : "ยืนยันการไม่อนุมัติ"}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
