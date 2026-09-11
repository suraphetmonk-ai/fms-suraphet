import "server-only";

export {
  listPrograms,
  listPublicPrograms,
  getProgramDetail,
  type ProgramDto,
} from "./_internal/services";
export {
  listTeachingAssignments,
  assignInstructor,
  removeTeachingAssignment,
  getProgramTeachingDossier,
  type TeachingAssignmentDto,
  type ProgramTeachingDossierDto,
} from "./_internal/services/teaching-assignment.service";
export {
  listClassSchedules,
  createClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
  checkScheduleConflict,
  getProgramTimetableDossier,
  type ClassScheduleDto,
  type ScheduleConflictCheckResult,
  type ProgramTimetableDossierDto,
} from "./_internal/services/timetable.service";
export { CURRICULUM_P, CURRICULUM_PERMISSIONS } from "./permissions";

