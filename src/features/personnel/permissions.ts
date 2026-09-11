import type { PermissionDef } from "@/shared/lib/permission-def";

export const PERSONNEL_P = {
  personnelRead: "personnel:read",
  personnelManage: "personnel:manage",
  personnelProfileUpdate: "personnel:profile.update",
} as const;

export const PERSONNEL_PERMISSIONS: readonly PermissionDef[] = [
  { code: PERSONNEL_P.personnelRead, module: "personnel", action: "read" },
  { code: PERSONNEL_P.personnelManage, module: "personnel", action: "manage" },
  { code: PERSONNEL_P.personnelProfileUpdate, module: "personnel", action: "profile.update" },
];
