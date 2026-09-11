import { describe, it, expect } from "vitest";
import {
  formatCitizenId,
  maskCitizenId,
  isValidCitizenId,
  encryptCitizenId,
  decryptCitizenId,
} from "./pdpa";

describe("PDPA Utility", () => {
  const validId = "1480100123458"; // Note: checksum can be tested
  const plainId = "1480100123456";

  it("formats citizen ID into 1-4801-00123-45-6 standard format", () => {
    expect(formatCitizenId("1480100123456")).toBe("1-4801-00123-45-6");
    expect(formatCitizenId("")).toBe("");
  });

  it("masks citizen ID to protect PII according to PDPA", () => {
    expect(maskCitizenId("1480100123456")).toBe("1-4801-XXXXX-45-6");
    expect(maskCitizenId("1-4801-00123-45-6")).toBe("1-4801-XXXXX-45-6");
  });

  it("encrypts and decrypts citizen ID using AES-256-GCM accurately", () => {
    const raw = "1480100123456";
    const encrypted = encryptCitizenId(raw);
    expect(encrypted).toContain(":");
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decryptCitizenId(encrypted);
    expect(decrypted).toBe("1-4801-00123-45-6");
  });

  it("detects repeating identical digits as invalid ID", () => {
    expect(isValidCitizenId("1111111111111")).toBe(false);
    expect(isValidCitizenId("0000000000000")).toBe(false);
  });
});
