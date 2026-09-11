import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { env, smtpConfigured } from "./env";
import { logger } from "./logger";

export interface MailInput { to: string; subject: string; text: string; html?: string }

/** ไม่มี SMTP → เขียนลง log ระดับ info แล้วคืน delivered:false — ระบบต้องไม่ล้มเพราะส่งอีเมลไม่ได้ */
export async function sendMail(input: MailInput, tenantId?: string): Promise<{ delivered: boolean }> {
  if (tenantId) {
    try {
      const t = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });
      const settingsObj = (t?.settings && typeof t.settings === "object" ? t.settings : {}) as Record<string, unknown>;
      const smtp = settingsObj.smtp as Record<string, unknown> | undefined;
      if (smtp && smtp.enabled && typeof smtp.user === "string" && smtp.user && typeof smtp.pass === "string" && smtp.pass) {
        const port = typeof smtp.port === "number" ? smtp.port : 465;
        const secure = smtp.secure !== false;
        const transport = nodemailer.createTransport({
          host: typeof smtp.host === "string" && smtp.host ? smtp.host : "smtp.gmail.com",
          port,
          secure,
          auth: { user: smtp.user, pass: smtp.pass },
        });
        const fromName = typeof smtp.fromName === "string" && smtp.fromName.trim() ? smtp.fromName.trim() : "";
        const fromEmail = typeof smtp.fromEmail === "string" && smtp.fromEmail.trim() ? smtp.fromEmail.trim() : smtp.user;
        const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
        await transport.sendMail({
          from,
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });
        logger.info("mail sent via tenant Gmail SMTP", { to: input.to, tenantId, from });
        return { delivered: true };
      }
    } catch (err) {
      logger.error("tenant Gmail SMTP send failed, falling back to system env", {
        to: input.to,
        tenantId,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!smtpConfigured()) {
    logger.info("mail (no SMTP, logged only)", { to: input.to, subject: input.subject, text: input.text });
    return { delivered: false };
  }
  const e = env();
  try {
    const transport = nodemailer.createTransport({
      host: e.SMTP_HOST, port: e.SMTP_PORT, secure: e.SMTP_PORT === 465,
      auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: e.SMTP_FROM, to: input.to, subject: input.subject, text: input.text, html: input.html });
    return { delivered: true };
  } catch (err) {
    logger.error("mail send failed", { to: input.to, err: err instanceof Error ? err.message : String(err) });
    return { delivered: false };
  }
}
