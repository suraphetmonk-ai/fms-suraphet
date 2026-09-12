import { requirePermission, P } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { UserImportClient } from "./_components/user-import-client";

export default async function UserImportPage() {
  const ctx = await requirePermission(P.usersManage);
  const roles = await prisma.role.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { code: "asc" },
    select: { id: true, code: true, nameTh: true, nameEn: true },
  });

  return <UserImportClient roles={roles} isSuperAdmin={ctx.isSuperAdmin} />;
}
