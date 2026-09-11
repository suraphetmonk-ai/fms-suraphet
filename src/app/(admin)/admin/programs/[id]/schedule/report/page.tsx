import { notFound } from "next/navigation";
import { requirePermission, getTenantSettings } from "@/features/identity/server";
import { CURRICULUM_P, getProgramTimetableDossier } from "@/features/curriculum/server";
import { ScheduleReportView } from "./schedule-report-view";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; semester?: string; yearLevel?: string }>;
}

export default async function ProgramScheduleReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const year = sp.year ? parseInt(sp.year, 10) : 2569;
  const semester = sp.semester ? parseInt(sp.semester, 10) : 1;
  const yearLevel = sp.yearLevel ? parseInt(sp.yearLevel, 10) : undefined;

  const ctx = await requirePermission(CURRICULUM_P.curriculumRead);

  const [dossier, tenantSettings] = await Promise.all([
    getProgramTimetableDossier(ctx.tenantId, id, year, semester, yearLevel),
    getTenantSettings(ctx.tenantId),
  ]);

  if (!dossier) {
    notFound();
  }

  return (
    <ScheduleReportView
      dossier={dossier}
      tenantName={tenantSettings.nameTh}
    />
  );
}
