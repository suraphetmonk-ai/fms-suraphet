import { requirePermission, hasPermission } from "@/features/identity/server";
import { STUDENT_P, listStudents, getStudentStats } from "@/features/students/server";
import { listPrograms } from "@/features/curriculum/server";
import { listPersonnel } from "@/features/personnel/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { StudentsAdminClient } from "./_components/students-admin-client";

export default async function StudentsAdminPage() {
  const ctx = await requirePermission(STUDENT_P.studentRead);

  // Find if current user has an associated personnel profile (advisor)
  const currentPersonnel = ctx.userId
    ? await prisma.personnelProfile.findFirst({
        where: { tenantId: ctx.tenantId, userId: ctx.userId },
        select: { id: true, firstNameTh: true, lastNameTh: true },
      })
    : null;

  const [initialStudents, programs, allPersonnel, stats] = await Promise.all([
    listStudents(ctx.tenantId),
    listPrograms(ctx.tenantId),
    listPersonnel(ctx.tenantId),
    getStudentStats(ctx.tenantId, currentPersonnel?.id),
  ]);

  // Filter advisors to academic personnel
  const advisors = allPersonnel.filter((p) => p.personnelType === "ACADEMIC" || p.personnelType === undefined);

  return (
    <StudentsAdminClient
      initialStudents={initialStudents}
      programs={programs}
      advisors={advisors}
      stats={stats}
      currentPersonnelId={currentPersonnel?.id ?? null}
      currentPersonnelName={
        currentPersonnel ? `${currentPersonnel.firstNameTh} ${currentPersonnel.lastNameTh}` : null
      }
      canManage={hasPermission(ctx, STUDENT_P.studentManage)}
      canBatchAssign={hasPermission(ctx, STUDENT_P.studentBatchAssign)}
      canLogAdvising={hasPermission(ctx, STUDENT_P.studentAdvisingLog)}
      canManageScholarship={hasPermission(ctx, STUDENT_P.studentScholarshipManage)}
      canReadConfidential={hasPermission(ctx, STUDENT_P.studentConfidentialRead)}
    />
  );
}
