"use client";

import { useState, useTransition, useRef, type DragEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload, FileText, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBreadcrumbTail, StatusPill, LiyonCard } from "@/shared/components/liyon";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { importUsersCsvAction } from "@/features/identity/actions";

interface RoleItem {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
}

interface UserImportClientProps {
  roles: RoleItem[];
  isSuperAdmin: boolean;
}

interface ParsedRow {
  id: string;
  rowNumber: number;
  name: string;
  email: string;
  roleCode: string;
  status: "active" | "inactive";
  isValid: boolean;
  errorKey?: string;
  errorMessage?: string;
}

interface ImportSummary {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; email: string; message: string }[];
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentVal.trim());
        currentVal = "";
      } else if (char === "\r" || char === "\n") {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        currentRow.push(currentVal.trim());
        if (currentRow.some((c) => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].map((h) => h.toLowerCase().trim());
  return { headers, rows: lines.slice(1) };
}

export function UserImportClient({ roles, isSuperAdmin }: UserImportClientProps) {
  const t = useT();
  const locale = useLocale();
  useBreadcrumbTail([{ label: t("users.import.title") }]);

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleCodes = roles.map((r) => r.code);
  const roleCodeSet = new Set(roleCodes.map((c) => c.toUpperCase()));

  const downloadTemplate = () => {
    const header = "name,email,role,status";
    const sampleRows = [
      `"พระมหาสุรเพชร วชิรญาโณ","suraphet@example.com","ADMIN","active"`,
      `"นายวิชัย สมบูรณ์","wichai@example.com","STAFF","active"`,
      `"นางสาวกัญญา พรหมดี","kanya@example.com","VIEWER","active"`,
    ];
    const content = "\uFEFF" + [header, ...sampleRows].join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      toast.error(locale === "th" ? "กรุณาเลือกไฟล์ .csv เท่านั้น" : "Please select a .csv file only");
      return;
    }

    try {
      const text = await selectedFile.text();
      const { headers, rows: rawRows } = parseCsv(text);

      if (headers.length === 0 || rawRows.length === 0) {
        toast.error(locale === "th" ? "ไฟล์ว่างเปล่าหรือไม่พบข้อมูล" : "The CSV file is empty or invalid");
        return;
      }

      const nameIdx = headers.findIndex((h) => h === "name" || h === "ชื่อ" || h === "ชื่อ-นามสกุล");
      const emailIdx = headers.findIndex((h) => h === "email" || h === "อีเมล");
      const roleIdx = headers.findIndex((h) => h === "role" || h === "บทบาท" || h === "rolecode");
      const statusIdx = headers.findIndex((h) => h === "status" || h === "สถานะ");

      if (nameIdx === -1 || emailIdx === -1 || roleIdx === -1) {
        toast.error(
          locale === "th"
            ? "หัวคอลัมน์ไม่ถูกต้อง ต้องมี name, email, role (และ status เพิ่มเติมได้)"
            : "Missing required column headers: name, email, role",
        );
        return;
      }

      const seenEmails = new Set<string>();
      const parsed: ParsedRow[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowNumber = i + 2; // +1 for 1-based, +1 for header
        const name = (row[nameIdx] ?? "").trim();
        const rawEmail = (row[emailIdx] ?? "").trim();
        const email = rawEmail.toLowerCase();
        const roleCode = (row[roleIdx] ?? "").trim().toUpperCase();
        const rawStatus = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].trim().toLowerCase() : "active";
        const status = rawStatus === "inactive" ? "inactive" : "active";

        let isValid = true;
        let errorKey: string | undefined;

        if (!name) {
          isValid = false;
          errorKey = "users.import.err.nameRequired";
        } else if (!email || !email.includes("@") || !email.includes(".")) {
          isValid = false;
          errorKey = "users.import.err.invalidEmail";
        } else if (seenEmails.has(email)) {
          isValid = false;
          errorKey = "users.import.err.dupInFile";
        } else if (!roleCodeSet.has(roleCode)) {
          isValid = false;
          errorKey = "users.import.err.roleNotFound";
        } else if (roleCode === "SUPER_ADMIN" && !isSuperAdmin) {
          isValid = false;
          errorKey = "users.import.err.superAdminProtected";
        }

        if (email) {
          seenEmails.add(email);
        }

        parsed.push({
          id: `row-${i}-${Date.now()}`,
          rowNumber,
          name,
          email,
          roleCode,
          status,
          isValid,
          errorKey,
        });
      }

      setFile(selectedFile);
      setRows(parsed);
      setSummary(null);
    } catch {
      toast.error(locale === "th" ? "เกิดข้อผิดพลาดในการอ่านไฟล์" : "Failed to read file");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void processFile(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void processFile(f);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleReset = () => {
    setFile(null);
    setRows([]);
    setSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);

  const handleSubmit = () => {
    if (validRows.length === 0) return;

    startTransition(async () => {
      const payload = {
        rows: validRows.map((r) => ({
          name: r.name,
          email: r.email,
          roleCode: r.roleCode,
          status: r.status,
        })),
      };

      const result = await importUsersCsvAction(payload);
      if (!result.ok) {
        toast.error(t("common.error"));
        return;
      }

      setSummary(result.data);
      if (result.data.success > 0) {
        toast.success(t("users.import.resultSuccess", { n: result.data.success }));
      }
      if (result.data.failed > 0) {
        toast.error(t("users.import.resultFailed", { n: result.data.failed }));
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/users">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {t("users.import.back")}
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("users.import.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("users.import.subtitle")}</p>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-1.5" />
          {t("users.import.downloadTemplate")}
        </Button>
      </div>

      {/* Guide card */}
      <LiyonCard className="p-5 space-y-3 bg-muted/30 border">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          {t("users.import.guideTitle")}
        </h2>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>{t("users.import.guideStep1")}</li>
          <li>{t("users.import.guideStep2")}</li>
          <li>
            {t("users.import.guideStep3", {
              roles: roleCodes.join(", "),
            })}
          </li>
        </ul>
        <div className="pt-2 flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            {locale === "th" ? "บทบาทที่มีในระบบ:" : "Available Roles:"}
          </span>
          {roles.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-background border text-foreground"
            >
              {r.code}
              <span className="text-muted-foreground ml-1 font-sans">
                ({locale === "th" ? r.nameTh : r.nameEn})
              </span>
            </span>
          ))}
        </div>
      </LiyonCard>

      {/* Result summary banner when finished */}
      {summary && (
        <div className="p-5 rounded-lg border bg-card space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              {t("users.import.resultDoneTitle")}
            </h2>
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link href="/users">
                  <Users className="w-4 h-4 mr-1.5" />
                  {t("users.import.viewUsersBtn")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                {t("users.import.importMoreBtn")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded border bg-muted/20 text-center">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-xs text-muted-foreground">
                {locale === "th" ? "รายการทั้งหมดที่ส่ง" : "Total submitted"}
              </div>
            </div>
            <div className="p-3.5 rounded border border-green-200 bg-green-50/50 dark:bg-green-950/20 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.success}</div>
              <div className="text-xs text-green-700 dark:text-green-400">
                {locale === "th" ? "สร้างผู้ใช้สำเร็จ" : "Successfully created"}
              </div>
            </div>
            <div className="p-3.5 rounded border border-red-200 bg-red-50/50 dark:bg-red-950/20 text-center">
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-xs text-red-700 dark:text-red-400">
                {locale === "th" ? "ไม่สำเร็จ" : "Failed"}
              </div>
            </div>
          </div>

          {summary.errors.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {locale === "th" ? "รายละเอียดข้อผิดพลาดในการนำเข้า:" : "Import Error Details:"}
              </h3>
              <div className="max-h-48 overflow-y-auto border rounded text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-2 font-medium w-16">{t("users.import.colRow")}</th>
                      <th className="p-2 font-medium">{t("users.import.colEmail")}</th>
                      <th className="p-2 font-medium">{locale === "th" ? "สาเหตุ" : "Reason"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-muted/10">
                        <td className="p-2 font-mono text-muted-foreground">{err.row}</td>
                        <td className="p-2 font-mono">{err.email}</td>
                        <td className="p-2 text-destructive">
                          {err.message === "email_already_exists"
                            ? t("users.import.err.emailExists")
                            : err.message === "super_admin_protected"
                              ? t("users.import.err.superAdminProtected")
                              : err.message === "cannot_grant_unheld_permission"
                                ? t("users.import.err.unheldPerm")
                                : err.message === "role_not_found"
                                  ? t("users.import.err.roleNotFound")
                                  : err.message === "duplicate_email_in_file"
                                    ? t("users.import.err.dupInFile")
                                    : t("users.import.err.createFailed")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Zone (shown when no file or when resetting) */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/20"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-semibold">{t("users.import.uploadArea")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("users.import.uploadHint")}</p>
            </div>
            <Button type="button" variant="secondary" size="sm" className="mt-2 pointer-events-none">
              <Upload className="w-4 h-4 mr-1.5" />
              {locale === "th" ? "เลือกไฟล์ CSV" : "Choose CSV File"}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Table & Confirm Section */}
      {file && !summary && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded bg-muted">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("users.import.previewCount", {
                    total: rows.length,
                    valid: validRows.length,
                    invalid: invalidRows.length,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} disabled={pending}>
                <Trash2 className="w-4 h-4 mr-1.5" />
                {t("users.import.clearBtn")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={validRows.length === 0 || pending}
              >
                {pending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    {t("users.import.submitting")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    {t("users.import.submitBtn", { n: validRows.length })}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/70 sticky top-0 z-10 border-b text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3 w-14 text-center">{t("users.import.colRow")}</th>
                    <th className="p-3">{t("users.import.colName")}</th>
                    <th className="p-3">{t("users.import.colEmail")}</th>
                    <th className="p-3">{t("users.import.colRole")}</th>
                    <th className="p-3">{t("users.import.colStatus")}</th>
                    <th className="p-3">{t("users.import.colValidation")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        !row.isValid ? "bg-red-50/20 dark:bg-red-950/10" : ""
                      }`}
                    >
                      <td className="p-3 text-center text-xs font-mono text-muted-foreground">
                        {row.rowNumber}
                      </td>
                      <td className="p-3 font-medium">{row.name || "-"}</td>
                      <td className="p-3 font-mono text-xs">{row.email || "-"}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-muted font-medium">
                          {row.roleCode || "-"}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        <StatusPill tone={row.status === "active" ? "ok" : "off"}>
                          {row.status === "active"
                            ? locale === "th"
                              ? "เปิดใช้งาน"
                              : "Active"
                            : locale === "th"
                              ? "ระงับชั่วคราว"
                              : "Inactive"}
                        </StatusPill>
                      </td>
                      <td className="p-3">
                        {row.isValid ? (
                          <StatusPill tone="ok">{t("users.import.statusReady")}</StatusPill>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>
                              {row.errorKey ? t(row.errorKey) : locale === "th" ? "ไม่ถูกต้อง" : "Invalid"}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
