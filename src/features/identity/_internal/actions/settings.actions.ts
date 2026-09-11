"use server";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { P } from "../../permissions";
import { requirePermission } from "../rbac";
import { updateSettingsSchema } from "../validations/settings";
import { getTenantSettings, updateTenantSettings, type TenantSettings } from "../services/tenant.service";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import { logger } from "@/shared/lib/infra/logger";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/x-png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function getSettingsAction(): Promise<ActionResult<TenantSettings>> {
  return runAction(async () => getTenantSettings((await requirePermission(P.settingsManage)).tenantId));
}
export async function updateSettingsAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    logger.info("updateSettingsAction called", { input });
    const ctx = await requirePermission(P.settingsManage);
    const parsed = updateSettingsSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    logger.info("updateSettingsAction: parsed payload", { parsed, tenantId: ctx.tenantId, actorId: ctx.userId });
    await updateTenantSettings({ tenantId: ctx.tenantId, actorId: ctx.userId, ...parsed });
    logger.info("updateSettingsAction: settings updated successfully");
    revalidatePath("/", "layout"); // data-palette บน <html> อ่านใหม่
  });
}
export async function uploadLogoAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    logger.info("uploadLogoAction called");
    const ctx = await requirePermission(P.settingsManage);
    const file = formData.get("file");
    const isFile = file && typeof file === "object" && "arrayBuffer" in file && "size" in file && "type" in file;
    if (!isFile) {
      logger.warn("uploadLogoAction: no file provided");
      throw errors.validation("File is required", { file: ["กรุณาเลือกไฟล์รูปภาพ"] });
    }
    const uploadedFile = file as Blob & { name?: string };
    logger.info("uploadLogoAction: file received", { name: uploadedFile.name, size: uploadedFile.size, type: uploadedFile.type });

    if (uploadedFile.size > MAX_FILE_SIZE) {
      logger.warn("uploadLogoAction: file too large", { size: uploadedFile.size });
      throw errors.validation("File too large", { file: ["ขนาดไฟล์ต้องไม่เกิน 2MB"] });
    }

    const mime = (uploadedFile.type || "").toLowerCase();
    let ext: string | undefined = ALLOWED_IMAGE_TYPES[mime];
    if (!ext && uploadedFile.name) {
      const match = uploadedFile.name.toLowerCase().match(/\.(png|jpe?g|webp|svg|gif)$/);
      if (match) {
        ext = match[1] === "jpeg" ? ".jpg" : `.${match[1]}`;
      }
    }

    if (!ext) {
      logger.warn("uploadLogoAction: invalid file type", { mime, name: uploadedFile.name });
      throw errors.validation("Invalid file type", { file: ["รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG, WebP, SVG, GIF)"] });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    await fs.mkdir(uploadDir, { recursive: true });

    const safeTenantId = ctx.tenantId.replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = `logo-${safeTenantId}-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/logos/${filename}`;
    logger.info("uploadLogoAction: file saved successfully", { filePath, publicUrl });

    return { url: publicUrl };
  });
}

export async function testSmtpConnectionAction(input: {
  to: string;
  user: string;
  pass?: string;
  fromName?: string;
  port?: number;
  secure?: boolean;
}): Promise<ActionResult<{ delivered: boolean; message: string }>> {
  return runAction(async () => {
    logger.info("testSmtpConnectionAction called", { to: input.to, user: input.user });
    const ctx = await requirePermission(P.settingsManage);

    if (!input.to || !input.to.includes("@")) {
      throw errors.validation("Invalid recipient email", { to: ["กรุณาระบุอีเมลผู้รับที่ถูกต้อง"] });
    }
    if (!input.user || !input.user.includes("@")) {
      throw errors.validation("Invalid sender email", { user: ["กรุณาระบุอีเมล Gmail ผู้ส่งที่ถูกต้อง"] });
    }

    let password = input.pass?.trim();
    if (!password) {
      // Check stored password in tenant
      const t = await prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { settings: true },
      });
      const settingsObj = (t?.settings && typeof t.settings === "object" ? t.settings : {}) as Record<string, unknown>;
      const storedSmtp = settingsObj.smtp as Record<string, unknown> | undefined;
      if (storedSmtp && typeof storedSmtp.pass === "string" && storedSmtp.pass) {
        password = storedSmtp.pass;
      }
    }

    if (!password) {
      throw errors.validation("App password required", { pass: ["กรุณากรอกรหัสผ่านสำหรับแอป (App Password 16 หลัก)"] });
    }

    const port = input.port || 465;
    const secure = input.secure !== false;
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port,
      secure,
      auth: {
        user: input.user.trim(),
        pass: password,
      },
    });

    try {
      await transport.verify();
      const fromName = input.fromName?.trim() || "FMS System";
      const from = `"${fromName}" <${input.user.trim()}>`;

      await transport.sendMail({
        from,
        to: input.to.trim(),
        subject: "[ทดสอบการเชื่อมต่อ] ระบบ FMS - ทดสอบการส่งอีเมลผ่าน Gmail SMTP สำเร็จ",
        text: `เรียน ผู้ดูแลระบบ\n\nการทดสอบการเชื่อมต่อบริการ Google Gmail SMTP (${input.user}) กับระบบสำเร็จเรียบร้อยแล้ว\nระบบสามารถส่งอีเมลแจ้งเตือนและรีเซ็ตรหัสผ่านได้ตามปกติ\n\nเวลาทดสอบ: ${new Date().toLocaleString("th-TH")}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #16a34a; margin-top: 0;">✔ ทดสอบการเชื่อมต่อ Gmail SMTP สำเร็จ</h2>
            <p>เรียน ผู้ดูแลระบบ,</p>
            <p>การทดสอบส่งอีเมลผ่านบริการ <strong>Google Gmail SMTP</strong> สำเร็จเรียบร้อยแล้ว</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr><td style="padding: 8px; color: #64748b;">บัญชีผู้ส่ง:</td><td style="padding: 8px; font-weight: bold;">${input.user}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;">ชื่อผู้ส่ง:</td><td style="padding: 8px;">${fromName}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;">อีเมลผู้รับทดสอบ:</td><td style="padding: 8px;">${input.to}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;">วันเวลา:</td><td style="padding: 8px;">${new Date().toLocaleString("th-TH")}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">ข้อความนี้ถูกส่งอัตโนมัติจากการกดปุ่มทดสอบในหน้าการตั้งค่าระบบ (Settings)</p>
          </div>
        `,
      });

      logger.info("testSmtpConnectionAction: test email sent successfully", { to: input.to, user: input.user });
      return { delivered: true, message: "ส่งอีเมลทดสอบสำเร็จเรียบร้อยแล้ว กรุณาตรวจสอบในกล่องจดหมาย" };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("testSmtpConnectionAction failed", { err: errMsg });
      if (errMsg.includes("Username and Password not accepted") || errMsg.includes("Invalid login") || errMsg.includes("535")) {
        throw errors.validation("Google App Password ไม่ถูกต้อง กรุณาตรวจสอบว่าใช้รหัสผ่านสำหรับแอป (16 หลัก) และเปิด 2-Step Verification แล้ว", {
          pass: ["รหัสผ่านสำหรับแอปไม่ถูกต้อง (ตรวจสอบรหัสผ่าน 16 หลักจาก Google Account)"],
        });
      }
      throw errors.validation(`เชื่อมต่อ Gmail SMTP ไม่สำเร็จ: ${errMsg}`, {
        user: [`ไม่สามารถเชื่อมต่อ SMTP: ${errMsg}`],
      });
    }
  });
}
