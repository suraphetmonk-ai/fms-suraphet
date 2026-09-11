import { prisma } from "@/shared/lib/infra/prisma";
import type { Prisma } from "@/generated/prisma";
import type { CreateScheduleInput, UpdateScheduleInput } from "../validations";

export interface ClassScheduleDto {
  id: string;
  tenantId: string;
  scheduleCode: string;
  programId: string;
  courseId: string;
  personnelId: string;
  academicYear: number;
  semester: number;
  yearLevel: number;
  dayOfWeek: number; // 1=Mon ... 7=Sun
  dayNameTh: string;
  dayNameEn: string;
  startTime: string;
  endTime: string;
  room: string;
  building: string | null;
  section: string;
  classType: string;
  notes: string | null;
  course?: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
    credits: string;
    courseCategory: string | null;
  };
  personnel?: {
    id: string;
    personnelCode: string | null;
    fullNameTh: string;
    fullNameEn: string;
    monasticTitle: string | null;
    chaya: string | null;
    paliDegree: string | null;
    academicRank: string | null;
    templeName: string | null;
  };
  program?: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleConflictCheckResult {
  hasConflict: boolean;
  conflictType?: "INSTRUCTOR" | "ROOM" | "COHORT";
  conflictMessage?: string;
  conflictingItem?: {
    id: string;
    courseCode: string;
    courseNameTh: string;
    instructorName: string;
    room: string;
    timeRange: string;
  };
  hasLunchWarning: boolean;
  lunchWarningMessage?: string;
}

export interface ProgramTimetableDossierDto {
  program: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
    degreeNameTh: string;
    degreeNameEn: string;
    totalCredits: number;
    departmentNameTh?: string;
  };
  academicYear: number;
  semester: number;
  yearLevelFilter?: number | null;
  schedules: ClassScheduleDto[];
  days: {
    dayOfWeek: number;
    dayNameTh: string;
    dayNameEn: string;
    schedules: ClassScheduleDto[];
  }[];
  summary: {
    totalSchedules: number;
    totalCourses: number;
    totalInstructors: number;
    totalRooms: number;
    totalHoursPerWeek: number;
  };
}

const DAYS_MAP: Record<number, { th: string; en: string }> = {
  1: { th: "วันจันทร์", en: "Monday" },
  2: { th: "วันอังคาร", en: "Tuesday" },
  3: { th: "วันพุธ", en: "Wednesday" },
  4: { th: "วันพฤหัสบดี", en: "Thursday" },
  5: { th: "วันศุกร์", en: "Friday" },
  6: { th: "วันเสาร์", en: "Saturday" },
  7: { th: "วันอาทิตย์", en: "Sunday" },
};

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return aStart < bEnd && aEnd > bStart;
}

/**
 * ตรวจสอบความขัดแย้งของตารางสอน (Conflict Detection Engine)
 */
