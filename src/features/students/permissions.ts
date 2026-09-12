import type { PermissionDef } from "@/shared/lib/permission-def";

export const STUDENT_P = {
  studentRead: "student:read",
  studentManage: "student:manage",
  studentAdviseesRead: "student:advisees.read",
  studentAdvisingLog: "student:advising.log",
  studentConfidentialRead: "student:confidential.read",
  studentBatchAssign: "student:batch_assign",
  studentScholarshipManage: "student:scholarship.manage",
} as const;

export const STUDENT_PERMISSIONS: readonly PermissionDef[] = [
  { code: STUDENT_P.studentRead, module: "student", action: "read" },
  { code: STUDENT_P.studentManage, module: "student", action: "manage" },
  { code: STUDENT_P.studentAdviseesRead, module: "student", action: "advisees.read" },
  { code: STUDENT_P.studentAdvisingLog, module: "student", action: "advising.log" },
  { code: STUDENT_P.studentConfidentialRead, module: "student", action: "confidential.read" },
  { code: STUDENT_P.studentBatchAssign, module: "student", action: "batch_assign" },
  { code: STUDENT_P.studentScholarshipManage, module: "student", action: "scholarship.manage" },
];
