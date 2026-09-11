import { requirePermission, hasPermission } from "@/features/identity/server";
import {
  CURRICULUM_P,
  listPrograms,
} from "@/features/curriculum/server";
import { listDepartments } from "@/features/personnel/server";
import { ProgramsAdminClient } from "./_components/programs-admin-client";

export default async function ProgramsAdminPage() {
  const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
  const [initialPrograms, departments] = await Promise.all([
    listPrograms(ctx.tenantId),
    listDepartments(ctx.tenantId),
  ]);

  return (
    <ProgramsAdminClient
      initialPrograms={initialPrograms}
      departments={departments}
      canCreate={hasPermission(ctx, CURRICULUM_P.curriculumCreate)}
      canUpdate={hasPermission(ctx, CURRICULUM_P.curriculumUpdate)}
      canDelete={hasPermission(ctx, CURRICULUM_P.curriculumDelete)}
    />
  );
}
