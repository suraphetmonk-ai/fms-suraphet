import { cache } from "react";
import { prisma, type Db } from "@/shared/lib/infra/prisma";
import { DEFAULT_PALETTE, isPalette, type PaletteId } from "@/shared/lib/palette";
import { errors } from "@/shared/lib/errors";
import { writeAudit } from "../audit";
import type { UpdateSettingsInput } from "../validations/settings";

export interface TenantSmtpSettings {
  provider: "gmail";
  enabled: boolean;
  user: string;
  hasPass?: boolean;
  fromName: string;
  fromEmail?: string;
  port: number;
  secure: boolean;
}

export interface TenantContactSettings {
  addressTh?: string;
  addressEn?: string;
  phone?: string;
  email?: string;
  fax?: string;
  officeHours?: string;
  facebook?: string;
  lineId?: string;
  mapEmbedUrl?: string;
}

export interface TenantGeminiSettings {
  enabled: boolean;
  hasApiKey: boolean;
  model: string;
}

export interface TenantSettings {
  code: string;
  nameTh: string;
  nameEn: string;
  logoUrl: string | null;
  palette: PaletteId;
  smtp?: TenantSmtpSettings;
  contact?: TenantContactSettings;
  gemini?: TenantGeminiSettings;
}

async function readTenantSettings(tenantId: string, db: Db): Promise<TenantSettings> {
  const t = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!t) throw errors.not_found();
  const settingsObj = (t.settings && typeof t.settings === "object" ? t.settings : {}) as Record<string, unknown>;
  const p = settingsObj.palette;
  const rawSmtp = settingsObj.smtp as Record<string, unknown> | undefined;
  const rawContact = settingsObj.contact as Record<string, unknown> | undefined;
  const rawGemini = settingsObj.gemini as Record<string, unknown> | undefined;

  let smtp: TenantSmtpSettings | undefined = undefined;
  if (rawSmtp && typeof rawSmtp === "object") {
    smtp = {
      provider: "gmail",
      enabled: Boolean(rawSmtp.enabled),
      user: typeof rawSmtp.user === "string" ? rawSmtp.user : "",
      hasPass: Boolean(typeof rawSmtp.pass === "string" && rawSmtp.pass.trim().length > 0),
      fromName: typeof rawSmtp.fromName === "string" ? rawSmtp.fromName : "",
      fromEmail: typeof rawSmtp.fromEmail === "string" ? rawSmtp.fromEmail : "",
      port: typeof rawSmtp.port === "number" ? rawSmtp.port : 465,
      secure: rawSmtp.secure !== false,
    };
  }

  let contact: TenantContactSettings | undefined = undefined;
  if (rawContact && typeof rawContact === "object") {
    contact = {
      addressTh: typeof rawContact.addressTh === "string" ? rawContact.addressTh : "",
      addressEn: typeof rawContact.addressEn === "string" ? rawContact.addressEn : "",
      phone: typeof rawContact.phone === "string" ? rawContact.phone : "",
      email: typeof rawContact.email === "string" ? rawContact.email : "",
      fax: typeof rawContact.fax === "string" ? rawContact.fax : "",
      officeHours: typeof rawContact.officeHours === "string" ? rawContact.officeHours : "",
      facebook: typeof rawContact.facebook === "string" ? rawContact.facebook : "",
      lineId: typeof rawContact.lineId === "string" ? rawContact.lineId : "",
      mapEmbedUrl: typeof rawContact.mapEmbedUrl === "string" ? rawContact.mapEmbedUrl : "",
    };
  }

  let gemini: TenantGeminiSettings | undefined = undefined;
  if (rawGemini && typeof rawGemini === "object") {
    gemini = {
      enabled: Boolean(rawGemini.enabled),
      hasApiKey: Boolean(typeof rawGemini.apiKey === "string" && rawGemini.apiKey.trim().length > 0),
      model: typeof rawGemini.model === "string" && rawGemini.model.trim().length > 0 ? rawGemini.model : "gemini-2.5-flash",
    };
  } else {
    const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    gemini = {
      enabled: hasEnvKey,
      hasApiKey: hasEnvKey,
      model: "gemini-2.5-flash",
    };
  }

  return {
    code: t.code,
    nameTh: t.nameTh,
    nameEn: t.nameEn,
    logoUrl: t.logoUrl,
    palette: isPalette(p) ? p : DEFAULT_PALETTE,
    smtp,
    contact,
    gemini,
  };
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  return readTenantSettings(tenantId, prisma);
}

/** คืนค่า configuration ของ Google Gemini API สำหรับเรียกใช้งานบน server (unmasked) */
export async function getTenantGeminiConfig(tenantId: string): Promise<{ enabled: boolean; apiKey: string; model: string } | null> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  if (!t) return null;
  const settingsObj = (t.settings && typeof t.settings === "object" ? t.settings : {}) as Record<string, unknown>;
  const rawGemini = settingsObj.gemini as Record<string, unknown> | undefined;

  let apiKey = typeof rawGemini?.apiKey === "string" ? rawGemini.apiKey.trim() : "";
  let enabled = Boolean(rawGemini?.enabled);
  const model = typeof rawGemini?.model === "string" && rawGemini.model.trim().length > 0 ? rawGemini.model.trim() : "gemini-2.5-flash";


  if (!apiKey && process.env.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY.trim();
    if (rawGemini?.enabled === undefined) {
      enabled = true;
    }
  }

  return {
    enabled,
    apiKey,
    model,
  };
}

