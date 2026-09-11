import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "./lib/require-database-url";
import { encryptCitizenId, maskCitizenId } from "../src/shared/lib/security/pdpa";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

function generateValidCitizenId(prefix: string, seed: number): string {
  const padded = (seed % 10000000).toString().padStart(7, "0");
  const base = `${prefix}${padded}`; // 12 digits
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return `${base}${checkDigit}`;
}

async function main() {
  console.log("☸️ กำลัง Seed ข้อมูลหลักสูตรสาขาวิชาพระพุทธศาสนา วิทยาลัยสงฆ์นครพนม...");

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("❌ ไม่พบ Tenant ในระบบ กรุณารัน seed หลักก่อน");
    return;
  }
  const tenantId = tenant.id;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      nameTh: "วิทยาลัยสงฆ์นครพนม มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      nameEn: "Nakhon Phanom Buddhist College, Mahachulalongkornrajavidyalaya University",
    },
  });

  console.log("🏛️ สร้าง/อัปเดต สาขาวิชาพระพุทธศาสนา...");
  const deptBuddhist = await prisma.department.upsert({
    where: { tenantId_code: { tenantId, code: "BUDDHIST_STUDIES" } },
    update: {
      nameTh: "สาขาวิชาพระพุทธศาสนา",
      nameEn: "Department of Buddhist Studies",
    },
    create: {
      tenantId,
      code: "BUDDHIST_STUDIES",
      nameTh: "สาขาวิชาพระพุทธศาสนา",
      nameEn: "Department of Buddhist Studies",
      orderIndex: 1,
    },
  });

  console.log("👥 สร้างข้อมูลคณาจารย์ประจำหลักสูตรพร้อมข้อมูล PDPA...");

  const rawCids = [
    generateValidCitizenId("1480100", 12345),
    generateValidCitizenId("1480200", 23456),
    generateValidCitizenId("1480300", 34567),
    generateValidCitizenId("3480100", 45678),
    generateValidCitizenId("3480200", 56789),
  ];

  const personnelData = [
    {
      personnelCode: "NKP-B-001",
      citizenId: rawCids[0],
      monasticTitle: "พระราชสิริวัฒน์",
      firstNameTh: "เลื่อน",
      lastNameTh: "สิริภทฺโท",
      firstNameEn: "Luean",
      lastNameEn: "Siribhatto",
      chaya: "ฐิตปญฺโญ",
      paliDegree: "ป.ธ.๙",
      academicRank: "ผศ.ดร.",
      positionTh: "ผู้อำนวยการวิทยาลัยสงฆ์นครพนม / ที่ปรึกษาหลักสูตร",
      positionEn: "Director of Nakhon Phanom Buddhist College",
      personnelType: "ACADEMIC" as const,
      templeName: "วัดสว่างสุวรรณาราม ต.หนองญาติ อ.เมือง จ.นครพนม",
      address: "วิทยาลัยสงฆ์นครพนม มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ขามเฒ่า อ.เมือง จ.นครพนม 48000",
      phone: "042-530-801",
      email: "director.nkp@mcu.ac.th",
      orderIndex: 1,
    },
    {
      personnelCode: "NKP-B-002",
      citizenId: rawCids[1],
      monasticTitle: "พระมหาปิยะวัฒน์",
      firstNameTh: "ปิยะวัฒน์",
      lastNameTh: "โสภณวาที",
      firstNameEn: "Piyawat",
      lastNameEn: "Soponwatee",
      chaya: "ปิยธมฺโม",
      paliDegree: "ป.ธ.๗",
      academicRank: "ดร.",
      positionTh: "ประธานหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
      positionEn: "Chairperson of Buddhist Studies Program",
      personnelType: "ACADEMIC" as const,
      templeName: "วัดพระธาตุพนม วรมหาวิหาร ต.ธาตุพนม อ.ธาตุพนม จ.นครพนม",
      address: "กุฏิเฉลิมพระเกียรติ วัดพระธาตุพนม วรมหาวิหาร อ.ธาตุพนม จ.นครพนม 48110",
      phone: "089-712-3456",
      email: "buddhist.chair@mcu.ac.th",
      orderIndex: 2,
    },
    {
      personnelCode: "NKP-B-003",
      citizenId: rawCids[2],
      monasticTitle: "พระครูวิสุทธิ์ธีรคุณ",
      firstNameTh: "สมคิด",
      lastNameTh: "ธีรปญฺโญ",
      firstNameEn: "Somkid",
      lastNameEn: "Theerapanyo",
      chaya: "ธีรปญฺโญ",
      paliDegree: "ป.ธ.๖",
      academicRank: "รศ.ดร.",
      positionTh: "อาจารย์ผู้รับผิดชอบหลักสูตร / หัวหน้างานวิชาการ",
      positionEn: "Associate Professor / Academic Head",
      personnelType: "ACADEMIC" as const,
      templeName: "วัดมหาธาตุ ต.ในเมือง อ.เมือง จ.นครพนม",
      address: "วิทยาลัยสงฆ์นครพนม ต.ขามเฒ่า อ.เมือง จ.นครพนม 48000",
      phone: "081-234-5678",
      email: "theerapanyo@mcu.ac.th",
      orderIndex: 3,
    },
    {
      personnelCode: "NKP-B-004",
      citizenId: rawCids[3],
      monasticTitle: null,
      firstNameTh: "สุภาพรรณ",
      lastNameTh: "ณ นครพนม",
      firstNameEn: "Supapan",
      lastNameEn: "Na Nakhonphanom",
      chaya: null,
      paliDegree: null,
      academicRank: "รศ.ดร.",
      positionTh: "อาจารย์ประจำหลักสูตร / ผู้เชี่ยวชาญพระไตรปิฎกศึกษา",
      positionEn: "Associate Professor in Tipitaka Studies",
      personnelType: "ACADEMIC" as const,
      templeName: null,
      address: "148 ถนนอภิบาลบัญชา ตำบลในเมือง อำเภอเมือง จังหวัดนครพนม 48000",
      phone: "084-555-1234",
      email: "supapan.nkp@mcu.ac.th",
      orderIndex: 4,
    },
    {
      personnelCode: "NKP-B-005",
      citizenId: rawCids[4],
      monasticTitle: null,
      firstNameTh: "เกรียงศักดิ์",
      lastNameTh: "ธรรมรัตน์",
      firstNameEn: "Kriangsak",
      lastNameEn: "Thammarat",
      chaya: null,
      paliDegree: null,
      academicRank: "ผศ.ดร.",
      positionTh: "อาจารย์ประจำสาขาวิชาพระพุทธศาสนา",
      positionEn: "Assistant Professor in Buddhist Philosophy",
      personnelType: "ACADEMIC" as const,
      templeName: null,
      address: "วิทยาลัยสงฆ์นครพนม มจร ตำบลขามเฒ่า อำเภอเมือง จังหวัดนครพนม 48000",
      phone: "086-999-7788",
      email: "kriangsak.th@mcu.ac.th",
      orderIndex: 5,
    },
  ];

  const createdPersonnel: Record<string, string> = {};

  for (const p of personnelData) {
    const encCid = encryptCitizenId(p.citizenId);
    const maskedCid = maskCitizenId(p.citizenId);

    const existing = await prisma.personnelProfile.findFirst({
      where: {
        tenantId,
        personnelCode: p.personnelCode,
      },
    });

    let recordId: string;
    if (existing) {
      const updated = await prisma.personnelProfile.update({
        where: { id: existing.id },
        data: {
          citizenIdEncrypted: encCid,
          citizenIdMasked: maskedCid,
          monasticTitle: p.monasticTitle,
          firstNameTh: p.firstNameTh,
          lastNameTh: p.lastNameTh,
          firstNameEn: p.firstNameEn,
          lastNameEn: p.lastNameEn,
          chaya: p.chaya,
          paliDegree: p.paliDegree,
          academicRank: p.academicRank,
          positionTh: p.positionTh,
          positionEn: p.positionEn,
          departmentId: deptBuddhist.id,
          templeName: p.templeName,
          address: p.address,
          phone: p.phone,
          email: p.email,
          isActive: true,
        },
      });
      recordId = updated.id;
    } else {
      const created = await prisma.personnelProfile.create({
        data: {
          tenantId,
          personnelCode: p.personnelCode,
          citizenIdEncrypted: encCid,
          citizenIdMasked: maskedCid,
          monasticTitle: p.monasticTitle,
          firstNameTh: p.firstNameTh,
          lastNameTh: p.lastNameTh,
          firstNameEn: p.firstNameEn,
          lastNameEn: p.lastNameEn,
          chaya: p.chaya,
          paliDegree: p.paliDegree,
          academicRank: p.academicRank,
          departmentId: deptBuddhist.id,
          positionTh: p.positionTh,
          positionEn: p.positionEn,
          personnelType: p.personnelType,
          templeName: p.templeName,
          address: p.address,
          phone: p.phone,
          email: p.email,
          orderIndex: p.orderIndex,
          isActive: true,
        },
      });
      recordId = created.id;
    }
    createdPersonnel[p.personnelCode] = recordId;
  }

  console.log("📖 สร้างข้อมูลรายวิชาพระพุทธศาสนา...");
  const coursesData = [
    {
      code: "BUD101",
      nameTh: "พระไตรปิฎกศึกษา",
      nameEn: "Tipitaka Studies",
      credits: "3(3-0-6)",
      courseCategory: "วิชาแกนพระพุทธศาสนา",
      group: "หมวดวิชาเฉพาะด้าน",
      yearLevel: 1,
      semester: 1,
    },
    {
      code: "BUD102",
      nameTh: "พระวินัยปิฎก",
      nameEn: "Vinaya Pitaka",
      credits: "3(3-0-6)",
      courseCategory: "วิชาเฉพาะสาขาวิชา",
      group: "หมวดวิชาเฉพาะด้าน",
      yearLevel: 1,
      semester: 1,
    },
    {
      code: "BUD103",
      nameTh: "พระสุตตันตปิฎก",
      nameEn: "Suttanta Pitaka",
      credits: "3(3-0-6)",
      courseCategory: "วิชาเฉพาะสาขาวิชา",
      group: "หมวดวิชาเฉพาะด้าน",
      yearLevel: 1,
      semester: 2,
    },
    {
      code: "BUD201",
      nameTh: "พระอภิธรรมปิฎก",
      nameEn: "Abhidhamma Pitaka",
      credits: "3(3-0-6)",
      courseCategory: "วิชาเฉพาะสาขาวิชา",
      group: "หมวดวิชาเฉพาะด้าน",
      yearLevel: 2,
      semester: 1,
    },
    {
      code: "BUD202",
      nameTh: "ประวัติศาสตร์พระพุทธศาสนาในประเทศไทยและลุ่มน้ำโขง",
      nameEn: "History of Buddhism in Thailand and Mekong Basin",
      credits: "3(3-0-6)",
      courseCategory: "วิชาแกนพระพุทธศาสนา",
      group: "หมวดวิชาเฉพาะด้าน",
      yearLevel: 2,
      semester: 1,
    },
    {
      code: "BUD203",
      nameTh: "กรรมฐานและวิปัสสนาภาวนา",
      nameEn: "Kammatthana and Vipassana Bhavana",
      credits: "3(2-2-5)",
      courseCategory: "วิชาปฏิบัติการทางจิตวิญญาณ",
      group: "หมวดวิชาเฉพาะด้าน",
      yearLevel: 2,
      semester: 1,
    },
    {
      code: "BUD301",
      nameTh: "ธรรมนิเทศและการเผยแผ่พระพุทธศาสนา",
      nameEn: "Dhamma Propagation and Communication",
      credits: "3(3-0-6)",
      courseCategory: "วิชาเลือกสาขาวิชา",
      group: "หมวดวิชาเลือก",
      yearLevel: 3,
      semester: 1,
    },
    {
      code: "BUD302",
      nameTh: "ภาษาบาลีสำหรับพระพุทธศาสนา",
      nameEn: "Pali for Buddhist Studies",
      credits: "3(3-0-6)",
      courseCategory: "วิชาเฉพาะสาขาวิชา",
      group: "หมวดวิชาเฉพาะด้าน",
      yearLevel: 3,
      semester: 1,
    },
    {
      code: "BUD401",
      nameTh: "ระเบียบวิธีวิจัยทางพระพุทธศาสนา",
      nameEn: "Research Methodology in Buddhist Studies",
      credits: "3(3-0-6)",
      courseCategory: "วิชาสัมมนาและวิจัย",
      group: "หมวดวิชาเฉพาะด้าน",
      yearLevel: 4,
      semester: 1,
    },
    {
      code: "BUD402",
      nameTh: "พระพุทธศาสนากับสันติภาพโลกและสังคมร่วมสมัย",
      nameEn: "Buddhism, World Peace and Contemporary Society",
      credits: "3(3-0-6)",
      courseCategory: "วิชาเลือกสาขาวิชา",
      group: "หมวดวิชาเลือก",
      yearLevel: 4,
      semester: 1,
    },
  ];

  const createdCourses: Record<string, string> = {};

  for (const c of coursesData) {
    const record = await prisma.course.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code: c.code,
        },
      },
      update: {
        nameTh: c.nameTh,
        nameEn: c.nameEn,
        credits: c.credits,
        courseCategory: c.courseCategory,
      },
      create: {
        tenantId,
        code: c.code,
        nameTh: c.nameTh,
        nameEn: c.nameEn,
        credits: c.credits,
        courseCategory: c.courseCategory,
      },
    });
    createdCourses[c.code] = record.id;
  }

  console.log("🎓 สร้างหลักสูตรพุทธศาสตรบัณฑิต (พธ.บ.)...");
  const program = await prisma.program.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: "B-BUDDHIST",
      },
    },
    update: {
      nameTh: "หลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรปรับปรุง พ.ศ. 2566)",
      nameEn: "Bachelor of Arts Program in Buddhist Studies (Revised Curriculum B.E. 2566)",
      degreeLevel: "BACHELOR",
      degreeNameTh: "พุทธศาสตรบัณฑิต (พระพุทธศาสนา) - พธ.บ.",
      degreeNameEn: "Bachelor of Arts (Buddhist Studies) - B.A. (Buddhist Studies)",
      departmentId: deptBuddhist.id,
      totalCredits: 140,
      durationYears: 4,
      tuitionFee: "สนับสนุนตามนโยบายการจัดการศึกษาของคณะสงฆ์และ มจร",
      descriptionTh:
        "มุ่งผลิตพุทธศาสตรบัณฑิตให้มีความรู้ความเข้าใจในหลักธรรมคำสอนทางพระพุทธศาสนาอย่างถูกต้องลึกซึ้ง มีปฏิปทาน่าเลื่อมใส มีความสามารถประยุกต์ใช้หลักพุทธธรรมเพื่อพัฒนาจิตใจ สังคม และสิ่งแวดล้อม และมีความเชี่ยวชาญด้านการวิจัยและการเผยแผ่พระพุทธศาสนาสู่สากล",
      descriptionEn:
        "Aims to cultivate Buddhist scholars with deep comprehension of Dhamma, exemplary conduct, skills in Dhamma application for social development, and excellence in Buddhist research and international propagation.",
      careerOpportunitiesTh:
        "พระธรรมทูต/นักเผยแผ่พระพุทธศาสนา, อาจารย์สอนวิชาพระพุทธศาสนาในสถาบันการศึกษา, นักวิชาการศาสนา, เจ้าหน้าที่หน่วยงานองค์กรการกุศลและวัฒนธรรม, นักวิจัยพระพุทธศาสนา",
      careerOpportunitiesEn:
        "Buddhist Missionary, Religious Educator, Academic Specialist in Buddhism, Cultural & Non-Profit Foundation Officer, Buddhist Researcher",
      isOpenAdmission: true,
      status: "ACTIVE",
    },
    create: {
      tenantId,
      code: "B-BUDDHIST",
      nameTh: "หลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรปรับปรุง พ.ศ. 2566)",
      nameEn: "Bachelor of Arts Program in Buddhist Studies (Revised Curriculum B.E. 2566)",
      degreeLevel: "BACHELOR",
      degreeNameTh: "พุทธศาสตรบัณฑิต (พระพุทธศาสนา) - พธ.บ.",
      degreeNameEn: "Bachelor of Arts (Buddhist Studies) - B.A. (Buddhist Studies)",
      departmentId: deptBuddhist.id,
      totalCredits: 140,
      durationYears: 4,
      tuitionFee: "สนับสนุนตามนโยบายการจัดการศึกษาของคณะสงฆ์และ มจร",
      descriptionTh:
        "มุ่งผลิตพุทธศาสตรบัณฑิตให้มีความรู้ความเข้าใจในหลักธรรมคำสอนทางพระพุทธศาสนาอย่างถูกต้องลึกซึ้ง มีปฏิปทาน่าเลื่อมใส มีความสามารถประยุกต์ใช้หลักพุทธธรรมเพื่อพัฒนาจิตใจ สังคม และสิ่งแวดล้อม และมีความเชี่ยวชาญด้านการวิจัยและการเผยแผ่พระพุทธศาสนาสู่สากล",
      descriptionEn:
        "Aims to cultivate Buddhist scholars with deep comprehension of Dhamma, exemplary conduct, skills in Dhamma application for social development, and excellence in Buddhist research and international propagation.",
      careerOpportunitiesTh:
        "พระธรรมทูต/นักเผยแผ่พระพุทธศาสนา, อาจารย์สอนวิชาพระพุทธศาสนาในสถาบันการศึกษา, นักวิชาการศาสนา, เจ้าหน้าที่หน่วยงานองค์กรการกุศลและวัฒนธรรม, นักวิจัยพระพุทธศาสนา",
      careerOpportunitiesEn:
        "Buddhist Missionary, Religious Educator, Academic Specialist in Buddhism, Cultural & Non-Profit Foundation Officer, Buddhist Researcher",
      isOpenAdmission: true,
      status: "ACTIVE",
      studyPlans: {
        create: [
          { nameTh: "แผนการศึกษาพระปริยัติธรรมและพุทธศาสตร์ร่วมสมัย", nameEn: "Canonical & Contemporary Track", orderIndex: 1 },
          { nameTh: "แผนการศึกษาวิปัสสนาและพระธรรมทูตสากล", nameEn: "Vipassana & Dhammaduta Track", orderIndex: 2 },
        ],
      },
    },
  });

  console.log("🔗 เชื่อมโยงรายวิชาเข้าสู่โครงสร้างหลักสูตร...");
  await prisma.programCourse.deleteMany({
    where: { programId: program.id },
  });

  for (const c of coursesData) {
    await prisma.programCourse.create({
      data: {
        programId: program.id,
        courseId: createdCourses[c.code],
        yearLevel: c.yearLevel,
        semester: c.semester,
        courseGroup: c.group,
      },
    });
  }

  console.log("📋 บันทึกการมอบหมายภาระงานสอน (Teaching Assignments)...");
  await prisma.teachingAssignment.deleteMany({
    where: {
      tenantId,
      programId: program.id,
      academicYear: 2569,
      semester: 1,
    },
  });

  const assignments = [
    {
      courseCode: "BUD101",
      personnelCode: "NKP-B-001",
      role: "COORDINATOR",
      section: "01",
      hoursPerWeek: 3,
      studentCount: 45,
      notes: "บรรยายหลักการสำคัญและโครงสร้างพระไตรปิฎก",
    },
    {
      courseCode: "BUD102",
      personnelCode: "NKP-B-002",
      role: "PRIMARY",
      section: "01",
      hoursPerWeek: 3,
      studentCount: 45,
      notes: "ศึกษาพระวินัย 227 สิกขาบทและศีลอภิสมาจาร",
    },
    {
      courseCode: "BUD201",
      personnelCode: "NKP-B-004",
      role: "PRIMARY",
      section: "01",
      hoursPerWeek: 3,
      studentCount: 38,
      notes: "วิเคราะห์จิต เจตสิก รูป นิพพาน ในคัมภีร์อภิธรรม",
    },
    {
      courseCode: "BUD202",
      personnelCode: "NKP-B-005",
      role: "PRIMARY",
      section: "01",
      hoursPerWeek: 3,
      studentCount: 38,
      notes: "พัฒนาการของพระพุทธศาสนาในลุ่มน้ำโขงและดินแดนศรีโคตรบูรณ์",
    },
    {
      courseCode: "BUD203",
      personnelCode: "NKP-B-003",
      role: "PRIMARY",
      section: "01",
      hoursPerWeek: 4,
      studentCount: 38,
      notes: "ฝึกปฏิบัติสมถะและวิปัสสนากรรมฐาน ณ ศูนย์ปฏิบัติธรรม",
    },
    {
      courseCode: "BUD301",
      personnelCode: "NKP-B-002",
      role: "PRIMARY",
      section: "01",
      hoursPerWeek: 3,
      studentCount: 32,
      notes: "การประยุกต์ใช้สื่อดิจิทัลในการแสดงธรรมและเผยแผ่",
    },
    {
      courseCode: "BUD302",
      personnelCode: "NKP-B-001",
      role: "PRIMARY",
      section: "01",
      hoursPerWeek: 3,
      studentCount: 32,
      notes: "ไวยากรณ์บาลีและการแปลพระสูตรเบื้องต้น",
    },
    {
      courseCode: "BUD401",
      personnelCode: "NKP-B-003",
      role: "COORDINATOR",
      section: "01",
      hoursPerWeek: 3,
      studentCount: 25,
      notes: "อาจารย์ที่ปรึกษาสัมมนาวิจัยพระพุทธศาสนา",
    },
    {
      courseCode: "BUD401",
      personnelCode: "NKP-B-004",
      role: "CO_INSTRUCTOR",
      section: "01",
      hoursPerWeek: 3,
      studentCount: 25,
      notes: "อาจารย์ร่วมสอนและตรวจร่างระเบียบวิธีวิจัย",
    },
  ];

  for (const a of assignments) {
    const courseId = createdCourses[a.courseCode];
    const personnelId = createdPersonnel[a.personnelCode];
    if (!courseId || !personnelId) continue;

    await prisma.teachingAssignment.create({
      data: {
        tenantId,
        programId: program.id,
        courseId,
        personnelId,
        academicYear: 2569,
        semester: 1,
        role: a.role,
        section: a.section,
        hoursPerWeek: a.hoursPerWeek,
        studentCount: a.studentCount,
        notes: a.notes,
      },
    });
  }

  console.log("📅 บันทึกตารางสอนและตารางเรียน (Class Schedules)...");
  await prisma.classSchedule.deleteMany({
    where: {
      tenantId,
      programId: program.id,
      academicYear: 2569,
      semester: 1,
    },
  });

  const schedules = [
    // วันจันทร์ (Monday)
    {
      scheduleCode: "SCH-2569-1-001",
      courseCode: "BUD101",
      personnelCode: "NKP-B-001",
      yearLevel: 1,
      dayOfWeek: 1,
      startTime: "08:30",
      endTime: "11:15",
      room: "ห้อง 301",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
      notes: "บรรยายโครงสร้างและคัมภีร์พระไตรปิฎกเบื้องต้น",
    },
    {
      scheduleCode: "SCH-2569-1-002",
      courseCode: "BUD102",
      personnelCode: "NKP-B-002",
      yearLevel: 1,
      dayOfWeek: 1,
      startTime: "13:00",
      endTime: "15:45",
      room: "ห้อง 301",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
      notes: "สิกขาบท 227 และอภิสมาจาร",
    },
    // วันอังคาร (Tuesday)
    {
      scheduleCode: "SCH-2569-1-003",
      courseCode: "BUD201",
      personnelCode: "NKP-B-004",
      yearLevel: 2,
      dayOfWeek: 2,
      startTime: "08:30",
      endTime: "11:15",
      room: "ห้อง 302",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
      notes: "ปรมัตถธรรม 4: จิต เจตสิก รูป นิพพาน",
    },
    {
      scheduleCode: "SCH-2569-1-004",
      courseCode: "BUD202",
      personnelCode: "NKP-B-005",
      yearLevel: 2,
      dayOfWeek: 2,
      startTime: "13:00",
      endTime: "15:45",
      room: "ห้อง 302",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
      notes: "ประวัติศาสตร์พระพุทธศาสนาในลุ่มน้ำโขงและนครพนม",
    },
    // วันพุธ (Wednesday)
    {
      scheduleCode: "SCH-2569-1-005",
      courseCode: "BUD302",
      personnelCode: "NKP-B-001",
      yearLevel: 3,
      dayOfWeek: 3,
      startTime: "08:30",
      endTime: "11:15",
      room: "ห้องปฏิบัติการบาลี 204",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
      notes: "ไวยากรณ์และการแปลคัมภีร์ธรรมบท",
    },
    {
      scheduleCode: "SCH-2569-1-006",
      courseCode: "BUD301",
      personnelCode: "NKP-B-002",
      yearLevel: 3,
      dayOfWeek: 3,
      startTime: "13:00",
      endTime: "15:45",
      room: "ห้อง 303",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
      notes: "การประยุกต์สื่อดิจิทัลเพื่อการเทศนาและเผยแผ่",
    },
    // วันพฤหัสบดี (Thursday)
    {
      scheduleCode: "SCH-2569-1-007",
      courseCode: "BUD203",
      personnelCode: "NKP-B-003",
      yearLevel: 2,
      dayOfWeek: 4,
      startTime: "13:00",
      endTime: "16:30",
      room: "ศูนย์ปฏิบัติธรรมและวิปัสสนา",
      building: "ศาลาการเปรียญริมโขง",
      section: "01",
      classType: "MEDITATION",
      notes: "ฝึกอบรมสติปัฏฐาน 4 และสมถกรรมฐาน",
    },
    // วันศุกร์ (Friday)
    {
      scheduleCode: "SCH-2569-1-008",
      courseCode: "BUD401",
      personnelCode: "NKP-B-003",
      yearLevel: 4,
      dayOfWeek: 5,
      startTime: "08:30",
      endTime: "11:15",
      room: "ห้องสัมมนาบัณฑิต 401",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "SEMINAR",
      notes: "การเขียนโครงร่างวิจัยและสัมมนาหัวข้อวิจัยทางพุทธศาสตร์",
    },
    {
      scheduleCode: "SCH-2569-1-009",
      courseCode: "BUD402",
      personnelCode: "NKP-B-005",
      yearLevel: 4,
      dayOfWeek: 5,
      startTime: "13:00",
      endTime: "15:45",
      room: "ห้องสัมมนาบัณฑิต 401",
      building: "อาคารเฉลิมพระเกียรติ 84 พรรษา",
      section: "01",
      classType: "LECTURE",
      notes: "หลักพุทธธรรมกับการสร้างสันติภาพในสังคมร่วมสมัย",
    },
  ];

  for (const s of schedules) {
    const courseId = createdCourses[s.courseCode];
    const personnelId = createdPersonnel[s.personnelCode];
    if (!courseId || !personnelId) continue;

    await prisma.classSchedule.create({
      data: {
        tenantId,
        scheduleCode: s.scheduleCode,
        programId: program.id,
        courseId,
        personnelId,
        academicYear: 2569,
        semester: 1,
        yearLevel: s.yearLevel,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        building: s.building,
        section: s.section,
        classType: s.classType,
        notes: s.notes,
      },
    });
  }

  console.log("✨ Seed หลักสูตรพุทธศาสตรบัณฑิต และ ตารางสอน วิทยาลัยสงฆ์นครพนม เรียบร้อยสมบูรณ์!");
}

main()
  .catch((e) => {
    console.error("❌ เกิดข้อผิดพลาดในการรัน Seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
