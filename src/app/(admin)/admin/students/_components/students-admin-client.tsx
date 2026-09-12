"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonField,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { StudentDto, AdvisingRecordDto, StudentScholarshipDto, StudentStatus } from "@/features/students";
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  batchAssignAdvisorAction,
  createAdvisingRecordAction,
  createScholarshipAction,
  importStudentsAction,
  getStudentDetailAction,
} from "@/features/students/actions";
import {
  School,
  GraduationCap,
  Users,
  ShieldAlert,
  AlertTriangle,
  Search,
  Plus,
  Edit2,
  Trash2,
  Upload,
  UserCheck,
  CheckCircle2,
  Lock,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  User,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";

interface ProgramItem {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
}

interface AdvisorItem {
  id: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  academicRank?: string | null;
}

interface StatsItem {
  total: number;
  advisees: number;
  probation: number;
  graduated: number;
}

interface Props {
  initialStudents: StudentDto[];
  programs: ProgramItem[];
  advisors: AdvisorItem[];
  stats: StatsItem;
  currentPersonnelId: string | null;
  currentPersonnelName: string | null;
  canManage: boolean;
  canBatchAssign: boolean;
  canLogAdvising: boolean;
  canManageScholarship: boolean;
  canReadConfidential: boolean;
}

export function StudentsAdminClient({
  initialStudents,
  programs,
  advisors,
  stats: initialStats,
  currentPersonnelId,
  currentPersonnelName,
  canManage,
  canBatchAssign,
  canLogAdvising,
  canManageScholarship,
  canReadConfidential: _canReadConfidential,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const isTh = locale === "th";

  const [students, setStudents] = useState<StudentDto[]>(initialStudents);
  const [stats, setStats] = useState<StatsItem>(initialStats);
  const [activeTab, setActiveTab] = useState<"advisees" | "all" | "batch">("advisees");
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  // Selection for batch assignment
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchAdvisorId, setBatchAdvisorId] = useState<string>("");

  // Modals
  const [studentModal, setStudentModal] = useState<{ mode: "create" | "edit"; student?: StudentDto } | null>(null);
  const [detailModalStudent, setDetailModalStudent] = useState<(StudentDto & { advisingRecords: AdvisingRecordDto[]; scholarships: StudentScholarshipDto[] }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [advisingModal, setAdvisingModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [scholarshipModal, setScholarshipModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [importModal, setImportModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentDto | null>(null);

  // Form states
  const [studentFormData, setStudentFormData] = useState({
    studentCode: "",
    title: "นาย",
    firstNameTh: "",
    lastNameTh: "",
    firstNameEn: "",
    lastNameEn: "",
    programId: programs[0]?.id || "",
    advisorId: "",
    admissionYear: 2569,
    status: "STUDYING" as StudentStatus,
    gpa: 3.0,
    email: "",
    phone: "",
    avatarUrl: "",
  });

  const [advisingFormData, setAdvisingFormData] = useState({
    advisorId: currentPersonnelId || advisors[0]?.id || "",
    topic: "",
    detail: "",
    actionPlan: "",
    isConfidential: false,
    date: new Date().toISOString().split("T")[0],
  });

  const [scholarshipFormData, setScholarshipFormData] = useState({
    scholarshipName: "",
    academicYear: 2569,
    amount: 10000,
  });

  const [csvText, setCsvText] = useState("");
  const [csvProgramId, setCsvProgramId] = useState(programs[0]?.id || "");
  const [csvAdvisorId, setCsvAdvisorId] = useState("");

  // Filtered Advisees (for current logged-in advisor)
  const adviseesList = students.filter((s) => s.advisorId === currentPersonnelId);

  // Filtered All Students
  const filteredStudents = students.filter((s) => {
    if (programFilter !== "ALL" && s.programId !== programFilter) return false;
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (riskFilter !== "ALL" && s.riskLevel !== riskFilter) return false;
    if (yearFilter !== "ALL" && s.admissionYear.toString() !== yearFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        s.studentCode.toLowerCase().includes(q) ||
        s.fullNameTh.toLowerCase().includes(q) ||
        s.fullNameEn.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Unique admission years
  const admissionYears = Array.from(new Set(students.map((s) => s.admissionYear))).sort((a, b) => b - a);

  // Handlers
  const handleOpenCreateStudent = () => {
    setStudentFormData({
      studentCode: "",
      title: "นาย",
      firstNameTh: "",
      lastNameTh: "",
      firstNameEn: "",
      lastNameEn: "",
      programId: programs[0]?.id || "",
      advisorId: currentPersonnelId || "",
      admissionYear: 2569,
      status: "STUDYING",
      gpa: 3.0,
      email: "",
      phone: "",
      avatarUrl: "",
    });
    setStudentModal({ mode: "create" });
  };

  const handleOpenEditStudent = (s: StudentDto) => {
    setStudentFormData({
      studentCode: s.studentCode,
      title: s.title,
      firstNameTh: s.firstNameTh,
      lastNameTh: s.lastNameTh,
      firstNameEn: s.firstNameEn,
      lastNameEn: s.lastNameEn,
      programId: s.programId,
      advisorId: s.advisorId || "",
      admissionYear: s.admissionYear,
      status: s.status,
      gpa: s.gpa,
      email: s.email || "",
      phone: s.phone || "",
      avatarUrl: s.avatarUrl || "",
    });
    setStudentModal({ mode: "edit", student: s });
  };

  const handleSaveStudent = () => {
    startTransition(async () => {
      if (studentModal?.mode === "create") {
        const res = await createStudentAction({
          ...studentFormData,
          advisorId: studentFormData.advisorId || null,
        });
        if (!res.ok) {
          alert(res.error.message || "เกิดข้อผิดพลาดในการบันทึก");
          return;
        }
        const newStudent = res.data;
        setStudents((prev) => [newStudent, ...prev]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          advisees: newStudent.advisorId === currentPersonnelId ? prev.advisees + 1 : prev.advisees,
          probation: newStudent.gpa < 2.0 ? prev.probation + 1 : prev.probation,
        }));
        setStudentModal(null);
      } else if (studentModal?.mode === "edit" && studentModal.student) {
        const res = await updateStudentAction({
          id: studentModal.student.id,
          ...studentFormData,
          advisorId: studentFormData.advisorId || null,
        });
        if (!res.ok) {
          alert(res.error.message || "เกิดข้อผิดพลาดในการบันทึก");
          return;
        }
        const updated = res.data;
        setStudents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setStudentModal(null);
      }
    });
  };

  const handleDeleteStudent = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteStudentAction(deleteTarget.id);
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          probation: deleteTarget.gpa < 2.0 ? Math.max(0, prev.probation - 1) : prev.probation,
        }));
        setDeleteTarget(null);
      } else {
        alert(res.error?.message || "ไม่สามารถลบข้อมูลได้");
      }
    });
  };

  const handleOpenDetail = async (student: StudentDto) => {
    setDetailLoading(true);
    setDetailModalStudent({
      ...student,
      advisingRecords: [],
      scholarships: [],
    });
    const res = await getStudentDetailAction(student.id, currentPersonnelId || undefined);
    if (res.ok && res.data) {
      setDetailModalStudent(res.data);
    }
    setDetailLoading(false);
  };

  const handleOpenAdvisingModal = (studentId: string, studentName: string) => {
    setAdvisingFormData({
      advisorId: currentPersonnelId || advisors[0]?.id || "",
      topic: "",
      detail: "",
      actionPlan: "",
      isConfidential: false,
      date: new Date().toISOString().split("T")[0],
    });
    setAdvisingModal({ studentId, studentName });
  };

  const handleSaveAdvising = () => {
    if (!advisingModal) return;
    startTransition(async () => {
      const res = await createAdvisingRecordAction({
        studentId: advisingModal.studentId,
        advisorId: advisingFormData.advisorId,
        topic: advisingFormData.topic,
        detail: advisingFormData.detail,
        actionPlan: advisingFormData.actionPlan || null,
        isConfidential: advisingFormData.isConfidential,
        date: advisingFormData.date,
      });
      if (!res.ok) {
        alert(res.error.message || "เกิดข้อผิดพลาดในการบันทึกการให้คำปรึกษา");
        return;
      }
      if (detailModalStudent && detailModalStudent.id === advisingModal.studentId) {
        setDetailModalStudent({
          ...detailModalStudent,
          advisingRecords: [res.data, ...detailModalStudent.advisingRecords],
        });
      }
      setAdvisingModal(null);
    });
  };

  const handleSaveScholarship = () => {
    if (!scholarshipModal) return;
    startTransition(async () => {
      const res = await createScholarshipAction({
        studentId: scholarshipModal.studentId,
        scholarshipName: scholarshipFormData.scholarshipName,
        academicYear: scholarshipFormData.academicYear,
        amount: scholarshipFormData.amount,
      });
      if (!res.ok) {
        alert(res.error.message || "เกิดข้อผิดพลาดในการบันทึกทุนการศึกษา");
        return;
      }
      if (detailModalStudent && detailModalStudent.id === scholarshipModal.studentId) {
        setDetailModalStudent({
          ...detailModalStudent,
          scholarships: [res.data, ...detailModalStudent.scholarships],
        });
      }
      setScholarshipModal(null);
    });
  };

  const handleBatchAssign = () => {
    if (selectedIds.length === 0) {
      alert("กรุณาเลือกนิสิตอย่างน้อย 1 คน");
      return;
    }
    startTransition(async () => {
      const res = await batchAssignAdvisorAction({
        studentIds: selectedIds,
        advisorId: batchAdvisorId || null,
      });
      if (res.ok) {
        const targetAdv = advisors.find((a) => a.id === batchAdvisorId);
        setStudents((prev) =>
          prev.map((s) => {
            if (selectedIds.includes(s.id)) {
              return {
                ...s,
                advisorId: batchAdvisorId || null,
                advisorNameTh: targetAdv ? `${targetAdv.firstNameTh} ${targetAdv.lastNameTh}` : undefined,
                advisorNameEn: targetAdv ? `${targetAdv.firstNameEn} ${targetAdv.lastNameEn}` : undefined,
              };
            }
            return s;
          })
        );
        setSelectedIds([]);
        alert(`มอบหมายอาจารย์ที่ปรึกษาให้นิสิตจำนวน ${res.data?.count} คนเรียบร้อยแล้ว`);
      } else {
        alert(res.error?.message || "เกิดข้อผิดพลาดในการมอบหมายอาจารย์ที่ปรึกษา");
      }
    });
  };

  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    startTransition(async () => {
      const lines = csvText.split("\n").filter((l) => l.trim().length > 0);
      const items = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          studentCode: parts[0] || "",
          title: parts[1] || "นาย",
          firstNameTh: parts[2] || "",
          lastNameTh: parts[3] || "",
          firstNameEn: parts[4] || "",
          lastNameEn: parts[5] || "",
          admissionYear: parseInt(parts[6]) || 2569,
          gpa: parseFloat(parts[7]) || 0.0,
          email: parts[8] || null,
          phone: parts[9] || null,
        };
      });

      const res = await importStudentsAction({
        programId: csvProgramId,
        advisorId: csvAdvisorId || null,
        items,
      });

      if (!res.ok) {
        alert(res.error.message || "ไม่สามารถนำเข้าข้อมูลได้ ตรวจสอบรูปแบบ CSV");
        return;
      }

      alert(`นำเข้าข้อมูลนิสิตสำเร็จ ${res.data.created} คน`);
      setImportModal(false);
      setCsvText("");
      window.location.reload();
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <School className="h-5 w-5" />
            <span>{t("roles.module.student")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
            {t("students.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("students.description")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/verify-student" target="_blank">
              <ExternalLink className="h-4 w-4" />
              <span>{isTh ? "หน้าตรวจสอบสถานะนิสิต (Public)" : "Verify Portal"}</span>
            </Link>
          </Button>

          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setImportModal(true)}
            >
              <Upload className="h-4 w-4" />
              <span>{t("students.importCsv")}</span>
            </Button>
          )}

          {canManage && (
            <Button
              size="sm"
              className="gap-1.5 font-semibold"
              onClick={handleOpenCreateStudent}
            >
              <Plus className="h-4 w-4" />
              <span>{t("students.add")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <LiyonCard className="p-4 bg-card border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("students.totalCount")}
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">{stats.total}</div>
          <span className="text-xs text-muted-foreground">{isTh ? "นิสิตทั้งหมดในคณะ" : "Total in Faculty"}</span>
        </LiyonCard>

        <LiyonCard className="p-4 bg-card border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("students.adviseesCount")}
            </span>
            <UserCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-primary mt-2">
            {currentPersonnelId ? adviseesList.length : stats.advisees}
          </div>
          <span className="text-xs text-muted-foreground">
            {currentPersonnelName ? `อ.${currentPersonnelName}` : isTh ? "ในความดูแลของท่าน" : "Your advisees"}
          </span>
        </LiyonCard>

        <LiyonCard className="p-4 bg-card border rounded-xl shadow-2xs border-red-200 dark:border-red-950 bg-red-50/30 dark:bg-red-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              {t("students.probationCount")}
            </span>
            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">{stats.probation}</div>
          <span className="text-xs text-red-600/80 dark:text-red-400/80 font-medium">
            {isTh ? "GPA < 2.00 ต้องดูแลด่วน" : "GPA < 2.00 Needs attention"}
          </span>
        </LiyonCard>

        <LiyonCard className="p-4 bg-card border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("students.graduatedCount")}
            </span>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{stats.graduated}</div>
          <span className="text-xs text-muted-foreground">{isTh ? "สำเร็จการศึกษาแล้ว" : "Alumni"}</span>
        </LiyonCard>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-1">
        <button
          onClick={() => setActiveTab("advisees")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "advisees"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>{t("students.tab.advisees")}</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-background/20">
            {adviseesList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{t("students.tab.all")}</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-background/20">
            {students.length}
          </span>
        </button>

        {canBatchAssign && (
          <button
            onClick={() => setActiveTab("batch")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "batch"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>{t("students.tab.batch")}</span>
            {selectedIds.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold">
                {selectedIds.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab 1: My Advisees Grid */}
      {activeTab === "advisees" && (
        <div className="space-y-4">
          {adviseesList.length === 0 ? (
            <div className="bg-card border rounded-2xl p-12 text-center space-y-3">
              <UserCheck className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <h3 className="text-lg font-bold text-foreground">
                {isTh ? "ยังไม่มีนิสิตในความดูแลของท่าน" : "No Advisees Assigned Yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isTh
                  ? "ท่านยังไม่มีรายชื่อนิสิตที่ได้รับการมอบหมายเป็นอาจารย์ที่ปรึกษา หรือสามารถมอบหมายนิสิตได้ในแท็บ 'จับคู่อาจารย์ที่ปรึกษา'"
                  : "You do not have any students assigned as academic advisor yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adviseesList.map((student) => (
                <div
                  key={student.id}
                  className={`bg-card border rounded-2xl p-5 shadow-xs transition hover:shadow-md space-y-4 relative flex flex-col justify-between ${
                    student.riskLevel === "CRITICAL"
                      ? "border-red-300 dark:border-red-900 ring-1 ring-red-500/20"
                      : ""
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar, Code, Risk Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-base uppercase shrink-0">
                          {student.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={student.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                          ) : (
                            student.firstNameEn.charAt(0) || student.firstNameTh.charAt(0) || "S"
                          )}
                        </div>
                        <div>
                          <div className="font-mono text-xs font-semibold text-primary">
                            {student.studentCode}
                          </div>
                          <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug">
                            {isTh ? student.fullNameTh : student.fullNameEn}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {isTh ? `ชั้นปีที่ ${2570 - student.admissionYear}` : `Year ${2570 - student.admissionYear}`} (เข้าปี {student.admissionYear})
                          </span>
                        </div>
                      </div>

                      {/* Risk Badge */}
                      <div>
                        {student.riskLevel === "CRITICAL" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-xs animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            <span>GPA {student.gpa.toFixed(2)}</span>
                          </span>
                        )}
                        {student.riskLevel === "WARNING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                            <span>GPA {student.gpa.toFixed(2)}</span>
                          </span>
                        )}
                        {student.riskLevel === "NORMAL" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                            <span>GPA {student.gpa.toFixed(2)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Program & Status */}
                    <div className="text-xs space-y-1 bg-muted/30 p-2.5 rounded-lg">
                      <div className="font-medium text-foreground truncate">
                        📚 {isTh ? student.programNameTh : student.programNameEn}
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{t("students.status")}:</span>
                        <StatusPill
                          tone={
                            student.status === "STUDYING"
                              ? "ok"
                              : student.status === "ON_LEAVE"
                              ? "warn"
                              : student.status === "GRADUATED"
                              ? "info"
                              : "bad"
                          }
                        >
                          {t(`students.status.${student.status}`)}
                        </StatusPill>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {(student.email || student.phone) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {student.email && (
                          <span className="flex items-center gap-1 truncate" title={student.email}>
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{student.email}</span>
                          </span>
                        )}
                        {student.phone && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{student.phone}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1"
                      onClick={() => handleOpenDetail(student)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{isTh ? "ดูประวัติ & ไทม์ไลน์" : "Profile & Logs"}</span>
                    </Button>

                    {canLogAdvising && (
                      <Button
                        size="sm"
                        className="flex-1 text-xs gap-1 font-semibold"
                        onClick={() => handleOpenAdvisingModal(student.id, student.fullNameTh)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t("advising.newLog")}</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Students Table */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-card border rounded-xl p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("students.search")}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Program Filter */}
              <div>
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="w-full py-2 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL">{t("students.allPrograms")}</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {isTh ? p.nameTh : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL">{t("students.allStatuses")}</option>
                  <option value="STUDYING">{t("students.status.STUDYING")}</option>
                  <option value="ON_LEAVE">{t("students.status.ON_LEAVE")}</option>
                  <option value="GRADUATED">{t("students.status.GRADUATED")}</option>
                  <option value="RETIRED">{t("students.status.RETIRED")}</option>
                </select>
              </div>

              {/* Risk Level Filter */}
              <div>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="w-full py-2 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL">{isTh ? "ทุกระดับความเสี่ยง" : "All Risk Levels"}</option>
                  <option value="CRITICAL">{t("students.risk.CRITICAL")}</option>
                  <option value="WARNING">{t("students.risk.WARNING")}</option>
                  <option value="NORMAL">{t("students.risk.NORMAL")}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <div>
                {isTh
                  ? `แสดง ${filteredStudents.length} จากทั้งหมด ${students.length} รายการ`
                  : `Showing ${filteredStudents.length} of ${students.length} students`}
                {selectedIds.length > 0 && (
                  <span className="ml-2 font-bold text-primary">
                    ({isTh ? `เลือกอยู่ ${selectedIds.length} คน` : `${selectedIds.length} selected`})
                  </span>
                )}
              </div>

              {admissionYears.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span>{t("students.admissionYear")}:</span>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="py-1 px-2 text-xs rounded border border-input bg-background"
                  >
                    <option value="ALL">{t("students.allYears")}</option>
                    {admissionYears.map((y) => (
                      <option key={y} value={y.toString()}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3">{t("students.code")}</th>
                    <th className="p-3">{t("students.nameTh")}</th>
                    <th className="p-3">{t("students.program")}</th>
                    <th className="p-3">{t("students.advisor")}</th>
                    <th className="p-3 text-center">{t("students.gpa")}</th>
                    <th className="p-3 text-center">{t("students.status")}</th>
                    <th className="p-3 text-right">{isTh ? "จัดการ" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        {isTh ? "ไม่พบข้อมูลนิสิตที่ตรงกับเงื่อนไข" : "No student records found"}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition">
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => toggleSelectStudent(s.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 font-mono font-medium text-foreground">
                          {s.studentCode}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleOpenDetail(s)}
                            className="font-semibold text-primary hover:underline text-left"
                          >
                            {isTh ? s.fullNameTh : s.fullNameEn}
                          </button>
                          <div className="text-xs text-muted-foreground">
                            เข้าปี {s.admissionYear}
                          </div>
                        </td>
                        <td className="p-3 text-xs">
                          <span className="font-medium text-foreground">
                            {isTh ? s.programNameTh : s.programNameEn}
                          </span>
                        </td>
                        <td className="p-3 text-xs">
                          {s.advisorNameTh ? (
                            <span className="text-foreground">{isTh ? s.advisorNameTh : s.advisorNameEn}</span>
                          ) : (
                            <span className="text-muted-foreground/60 italic">{t("students.noAdvisor")}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 font-bold">
                            <span
                              className={
                                s.riskLevel === "CRITICAL"
                                  ? "text-red-600 font-black"
                                  : s.riskLevel === "WARNING"
                                  ? "text-amber-600"
                                  : "text-foreground"
                              }
                            >
                              {s.gpa.toFixed(2)}
                            </span>
                            {s.riskLevel === "CRITICAL" && (
                              <span title="กลุ่มวิทยาทัณฑ์">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <StatusPill
                            tone={
                              s.status === "STUDYING"
                                ? "ok"
                                : s.status === "ON_LEAVE"
                                ? "warn"
                                : s.status === "GRADUATED"
                                ? "info"
                                : "bad"
                            }
                          >
                            {t(`students.status.${s.status}`)}
                          </StatusPill>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenDetail(s)}
                              className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-muted"
                              title={t("students.detail")}
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            {canLogAdvising && (
                              <button
                                onClick={() => handleOpenAdvisingModal(s.id, s.fullNameTh)}
                                className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-muted"
                                title={t("advising.newLog")}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                            {canManage && (
                              <button
                                onClick={() => handleOpenEditStudent(s)}
                                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                title={t("students.edit")}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                            {canManage && (
                              <button
                                onClick={() => setDeleteTarget(s)}
                                className="p-1.5 rounded text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                title={t("students.delete")}
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
          </div>
        </div>
      )}

      {/* Tab 3: Batch Advisor Assignment */}
      {activeTab === "batch" && canBatchAssign && (
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>{t("students.batchTitle")}</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isTh
                ? "เลือกนิสิตจากตาราง และเลือกอาจารย์ที่ปรึกษาเพื่อทำการจับคู่แบบกลุ่มในคราวเดียว"
                : "Select multiple students and assign them to a primary advisor in batch."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LiyonField label={t("students.selectAdvisor")}>
              <select
                value={batchAdvisorId}
                onChange={(e) => setBatchAdvisorId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{isTh ? "-- ยกเลิกอาจารย์ที่ปรึกษา / ยังไม่กำหนด --" : "-- Unassign Advisor --"}</option>
                {advisors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.academicRank || ""} {isTh ? `${a.firstNameTh} ${a.lastNameTh}` : `${a.firstNameEn} ${a.lastNameEn}`}
                  </option>
                ))}
              </select>
            </LiyonField>

            <div className="flex flex-col justify-end">
              <div className="text-sm text-muted-foreground mb-2">
                {t("students.selectedCount")}:{" "}
                <span className="font-bold text-primary text-base">{selectedIds.length}</span> คน
              </div>
              <Button
                onClick={handleBatchAssign}
                disabled={selectedIds.length === 0 || isPending}
                className="gap-2 font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{t("students.applyBatch")}</span>
              </Button>
            </div>
          </div>

          {selectedIds.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 border border-dashed rounded-xl text-sm text-muted-foreground">
              {isTh
                ? "ยังไม่มีการเลือกนิสิต กรุณาไปที่แท็บ 'ทะเบียนนิสิตทั้งหมด' แล้วทำเครื่องหมายถูกที่หน้ารายชื่อนิสิตที่ต้องการ"
                : "No students selected. Please switch to 'All Students' tab and check the boxes for the students you want to batch assign."}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                {isTh ? "รายชื่อนิสิตที่เลือกมอบหมาย:" : "Selected Students for Assignment:"}
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-muted/20 rounded-lg">
                {students
                  .filter((s) => selectedIds.includes(s.id))
                  .map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-card border shadow-2xs"
                    >
                      <span className="font-mono text-primary font-bold">{s.studentCode}</span>
                      <span>{isTh ? s.fullNameTh : s.fullNameEn}</span>
                      <button
                        onClick={() => toggleSelectStudent(s.id)}
                        className="text-muted-foreground hover:text-destructive ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Create / Edit Student */}
      {studentModal && (
        <LiyonDialog open onOpenChange={(o) => !o && setStudentModal(null)}>
          <LiyonDialogHeader
            title={studentModal.mode === "create" ? t("students.add") : t("students.edit")}
            description={isTh ? "กรอกข้อมูลทะเบียนประวัตินิสิตและอาจารย์ที่ปรึกษา" : "Fill student profile and academic details"}
          />
          <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <LiyonField label={t("students.code")}>
                <input
                  type="text"
                  required
                  value={studentFormData.studentCode}
                  onChange={(e) => setStudentFormData({ ...studentFormData, studentCode: e.target.value })}
                  placeholder="เช่น 66010001"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </LiyonField>

              <LiyonField label={t("students.titleField")}>
                <select
                  value={studentFormData.title}
                  onChange={(e) => setStudentFormData({ ...studentFormData, title: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="นาย">นาย</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="นาง">นาง</option>
                  <option value="พระ">พระ</option>
                  <option value="สามเณร">สามเณร</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                </select>
              </LiyonField>

              <LiyonField label={t("students.admissionYear")}>
                <input
                  type="number"
                  value={studentFormData.admissionYear}
                  onChange={(e) => setStudentFormData({ ...studentFormData, admissionYear: parseInt(e.target.value) || 2569 })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("students.firstNameTh")}>
                <input
                  type="text"
                  required
                  value={studentFormData.firstNameTh}
                  onChange={(e) => setStudentFormData({ ...studentFormData, firstNameTh: e.target.value })}
                  placeholder="เช่น วรภพ"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
              <LiyonField label={t("students.lastNameTh")}>
                <input
                  type="text"
                  required
                  value={studentFormData.lastNameTh}
                  onChange={(e) => setStudentFormData({ ...studentFormData, lastNameTh: e.target.value })}
                  placeholder="เช่น สิริปัญญา"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("students.firstNameEn")}>
                <input
                  type="text"
                  required
                  value={studentFormData.firstNameEn}
                  onChange={(e) => setStudentFormData({ ...studentFormData, firstNameEn: e.target.value })}
                  placeholder="e.g. Woraphop"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
              <LiyonField label={t("students.lastNameEn")}>
                <input
                  type="text"
                  required
                  value={studentFormData.lastNameEn}
                  onChange={(e) => setStudentFormData({ ...studentFormData, lastNameEn: e.target.value })}
                  placeholder="e.g. Siripanya"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("students.program")}>
                <select
                  value={studentFormData.programId}
                  onChange={(e) => setStudentFormData({ ...studentFormData, programId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {isTh ? p.nameTh : p.nameEn}
                    </option>
                  ))}
                </select>
              </LiyonField>

              <LiyonField label={t("students.advisor")}>
                <select
                  value={studentFormData.advisorId}
                  onChange={(e) => setStudentFormData({ ...studentFormData, advisorId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{t("students.noAdvisor")}</option>
                  {advisors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.academicRank || ""} {isTh ? `${a.firstNameTh} ${a.lastNameTh}` : `${a.firstNameEn} ${a.lastNameEn}`}
                    </option>
                  ))}
                </select>
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("students.status")}>
                <select
                  value={studentFormData.status}
                  onChange={(e) => setStudentFormData({ ...studentFormData, status: e.target.value as StudentStatus })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="STUDYING">{t("students.status.STUDYING")}</option>
                  <option value="ON_LEAVE">{t("students.status.ON_LEAVE")}</option>
                  <option value="GRADUATED">{t("students.status.GRADUATED")}</option>
                  <option value="RETIRED">{t("students.status.RETIRED")}</option>
                </select>
              </LiyonField>

              <LiyonField label={t("students.gpa")}>
                <input
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="4.0"
                  value={studentFormData.gpa}
                  onChange={(e) => setStudentFormData({ ...studentFormData, gpa: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("students.email")}>
                <input
                  type="email"
                  value={studentFormData.email}
                  onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                  placeholder="student@fms.ac.th"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("students.phone")}>
                <input
                  type="text"
                  value={studentFormData.phone}
                  onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                  placeholder="08x-xxx-xxxx"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <LiyonField label={t("students.avatarUrl")}>
              <input
                type="text"
                value={studentFormData.avatarUrl}
                onChange={(e) => setStudentFormData({ ...studentFormData, avatarUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="ghost" onClick={() => setStudentModal(null)}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleSaveStudent} disabled={isPending} className="font-semibold">
              {isTh ? "บันทึกข้อมูล" : "Save Student"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Modal 2: Student Detail, Timeline & Scholarships */}
      {detailModalStudent && (
        <LiyonDialog open onOpenChange={(o) => !o && setDetailModalStudent(null)}>
          <LiyonDialogHeader
            title={
              <div className="flex items-center gap-3">
                <span>{isTh ? detailModalStudent.fullNameTh : detailModalStudent.fullNameEn}</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {detailModalStudent.studentCode}
                </span>
              </div>
            }
            description={
              <span>
                {isTh ? detailModalStudent.programNameTh : detailModalStudent.programNameEn} • เข้าปี {detailModalStudent.admissionYear}
              </span>
            }
          />
          <LiyonDialogBody className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Risk / GPA Banner */}
            <div
              className={`p-4 rounded-xl flex items-center justify-between gap-4 ${
                detailModalStudent.riskLevel === "CRITICAL"
                  ? "bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400"
                  : detailModalStudent.riskLevel === "WARNING"
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider">
                  {t("students.risk")}: {t(`students.risk.${detailModalStudent.riskLevel}`)}
                </div>
                <div className="text-xs">
                  {detailModalStudent.riskLevel === "CRITICAL"
                    ? isTh
                      ? "นิสิตมีเกรดเฉลี่ยสะสมต่ำกว่า 2.00 อยู่ในสภาวะวิทยาทัณฑ์ ต้องการการติดตามให้คำปรึกษาอย่างใกล้ชิด"
                      : "GPA is below 2.00 (Probation). Requires close advising."
                    : detailModalStudent.riskLevel === "WARNING"
                    ? isTh
                      ? "นิสิตมีเกรดเฉลี่ยระหว่าง 2.00 - 2.50 ควรเฝ้าระวังและแนะนำแผนการเรียน"
                      : "Academic warning (GPA 2.00 - 2.50)."
                    : isTh
                    ? "ผลการเรียนอยู่ในเกณฑ์ปกติ"
                    : "Normal academic standing."}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-2xl font-black">{detailModalStudent.gpa.toFixed(2)}</div>
                <div className="text-xs font-medium">{t("students.gpa")}</div>
              </div>
            </div>

            {/* Advisor & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/40 p-4 rounded-xl">
              <div>
                <span className="text-muted-foreground block">{t("students.advisor")}:</span>
                <span className="font-semibold text-foreground text-sm">
                  {detailModalStudent.advisorNameTh || t("students.noAdvisor")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">{t("students.status")}:</span>
                <StatusPill
                  tone={
                    detailModalStudent.status === "STUDYING"
                      ? "ok"
                      : detailModalStudent.status === "ON_LEAVE"
                      ? "warn"
                      : detailModalStudent.status === "GRADUATED"
                      ? "info"
                      : "bad"
                  }
                >
                  {t(`students.status.${detailModalStudent.status}`)}
                </StatusPill>
              </div>
              {detailModalStudent.email && (
                <div>
                  <span className="text-muted-foreground block">{t("students.email")}:</span>
                  <span className="font-medium text-foreground">{detailModalStudent.email}</span>
                </div>
              )}
              {detailModalStudent.phone && (
                <div>
                  <span className="text-muted-foreground block">{t("students.phone")}:</span>
                  <span className="font-medium text-foreground">{detailModalStudent.phone}</span>
                </div>
              )}
            </div>

            {/* Advising Records Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{t("advising.title")}</span>
                </h4>
                {canLogAdvising && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() => handleOpenAdvisingModal(detailModalStudent.id, detailModalStudent.fullNameTh)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t("advising.newLog")}</span>
                  </Button>
                )}
              </div>

              {detailLoading ? (
                <div className="text-xs text-muted-foreground p-4 text-center">กำลังโหลดประวัติ...</div>
              ) : detailModalStudent.advisingRecords.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  {t("advising.noRecords")}
                </div>
              ) : (
                <div className="space-y-3 relative border-l-2 border-primary/20 ml-2.5 pl-4">
                  {detailModalStudent.advisingRecords.map((rec) => (
                    <div key={rec.id} className="relative bg-card border rounded-xl p-4 shadow-2xs space-y-2">
                      {/* Timeline dot */}
                      <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-foreground text-sm">{rec.topic}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(rec.date).toLocaleDateString("th-TH")}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {rec.advisorNameTh || "อาจารย์ที่ปรึกษา"}
                            </span>
                          </div>
                        </div>

                        {rec.isConfidential && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Lock className="h-3 w-3" />
                            <span>{t("advising.confidentialBadge")}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/20 p-2.5 rounded-md">
                        {rec.detail}
                      </div>

                      {rec.actionPlan && (
                        <div className="text-xs bg-primary/5 border border-primary/10 p-2.5 rounded-md space-y-0.5">
                          <span className="font-semibold text-primary block">{t("advising.actionPlan")}:</span>
                          <span className="text-foreground/90">{rec.actionPlan}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scholarships Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>{t("scholarship.title")}</span>
                </h4>
                {canManageScholarship && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() => {
                      setScholarshipFormData({ scholarshipName: "", academicYear: 2569, amount: 10000 });
                      setScholarshipModal({ studentId: detailModalStudent.id, studentName: detailModalStudent.fullNameTh });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t("scholarship.add")}</span>
                  </Button>
                )}
              </div>

              {detailModalStudent.scholarships.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  {t("scholarship.noData")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detailModalStudent.scholarships.map((sch) => (
                    <div key={sch.id} className="bg-card border rounded-lg p-3 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{sch.scholarshipName}</div>
                        <div className="text-muted-foreground">ปีการศึกษา {sch.academicYear}</div>
                      </div>
                      <div className="font-bold text-emerald-600 text-sm">
                        {sch.amount.toLocaleString()} ฿
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button onClick={() => setDetailModalStudent(null)}>
              {isTh ? "ปิดหน้าต่าง" : "Close"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Modal 3: Advising Log Modal */}
      {advisingModal && (
        <LiyonDialog open onOpenChange={(o) => !o && setAdvisingModal(null)}>
          <LiyonDialogHeader
            title={t("advising.newLog")}
            description={`${isTh ? "บันทึกประวัติการให้คำปรึกษาสำหรับ" : "Log advising session for"}: ${advisingModal.studentName}`}
          />
          <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("advising.date")}>
                <input
                  type="date"
                  required
                  value={advisingFormData.date}
                  onChange={(e) => setAdvisingFormData({ ...advisingFormData, date: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("students.advisor")}>
                <select
                  value={advisingFormData.advisorId}
                  onChange={(e) => setAdvisingFormData({ ...advisingFormData, advisorId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {advisors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.academicRank || ""} {isTh ? `${a.firstNameTh} ${a.lastNameTh}` : `${a.firstNameEn} ${a.lastNameEn}`}
                    </option>
                  ))}
                </select>
              </LiyonField>
            </div>

            <LiyonField label={t("advising.topic")}>
              <input
                type="text"
                required
                value={advisingFormData.topic}
                onChange={(e) => setAdvisingFormData({ ...advisingFormData, topic: e.target.value })}
                placeholder="เช่น การวางแผนลงทะเบียนเรียน, ปัญหาการปรับตัว, ขอคำแนะนำการฝึกงาน"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("advising.detail")}>
              <textarea
                rows={4}
                required
                value={advisingFormData.detail}
                onChange={(e) => setAdvisingFormData({ ...advisingFormData, detail: e.target.value })}
                placeholder="รายละเอียดการสนทนา ปัญหาที่พบ และความก้าวหน้า..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("advising.actionPlan")}>
              <textarea
                rows={2}
                value={advisingFormData.actionPlan}
                onChange={(e) => setAdvisingFormData({ ...advisingFormData, actionPlan: e.target.value })}
                placeholder="ข้อตกลง แนวทางปฏิบัติ หรือการนัดหมายครั้งถัดไป..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            {/* Confidential Toggle (PDPA Rule) */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advisingFormData.isConfidential}
                  onChange={(e) => setAdvisingFormData({ ...advisingFormData, isConfidential: e.target.checked })}
                  className="rounded h-4 w-4"
                />
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span>{t("advising.isConfidential")}</span>
                </span>
              </label>
              <p className="text-xs text-muted-foreground pl-6">
                {t("advising.confidentialHelp")}
              </p>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="ghost" onClick={() => setAdvisingModal(null)}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleSaveAdvising} disabled={isPending} className="font-semibold">
              {isTh ? "บันทึกคำปรึกษา" : "Save Advising Log"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Modal 4: Scholarship Modal */}
      {scholarshipModal && (
        <LiyonDialog open onOpenChange={(o) => !o && setScholarshipModal(null)}>
          <LiyonDialogHeader
            title={t("scholarship.add")}
            description={`${isTh ? "เพิ่มประวัติการรับทุนการศึกษาของ" : "Add scholarship record for"}: ${scholarshipModal.studentName}`}
          />
          <LiyonDialogBody className="space-y-4">
            <LiyonField label={t("scholarship.name")}>
              <input
                type="text"
                required
                value={scholarshipFormData.scholarshipName}
                onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, scholarshipName: e.target.value })}
                placeholder="เช่น ทุนเรียนดีคณะวิทยาการ, ทุนช่วยเหลือนิสิตขาดแคลน"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("scholarship.year")}>
                <input
                  type="number"
                  value={scholarshipFormData.academicYear}
                  onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, academicYear: parseInt(e.target.value) || 2569 })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("scholarship.amount")}>
                <input
                  type="number"
                  min="0"
                  value={scholarshipFormData.amount}
                  onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="ghost" onClick={() => setScholarshipModal(null)}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleSaveScholarship} disabled={isPending} className="font-semibold">
              {isTh ? "บันทึกทุน" : "Save Scholarship"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Modal 5: Import CSV Modal */}
      {importModal && (
        <LiyonDialog open onOpenChange={(o) => !o && setImportModal(false)}>
          <LiyonDialogHeader
            title={t("students.importCsv")}
            description={t("students.importHelp")}
          />
          <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("students.program")}>
                <select
                  value={csvProgramId}
                  onChange={(e) => setCsvProgramId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {isTh ? p.nameTh : p.nameEn}
                    </option>
                  ))}
                </select>
              </LiyonField>

              <LiyonField label={isTh ? "อาจารย์ที่ปรึกษา (ถ้ามี)" : "Advisor (Optional)"}>
                <select
                  value={csvAdvisorId}
                  onChange={(e) => setCsvAdvisorId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{t("students.noAdvisor")}</option>
                  {advisors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.academicRank || ""} {isTh ? `${a.firstNameTh} ${a.lastNameTh}` : `${a.firstNameEn} ${a.lastNameEn}`}
                    </option>
                  ))}
                </select>
              </LiyonField>
            </div>

            <LiyonField label={isTh ? "ข้อมูล CSV (1 บรรทัดต่อนิสิต 1 คน)" : "CSV Data (1 row per student)"}>
              <textarea
                rows={7}
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="66010010, นาย, สมศักดิ์, รักเรียน, Somsak, Rakrian, 2566, 3.20, somsak@mail.com, 0812345678&#10;66010011, นางสาว, อารียา, ใจดี, Areeya, Jaidee, 2566, 1.85, areeya@mail.com, 0899998888"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
              />
            </LiyonField>

            <div className="bg-muted/40 p-3 rounded-lg text-xs text-muted-foreground">
              💡 {isTh ? "ระบบจะข้ามรายการที่มีรหัสนิสิตซ้ำในฐานข้อมูลโดยอัตโนมัติ" : "Existing student IDs will be skipped automatically."}
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="ghost" onClick={() => setImportModal(false)}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleImportCsv} disabled={!csvText.trim() || isPending} className="font-semibold gap-1.5">
              <Upload className="h-4 w-4" />
              <span>{isTh ? "นำเข้าข้อมูลทันที" : "Import Now"}</span>
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Modal 6: Delete Confirmation */}
      {deleteTarget && (
        <LiyonDialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <LiyonDialogHeader
            title={t("students.delete")}
            description={t("students.deleteConfirm")}
          />
          <LiyonDialogBody>
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
              {isTh ? deleteTarget.fullNameTh : deleteTarget.fullNameEn} ({deleteTarget.studentCode})
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleDeleteStudent} disabled={isPending}>
              {isTh ? "ยืนยันการลบ" : "Confirm Delete"}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}
    </div>
  );
}
