"use client";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2, Mail, Send, Eye, EyeOff, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiyonCard, LiyonField, LiyonSwitchRow, PalettePicker } from "@/shared/components/liyon";
import { useT } from "@/shared/lib/i18n/client";
import type { PaletteId } from "@/shared/lib/palette";
import type { TenantSettings } from "@/features/identity";
import { updateSettingsAction, uploadLogoAction, testSmtpConnectionAction } from "@/features/identity/actions";

export function SettingsForm({ initial }: { initial: TenantSettings }) {
  const t = useT();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nameTh: initial.nameTh,
    nameEn: initial.nameEn,
    logoUrl: initial.logoUrl ?? "",
    palette: initial.palette as PaletteId,
    smtp: {
      provider: "gmail" as const,
      enabled: initial.smtp?.enabled ?? false,
      user: initial.smtp?.user ?? "",
      pass: "",
      fromName: initial.smtp?.fromName ?? "",
      port: initial.smtp?.port ?? 465,
      secure: initial.smtp?.secure ?? true,
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [hasStoredPassword] = useState(initial.smtp?.hasPass ?? false);
  const [testRecipient, setTestRecipient] = useState(initial.smtp?.user ?? "");
  const [testing, setTesting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function handleTestEmail() {
    if (!testRecipient || !testRecipient.includes("@")) {
      toast.error("กรุณาระบุอีเมลผู้รับที่ถูกต้องสำหรับการทดสอบ");
      return;
    }
    if (!form.smtp.user || !form.smtp.user.includes("@")) {
      toast.error("กรุณากรอกบัญชี Gmail ผู้ส่ง");
      return;
    }
    if (!form.smtp.pass && !hasStoredPassword) {
      toast.error("กรุณากรอกรหัสผ่านสำหรับแอป (App Password 16 หลัก)");
      return;
    }

    setTesting(true);
    try {
      const res = await testSmtpConnectionAction({
        to: testRecipient,
        user: form.smtp.user,
        pass: form.smtp.pass || undefined,
        fromName: form.smtp.fromName || undefined,
        port: form.smtp.port,
        secure: form.smtp.secure,
      });
      if (res.ok) {
        toast.success(res.data.message || t("settings.smtpTestSuccess"));
      } else {
        const err =
          res.error.fieldErrors?.pass?.[0] ||
          res.error.fieldErrors?.user?.[0] ||
          res.error.fieldErrors?.to?.[0] ||
          (res.error.code ? t(`error.${res.error.code}`) : t("settings.smtpTestFailed"));
        toast.error(err);
      }
    } catch {
      toast.error(t("settings.smtpTestFailed"));
    } finally {
      setTesting(false);
    }
  }

  function save() {
    start(async () => {
      console.log("[SettingsForm] Saving form:", form);
      const r = await updateSettingsAction(form);
      if (!r.ok) {
        console.error("[SettingsForm] Save failed:", r.error);
        setErrors(r.error.fieldErrors ?? {});
        const firstErr = Object.values(r.error.fieldErrors ?? {})[0]?.[0];
        toast.error(firstErr || (r.error.code ? t(`error.${r.error.code}`) : t("common.error")));
        return;
      }
      console.log("[SettingsForm] Save succeeded!");
      setErrors({});
      toast.success(t("settings.saveOk"));
      router.refresh();
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("settings.logoHint"));
      return;
    }

    setUploading(true);
    try {
      console.log("[SettingsForm] Uploading file:", file.name, file.size, file.type);
      const fd = new FormData();
      fd.append("file", file);
      const r = await uploadLogoAction(fd);
      if (r.ok) {
        console.log("[SettingsForm] Upload success, new URL:", r.data.url);
        setForm((prev) => ({ ...prev, logoUrl: r.data.url }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.logoUrl;
          return next;
        });
        toast.success(t("settings.logoUploadSuccess"));
      } else {
        console.error("[SettingsForm] Upload failed:", r.error);
        const msg = r.error.fieldErrors?.file?.[0] || (r.error.code ? t(`error.${r.error.code}`) : t("settings.logoUploadError"));
        toast.error(msg);
      }
    } catch (err) {
      console.error("[SettingsForm] Upload exception:", err);
      toast.error(t("settings.logoUploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <header className="ph"><h1>{t("settings.title")}</h1></header>
      <div className="set-cards">
        <LiyonCard>
          <h2>{t("settings.orgTitle")}</h2>
          <div className="fields">
            <LiyonField label={t("settings.nameTh")} htmlFor="s-name-th" error={errors.nameTh?.[0]}><input id="s-name-th" value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} /></LiyonField>
            <LiyonField label={t("settings.nameEn")} htmlFor="s-name-en" error={errors.nameEn?.[0]}><input id="s-name-en" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></LiyonField>
            <LiyonField label={t("settings.logoUrl")} htmlFor="s-logo" hint={t("common.optional")} error={errors.logoUrl?.[0]}>
              <div className="space-y-3">
                <div className="logo-up">
                  <div className="prev">
                    {form.logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={form.logoUrl} alt="Logo" />
                    ) : (
                      <ImageIcon className="h-6 w-6 opacity-40" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || pending}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? t("settings.logoUploading") : t("settings.logoUpload")}
                    </Button>
                    {form.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm({ ...form, logoUrl: "" })}
                        disabled={uploading || pending}
                      >
                        <X className="h-4 w-4" />
                        {t("settings.logoRemove")}
                      </Button>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground block w-full">
                    {t("settings.logoHint")}
                  </span>
                </div>
                <input
                  id="s-logo"
                  type="text"
                  placeholder="https://... หรือ /uploads/..."
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  disabled={uploading || pending}
                />
              </div>
            </LiyonField>
          </div>
        </LiyonCard>
        <LiyonCard>
          <h2>{t("settings.smtpTitle")}</h2>
          <p>{t("settings.smtpDesc")}</p>
          <div className="fields space-y-4">
            <LiyonSwitchRow
              id="smtp-enabled"
              checked={form.smtp.enabled}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  smtp: { ...prev.smtp, enabled: checked },
                }))
              }
              disabled={pending || uploading}
              label={t("settings.smtpEnable")}
              description="ส่งอีเมลแจ้งเตือน บัญชีผู้ใช้ใหม่ และลิงก์รีเซ็ตรหัสผ่านผ่าน Gmail"
            />

            {form.smtp.enabled && (
              <>
                <LiyonField
                  label={t("settings.smtpUser")}
                  htmlFor="smtp-user"
                  hint="ใช้อีเมล @gmail.com หรือ Google Workspace"
                  error={errors["smtp.user"]?.[0]}
                >
                  <input
                    id="smtp-user"
                    type="email"
                    placeholder="example@gmail.com"
                    value={form.smtp.user}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        smtp: { ...prev.smtp, user: e.target.value },
                      }))
                    }
                    disabled={pending || uploading}
                  />
                </LiyonField>

                <LiyonField
                  label={t("settings.smtpPass")}
                  htmlFor="smtp-pass"
                  hint={hasStoredPassword && !form.smtp.pass ? t("settings.smtpPassConfigured") : t("settings.smtpPassHint")}
                  error={errors["smtp.pass"]?.[0]}
                >
                  <div className="relative flex items-center">
                    <input
                      id="smtp-pass"
                      type={showPassword ? "text" : "password"}
                      placeholder={hasStoredPassword ? "•••••••••••••••• (มีรหัสเดิมอยู่แล้ว)" : t("settings.smtpPassPlaceholder")}
                      value={form.smtp.pass}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          smtp: { ...prev.smtp, pass: e.target.value },
                        }))
                      }
                      disabled={pending || uploading}
                      className="pr-10 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </LiyonField>

                <LiyonField
                  label={t("settings.smtpFromName")}
                  htmlFor="smtp-from-name"
                  hint="ชื่อที่จะแสดงในช่อง 'จาก' เมื่อผู้รับเปิดอ่านอีเมล"
                  error={errors["smtp.fromName"]?.[0]}
                >
                  <input
                    id="smtp-from-name"
                    type="text"
                    placeholder="ระบบสารสนเทศ วิทยาลัยสงฆ์นครพนม"
                    value={form.smtp.fromName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        smtp: { ...prev.smtp, fromName: e.target.value },
                      }))
                    }
                    disabled={pending || uploading}
                  />
                </LiyonField>

                {/* Step by Step Guide */}
                <div className="p-3 bg-muted/40 rounded-lg text-sm border border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowGuide((prev) => !prev)}
                    className="flex items-center justify-between w-full font-medium text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-primary">
                      <HelpCircle className="h-4 w-4" />
                      {t("settings.smtpGuideTitle")}
                    </span>
                    <span className="text-xs text-muted-foreground">{showGuide ? "ซ่อนคำแนะนำ ▲" : "ดูขั้นตอน ▼"}</span>
                  </button>
                  {showGuide && (
                    <div className="mt-2.5 space-y-1.5 text-xs text-muted-foreground border-t pt-2">
                      <p>{t("settings.smtpGuideStep1")}</p>
                      <p>{t("settings.smtpGuideStep2")}</p>
                      <p>{t("settings.smtpGuideStep3")}</p>
                      <p>{t("settings.smtpGuideStep4")}</p>
                      <p className="text-amber-600 dark:text-amber-400 mt-1">
                        * หมายเหตุ: ไม่สามารถใช้รหัสผ่านสำหรับล็อกอินเข้า Gmail ทั่วไปได้ ต้องเป็นรหัสผ่านสำหรับแอป (App Password 16 หลัก) เท่านั้น
                      </p>
                    </div>
                  )}
                </div>

                {/* Test Email Connection Box */}
                <div className="p-4 bg-muted/20 rounded-lg border border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{t("settings.smtpTestTitle")}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("settings.smtpTestDesc")}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="recipient@example.com (ระบุอีเมลผู้รับทดสอบ)"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      disabled={testing || pending}
                      className="flex-1 text-sm px-3 py-1.5 border rounded-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestEmail}
                      disabled={testing || pending}
                      className="shrink-0"
                    >
                      {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                      {testing ? t("settings.smtpTesting") : t("settings.smtpTestBtn")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </LiyonCard>
        <LiyonCard>
          <h2>{t("settings.brandTitle")}</h2>
          <p>{t("settings.brandDesc")}</p>
          <PalettePicker value={form.palette} onChange={(p) => setForm({ ...form, palette: p })} label={t("settings.paletteLabel")} />
          {form.palette === "coral" && <p className="warn" role="note">{t("settings.coralWarn")}</p>}
        </LiyonCard>
        <div className="savebar"><Button type="button" onClick={save} disabled={pending || uploading}>{t("common.save")}</Button></div>
      </div>
    </>
  );
}
