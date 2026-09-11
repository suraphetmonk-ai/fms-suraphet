"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Trash2, Search, User, Mail, Phone, ExternalLink, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
import type { PersonnelDto, DepartmentDto } from "@/features/personnel";
import {
  createPersonnelAction,
  updatePersonnelAction,
  deletePersonnelAction,
  getPersonnelListAction,
  revealCitizenIdAction,
} from "@/features/personnel/actions";

interface Props {
  initialPersonnel: PersonnelDto[];
  departments: DepartmentDto[];
  canManage: boolean;
}

export function PersonnelAdminClient({ initialPersonnel, departments, canManage }: Props) {
  const t = useT();
  const locale = useLocale();
  const [personnelList, setPersonnelList] = useState<PersonnelDto[]>(initialPersonnel);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonnelDto | null>(null);
  const [unmaskedCids, setUnmaskedCids] = useState<Record<string, string>>({});

  const handleToggleReveal = async (id: string) => {
    if (unmaskedCids[id]) {
      const next = { ...unmaskedCids };
      delete next[id];
      setUnmaskedCids(next);
      return;
    }
    const res = await revealCitizenIdAction(id);
    if (res.ok && res.data) {
      setUnmaskedCids((prev) => ({ ...prev, [id]: res.data }));
      toast.success("ถอดรหัสเลขประจำตัวประชาชน (บันทึกประวัติการเข้าดูแล้ว)");
    } else {
      toast.error("ไม่มีสิทธิ์หรือเกิดข้อผิดพลาดในการเปิดดู");
    }
  };

  // Form state
  const [formData, setFormData] = useState<{
    id?: string;
    personnelCode: string;
    citizenId: string;
    monasticTitle: string;
    chaya: string;
    paliDegree: string;
    templeName: string;
    address: string;
    phone: string;
    academicRank: string;
    firstNameTh: string;
    lastNameTh: string;
    firstNameEn: string;
    lastNameEn: string;
    departmentId: string;
    positionTh: string;
    positionEn: string;
    personnelType: "ACADEMIC" | "SUPPORT";
    email: string;
    phoneExt: string;
    roomNumber: string;
    avatarUrl: string;
    biographyTh: string;
    biographyEn: string;
    expertiseInput: string;
    orderIndex: number;
    isActive: boolean;
  }>({
    personnelCode: "",
    citizenId: "",
    monasticTitle: "",
    chaya: "",
    paliDegree: "",
    templeName: "",
    address: "",
    phone: "",
    academicRank: "",
    firstNameTh: "",
    lastNameTh: "",
    firstNameEn: "",
    lastNameEn: "",
    departmentId: departments[0]?.id ?? "",
    positionTh: "อาจารย์ประจำสาขาวิชา",
    positionEn: "Lecturer",
    personnelType: "ACADEMIC",
    email: "",
    phoneExt: "",
    roomNumber: "",
    avatarUrl: "",
    biographyTh: "",
    biographyEn: "",
    expertiseInput: "",
    orderIndex: 10,
    isActive: true,
  });

  const refresh = async () => {
    const res = await getPersonnelListAction();
    if (res.ok) setPersonnelList(res.data);
  };

  const handleOpenCreate = () => {
    setFormData({
      personnelCode: `NKP-B-${Date.now().toString().slice(-3)}`,
      citizenId: "",
      monasticTitle: "",
      chaya: "",
      paliDegree: "",
      templeName: "",
      address: "",
      phone: "",
      academicRank: "ดร.",
      firstNameTh: "",
      lastNameTh: "",
      firstNameEn: "",
      lastNameEn: "",
      departmentId: departments[0]?.id ?? "",
      positionTh: "อาจารย์ประจำสาขาวิชา",
      positionEn: "Lecturer",
      personnelType: "ACADEMIC",
      email: "",
      phoneExt: "",
      roomNumber: "",
      avatarUrl: "",
      biographyTh: "",
      biographyEn: "",
      expertiseInput: "พระไตรปิฎกศึกษา, ปรัชญาพระพุทธศาสนา",
      orderIndex: 10,
      isActive: true,
    });
    setDialogMode("create");
  };

  const handleOpenEdit = (p: PersonnelDto) => {
    setFormData({
      id: p.id,
      personnelCode: p.personnelCode ?? "",
      citizenId: "",
      monasticTitle: p.monasticTitle ?? "",
      chaya: p.chaya ?? "",
      paliDegree: p.paliDegree ?? "",
      templeName: p.templeName ?? "",
      address: p.address ?? "",
      phone: p.phone ?? "",
      academicRank: p.academicRank ?? "",
      firstNameTh: p.firstNameTh,
      lastNameTh: p.lastNameTh,
      firstNameEn: p.firstNameEn,
      lastNameEn: p.lastNameEn,
      departmentId: p.departmentId ?? departments[0]?.id ?? "",
      positionTh: p.positionTh,
      positionEn: p.positionEn,
      personnelType: (p.personnelType as "ACADEMIC" | "SUPPORT") || "ACADEMIC",
      email: p.email ?? "",
      phoneExt: p.phoneExt ?? "",
      roomNumber: p.roomNumber ?? "",
      avatarUrl: p.avatarUrl ?? "",
      biographyTh: p.biographyTh ?? "",
      biographyEn: p.biographyEn ?? "",
      expertiseInput: p.expertise.join(", "),
      orderIndex: p.orderIndex,
      isActive: p.isActive,
    });
    setDialogMode("edit");
  };

  const handleSubmit = () => {
    if (!formData.firstNameTh.trim() || !formData.lastNameTh.trim()) {
      toast.error(t("personnel.nameTh") + " required");
      return;
    }
    if (!formData.firstNameEn.trim() || !formData.lastNameEn.trim()) {
      toast.error(t("personnel.nameEn") + " required");
      return;
    }

    const expertise = formData.expertiseInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      expertise,
    };

    startTransition(async () => {
      if (dialogMode === "create") {
        const res = await createPersonnelAction(payload);
        if (res.ok) {
          toast.success(t("personnel.createSuccess"));
          setDialogMode(null);
          await refresh();
        } else {
          toast.error(res.error.message);
        }
      } else if (dialogMode === "edit") {
        const res = await updatePersonnelAction(payload);
        if (res.ok) {
          toast.success(t("personnel.updateSuccess"));
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
      const res = await deletePersonnelAction(deleteTarget.id);
      if (res.ok) {
        toast.success(t("personnel.deleteSuccess"));
        setDeleteTarget(null);
        await refresh();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  const filtered = personnelList.filter((p) => {
    const matchesSearch =
      p.fullNameTh.toLowerCase().includes(search.toLowerCase()) ||
      p.fullNameEn.toLowerCase().includes(search.toLowerCase()) ||
      p.positionTh.toLowerCase().includes(search.toLowerCase()) ||
      p.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = selectedDept === "ALL" || p.departmentId === selectedDept;
    const matchesType = selectedType === "ALL" || p.personnelType === selectedType;
    return matchesSearch && matchesDept && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("personnel.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("personnel.subtitle")}</p>
        </div>
        {canManage && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("personnel.create")}
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
              placeholder="ค้นหาชื่อ, ตำแหน่ง หรือความเชี่ยวชาญ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกภาควิชา/สังกัด --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {locale === "en" ? d.nameEn : d.nameTh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกประเภทบุคลากร --</option>
              <option value="ACADEMIC">{t("personnel.type.academic")}</option>
              <option value="SUPPORT">{t("personnel.type.support")}</option>
            </select>
          </div>
        </div>
      </LiyonCard>

      {/* Personnel Table */}
      <LiyonCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">บุคลากร</th>
                <th className="px-4 py-3">ตำแหน่ง / สังกัด</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">การติดต่อ</th>
                <th className="px-4 py-3 text-center">ลำดับ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t("personnel.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.fullNameTh}
                            className="h-10 w-10 rounded-full object-cover border mt-0.5"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.personnelCode && (
                              <span className="font-mono text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded border border-primary/20">
                                {item.personnelCode}
                              </span>
                            )}
                            <span className="font-semibold text-foreground text-sm">
                              {item.fullNameTh}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground italic">{item.fullNameEn}</div>

                          {item.citizenIdMasked && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded w-fit border">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              <span>{unmaskedCids[item.id] || item.citizenIdMasked}</span>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleReveal(item.id)}
                                  className="p-0.5 text-muted-foreground hover:text-foreground"
                                  title={unmaskedCids[item.id] ? "ซ่อนเลขบัตร ปชช." : "แสดงเลขบัตร ปชช. เต็ม (บันทึก Audit Log)"}
                                >
                                  {unmaskedCids[item.id] ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{item.positionTh}</div>
                      <div className="text-xs text-muted-foreground">
                        {locale === "en" ? item.departmentNameEn : item.departmentNameTh}
                      </div>
                      {item.templeName && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          วัด: {item.templeName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {item.personnelType === "ACADEMIC" ? t("personnel.type.academic") : t("personnel.type.support")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {item.phone && (
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3 text-primary" />
                          {item.phone}
                        </div>
                      )}
                      {!item.phone && item.phoneExt && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          ต่อ {item.phoneExt}
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {item.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap text-xs text-muted-foreground">
                      {item.orderIndex}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill tone={item.isActive ? "ok" : "off"}>
                        {item.isActive ? t("personnel.status.active") : t("personnel.status.inactive")}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/personnel/${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="ดูหน้าโปรไฟล์สาธารณะ"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title={t("personnel.edit")}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="rounded p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                              title={t("personnel.delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
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
            title={dialogMode === "create" ? t("personnel.create") : t("personnel.edit")}
            description="บันทึกข้อมูลประวัติและสายงานของบุคลากร"
          />
          <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            {/* รหัสบุคลากร และ ข้อมูล PDPA */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-3 bg-muted/40 rounded-lg border">
              <LiyonField label="เลขที่ประจำตัวบุคลากร (Personnel Code)">
                <input
                  type="text"
                  value={formData.personnelCode}
                  onChange={(e) => setFormData({ ...formData, personnelCode: e.target.value })}
                  placeholder="เช่น NKP-B-001"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </LiyonField>

              <LiyonField label="เลขประจำตัวประชาชน 13 หลัก (PDPA Protection)">
                <input
                  type="text"
                  value={formData.citizenId}
                  onChange={(e) => setFormData({ ...formData, citizenId: e.target.value })}
                  placeholder={dialogMode === "edit" ? "(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)" : "1-XXXX-XXXXX-XX-X"}
                  maxLength={17}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </LiyonField>
            </div>

            {/* ข้อมูลสมณศักดิ์ / ฉายา / เปรียญธรรม สำหรับบรรพชิต */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/40">
              <LiyonField label="สมณศักดิ์ (Monastic Title)">
                <input
                  type="text"
                  value={formData.monasticTitle}
                  onChange={(e) => setFormData({ ...formData, monasticTitle: e.target.value })}
                  placeholder="เช่น พระราชสิริวัฒน์, พระมหา, พระครูวิสุทธิ์ธีรคุณ"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="ฉายา (Chaya)">
                <input
                  type="text"
                  value={formData.chaya}
                  onChange={(e) => setFormData({ ...formData, chaya: e.target.value })}
                  placeholder="เช่น ฐิตปญฺโญ, ปิยธมฺโม"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="เปรียญธรรม (Pali Degree)">
                <input
                  type="text"
                  value={formData.paliDegree}
                  onChange={(e) => setFormData({ ...formData, paliDegree: e.target.value })}
                  placeholder="เช่น ป.ธ.๙, ป.ธ.๗, น.ธ.เอก"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <LiyonField label={t("personnel.rank")}>
                <input
                  type="text"
                  value={formData.academicRank}
                  onChange={(e) => setFormData({ ...formData, academicRank: e.target.value })}
                  placeholder="เช่น ศ.ดร., ผศ., อ."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="ชื่อ (ภาษาไทย)">
                <input
                  type="text"
                  value={formData.firstNameTh}
                  onChange={(e) => setFormData({ ...formData, firstNameTh: e.target.value })}
                  placeholder="เช่น สุรเชษฐ์"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="นามสกุล (ภาษาไทย)">
                <input
                  type="text"
                  value={formData.lastNameTh}
                  onChange={(e) => setFormData({ ...formData, lastNameTh: e.target.value })}
                  placeholder="เช่น สุวรรณสิทธิ์"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LiyonField label="First Name (English)">
                <input
                  type="text"
                  value={formData.firstNameEn}
                  onChange={(e) => setFormData({ ...formData, firstNameEn: e.target.value })}
                  placeholder="e.g. Suraphet"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="Last Name (English)">
                <input
                  type="text"
                  value={formData.lastNameEn}
                  onChange={(e) => setFormData({ ...formData, lastNameEn: e.target.value })}
                  placeholder="e.g. Suwannasit"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LiyonField label={t("personnel.department")}>
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

              <LiyonField label={t("personnel.type")}>
                <select
                  value={formData.personnelType}
                  onChange={(e) => setFormData({ ...formData, personnelType: e.target.value as "ACADEMIC" | "SUPPORT" })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ACADEMIC">{t("personnel.type.academic")}</option>
                  <option value="SUPPORT">{t("personnel.type.support")}</option>
                </select>
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LiyonField label={t("personnel.positionTh")}>
                <input
                  type="text"
                  value={formData.positionTh}
                  onChange={(e) => setFormData({ ...formData, positionTh: e.target.value })}
                  placeholder="เช่น คณบดี, รองคณบดีฝ่ายวิชาการ, อาจารย์ประจำ"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("personnel.positionEn")}>
                <input
                  type="text"
                  value={formData.positionEn}
                  onChange={(e) => setFormData({ ...formData, positionEn: e.target.value })}
                  placeholder="e.g. Dean, Associate Dean, Lecturer"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-3 bg-muted/20 rounded-lg border">
              <LiyonField label="เบอร์โทรศัพท์ (มือถือ / ติดต่อโดยตรง)">
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="เช่น 089-123-4567, 042-530-801"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="วัดต้นสังกัด / พำนัก (สำหรับบรรพชิต)">
                <input
                  type="text"
                  value={formData.templeName}
                  onChange={(e) => setFormData({ ...formData, templeName: e.target.value })}
                  placeholder="เช่น วัดพระธาตุพนม วรมหาวิหาร, วัดสว่างสุวรรณาราม"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <div className="sm:col-span-2">
                <LiyonField label="ที่อยู่สำหรับติดต่อราชการ / กุฏิที่พัก">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="เช่น วิทยาลัยสงฆ์นครพนม มจร ต.ขามเฒ่า อ.เมือง จ.นครพนม 48000"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </LiyonField>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <LiyonField label={t("personnel.email")}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="lecturer@faculty.edu"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("personnel.phone")}>
                <input
                  type="text"
                  value={formData.phoneExt}
                  onChange={(e) => setFormData({ ...formData, phoneExt: e.target.value })}
                  placeholder="เช่น 1201-3"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("personnel.room")}>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="เช่น อาคาร 1 ห้อง 402"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <LiyonField label={t("personnel.avatar")}>
              <input
                type="text"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("personnel.expertise")}>
              <input
                type="text"
                value={formData.expertiseInput}
                onChange={(e) => setFormData({ ...formData, expertiseInput: e.target.value })}
                placeholder="เช่น Artificial Intelligence, Big Data, Cloud Computing"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("personnel.bioTh")}>
              <textarea
                rows={3}
                value={formData.biographyTh}
                onChange={(e) => setFormData({ ...formData, biographyTh: e.target.value })}
                placeholder="ประวัติการศึกษาและการทำงานโดยย่อ..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t">
              <LiyonField label={t("personnel.order")}>
                <input
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isActivePersonnel"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="isActivePersonnel" className="text-sm font-medium text-foreground cursor-pointer">
                  {t("personnel.status.active")}
                </label>
              </div>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={isPending}>
              {t("personnel.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "กำลังบันทึก..." : t("personnel.save")}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <LiyonDialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <LiyonDialogHeader
            title={t("personnel.delete")}
            description={t("personnel.deleteConfirm")}
          />
          <LiyonDialogBody>
            <div className="rounded-md border p-3 bg-muted/40">
              <p className="font-semibold text-foreground">{deleteTarget.fullNameTh}</p>
              <p className="text-xs text-muted-foreground">{deleteTarget.positionTh}</p>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              {t("personnel.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "กำลังลบ..." : t("personnel.delete")}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}
    </div>
  );
}
