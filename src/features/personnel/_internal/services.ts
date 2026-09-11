import { prisma } from "@/shared/lib/infra/prisma";
import type { Prisma } from "@/generated/prisma";
import { encryptCitizenId, decryptCitizenId, maskCitizenId } from "@/shared/lib/security/pdpa";
import { errors } from "@/shared/lib/errors";
import type { CreatePersonnelInput, UpdatePersonnelInput } from "./validations";

export interface DepartmentDto {
  id: string;
  nameTh: string;
  nameEn: string;
  code: string;
}

export interface AcademicWorkDto {
  id: string;
  title: string;
  workType: string;
  year: number | null;
  citationText: string | null;
  url: string | null;
  doi: string | null;
}

export interface PersonnelDto {
  id: string;
  tenantId: string;
  userId: string | null;
  personnelCode: string | null;
  citizenIdMasked: string | null;
  monasticTitle: string | null;
  chaya: string | null;
  paliDegree: string | null;
  templeName: string | null;
  address: string | null;
  academicRank: string | null;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  fullNameTh: string;
  fullNameEn: string;
  departmentId: string | null;
  departmentNameTh?: string;
  departmentNameEn?: string;
  positionTh: string;
  positionEn: string;
  personnelType: string;
  email: string | null;
  phone: string | null;
  phoneExt: string | null;
  roomNumber: string | null;
  avatarUrl: string | null;
  biographyTh: string | null;
  biographyEn: string | null;
  expertise: string[];
  orderIndex: number;
  isActive: boolean;
  works?: AcademicWorkDto[];
  createdAt: string;
  updatedAt: string;
}

export async function ensureDefaultDepartments(tenantId: string) {
  const count = await prisma.department.count({ where: { tenantId } });
  if (count === 0) {
    await prisma.department.createMany({
      data: [
        { tenantId, nameTh: "สำนักงานคณบดี/ผู้อำนวยการ", nameEn: "Dean & Director's Office", code: "DEAN", orderIndex: 1 },
        { tenantId, nameTh: "สาขาวิชาพระพุทธศาสนา", nameEn: "Department of Buddhist Studies", code: "BUDDHIST_STUDIES", orderIndex: 2 },
        { tenantId, nameTh: "ภาควิชาวิทยาการคอมพิวเตอร์", nameEn: "Department of Computer Science", code: "CS", orderIndex: 3 },
        { tenantId, nameTh: "ภาควิชาเทคโนโลยีสารสนเทศ", nameEn: "Department of Information Technology", code: "IT", orderIndex: 4 },
        { tenantId, nameTh: "ภาควิชาปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูล", nameEn: "Department of AI and Data Science", code: "AIDS", orderIndex: 5 },
      ],
    });
  }
}

export async function listDepartments(tenantId: string): Promise<DepartmentDto[]> {
  await ensureDefaultDepartments(tenantId);
  const rows = await prisma.department.findMany({
    where: { tenantId },
    orderBy: { orderIndex: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    code: r.code,
  }));
}

type PersonnelProfileWithRelations = Prisma.PersonnelProfileGetPayload<{
  include: { department: true; works: true };
}>;

function mapPersonnelRow(r: PersonnelProfileWithRelations): PersonnelDto {
  const rankTh = r.academicRank ? `${r.academicRank} ` : "";
  const rankEn = r.academicRank ? `${r.academicRank} ` : "";
  const expertiseList = Array.isArray(r.expertise) ? (r.expertise as string[]) : [];

  // ชื่อภาษาไทย: กรณีเป็นบรรพชิตที่มีสมณศักดิ์/ฉายา
  let fullNameTh = `${rankTh}${r.firstNameTh} ${r.lastNameTh}`;
  if (r.monasticTitle) {
    const chayaPart = r.chaya ? ` ${r.chaya}` : "";
    const paliPart = r.paliDegree ? ` (${r.paliDegree})` : "";
    fullNameTh = `${r.monasticTitle} ${r.firstNameTh}${chayaPart} ${r.lastNameTh}${paliPart}`;
  } else if (r.paliDegree) {
    fullNameTh = `${rankTh}${r.firstNameTh} ${r.lastNameTh} (${r.paliDegree})`;
  }

  const fullNameEn = `${rankEn}${r.firstNameEn} ${r.lastNameEn}`;

  return {
    id: r.id,
    tenantId: r.tenantId,
    userId: r.userId,
    personnelCode: r.personnelCode,
    citizenIdMasked: r.citizenIdMasked,
    monasticTitle: r.monasticTitle,
    chaya: r.chaya,
    paliDegree: r.paliDegree,
    templeName: r.templeName,
    address: r.address,
    academicRank: r.academicRank,
    firstNameTh: r.firstNameTh,
    lastNameTh: r.lastNameTh,
    firstNameEn: r.firstNameEn,
    lastNameEn: r.lastNameEn,
    fullNameTh,
    fullNameEn,
    departmentId: r.departmentId,
    departmentNameTh: r.department?.nameTh,
    departmentNameEn: r.department?.nameEn,
    positionTh: r.positionTh,
    positionEn: r.positionEn,
    personnelType: r.personnelType,
    email: r.email,
    phone: r.phone,
    phoneExt: r.phoneExt,
    roomNumber: r.roomNumber,
    avatarUrl: r.avatarUrl,
    biographyTh: r.biographyTh,
    biographyEn: r.biographyEn,
    expertise: expertiseList,
    orderIndex: r.orderIndex,
    isActive: r.isActive,
    works: r.works
      ? r.works.map((w) => ({
          id: w.id,
          title: w.title,
          workType: w.workType,
          year: w.year,
          citationText: w.citationText,
          url: w.url,
          doi: w.doi,
        }))
      : [],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listPersonnel(tenantId: string): Promise<PersonnelDto[]> {
  await ensureDefaultDepartments(tenantId);
  const rows = await prisma.personnelProfile.findMany({
    where: { tenantId },
    include: { department: true, works: true },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
  });

  return rows.map(mapPersonnelRow);
}

export async function listPublicPersonnel(tenantId: string, departmentId?: string): Promise<PersonnelDto[]> {
  await ensureDefaultDepartments(tenantId);
  const rows = await prisma.personnelProfile.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(departmentId ? { departmentId } : {}),
    },
    include: { department: true, works: true },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
  });

  return rows.map(mapPersonnelRow);
}

