import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_FALLBACK_SECRET = "nkp-buddhist-college-pdpa-encryption-key-32b";

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || process.env.APP_SECRET || DEFAULT_FALLBACK_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * จัดรูปแบบเลขบัตรประชาชน 13 หลักเป็นมาตรฐาน X-XXXX-XXXXX-XX-X
 */
export function formatCitizenId(id?: string | null): string {
  if (!id) return "";
  const cleaned = id.replace(/\D/g, "");
  if (cleaned.length !== 13) return id;
  return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12, 13)}`;
}

/**
 * บดบังเลขบัตรประชาชนตามมาตรฐาน PDPA (แสดงเฉพาะ 5 หลักแรก และ 3 หลักสุดท้าย)
 * ผลลัพธ์: 1-4801-XXXXX-45-6
 */
export function maskCitizenId(id?: string | null): string {
  if (!id) return "";
  const cleaned = id.replace(/\D/g, "");
  if (cleaned.length !== 13) {
    if (cleaned.length >= 8) {
      return `${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`;
    }
    return "****";
  }
  return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-XXXXX-${cleaned.slice(10, 12)}-${cleaned.slice(12, 13)}`;
}

/**
 * ตรวจสอบความถูกต้องของเลขบัตรประชาชนไทย 13 หลักตามสูตร Modulo 11
 */
export function isValidCitizenId(id?: string | null): boolean {
  if (!id) return false;
  const cleaned = id.replace(/\D/g, "");
  if (cleaned.length !== 13) return false;
  if (/^(\d)\1{12}$/.test(cleaned)) return false; // ป้องกันเลขซ้ำ 13 ตัว เช่น 1111111111111

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i], 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleaned[12], 10);
}

/**
 * เข้ารหัสเลขบัตรประชาชนด้วย AES-256-GCM
 * คืนค่ารูปแบบ iv:tag:ciphertext (Hex)
 */
export function encryptCitizenId(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/\D/g, "");
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(cleaned, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * ถอดรหัสเลขบัตรประชาชนจากรูปแบบ iv:tag:ciphertext (Hex)
 */
export function decryptCitizenId(encryptedPayload?: string | null): string {
  if (!encryptedPayload) return "";
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) return "";

  try {
    const [ivHex, tagHex, ciphertext] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return formatCitizenId(decrypted);
  } catch {
    return "";
  }
}
