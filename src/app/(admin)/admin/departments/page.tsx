import { requirePermission, hasPermission } from "@/features/identity/server";
import {
  PERSONNEL_P,
  listDepartmentsWithDetails,
} from "@/features/personnel/server";
import { DepartmentsAdminClient } from "./_components/departments-admin-client";

export default async function DepartmentsAdminPage() {
  const ctx = await requirePermission(PERSONNEL_P.personnelRead);
  const initialDepartments = await listDepartmentsWithDetails(ctx.tenantId);

  return (
    <DepartmentsAdminClient
      initialDepartments={initialDepartments}
      canManage={hasPermission(ctx, PERSONNEL_P.personnelManage)}
    />
  );
}