export async function getPersonnelDetail(tenantId: string, id: string): Promise<PersonnelDto | null> {
  const r = await prisma.personnelProfile.findUnique({
    where: { id, tenantId },
    include: { department: true, works: true },
  });
  if (!r) return null;

  return mapPersonnelRow(r);
}

export async function createPersonnel(tenantId: string, input: CreatePersonnelInput): Promise<PersonnelDto> {
  let citizenIdEncrypted: string | null = null;
  let citizenIdMasked: string | null = null;
  if (input.citizenId) {
    citizenIdEncrypted = encryptCitizenId(input.citizenId);
    citizenIdMasked = maskCitizenId(input.citizenId);
  }

  const created = await prisma.personnelProfile.create({
    data: {
      tenantId,
      personnelCode: input.personnelCode || null,
      citizenIdEncrypted,
      citizenIdMasked,
      monasticTitle: input.monasticTitle || null,
      chaya: input.chaya || null,
      paliDegree: input.paliDegree || null,
      templeName: input.templeName || null,
      address: input.address || null,
      academicRank: input.academicRank || null,
      firstNameTh: input.firstNameTh,
      lastNameTh: input.lastNameTh,
      firstNameEn: input.firstNameEn,
      lastNameEn: input.lastNameEn,
      departmentId: input.departmentId || null,
      positionTh: input.positionTh,
      positionEn: input.positionEn,
      personnelType: input.personnelType,
      email: input.email || null,
      phone: input.phone || null,
      phoneExt: input.phoneExt || null,
      roomNumber: input.roomNumber || null,
      avatarUrl: input.avatarUrl || null,
      biographyTh: input.biographyTh || null,
      biographyEn: input.biographyEn || null,
      expertise: input.expertise,
      orderIndex: input.orderIndex,
      isActive: input.isActive,
    },
    include: { department: true, works: true },
  });

  return getPersonnelDetail(tenantId, created.id) as Promise<PersonnelDto>;
}

export async function updatePersonnel(tenantId: string, input: UpdatePersonnelInput): Promise<PersonnelDto> {
  const dataToUpdate: Prisma.PersonnelProfileUpdateInput = {
    personnelCode: input.personnelCode || null,
    monasticTitle: input.monasticTitle || null,
    chaya: input.chaya || null,
    paliDegree: input.paliDegree || null,
    templeName: input.templeName || null,
    address: input.address || null,
    academicRank: input.academicRank || null,
    firstNameTh: input.firstNameTh,
    lastNameTh: input.lastNameTh,
    firstNameEn: input.firstNameEn,
    lastNameEn: input.lastNameEn,
    ...(input.departmentId
      ? { department: { connect: { id: input.departmentId } } }
      : { department: { disconnect: true } }),
    positionTh: input.positionTh,
    positionEn: input.positionEn,
    personnelType: input.personnelType,
    email: input.email || null,
    phone: input.phone || null,
    phoneExt: input.phoneExt || null,
    roomNumber: input.roomNumber || null,
    avatarUrl: input.avatarUrl || null,
    biographyTh: input.biographyTh || null,
    biographyEn: input.biographyEn || null,
    expertise: input.expertise,
    orderIndex: input.orderIndex,
    isActive: input.isActive,
  };

  if (input.citizenId !== undefined && input.citizenId !== null) {
    const trimmed = input.citizenId.trim();
    if (trimmed.length > 0) {
      dataToUpdate.citizenIdEncrypted = encryptCitizenId(trimmed);
      dataToUpdate.citizenIdMasked = maskCitizenId(trimmed);
    }
  }

  const updated = await prisma.personnelProfile.update({
    where: { id: input.id, tenantId },
    data: dataToUpdate,
    include: { department: true, works: true },
  });

  return getPersonnelDetail(tenantId, updated.id) as Promise<PersonnelDto>;
}

export async function deletePersonnel(tenantId: string, id: string): Promise<void> {
  await prisma.personnelProfile.delete({
    where: { id, tenantId },
  });
}

/**
 * ถอดรหัสเพื่อดูเลขประจำตัวประชาชนฉบับเต็ม พร้อมบันทึก Audit Log (PDPA Compliance)
 */
export async function revealCitizenId(tenantId: string, id: string, actorId: string): Promise<string> {
  const p = await prisma.personnelProfile.findUnique({
    where: { id, tenantId },
    select: { citizenIdEncrypted: true, firstNameTh: true, lastNameTh: true },
  });
  if (!p || !p.citizenIdEncrypted) {
    throw errors.not_found();
  }

  // Audit log การเข้าถึง PII
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorId,
      action: "personnel.reveal_citizen_id",
      entity: "personnel_profile",
      entityId: id,
      after: { viewedField: "citizen_id", targetName: `${p.firstNameTh} ${p.lastNameTh}` },
    },
  });

  return decryptCitizenId(p.citizenIdEncrypted);
}
