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

export interface TenantSettings {
  code: string;
  nameTh: string;
  nameEn: string;
  logoUrl: string | null;
  palette: PaletteId;
  smtp?: TenantSmtpSettings;
  contact?: TenantContactSettings;
}

async function readTenantSettings(tenantId: string, db: Db): Promise<TenantSettings> {
  const t = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!t) throw errors.not_found();
  const settingsObj = (t.settings && typeof t.settings === "object" ? t.settings : {}) as Record<string, unknown>;
  const p = settingsObj.palette;
  const rawSmtp = settingsObj.smtp as Record<string, unknown> | undefined;
  const rawContact = settingsObj.contact as Record<string, unknown> | undefined;

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

  return {
    code: t.code,
    nameTh: t.nameTh,
    nameEn: t.nameEn,
    logoUrl: t.logoUrl,
    palette: isPalette(p) ? p : DEFAULT_PALETTE,
    smtp,
    contact,
  };
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  return readTenantSettings(tenantId, prisma);
}

/** เก็บคีย์อื่น ๆ ใน settings JSON ไว้ทั้งหมด — merge palette และ smtp ไม่ทับคีย์อื่น */
export async function updateTenantSettings(input: { tenantId: string; actorId: string } & UpdateSettingsInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // อ่านผ่าน tx เดียวกัน ไม่ใช่ client กลาง — ไม่งั้นทรานแซกชันนี้กินคอนเนกชันจากพูลเพิ่มอีกเส้นเพื่ออ่าน
    // ค่าเดิม และค่าที่อ่านได้ก็อยู่นอกสแนปช็อตของทรานแซกชัน (ค่า before ของ audit อาจไม่ตรงกับที่กำลังจะทับ)
    const before = await readTenantSettings(input.tenantId, tx);
    const t = await tx.tenant.findUniqueOrThrow({ where: { id: input.tenantId }, select: { settings: true } });
    const currentSettings = (t.settings && typeof t.settings === "object" ? t.settings : {}) as Record<string, unknown>;
    const currentSmtp = (currentSettings.smtp && typeof currentSettings.smtp === "object" ? currentSettings.smtp : {}) as Record<string, unknown>;

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

    const nextSettings = {
      ...currentSettings,
      palette: input.palette,
      ...(newSmtp ? { smtp: newSmtp } : {}),
      ...(newContact ? { contact: newContact } : {}),
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

    // For audit log: mask password if present
    const auditAfter = {
      ...input,
      smtp: input.smtp ? { ...input.smtp, pass: input.smtp.pass ? "********" : undefined } : undefined,
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
