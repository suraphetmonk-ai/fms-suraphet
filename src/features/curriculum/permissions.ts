import type { PermissionDef } from "@/shared/lib/permission-def";

export const CURRICULUM_P = {
  curriculumRead: "curriculum:read",
  curriculumCreate: "curriculum:create",
  curriculumUpdate: "curriculum:update",
  curriculumDelete: "curriculum:delete",
} as const;

export const CURRICULUM_PERMISSIONS: readonly PermissionDef[] = [
  { code: CURRICULUM_P.curriculumRead, module: "curriculum", action: "read" },
  { code: CURRICULUM_P.curriculumCreate, module: "curriculum", action: "create" },
  { code: CURRICULUM_P.curriculumUpdate, module: "curriculum", action: "update" },
  { code: CURRICULUM_P.curriculumDelete, module: "curriculum", action: "delete" },
];