export async function checkScheduleConflict(
  tenantId: string,
  input: {
    id?: string;
    personnelId: string;
    room: string;
    programId: string;
    yearLevel: number;
    section: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    academicYear: number;
    semester: number;
  }
): Promise<ScheduleConflictCheckResult> {
  // 1. ตรวจสอบการคาบเกี่ยวกับช่วงฉันภัตตาหารเพล (11:15 - 13:00 น.)
  const lunchOverlap = isTimeOverlapping(input.startTime, input.endTime, "11:15", "13:00");
  const hasLunchWarning = lunchOverlap;
  const lunchWarningMessage = lunchOverlap
    ? "ช่วงเวลาการสอนนี้คาบเกี่ยวกับเวลาฉันภัตตาหารเพลของพระภิกษุสามเณร (11:15 - 13:00 น.)"
    : undefined;

  // ดึงตารางเรียนที่มีอยู่ในวันเดียวกันของปีการศึกษา/ภาคเรียนนั้น
  const existingSchedules = await prisma.classSchedule.findMany({
    where: {
      tenantId,
      academicYear: input.academicYear,
      semester: input.semester,
      dayOfWeek: input.dayOfWeek,
      ...(input.id ? { id: { not: input.id } } : {}),
    },
    include: {
      course: true,
      personnel: true,
    },
  });

  for (const item of existingSchedules) {
    const isOverlapping = isTimeOverlapping(
      input.startTime,
      input.endTime,
      item.startTime,
      item.endTime
    );

    if (!isOverlapping) continue;

    const timeRangeStr = `${item.startTime} - ${item.endTime} น.`;
    const instName = `${item.personnel.monasticTitle ? item.personnel.monasticTitle + " " : ""}${item.personnel.firstNameTh} ${item.personnel.lastNameTh}`;

    // 2. อาจารย์ติดสอนซ้ำซ้อน (Instructor Clash)
    if (item.personnelId === input.personnelId) {
      return {
        hasConflict: true,
        conflictType: "INSTRUCTOR",
        conflictMessage: `อาจารย์ ${instName} มีตารางสอนวิชา "${item.course.code} ${item.course.nameTh}" ในช่วงเวลา ${timeRangeStr} แล้ว`,
        conflictingItem: {
          id: item.id,
          courseCode: item.course.code,
          courseNameTh: item.course.nameTh,
          instructorName: instName,
          room: item.room,
          timeRange: timeRangeStr,
        },
        hasLunchWarning,
        lunchWarningMessage,
      };
    }

    // 3. ห้องเรียนถูกใช้งานซ้ำซ้อน (Room Clash)
    if (item.room.trim().toLowerCase() === input.room.trim().toLowerCase()) {
      return {
        hasConflict: true,
        conflictType: "ROOM",
        conflictMessage: `ห้องเรียน "${item.room}" มีการจัดการเรียนการสอนวิชา "${item.course.code} ${item.course.nameTh}" (${timeRangeStr}) อยู่แล้ว`,
        conflictingItem: {
          id: item.id,
          courseCode: item.course.code,
          courseNameTh: item.course.nameTh,
          instructorName: instName,
          room: item.room,
          timeRange: timeRangeStr,
        },
        hasLunchWarning,
        lunchWarningMessage,
      };
    }

    // 4. นิสิตชั้นปีและกลุ่มเรียนเดียวกันชนกัน (Cohort Clash)
    if (
      item.programId === input.programId &&
      item.yearLevel === input.yearLevel &&
      item.section.trim() === input.section.trim()
    ) {
      return {
        hasConflict: true,
        conflictType: "COHORT",
        conflictMessage: `นิสิตชั้นปีที่ ${input.yearLevel} กลุ่ม ${input.section} มีตารางเรียนวิชา "${item.course.code} ${item.course.nameTh}" ในช่วงเวลา ${timeRangeStr} แล้ว`,
        conflictingItem: {
          id: item.id,
          courseCode: item.course.code,
          courseNameTh: item.course.nameTh,
          instructorName: instName,
          room: item.room,
          timeRange: timeRangeStr,
        },
        hasLunchWarning,
        lunchWarningMessage,
      };
    }
  }

  return {
    hasConflict: false,
    hasLunchWarning,
    lunchWarningMessage,
  };
}

type ScheduleRowWithRelations = Prisma.ClassScheduleGetPayload<{
  include: {
    course: true;
    personnel: true;
    program: true;
  };
}>;

