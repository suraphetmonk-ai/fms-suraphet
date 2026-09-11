"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, Clock, ExternalLink, Printer, Users, Calendar } from "lucide-react";
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
import type { ProgramDto } from "@/features/curriculum";
import type { DepartmentDto } from "@/features/personnel";
import {
  createProgramAction,
  updateProgramAction,
  deleteProgramAction,
  getProgramsAction,
} from "@/features/curriculum/actions";

interface Props {
  initialPrograms: ProgramDto[];
  departments: DepartmentDto[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function ProgramsAdminClient({
  initialPrograms,
  departments,
  canCreate,
  canUpdate,
  canDelete,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const [programs, setPrograms] = useState<ProgramDto[]>(initialPrograms);
  const [search, setSearch] = useState("");
  const [degreeLevelFilter, setDegreeLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProgramDto | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    id?: string;
    code: string;
    nameTh: string;
    nameEn: string;
    degreeLevel: "BACHELOR" | "MASTER" | "DOCTORAL";
    degreeNameTh: string;
    degreeNameEn: string;
    departmentId: string;
    totalCredits: number;
    durationYears: number;
    tuitionFee: string;
    descriptionTh: string;
    descriptionEn: string;
    careerOpportunitiesTh: string;
    careerOpportunitiesEn: string;
    pdfUrl: string;
    isOpenAdmission: boolean;
    status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  }>({
    code: "",
    nameTh: "",
    nameEn: "",
    degreeLevel: "BACHELOR",
    degreeNameTh: "วิทยาศาสตรบัณฑิต (วท.บ.)",
    degreeNameEn: "Bachelor of Science (B.Sc.)",
    departmentId: departments[0]?.id ?? "",
    totalCredits: 128,
    durationYears: 4,
    tuitionFee: "22,000 บาท/ภาคการศึกษา",
    descriptionTh: "",
    descriptionEn: "",
    careerOpportunitiesTh: "",
    careerOpportunitiesEn: "",
    pdfUrl: "",
    isOpenAdmission: true,
    status: "ACTIVE",
  });

  const refresh = async () => {
    const res = await getProgramsAction();
    if (res.ok) setPrograms(res.data);
  };

  const handleOpenCreate = () => {
    setFormData({
      code: `CS-${Date.now().toString().slice(-4)}`,
      nameTh: "",
      nameEn: "",
      degreeLevel: "BACHELOR",
      degreeNameTh: "วิทยาศาสตรบัณฑิต (วท.บ.)",
      degreeNameEn: "Bachelor of Science (B.Sc.)",
      departmentId: departments[0]?.id ?? "",
      totalCredits: 128,
      durationYears: 4,
      tuitionFee: "22,000 บาท/ภาคการศึกษา",
      descriptionTh: "",
      descriptionEn: "",
      careerOpportunitiesTh: "นักพัฒนาซอฟต์แวร์, วิศวกรข้อมูล, สถาปนิกระบบคลาวด์",
      careerOpportunitiesEn: "Software Engineer, Data Engineer, Cloud Architect",
      pdfUrl: "",
      isOpenAdmission: true,
      status: "ACTIVE",
    });
    setDialogMode("create");
  };

  const handleOpenEdit = (prog: ProgramDto) => {
    setFormData({
      id: prog.id,
      code: prog.code,
      nameTh: prog.nameTh,
      nameEn: prog.nameEn,
      degreeLevel: (prog.degreeLevel as "BACHELOR" | "MASTER" | "DOCTORAL") || "BACHELOR",
      degreeNameTh: prog.degreeNameTh,
      degreeNameEn: prog.degreeNameEn,
      departmentId: prog.departmentId ?? departments[0]?.id ?? "",
      totalCredits: prog.totalCredits,
      durationYears: prog.durationYears,
      tuitionFee: prog.tuitionFee ?? "",
      descriptionTh: prog.descriptionTh ?? "",
      descriptionEn: prog.descriptionEn ?? "",
      careerOpportunitiesTh: prog.careerOpportunitiesTh ?? "",
      careerOpportunitiesEn: prog.careerOpportunitiesEn ?? "",
      pdfUrl: prog.pdfUrl ?? "",
      isOpenAdmission: prog.isOpenAdmission,
      status: (prog.status as "ACTIVE" | "DRAFT" | "ARCHIVED") || "ACTIVE",
    });
    setDialogMode("edit");
  };

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      toast.error(t("curriculum.code") + " required");
      return;
    }
    if (!formData.nameTh.trim()) {
      toast.error(t("curriculum.nameTh") + " required");
      return;
    }

    startTransition(async () => {
      if (dialogMode === "create") {
        const res = await createProgramAction(formData);
        if (res.ok) {
          toast.success(t("curriculum.createSuccess"));
          setDialogMode(null);
          await refresh();
        } else {
          toast.error(res.error.message);
        }
      } else if (dialogMode === "edit") {
        const res = await updateProgramAction(formData);
        if (res.ok) {
          toast.success(t("curriculum.updateSuccess"));
          setDialogMode(null);
          await refresh();
        } else {
          toast.error(res.error.message);
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteProgramAction(deleteTarget.id);
      if (res.ok) {
        toast.success(t("curriculum.deleteSuccess"));
        setDeleteTarget(null);
        await refresh();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  const filtered = programs.filter((p) => {
    const matchesSearch =
      p.nameTh.toLowerCase().includes(search.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.degreeNameTh.toLowerCase().includes(search.toLowerCase());
    const matchesDegree = degreeLevelFilter === "ALL" || p.degreeLevel === degreeLevelFilter;
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesDegree && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("curriculum.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("curriculum.subtitle")}</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("curriculum.create")}
          </Button>
        )}
      </div>

      {/* Filters */}
      <LiyonCard className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหารหัส หรือชื่อหลักสูตร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={degreeLevelFilter}
              onChange={(e) => setDegreeLevelFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกระดับการศึกษา --</option>
              <option value="BACHELOR">{t("curriculum.degreeLevel.bachelor")}</option>
              <option value="MASTER">{t("curriculum.degreeLevel.master")}</option>
              <option value="DOCTORAL">{t("curriculum.degreeLevel.doctoral")}</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกสถานะ --</option>
              <option value="ACTIVE">{t("curriculum.status.active")}</option>
              <option value="DRAFT">{t("curriculum.status.draft")}</option>
              <option value="ARCHIVED">{t("curriculum.status.archived")}</option>
            </select>
          </div>
        </div>
      </LiyonCard>

      {/* Programs Table */}
      <LiyonCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">รหัส / ชื่อหลักสูตร</th>
                <th className="px-4 py-3">ระดับ</th>
                <th className="px-4 py-3">หน่วยกิต / ระยะเวลา</th>
                <th className="px-4 py-3">ภาควิชา</th>
                <th className="px-4 py-3">รับสมัคร</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t("curriculum.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {item.code}
                          </span>
                          {item.nameTh}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.nameEn}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-medium">
                        {item.degreeLevel === "BACHELOR"
                          ? t("curriculum.degreeLevel.bachelor")
                          : item.degreeLevel === "MASTER"
                          ? t("curriculum.degreeLevel.master")
                          : t("curriculum.degreeLevel.doctoral")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      <div>{item.totalCredits} หน่วยกิต</div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                        <Clock className="h-3 w-3" /> {item.durationYears} ปี
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {locale === "en" ? item.departmentNameEn : item.departmentNameTh}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.isOpenAdmission ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          เปิดรับสมัคร
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">ปิดรับสมัคร</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill tone={item.status === "ACTIVE" ? "ok" : "off"}>
                        {item.status === "ACTIVE"
                          ? t("curriculum.status.active")
                          : item.status === "DRAFT"
                          ? t("curriculum.status.draft")
                          : t("curriculum.status.archived")}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/programs/${item.id}/schedule`}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                          title="จัดการตารางสอนและตารางเรียน (Timetable)"
                        >
                          <Calendar className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/programs/${item.id}/teaching`}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-emerald-600 transition-colors"
                          title="จัดการภาระงานสอนรายวิชา (Teaching Assignments)"
                        >
                          <Users className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/programs/${item.id}/report`}
                          target="_blank"
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                          title="พิมพ์รายงานหลักสูตร (มคอ.๒) / PDF"
                        >
                          <Printer className="h-4 w-4" />
                        </Link>
                        <a
                          href={`/programs/${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="ดูหน้าหลักสูตรสาธารณะ"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={t("curriculum.edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="rounded p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                            title={t("curriculum.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* Create / Edit Dialog */}
      {dialogMode && (
        <LiyonDialog open onOpenChange={(o) => !o && setDialogMode(null)}>
          <LiyonDialogHeader
            title={dialogMode === "create" ? t("curriculum.create") : t("curriculum.edit")}
            description="บันทึกข้อมูลหลักสูตรการศึกษาและรายละเอียดวิชาการ"
          />
          <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <LiyonField label={t("curriculum.code")}>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="เช่น CS-66, IT-66"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("curriculum.degreeLevel")}>
                <select
                  value={formData.degreeLevel}
                  onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value as "BACHELOR" | "MASTER" | "DOCTORAL" })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="BACHELOR">{t("curriculum.degreeLevel.bachelor")}</option>
                  <option value="MASTER">{t("curriculum.degreeLevel.master")}</option>
                  <option value="DOCTORAL">{t("curriculum.degreeLevel.doctoral")}</option>
                </select>
              </LiyonField>

              <LiyonField label={t("curriculum.department")}>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {locale === "en" ? d.nameEn : d.nameTh}
                    </option>
                  ))}
                </select>
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LiyonField label={t("curriculum.nameTh")}>
                <input
                  type="text"
                  value={formData.nameTh}
                  onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                  placeholder="เช่น หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("curriculum.nameEn")}>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="e.g. Bachelor of Science in Computer Science"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LiyonField label={t("curriculum.degreeNameTh")}>
                <input
                  type="text"
                  value={formData.degreeNameTh}
                  onChange={(e) => setFormData({ ...formData, degreeNameTh: e.target.value })}
                  placeholder="เช่น วิทยาศาสตรบัณฑิต (วิทยาการคอมพิวเตอร์)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("curriculum.degreeNameEn")}>
                <input
                  type="text"
                  value={formData.degreeNameEn}
                  onChange={(e) => setFormData({ ...formData, degreeNameEn: e.target.value })}
                  placeholder="e.g. Bachelor of Science (Computer Science)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <LiyonField label={t("curriculum.totalCredits")}>
                <input
                  type="number"
                  value={formData.totalCredits}
                  onChange={(e) => setFormData({ ...formData, totalCredits: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("curriculum.duration")}>
                <input
                  type="number"
                  value={formData.durationYears}
                  onChange={(e) => setFormData({ ...formData, durationYears: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("curriculum.tuition")}>
                <input
                  type="text"
                  value={formData.tuitionFee}
                  onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                  placeholder="เช่น 22,000 บาท/เทอม"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <LiyonField label={t("curriculum.descTh")}>
              <textarea
                rows={3}
                value={formData.descriptionTh}
                onChange={(e) => setFormData({ ...formData, descriptionTh: e.target.value })}
                placeholder="วัตถุประสงค์และจุดเด่นของหลักสูตร..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.careerTh")}>
              <textarea
                rows={2}
                value={formData.careerOpportunitiesTh}
                onChange={(e) => setFormData({ ...formData, careerOpportunitiesTh: e.target.value })}
                placeholder="อาชีพที่สามารถประกอบได้หลังสำเร็จการศึกษา..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.pdfUrl")}>
              <input
                type="text"
                value={formData.pdfUrl}
                onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                placeholder="https://example.edu/curriculum/tqf2-cs.pdf"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t">
              <LiyonField label={t("curriculum.status")}>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "DRAFT" | "ACTIVE" | "ARCHIVED" })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">{t("curriculum.status.active")}</option>
                  <option value="DRAFT">{t("curriculum.status.draft")}</option>
                  <option value="ARCHIVED">{t("curriculum.status.archived")}</option>
                </select>
              </LiyonField>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isOpenAdmission"
                  checked={formData.isOpenAdmission}
                  onChange={(e) => setFormData({ ...formData, isOpenAdmission: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="isOpenAdmission" className="text-sm font-medium text-foreground cursor-pointer">
                  {t("curriculum.isOpenAdmission")}
                </label>
              </div>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={isPending}>
              {t("curriculum.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "กำลังบันทึก..." : t("curriculum.save")}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <LiyonDialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <LiyonDialogHeader
            title={t("curriculum.delete")}
            description={t("curriculum.deleteConfirm")}
          />
          <LiyonDialogBody>
            <div className="rounded-md border p-3 bg-muted/40">
              <p className="font-semibold text-foreground">{deleteTarget.nameTh}</p>
              <p className="text-xs text-muted-foreground">{deleteTarget.code}</p>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              {t("curriculum.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "กำลังลบ..." : t("curriculum.delete")}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}
    </div>
  );
}
