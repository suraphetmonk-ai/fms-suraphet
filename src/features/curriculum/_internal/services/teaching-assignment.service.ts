import { prisma } from "@/shared/lib/infra/prisma";
import type { AssignInstructorInput } from "../validations";

export interface TeachingAssignmentDto {
  id: string;
  tenantId: string;
  personnelId: string;
  courseId: string;
  programId: string | null;
  academicYear: number;
  semester: number;
  role: string;
  section: string;
  hoursPerWeek: number;
  studentCount: number;
  notes: string | null;
  personnel?: {
    id: string;
    personnelCode: string | null;
    citizenIdMasked: string | null;
    monasticTitle: string | null;
    chaya: string | null;
    paliDegree: string | null;
    templeName: string | null;
    address: string | null;
    fullNameTh: string;
    fullNameEn: string;
    academicRank: string | null;
    email: string | null;
    phone: string | null;
  };
  course?: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
    credits: string;
    courseCategory: string | null;
  };
  program?: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
  };
  createdAt: string;
}

export interface ProgramTeachingDossierDto {
  program: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
    degreeLevel: string;
    degreeNameTh: string;
    degreeNameEn: string;
    totalCredits: number;
    durationYears: number;
    departmentNameTh?: string;
    departmentNameEn?: string;
  };
  academicYear: number;
  semester: number;
  courses: {
    id: string;
    courseId: string;
    code: string;
    nameTh: string;
    nameEn: string;
    credits: string;
    courseGroup: string;
    courseCategory: string | null;
    yearLevel: number;
    semester: number;
    assignments: TeachingAssignmentDto[];
  }[];
  instructors: {
    id: string;
    personnelCode: string | null;
    citizenIdMasked: string | null;
    monasticTitle: string | null;
    chaya: string | null;
    paliDegree: string | null;
    templeName: string | null;
    address: string | null;
    fullNameTh: string;
    fullNameEn: string;
    academicRank: string | null;
    email: string | null;
    phone: string | null;
    totalAssignedHours: number;
    coursesCount: number;
    role: string;
  }[];
  summary: {
    totalCourses: number;
    assignedCourses: number;
    totalInstructors: number;
    totalTeachingHours: number;
  };
}

