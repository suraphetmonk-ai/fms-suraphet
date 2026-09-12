import { describe, it, expect } from "vitest";
import {
  createDocumentSchema,
  approveDocumentSchema,
  rejectDocumentSchema,
} from "./validations";

describe("Document Validations", () => {
  it("validates valid createDocument input", () => {
    const valid = {
      title: "ขออนุมัติจัดโครงการสัมมนา AI",
      category: "MEMO",
      urgency: "URGENT",
      confidentiality: "NORMAL",
      senderName: "ผศ.ดร. สมคิด",
      recipientName: "คณบดี",
      summary: "รายละเอียดโครงการสัมมนาเชิงปฏิบัติการ...",
      approvers: [
        {
          approverId: "c8a4d46f-1293-4e89-a212-0738a148a032",
          roleTitle: "หัวหน้าภาควิชา",
          stepOrder: 1,
        },
      ],
    };

    const res = createDocumentSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("fails createDocument when title or summary is missing", () => {
    const invalid = {
      title: "",
      senderName: "อาจารย์",
      recipientName: "คณบดี",
      summary: "",
      approvers: [],
    };

    const res = createDocumentSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("validates approve and reject schemas", () => {
    const validApprove = {
      documentId: "c8a4d46f-1293-4e89-a212-0738a148a032",
      approvalId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      comment: "เห็นควรอนุมัติ",
    };
    expect(approveDocumentSchema.safeParse(validApprove).success).toBe(true);

    const validReject = {
      documentId: "c8a4d46f-1293-4e89-a212-0738a148a032",
      approvalId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      comment: "งบประมาณเกินกว่าแผนที่กำหนดไว้",
    };
    expect(rejectDocumentSchema.safeParse(validReject).success).toBe(true);

    const invalidRejectNoComment = {
      documentId: "c8a4d46f-1293-4e89-a212-0738a148a032",
      approvalId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      comment: "",
    };
    expect(rejectDocumentSchema.safeParse(invalidRejectNoComment).success).toBe(false);
  });
});
