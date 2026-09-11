import { notFound } from "next/navigation";
import { requirePermission, hasPermission, getTenantSettings } from "@/features/identity/server";
import { CURRICULUM_P, getProgramTeachingDossier } from "@/features/curriculum/server";
import { PERSONNEL_P } from "@/features/personnel";
import { CurriculumReportView } from "./curriculum-report-view";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; semester?: string }>;
}

export default async function ProgramReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const year = sp.year ? parseInt(sp.year, 10) : 2569;
  const semester = sp.semester ? parseInt(sp.semester, 10) : 1;

  const ctx = await requirePermission(CURRICULUM_P.curriculumRead);

  const [dossier, tenantSettings] = await Promise.all([
    getProgramTeachingDossier(ctx.tenantId, id, year, semester),
    getTenantSettings(ctx.tenantId),
  ]);

  if (!dossier) {
    notFound();
  }

  const canManagePersonnel = hasPermission(ctx, PERSONNEL_P.personnelManage);

  return (
    <CurriculumReportView
      dossier={dossier}
      tenantName={tenantSettings.nameTh}
      canManagePersonnel={canManagePersonnel}
    />
  );
}