export async function listTeachingAssignments(
  tenantId: string,
  filters?: { programId?: string; academicYear?: number; semester?: number; personnelId?: string }
): Promise<TeachingAssignmentDto[]> {
  const rows = await prisma.teachingAssignment.findMany({
    where: {
      tenantId,
      ...(filters?.programId ? { programId: filters.programId } : {}),
      ...(filters?.academicYear ? { academicYear: filters.academicYear } : {}),
      ...(filters?.semester ? { semester: filters.semester } : {}),
      ...(filters?.personnelId ? { personnelId: filters.personnelId } : {}),
    },
    include: {
      personnel: true,
      course: true,
      program: true,
    },
    orderBy: [{ academicYear: "desc" }, { semester: "desc" }, { course: { code: "asc" } }],
  });

  return rows.map((r) => {
    const rankTh = r.personnel.academicRank ? `${r.personnel.academicRank} ` : "";
    let fullNameTh = `${rankTh}${r.personnel.firstNameTh} ${r.personnel.lastNameTh}`;
    if (r.personnel.monasticTitle) {
      const chayaPart = r.personnel.chaya ? ` ${r.personnel.chaya}` : "";
      const paliPart = r.personnel.paliDegree ? ` (${r.personnel.paliDegree})` : "";
      fullNameTh = `${r.personnel.monasticTitle} ${r.personnel.firstNameTh}${chayaPart} ${r.personnel.lastNameTh}${paliPart}`;
    } else if (r.personnel.paliDegree) {
      fullNameTh = `${rankTh}${r.personnel.firstNameTh} ${r.personnel.lastNameTh} (${r.personnel.paliDegree})`;
    }

    return {
      id: r.id,
      tenantId: r.tenantId,
      personnelId: r.personnelId,
      courseId: r.courseId,
      programId: r.programId,
      academicYear: r.academicYear,
      semester: r.semester,
      role: r.role,
      section: r.section,
      hoursPerWeek: r.hoursPerWeek,
      studentCount: r.studentCount,
      notes: r.notes,
      personnel: {
        id: r.personnel.id,
        personnelCode: r.personnel.personnelCode,
        citizenIdMasked: r.personnel.citizenIdMasked,
        monasticTitle: r.personnel.monasticTitle,
        chaya: r.personnel.chaya,
        paliDegree: r.personnel.paliDegree,
        templeName: r.personnel.templeName,
        address: r.personnel.address,
        fullNameTh,
        fullNameEn: `${r.personnel.academicRank ? r.personnel.academicRank + " " : ""}${r.personnel.firstNameEn} ${r.personnel.lastNameEn}`,
        academicRank: r.personnel.academicRank,
        email: r.personnel.email,
        phone: r.personnel.phone,
      },
      course: {
        id: r.course.id,
        code: r.course.code,
        nameTh: r.course.nameTh,
        nameEn: r.course.nameEn,
        credits: r.course.credits,
        courseCategory: r.course.courseCategory,
      },
      program: r.program
        ? {
            id: r.program.id,
            code: r.program.code,
            nameTh: r.program.nameTh,
            nameEn: r.program.nameEn,
          }
        : undefined,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

export async function assignInstructor(
  tenantId: string,
  input: AssignInstructorInput
): Promise<TeachingAssignmentDto> {
  const row = await prisma.teachingAssignment.create({
    data: {
      tenantId,
      personnelId: input.personnelId,
      courseId: input.courseId,
      programId: input.programId || null,
      academicYear: input.academicYear,
      semester: input.semester,
      role: input.role,
      section: input.section,
      hoursPerWeek: input.hoursPerWeek,
      studentCount: input.studentCount,
      notes: input.notes || null,
    },
    include: {
      personnel: true,
      course: true,
      program: true,
    },
  });

  const list = await listTeachingAssignments(tenantId, {
    programId: row.programId || undefined,
    academicYear: row.academicYear,
    semester: row.semester,
  });

  return list.find((item) => item.id === row.id)!;
}

export async function removeTeachingAssignment(tenantId: string, id: string): Promise<void> {
  await prisma.teachingAssignment.delete({
    where: { id, tenantId },
  });
}

export async function getProgramTeachingDossier(
  tenantId: string,
  programId: string,
  academicYear: number = 2569,
  semester: number = 1
): Promise<ProgramTeachingDossierDto | null> {
  const program = await prisma.program.findUnique({
    where: { id: programId, tenantId },
    include: {
      department: true,
      programCourses: {
        include: { course: true },
        orderBy: [{ yearLevel: "asc" }, { semester: "asc" }, { course: { code: "asc" } }],
      },
    },
  });

  if (!program) return null;

  const assignments = await listTeachingAssignments(tenantId, {
    programId,
    academicYear,
    semester,
  });

  const assignmentByCourseId = new Map<string, TeachingAssignmentDto[]>();
  assignments.forEach((a) => {
    const list = assignmentByCourseId.get(a.courseId) || [];
    list.push(a);
    assignmentByCourseId.set(a.courseId, list);
  });

  type AssignedInstructorInfo = ProgramTeachingDossierDto["instructors"][number];

  const instructorMap = new Map<string, AssignedInstructorInfo>();
  assignments.forEach((a) => {
    if (!a.personnel) return;
    const existing: AssignedInstructorInfo = instructorMap.get(a.personnel.id) || {
      ...a.personnel,
      totalAssignedHours: 0,
      coursesCount: 0,
      role: a.role,
    };
    existing.totalAssignedHours += a.hoursPerWeek;
    existing.coursesCount += 1;
    instructorMap.set(a.personnel.id, existing);
  });

  const courses = program.programCourses.map((pc) => ({
    id: pc.id,
    courseId: pc.courseId,
    code: pc.course.code,
    nameTh: pc.course.nameTh,
    nameEn: pc.course.nameEn,
    credits: pc.course.credits,
    courseGroup: pc.courseGroup,
    courseCategory: pc.course.courseCategory,
    yearLevel: pc.yearLevel,
    semester: pc.semester,
    assignments: assignmentByCourseId.get(pc.courseId) || [],
  }));

  const assignedCount = courses.filter((c) => c.assignments.length > 0).length;
  const totalHours = assignments.reduce((acc, cur) => acc + cur.hoursPerWeek, 0);

  return {
    program: {
      id: program.id,
      code: program.code,
      nameTh: program.nameTh,
      nameEn: program.nameEn,
      degreeLevel: program.degreeLevel,
      degreeNameTh: program.degreeNameTh,
      degreeNameEn: program.degreeNameEn,
      totalCredits: program.totalCredits,
      durationYears: program.durationYears,
      departmentNameTh: program.department?.nameTh,
      departmentNameEn: program.department?.nameEn,
    },
    academicYear,
    semester,
    courses,
    instructors: Array.from(instructorMap.values()),
    summary: {
      totalCourses: courses.length,
      assignedCourses: assignedCount,
      totalInstructors: instructorMap.size,
      totalTeachingHours: totalHours,
    },
  };
}
