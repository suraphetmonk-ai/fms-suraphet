"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  GraduationCap,
  Users,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  StatusPill,
  LiyonField,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import type { DepartmentDto } from "@/features/personnel";
import {
  getDepartmentsWithDetailsAction,
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
} from "@/features/personnel/actions";

interface Props {
  initialDepartments: DepartmentDto[];
  canManage: boolean;
}

export function DepartmentsAdminClient({
  initialDepartments,
  canManage,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const [departments, setDepartments] = useState<DepartmentDto[]>(initialDepartments);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentDto | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    id?: string;
    code: string;
    nameTh: string;
    nameEn: string;
    orderIndex: number;
  }>({
    code: "",
    nameTh: "",
    nameEn: "",
    orderIndex: 0,
  });

  const refresh = async () => {
    const res = await getDepartmentsWithDetailsAction();
    if (res.ok) setDepartments(res.data);
  };

  const handleOpenCreate = () => {
    setFormData({
      code: "",
      nameTh: "",
      nameEn: "",
      orderIndex: departments.length * 10,
    });
    setDialogMode("create");
  };

  const handleOpenEdit = (dept: DepartmentDto) => {
    setFormData({
      id: dept.id,
      code: dept.code,
      nameTh: dept.nameTh,
      nameEn: dept.nameEn,
      orderIndex: dept.orderIndex ?? 0,
    });
    setDialogMode("edit");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.nameTh.trim() || !formData.nameEn.trim()) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      try {
        if (dialogMode === "create") {
          const res = await createDepartmentAction({
            code: formData.code.trim(),
            nameTh: formData.nameTh.trim(),
            nameEn: formData.nameEn.trim(),
            orderIndex: Number(formData.orderIndex) || 0,
          });
          if (res.ok) {
            toast.success(t("departments.createSuccess"));
            setDialogMode(null);
            await refresh();
          } else {
            toast.error(res.error.message || "เกิดข้อผิดพลาดในการเพิ่มภาควิชา");
          }
        } else if (dialogMode === "edit" && formData.id) {
          const res = await updateDepartmentAction({
            id: formData.id,
            code: formData.code.trim(),
            nameTh: formData.nameTh.trim(),
            nameEn: formData.nameEn.trim(),
            orderIndex: Number(formData.orderIndex) || 0,
          });
          if (res.ok) {
            toast.success(t("departments.updateSuccess"));
            setDialogMode(null);
            await refresh();
          } else {
            toast.error(res.error.message || "เกิดข้อผิดพลาดในการแก้ไขภาควิชา");
          }
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if ((deleteTarget.programsCount ?? 0) > 0) {
      toast.error("ไม่สามารถลบภาควิชาที่มีหลักสูตรสังกัดอยู่ได้ กรุณาย้ายหลักสูตรออกก่อน");
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteDepartmentAction(deleteTarget.id);
        if (res.ok) {
          toast.success(t("departments.deleteSuccess"));
          setDeleteTarget(null);
          await refresh();
        } else {
          toast.error(res.error.message || "เกิดข้อผิดพลาดในการลบภาควิชา");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    });
  };

  // Metrics
  const totalPrograms = departments.reduce((acc, cur) => acc + (cur.programsCount ?? 0), 0);
  const totalPersonnel = departments.reduce((acc, cur) => acc + (cur.personnelCount ?? 0), 0);

  // Filter
  const filtered = departments.filter((d) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      d.code.toLowerCase().includes(q) ||
      d.nameTh.toLowerCase().includes(q) ||
      d.nameEn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-primary" />
            {t("departments.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("departments.subtitle")}
          </p>
        </div>

        {canManage && (
          <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            {t("departments.create")}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LiyonCard className="p-4 flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{departments.length}</div>
            <div className="text-xs text-muted-foreground">{t("departments.totalDepartments")}</div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-4 flex items-center gap-4">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{totalPrograms}</div>
            <div className="text-xs text-muted-foreground">{t("departments.totalPrograms")}</div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-4 flex items-center gap-4">
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{totalPersonnel}</div>
            <div className="text-xs text-muted-foreground">{t("departments.totalPersonnel")}</div>
          </div>
        </LiyonCard>
      </div>

      {/* Filter / Search Bar */}
      <LiyonCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัสภาควิชา, ชื่อไทย, หรือชื่อภาษาอังกฤษ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </LiyonCard>

      {/* Departments Listing */}
      {filtered.length === 0 ? (
        <LiyonCard className="p-12 text-center text-muted-foreground">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-base font-medium">{t("departments.empty")}</p>
        </LiyonCard>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((dept) => (
            <LiyonCard key={dept.id} className="p-6 transition-all hover:shadow-md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Department Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                    <h2 className="text-lg font-bold text-foreground">
                      {locale === "en" ? dept.nameEn : dept.nameTh}
                    </h2>
                    {locale !== "en" && (
                      <span className="text-sm text-muted-foreground">({dept.nameEn})</span>
                    )}
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {t("departments.order")}: {dept.orderIndex ?? 0}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <strong>{dept.programsCount ?? 0}</strong> {t("departments.programsCount")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <strong>{dept.personnelCount ?? 0}</strong> {t("departments.personnelCount")}
                    </span>
                  </div>
                </div>

                {/* Management Action Buttons */}
                {canManage && (
                  <div className="flex items-center gap-2 self-end lg:self-start shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(dept)}
                      className="gap-1.5 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {t("departments.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(dept)}
                      className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("departments.delete")}
                    </Button>
                  </div>
                )}
              </div>

              {/* Affiliated Programs List */}
              <div className="mt-5 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    {t("departments.programsList")} ({dept.programs?.length ?? 0})
                  </h3>
                  <Link
                    href={`/admin/programs`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    จัดการหลักสูตรทั้งหมด
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {!dept.programs || dept.programs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                    {t("departments.noPrograms")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                    {dept.programs.map((prog) => (
                      <div
                        key={prog.id}
                        className="flex flex-col justify-between rounded-lg border bg-card/60 p-3 text-xs hover:border-primary/40 hover:bg-muted/20 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="font-mono text-[11px] font-semibold text-primary">
                              {prog.code}
                            </span>
                            <span className="rounded bg-secondary px-1.5 py-0.2 text-[10px] text-secondary-foreground font-medium">
                              {prog.degreeLevel === "BACHELOR"
                                ? "ป.ตรี"
                                : prog.degreeLevel === "MASTER"
                                ? "ป.โท"
                                : "ป.เอก"}
                            </span>
                          </div>
                          <div className="font-medium text-foreground line-clamp-1">
                            {locale === "en" ? prog.nameEn : prog.nameTh}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>สถานะ:</span>
                          <StatusPill tone={prog.status === "ACTIVE" ? "ok" : "off"}>
                            {prog.status === "ACTIVE" ? "เปิดสอน" : "ร่าง/ปิด"}
                          </StatusPill>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </LiyonCard>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      <LiyonDialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <form onSubmit={handleSave}>
          <LiyonDialogHeader
            title={dialogMode === "create" ? t("departments.create") : t("departments.edit")}
            description="กำหนดรหัสและชื่อภาควิชาเพื่อจัดกลุ่มหลักสูตรและบุคลากร"
          />

          <LiyonDialogBody className="space-y-4 py-4">
            <LiyonField label={`${t("departments.code")} *`}>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="เช่น COM, MKT, ACC, GEN"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </LiyonField>

            <LiyonField label={`${t("departments.nameTh")} *`}>
              <input
                type="text"
                required
                value={formData.nameTh}
                onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                placeholder="เช่น ภาควิชาวิทยาการคอมพิวเตอร์, ภาควิชาการตลาด"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </LiyonField>

            <LiyonField label={`${t("departments.nameEn")} *`}>
              <input
                type="text"
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="e.g. Department of Computer Science, Department of Marketing"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </LiyonField>

            <LiyonField label={t("departments.order")}>
              <input
                type="number"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </LiyonField>
          </LiyonDialogBody>

          <LiyonDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogMode(null)}
              disabled={isPending}
            >
              {t("departments.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "กำลังบันทึก..." : t("departments.save")}
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* Delete Confirmation Dialog */}
      <LiyonDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <LiyonDialogHeader
          title={
            <span className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("departments.delete")}
            </span>
          }
        />

        <LiyonDialogBody className="py-4 space-y-3">
          <p className="text-sm text-foreground">
            {t("departments.deleteConfirm")}
          </p>

          {deleteTarget && (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
              <div>
                <strong>รหัส:</strong> {deleteTarget.code}
              </div>
              <div>
                <strong>ชื่อ:</strong> {deleteTarget.nameTh} ({deleteTarget.nameEn})
              </div>
              <div>
                <strong>หลักสูตรที่สังกัด:</strong> {deleteTarget.programsCount ?? 0} หลักสูตร
              </div>
              <div>
                <strong>บุคลากรในสังกัด:</strong> {deleteTarget.personnelCount ?? 0} คน
              </div>
            </div>
          )}

          {deleteTarget && (deleteTarget.programsCount ?? 0) > 0 && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>คำเตือน:</strong> ภาควิชานี้ยังมีหลักสูตรสังกัดอยู่ {deleteTarget.programsCount} หลักสูตร ระบบไม่อนุญาตให้ลบจนกว่าจะทำการย้ายหรือลบหลักสูตรดังกล่าว
              </span>
            </div>
          )}
        </LiyonDialogBody>

        <LiyonDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteTarget(null)}
            disabled={isPending}
          >
            {t("departments.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || (deleteTarget ? (deleteTarget.programsCount ?? 0) > 0 : false)}
          >
            {isPending ? "กำลังลบ..." : t("departments.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