function mapScheduleRow(r: ScheduleRowWithRelations): ClassScheduleDto {
  const rankTh = r.personnel.academicRank ? `${r.personnel.academicRank} ` : "";
  let fullNameTh = `${rankTh}${r.personnel.firstNameTh} ${r.personnel.lastNameTh}`;
  if (r.personnel.monasticTitle) {
    const chayaPart = r.personnel.chaya ? ` ${r.personnel.chaya}` : "";
    const paliPart = r.personnel.paliDegree ? ` (${r.personnel.paliDegree})` : "";
    fullNameTh = `${r.personnel.monasticTitle} ${r.personnel.firstNameTh}${chayaPart} ${r.personnel.lastNameTh}${paliPart}`;
  } else if (r.personnel.paliDegree) {
    fullNameTh = `${rankTh}${r.personnel.firstNameTh} ${r.personnel.lastNameTh} (${r.personnel.paliDegree})`;
  }

  const dayInfo = DAYS_MAP[r.dayOfWeek] || { th: "ไม่ระบุ", en: "Unknown" };

  return {
    id: r.id,
    tenantId: r.tenantId,
    scheduleCode: r.scheduleCode,
    programId: r.programId,
    courseId: r.courseId,
    personnelId: r.personnelId,
    academicYear: r.academicYear,
    semester: r.semester,
    yearLevel: r.yearLevel,
    dayOfWeek: r.dayOfWeek,
    dayNameTh: dayInfo.th,
    dayNameEn: dayInfo.en,
    startTime: r.startTime,
    endTime: r.endTime,
    room: r.room,
    building: r.building,
    section: r.section,
    classType: r.classType,
    notes: r.notes,
    course: r.course
      ? {
          id: r.course.id,
          code: r.course.code,
          nameTh: r.course.nameTh,
          nameEn: r.course.nameEn,
          credits: r.course.credits,
          courseCategory: r.course.courseCategory,
        }
      : undefined,
    personnel: r.personnel
      ? {
          id: r.personnel.id,
          personnelCode: r.personnel.personnelCode,
          fullNameTh,
          fullNameEn: `${r.personnel.academicRank ? r.personnel.academicRank + " " : ""}${r.personnel.firstNameEn} ${r.personnel.lastNameEn}`,
          monasticTitle: r.personnel.monasticTitle,
          chaya: r.personnel.chaya,
          paliDegree: r.personnel.paliDegree,
          academicRank: r.personnel.academicRank,
          templeName: r.personnel.templeName,
        }
      : undefined,
    program: r.program
      ? {
          id: r.program.id,
          code: r.program.code,
          nameTh: r.program.nameTh,
          nameEn: r.program.nameEn,
        }
      : undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listClassSchedules(
  tenantId: string,
  filters?: {
    programId?: string;
    academicYear?: number;
    semester?: number;
    yearLevel?: number;
    personnelId?: string;
    dayOfWeek?: number;
    room?: string;
  }
): Promise<ClassScheduleDto[]> {
  const rows = await prisma.classSchedule.findMany({
    where: {
      tenantId,
      ...(filters?.programId ? { programId: filters.programId } : {}),
      ...(filters?.academicYear ? { academicYear: filters.academicYear } : {}),
      ...(filters?.semester ? { semester: filters.semester } : {}),
      ...(filters?.yearLevel ? { yearLevel: filters.yearLevel } : {}),
      ...(filters?.personnelId ? { personnelId: filters.personnelId } : {}),
      ...(filters?.dayOfWeek ? { dayOfWeek: filters.dayOfWeek } : {}),
      ...(filters?.room ? { room: { contains: filters.room, mode: "insensitive" } } : {}),
    },
    include: {
      course: true,
      personnel: true,
      program: true,
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
      { yearLevel: "asc" },
      { section: "asc" },
    ],
  });

  return rows.map(mapScheduleRow);
}

export async function createClassSchedule(
  tenantId: string,
  input: CreateScheduleInput
): Promise<ClassScheduleDto> {
  // ตรวจสอบ Conflict
  const conflict = await checkScheduleConflict(tenantId, {
    personnelId: input.personnelId,
    room: input.room,
    programId: input.programId,
    yearLevel: input.yearLevel,
    section: input.section,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    academicYear: input.academicYear,
    semester: input.semester,
  });

  if (conflict.hasConflict) {
    throw new Error(conflict.conflictMessage || "เกิดข้อขัดแย้งในตารางสอน");
  }

  // สร้าง running schedule code หากไม่ได้ระบุ
  let scheduleCode = input.scheduleCode;
  if (!scheduleCode) {
    const count = await prisma.classSchedule.count({
      where: {
        tenantId,
        academicYear: input.academicYear,
        semester: input.semester,
      },
    });
    scheduleCode = `SCH-${input.academicYear}-${input.semester}-${(count + 1).toString().padStart(3, "0")}`;
  }

  const created = await prisma.classSchedule.create({
    data: {
      tenantId,
      scheduleCode,
      programId: input.programId,
      courseId: input.courseId,
      personnelId: input.personnelId,
      academicYear: input.academicYear,
      semester: input.semester,
      yearLevel: input.yearLevel,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      room: input.room,
      building: input.building || null,
      section: input.section,
      classType: input.classType,
      notes: input.notes || null,
    },
    include: {
      course: true,
      personnel: true,
      program: true,
    },
  });

  return mapScheduleRow(created);
}

export async function updateClassSchedule(
  tenantId: string,
  input: UpdateScheduleInput
): Promise<ClassScheduleDto> {
  const conflict = await checkScheduleConflict(tenantId, {
    id: input.id,
    personnelId: input.personnelId,
    room: input.room,
    programId: input.programId,
    yearLevel: input.yearLevel,
    section: input.section,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    academicYear: input.academicYear,
    semester: input.semester,
  });

  if (conflict.hasConflict) {
    throw new Error(conflict.conflictMessage || "เกิดข้อขัดแย้งในตารางสอน");
  }

  const updated = await prisma.classSchedule.update({
    where: { id: input.id, tenantId },
    data: {
      programId: input.programId,
      courseId: input.courseId,
      personnelId: input.personnelId,
      academicYear: input.academicYear,
      semester: input.semester,
      yearLevel: input.yearLevel,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      room: input.room,
      building: input.building || null,
      section: input.section,
      classType: input.classType,
      notes: input.notes || null,
    },
    include: {
      course: true,
      personnel: true,
      program: true,
    },
  });

  return mapScheduleRow(updated);
}

export async function deleteClassSchedule(tenantId: string, id: string): Promise<void> {
  await prisma.classSchedule.delete({
    where: { id, tenantId },
  });
}

export async function getProgramTimetableDossier(
  tenantId: string,
  programId: string,
  academicYear: number = 2569,
  semester: number = 1,
  yearLevel?: number
): Promise<ProgramTimetableDossierDto | null> {
  const program = await prisma.program.findUnique({
    where: { id: programId, tenantId },
    include: { department: true },
  });

  if (!program) return null;

  const schedules = await listClassSchedules(tenantId, {
    programId,
    academicYear,
    semester,
    ...(yearLevel ? { yearLevel } : {}),
  });

  // จัดกลุ่มตามวัน 1-7
  const days: ProgramTimetableDossierDto["days"] = [];
  for (let d = 1; d <= 7; d++) {
    const daySchedules = schedules.filter((s) => s.dayOfWeek === d);
    days.push({
      dayOfWeek: d,
      dayNameTh: DAYS_MAP[d]?.th || `วัน ${d}`,
      dayNameEn: DAYS_MAP[d]?.en || `Day ${d}`,
      schedules: daySchedules,
    });
  }

  const courseIds = new Set(schedules.map((s) => s.courseId));
  const personnelIds = new Set(schedules.map((s) => s.personnelId));
  const rooms = new Set(schedules.map((s) => s.room.trim().toLowerCase()));

  // คำนวณชั่วโมงสอนรวมต่อสัปดาห์
  let totalMinutes = 0;
  for (const s of schedules) {
    const diff = timeToMinutes(s.endTime) - timeToMinutes(s.startTime);
    if (diff > 0) totalMinutes += diff;
  }

  return {
    program: {
      id: program.id,
      code: program.code,
      nameTh: program.nameTh,
      nameEn: program.nameEn,
      degreeNameTh: program.degreeNameTh,
      degreeNameEn: program.degreeNameEn,
      totalCredits: program.totalCredits,
      departmentNameTh: program.department?.nameTh,
    },
    academicYear,
    semester,
    yearLevelFilter: yearLevel || null,
    schedules,
    days,
    summary: {
      totalSchedules: schedules.length,
      totalCourses: courseIds.size,
      totalInstructors: personnelIds.size,
      totalRooms: rooms.size,
      totalHoursPerWeek: Math.round((totalMinutes / 60) * 10) / 10,
    },
  };
}
