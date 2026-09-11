import { requirePermission, hasPermission } from "@/features/identity/server";
import {
  PERSONNEL_P,
  listPersonnel,
  listDepartments,
} from "@/features/personnel/server";
import { PersonnelAdminClient } from "./_components/personnel-admin-client";

export default async function PersonnelAdminPage() {
  const ctx = await requirePermission(PERSONNEL_P.personnelRead);
  const [initialPersonnel, departments] = await Promise.all([
    listPersonnel(ctx.tenantId),
    listDepartments(ctx.tenantId),
  ]);

  return (
    <PersonnelAdminClient
      initialPersonnel={initialPersonnel}
      departments={departments}
      canManage={hasPermission(ctx, PERSONNEL_P.personnelManage)}
    />
  );
}
