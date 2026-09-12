import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "./lib/require-database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  console.log("🌱 กำลัง Seed ข้อมูลจำลองสำหรับระบบบริหารจัดการนิสิต (Students & Advising)...");

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("❌ ไม่พบ Tenant ในระบบ");
    return;
  }
  const tenantId = tenant.id;

  // Retrieve programs
  const progCS = await prisma.program.findFirst({ where: { tenantId, code: { startsWith: "CS" } } });
  const progIT = await prisma.program.findFirst({ where: { tenantId, code: { startsWith: "IT" } } });
  const progAIDS = await prisma.program.findFirst({ where: { tenantId, code: { startsWith: "AI" } } });
  const anyProg = await prisma.program.findFirst({ where: { tenantId } });
  const defaultProgram = progCS || progIT || progAIDS || anyProg;

  if (!defaultProgram) {
    console.error("❌ ไม่พบหลักสูตรในระบบ กรุณารัน seed-phase1 ก่อน");
    return;
  }

  // Retrieve advisors (personnel)
  const advisors = await prisma.personnelProfile.findMany({
    where: { tenantId },
    take: 3,
  });

  const adv1 = advisors[0];
  const adv2 = advisors[1] || advisors[0];

  console.log("👨‍🎓 สร้างทะเบียนนิสิตตัวอย่าง...");

  const sampleStudents = [
    {
      studentCode: "66010001",
      title: "นาย",
      firstNameTh: "ศุภวิชญ์",
      lastNameTh: "ปัญญาวงศ์",
      firstNameEn: "Suphawit",
      lastNameEn: "Panyawong",
      programId: progCS?.id || defaultProgram.id,
      advisorId: adv1?.id,
      admissionYear: 2566,
      status: "STUDYING",
      gpa: 3.82,
      email: "suphawit.p@fms.ac.th",
      phone: "081-234-5678",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
    },
    {
      studentCode: "66010002",
      title: "นางสาว",
      firstNameTh: "กนกวรรณ",
      lastNameTh: "ทองประเสริฐ",
      firstNameEn: "Kanokwan",
      lastNameEn: "Thongprasert",
      programId: progCS?.id || defaultProgram.id,
      advisorId: adv1?.id,
      admissionYear: 2566,
      status: "STUDYING",
      gpa: 1.85, // CRITICAL (วิทยาทัณฑ์)
      email: "kanokwan.t@fms.ac.th",
      phone: "089-876-5432",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    },
    {
      studentCode: "67010015",
      title: "นาย",
      firstNameTh: "ธนกฤต",
      lastNameTh: "รัตนมงคล",
      firstNameEn: "Thanakrit",
      lastNameEn: "Rattanamongkol",
      programId: progIT?.id || defaultProgram.id,
      advisorId: adv2?.id,
      admissionYear: 2567,
      status: "STUDYING",
      gpa: 2.25, // WARNING (เฝ้าระวัง)
      email: "thanakrit.r@fms.ac.th",
      phone: "082-345-6789",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    },
    {
      studentCode: "67010018",
      title: "นางสาว",
      firstNameTh: "พัชริดา",
      lastNameTh: "แสงสุวรรณ",
      firstNameEn: "Patcharida",
      lastNameEn: "Saengsuwan",
      programId: progAIDS?.id || defaultProgram.id,
      advisorId: adv2?.id,
      admissionYear: 2567,
      status: "STUDYING",
      gpa: 3.45,
      email: "patcharida.s@fms.ac.th",
      phone: "084-567-8901",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    },
    {
      studentCode: "63010045",
      title: "นาย",
      firstNameTh: "เอกชัย",
      lastNameTh: "สุขเกษม",
      firstNameEn: "Ekkachai",
      lastNameEn: "Sukgasem",
      programId: progCS?.id || defaultProgram.id,
      advisorId: adv1?.id,
      admissionYear: 2563,
      status: "GRADUATED", // GRADUATED
      gpa: 3.65,
      email: "ekkachai.s@alumni.fms.ac.th",
      phone: "086-123-4567",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    },
    {
      studentCode: "68010005",
      title: "นาย",
      firstNameTh: "ณัฐดนัย",
      lastNameTh: "จิรภัทร",
      firstNameEn: "Natdanai",
      lastNameEn: "Jiraphat",
      programId: progAIDS?.id || defaultProgram.id,
      advisorId: adv1?.id,
      admissionYear: 2568,
      status: "ON_LEAVE", // ON_LEAVE
      gpa: 2.70,
      email: "natdanai.j@fms.ac.th",
      phone: "088-765-4321",
    },
  ];

  for (const s of sampleStudents) {
    const created = await prisma.student.upsert({
      where: { tenantId_studentCode: { tenantId, studentCode: s.studentCode } },
      update: {
        gpa: s.gpa,
        status: s.status,
        advisorId: s.advisorId,
      },
      create: {
        tenantId,
        studentCode: s.studentCode,
        title: s.title,
        firstNameTh: s.firstNameTh,
        lastNameTh: s.lastNameTh,
        firstNameEn: s.firstNameEn,
        lastNameEn: s.lastNameEn,
        programId: s.programId,
        advisorId: s.advisorId,
        admissionYear: s.admissionYear,
        status: s.status,
        gpa: s.gpa,
        email: s.email,
        phone: s.phone,
        avatarUrl: s.avatarUrl,
      },
    });

    // Add advising records for critical student
    if (s.studentCode === "66010002" && adv1) {
      await prisma.advisingRecord.createMany({
        data: [
          {
            tenantId,
            studentId: created.id,
            advisorId: adv1.id,
            date: new Date(Date.now() - 86400000 * 7),
            topic: "ติดตามภาวะวิทยาทัณฑ์และวางแผนการลงทะเบียนใหม่",
            detail: "นิสิตมีผลการเรียนวิชา Data Structures และ Calculus ต่ำกว่าเกณฑ์ ทำให้ GPAX สะสมตกมาอยู่ที่ 1.85 ได้พูดคุยสอบถามปัญหาครอบครัวและการจัดสรรเวลาอ่านหนังสือ",
            actionPlan: "ให้นิสิตดรอปวิชาโทก่อน และเน้นทบทวนรายวิชาบังคับหลัก นัดพบสัปดาห์ละ 1 ครั้งเพื่อติดตามผล",
            isConfidential: true, // PDPA Confidential
          },
          {
            tenantId,
            studentId: created.id,
            advisorId: adv1.id,
            date: new Date(Date.now() - 86400000 * 30),
            topic: "ให้คำปรึกษาการปรับตัวและกิจกรรมเสริมหลักสูตร",
            detail: "นิสิตมีความตั้งใจดี แต่ทำกิจกรรมนอกหลักสูตรมากเกินไป แนะนำให้ลดชั่วโมงกิจกรรมเพื่อเตรียมตัวสอบกลางภาค",
            actionPlan: "จัดตารางเวลาอ่านหนังสือวันละ 2 ชั่วโมง",
            isConfidential: false,
          },
        ],
      });
    }

    // Add scholarship for top student
    if (s.studentCode === "66010001") {
      await prisma.studentScholarship.createMany({
        data: [
          {
            tenantId,
            studentId: created.id,
            scholarshipName: "ทุนเรียนดี คณะวิทยาการและเทคโนโลยีสารสนเทศ",
            academicYear: 2567,
            amount: 25000,
          },
          {
            tenantId,
            studentId: created.id,
            scholarshipName: "ทุนสนับสนุนการแข่งขันพัฒนาซอฟต์แวร์ระดับเยาวชนแห่งชาติ",
            academicYear: 2568,
            amount: 15000,
          },
        ],
      });

      if (adv1) {
        await prisma.advisingRecord.create({
          data: {
            tenantId,
            studentId: created.id,
            advisorId: adv1.id,
            date: new Date(Date.now() - 86400000 * 14),
            topic: "การวางแผนโครงงานวิจัยระดับปริญญาตรีและการศึกษาต่อ",
            detail: "นิสิตมีความสนใจศึกษาต่อระดับบัณฑิตศึกษาด้าน Artificial Intelligence ได้แนะนำหัวข้อวิจัย Foundation Models และช่องทางการสมัครทุนเรียนต่อต่างประเทศ",
            actionPlan: "เตรียมนิพนธ์ต้นฉบับเพื่อส่งตีพิมพ์ในการประชุมวิชาการระดับชาติ",
            isConfidential: false,
          },
        });
      }
    }
  }

  console.log("✅ Seed ข้อมูลระบบนิสิตและการให้คำปรึกษาเสร็จสมบูรณ์");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
