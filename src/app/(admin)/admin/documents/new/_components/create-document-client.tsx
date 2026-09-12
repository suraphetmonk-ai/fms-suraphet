"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  UserCheck,
  Paperclip,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonField,
} from "@/shared/components/liyon";
import type { ApproverOptionDto } from "@/features/documents";
import type { DepartmentDto } from "@/features/personnel";
import {
  createDocumentAction,
  generateNextNumberAction,
} from "@/features/documents/actions";

interface Props {
  departments: DepartmentDto[];
  approvers: ApproverOptionDto[];
  defaultDocNumber: string;
  currentUserName: string;
}

export function CreateDocumentClient({
  departments,
  approvers,
  defaultDocNumber,
  currentUserName,
}: Props) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    documentNumber: defaultDocNumber,
    category: "MEMO",
    urgency: "NORMAL",
    confidentiality: "NORMAL",
    title: "",
    departmentId: departments[0]?.id || "",
    senderName: currentUserName,
    recipientName: "คณบดีคณะวิทยาการจัดการ",
    summary: "",
    attachmentUrl: "",
  });

  // Dynamic approval chain steps
  const [steps, setSteps] = useState<
    { approverId: string; roleTitle: string }[]
  >([
    {
      approverId: approvers[0]?.id || "",
      roleTitle: "หัวหน้าภาควิชา/หัวหน้างาน",
    },
    {
      approverId: approvers[1]?.id || approvers[0]?.id || "",
      roleTitle: "คณบดีคณะวิทยาการจัดการ",
    },
  ]);

  const handleCategoryChange = async (newCat: string) => {
    setFormData((prev) => ({ ...prev, category: newCat }));
    try {
      const res = await generateNextNumberAction(newCat);
      if (res.ok) {
        setFormData((prev) => ({ ...prev, documentNumber: res.data }));
      }
    } catch {
      // Keep existing number if fail
    }
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        approverId: approvers[0]?.id || "",
        roleTitle: `ผู้พิจารณาลำดับที่ ${steps.length + 1}`,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      toast.error("เอกสารต้องมีผู้พิจารณาอย่างน้อย 1 ท่าน");
      return;
    }
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.summary.trim()) {
      toast.error("กรุณากรอกชื่อเรื่องและสาระสำคัญของเอกสาร");
      return;
    }

    if (steps.some((s) => !s.approverId || !s.roleTitle.trim())) {
      toast.error("กรุณาระบุข้อมูลผู้พิจารณาและตำแหน่งให้ครบถ้วนทุกขั้นตอน");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createDocumentAction({
          documentNumber: formData.documentNumber.trim() || undefined,
          title: formData.title.trim(),
          category: formData.category,
          urgency: formData.urgency,
          confidentiality: formData.confidentiality,
          senderName: formData.senderName.trim(),
          recipientName: formData.recipientName.trim(),
          summary: formData.summary.trim(),
          attachmentUrl: formData.attachmentUrl.trim() || undefined,
          departmentId: formData.departmentId || undefined,
          approvers: steps.map((s, idx) => ({
            approverId: s.approverId,
            roleTitle: s.roleTitle.trim(),
            stepOrder: idx + 1,
          })),
        });

        if (res.ok) {
          toast.success(t("documents.createSuccess"));
          router.push(`/admin/documents/${res.data.id}`);
        } else {
          toast.error(res.error.message || "เกิดข้อผิดพลาดในการสร้างเอกสาร");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/documents"
            className="rounded-lg border p-2 hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {t("documents.create")}
            </h1>
            <p className="text-xs text-muted-foreground">
              ยื่นเสนอเอกสารราชการ บันทึกข้อความ หรือประกาศเข้าสู่สายการพิจารณา
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="gap-2">
          <Send className="h-4 w-4" />
          {isPending ? "กำลังยื่นเสนอ..." : t("documents.submit")}
        </Button>
      </div>

      {/* Section 1: ข้อมูลหนังสือ */}
      <LiyonCard className="p-6 space-y-4">
        <h2 className="text-base font-bold text-foreground border-b pb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          ข้อมูลสารบรรณและประเภทเอกสาร
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LiyonField label={`${t("documents.category")} *`}>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="MEMO">{t("documents.category.memo")}</option>
              <option value="ORDER">{t("documents.category.order")}</option>
              <option value="ANNOUNCEMENT">{t("documents.category.announcement")}</option>
              <option value="CIRCULAR">{t("documents.category.circular")}</option>
              <option value="REQUEST">{t("documents.category.request")}</option>
              <option value="GENERAL">{t("documents.category.general")}</option>
            </select>
          </LiyonField>

          <LiyonField label={t("documents.documentNumber")}>
            <input
              type="text"
              value={formData.documentNumber}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
              placeholder="ระบบสร้างให้อัตโนมัติ"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </LiyonField>

          <LiyonField label={t("documents.urgency")}>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NORMAL">{t("documents.urgency.normal")}</option>
              <option value="URGENT">{t("documents.urgency.urgent")}</option>
              <option value="VERY_URGENT">{t("documents.urgency.veryUrgent")}</option>
              <option value="MOST_URGENT">{t("documents.urgency.mostUrgent")}</option>
            </select>
          </LiyonField>

          <LiyonField label={t("documents.confidentiality")}>
            <select
              value={formData.confidentiality}
              onChange={(e) => setFormData({ ...formData, confidentiality: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NORMAL">ปกติ</option>
              <option value="CONFIDENTIAL">ลับ</option>
              <option value="TOP_SECRET">ลับที่สุด</option>
            </select>
          </LiyonField>
        </div>

        <LiyonField label={`${t("documents.subject")} *`}>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="เช่น ขออนุมัติจัดโครงการสัมมนาเชิงปฏิบัติการ..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </LiyonField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LiyonField label={`${t("documents.sender")} *`}>
            <input
              type="text"
              required
              value={formData.senderName}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              placeholder="ระบุชื่อผู้เสนอหรือตำแหน่ง"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </LiyonField>

          <LiyonField label={`${t("documents.recipient")} *`}>
            <input
              type="text"
              required
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              placeholder="เช่น คณบดีคณะวิทยาการจัดการ"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </LiyonField>

          <LiyonField label={t("documents.department")}>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- ไม่ระบุภาควิชา --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameTh} ({d.code})
                </option>
              ))}
            </select>
          </LiyonField>
        </div>

        <LiyonField label={`${t("documents.summary")} *`}>
          <textarea
            rows={5}
            required
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="ระบุรายละเอียดสาระสำคัญ วัตถุประสงค์ และสิ่งที่ขอรับการอนุมัติ..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </LiyonField>

        <LiyonField label={t("documents.attachment")}>
          <div className="relative">
            <Paperclip className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="url"
              value={formData.attachmentUrl}
              onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
              placeholder="ระบุ URL ไฟล์แนบเอกสาร PDF เช่น https://example.com/file.pdf"
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
            />
          </div>
        </LiyonField>
      </LiyonCard>

      {/* Section 2: สายการเสนอพิจารณาอนุมัติ */}
      <LiyonCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              {t("documents.approvers")}
            </h2>
            <p className="text-xs text-muted-foreground">
              กำหนดลำดับขั้นผู้พิจารณาลงนาม (ระบบจะส่งต่อตามลำดับที่ 1 สู่ลำดับถัดไป)
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStep}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มลำดับขั้น
          </Button>
        </div>

        <div className="space-y-3 pt-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border bg-muted/20 p-3"
            >
              <div className="flex items-center gap-2 w-24 shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  ขั้นที่ {idx + 1}
                </span>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    ผู้พิจารณาลงนาม *
                  </label>
                  <select
                    value={step.approverId}
                    onChange={(e) => {
                      const newSteps = [...steps];
                      newSteps[idx].approverId = e.target.value;
                      setSteps(newSteps);
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {approvers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    ตำแหน่งในสายการพิจารณา *
                  </label>
                  <input
                    type="text"
                    required
                    value={step.roleTitle}
                    onChange={(e) => {
                      const newSteps = [...steps];
                      newSteps[idx].roleTitle = e.target.value;
                      setSteps(newSteps);
                    }}
                    placeholder="เช่น หัวหน้าภาควิชา, รองคณบดี, คณบดี"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStep(idx)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 self-end sm:self-center"
                  title="ลบลำดับขั้นนี้"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </LiyonCard>

      {/* Footer Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/admin/documents">
          <Button type="button" variant="outline" disabled={isPending}>
            {t("documents.cancel")}
          </Button>
        </Link>
        <Button type="submit" disabled={isPending} className="gap-2 px-6">
          <CheckCircle className="h-4 w-4" />
          {isPending ? "กำลังยื่นเสนอ..." : t("documents.submit")}
        </Button>
      </div>
    </form>
  );
}