/** เก็บคีย์อื่น ๆ ใน settings JSON ไว้ทั้งหมด — merge palette, smtp, contact, gemini ไม่ทับคีย์อื่น */
export async function updateTenantSettings(input: { tenantId: string; actorId: string } & UpdateSettingsInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // อ่านผ่าน tx เดียวกัน ไม่ใช่ client กลาง — ไม่งั้นทรานแซกชันนี้กินคอนเนกชันจากพูลเพิ่มอีกเส้นเพื่ออ่าน
    // ค่าเดิม และค่าที่อ่านได้ก็อยู่นอกสแนปช็อตของทรานแซกชัน (ค่า before ของ audit อาจไม่ตรงกับที่กำลังจะทับ)
    const before = await readTenantSettings(input.tenantId, tx);
    const t = await tx.tenant.findUniqueOrThrow({ where: { id: input.tenantId }, select: { settings: true } });
    const currentSettings = (t.settings && typeof t.settings === "object" ? t.settings : {}) as Record<string, unknown>;
    const currentSmtp = (currentSettings.smtp && typeof currentSettings.smtp === "object" ? currentSettings.smtp : {}) as Record<string, unknown>;
    const currentGemini = (currentSettings.gemini && typeof currentSettings.gemini === "object" ? currentSettings.gemini : {}) as Record<string, unknown>;

    let newSmtp = currentSettings.smtp;
    if (input.smtp) {
      // If pass is provided, update it. If empty string/omitted, retain current pass
      const passToSave = input.smtp.pass && input.smtp.pass.trim().length > 0
        ? input.smtp.pass.trim()
        : (typeof currentSmtp.pass === "string" ? currentSmtp.pass : "");

      newSmtp = {
        provider: "gmail",
        enabled: Boolean(input.smtp.enabled),
        user: input.smtp.user?.trim() || "",
        pass: passToSave,
        fromName: input.smtp.fromName?.trim() || "",
        fromEmail: input.smtp.fromEmail?.trim() || input.smtp.user?.trim() || "",
        port: input.smtp.port || 465,
        secure: input.smtp.secure !== false,
      };
    }

    let newContact = currentSettings.contact;
    if (input.contact) {
      newContact = {
        addressTh: input.contact.addressTh?.trim() || "",
        addressEn: input.contact.addressEn?.trim() || "",
        phone: input.contact.phone?.trim() || "",
        email: input.contact.email?.trim() || "",
        fax: input.contact.fax?.trim() || "",
        officeHours: input.contact.officeHours?.trim() || "",
        facebook: input.contact.facebook?.trim() || "",
        lineId: input.contact.lineId?.trim() || "",
        mapEmbedUrl: input.contact.mapEmbedUrl?.trim() || "",
      };
    }

    let newGemini = currentSettings.gemini;
    if (input.gemini) {
      const keyToSave = input.gemini.apiKey && input.gemini.apiKey.trim().length > 0
        ? input.gemini.apiKey.trim()
        : (typeof currentGemini.apiKey === "string" ? currentGemini.apiKey : "");

      newGemini = {
        enabled: Boolean(input.gemini.enabled),
        apiKey: keyToSave,
        model: input.gemini.model?.trim() || (typeof currentGemini.model === "string" ? currentGemini.model : "gemini-2.5-flash"),
      };
    }

    const nextSettings = {
      ...currentSettings,
      palette: input.palette,
      ...(newSmtp ? { smtp: newSmtp } : {}),
      ...(newContact ? { contact: newContact } : {}),
      ...(newGemini ? { gemini: newGemini } : {}),
    };

    await tx.tenant.update({
      where: { id: input.tenantId },
      data: {
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        logoUrl: input.logoUrl || null,
        settings: nextSettings,
      },
    });

    // For audit log: mask password and api key if present
    const auditAfter = {
      ...input,
      smtp: input.smtp ? { ...input.smtp, pass: input.smtp.pass ? "********" : undefined } : undefined,
      gemini: input.gemini ? { ...input.gemini, apiKey: input.gemini.apiKey ? "********" : undefined } : undefined,
    };
    await writeAudit({ tenantId: input.tenantId, actorId: input.actorId, action: "tenant.settings_update", entity: "tenant", entityId: input.tenantId, before, after: auditAfter }, tx);
  });
}

export async function getTenantPalette(tenantId: string): Promise<PaletteId> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const p = (t?.settings as { palette?: unknown } | null)?.palette;
  return isPalette(p) ? p : DEFAULT_PALETTE;
}

/**
 * tenant ของ session ถ้ามี — import แบบ dynamic เพราะ `../auth` ดึง next-auth ทั้งก้อนเข้ามา และ
 * โมดูลนี้ถูก import จาก root layout ที่รันทุก request · แยก try ของตัวเองไว้ต่างหากโดยเจตนา: เดิมมันอยู่
 * ใน try เดียวกับการอ่านฐานข้อมูล ทำให้ "โหลด auth ไม่ได้" กับ "ฐานข้อมูลล้ม" กลืนหายไปเป็นค่าเดียวกัน
 * และเส้นทางอ่าน tenant ทั้งเส้นทดสอบไม่ได้เลย (ในสภาพแวดล้อมเทสต์ next-auth resolve ไม่ผ่าน)
 */
async function sessionTenantId(): Promise<string | null> {
  try {
    const { auth } = await import("../auth");
    return (await auth())?.tenantId || null;
  } catch {
    return null;
  }
}

/** ใช้โดย root layout ทุก request — tenant จาก session ถ้ามี ไม่งั้น tenant แรก (หน้า login ยังไม่มี session) · ไม่ throw */
export const resolvePalette = cache(async (): Promise<PaletteId> => {
  try {
    const tenantId = (await sessionTenantId()) || (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
    return tenantId ? await getTenantPalette(tenantId) : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
});
