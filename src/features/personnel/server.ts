import "server-only";

export {
  listPersonnel,
  listPublicPersonnel,
  getPersonnelDetail,
  listDepartments,
  listDepartmentsWithDetails,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type PersonnelDto,
  type DepartmentDto,
  type AcademicWorkDto,
} from "./_internal/services";
export { PERSONNEL_P, PERSONNEL_PERMISSIONS } from "./permissions";
