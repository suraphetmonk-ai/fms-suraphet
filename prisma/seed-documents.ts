import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "./lib/require-database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  console.log("🌱 กำลัง Seed ข้อมูลจำลองสำหรับระบบบริหารจัดการและอนุมัติเอกสาร (E-Document & Approval)...");

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("❌ ไม่พบ Tenant ในระบบ");
    return;
  }
  const tenantId = tenant.id;

  const users = await prisma.user.findMany({ take: 5 });
  if (users.length === 0) {
    console.error("❌ ไม่พบผู้ใช้ในระบบ กรุณารัน seed-phase1 ก่อน");
    return;
  }

  const creator = users[0];
  const approver1 = users[1] || users[0];
  const approver2 = users[2] || users[0];

  const department = await prisma.department.findFirst({ where: { tenantId } });

  console.log("📄 สร้างเอกสารตัวอย่างและสายการอนุมัติ...");

  const doc1 = await prisma.document.upsert({
    where: {
      tenantId_documentNumber: {
        tenantId,
        documentNumber: "ศธ 0514.01/ว0142",
      },
    },
    update: {},
    create: {
      tenantId,
      documentNumber: "ศธ 0514.01/ว0142",
      title: "ขออนุมัติจัดโครงการสัมมนาเชิงปฏิบัติการปัญญาประดิษฐ์เพื่องานวิจัยและนวัตกรรม",
      category: "MEMO",
      urgency: "URGENT",
      confidentiality: "NORMAL",
      senderName: creator.name || "ผศ.ดร. ธีรภัทร สมบูรณ์",
      recipientName: "คณบดีคณะวิทยาการจัดการ",
      summary: "ด้วยภาควิชาวิทยาการคอมพิวเตอร์มีความประสงค์จัดสัมมนาเชิงปฏิบัติการ เรื่อง การประยุกต์ใช้ AI ในการวิเคราะห์ข้อมูลขนาดใหญ่ สำหรับคณาจารย์และนิสิตระดับบัณฑิตศึกษา ในวันที่ 25-26 ตุลาคม 2569 ณ ห้องประชุมสัมมนา 1 โดยใช้งบประมาณสนับสนุนจากกองทุนพัฒนาวิชาการ จำนวน 45,000 บาท จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      status: "IN_PROGRESS",
      departmentId: department?.id,
      createdById: creator.id,
      approvals: {
        create: [
          {
            tenantId,
            approverId: approver1.id,
            stepOrder: 1,
            roleTitle: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์",
            status: "APPROVED",
            comment: "เห็นควรสนับสนุนโครงการดังกล่าวเพื่อเสริมสร้างทักษะ AI แก่บุคลากรและนิสิต",
            actedAt: new Date(Date.now() - 86400000),
          },
          {
            tenantId,
            approverId: approver2.id,
            stepOrder: 2,
            roleTitle: "รองคณบดีฝ่ายวิชาการและวิจัย",
            status: "PENDING",
            comment: null,
          },
        ],
      },
      histories: {
        create: [
          {
            tenantId,
            actorId: creator.id,
            action: "SUBMITTED",
            description: "ยื่นเสนอเอกสารขออนุมัติโครงการสัมมนา AI เข้าสู่สายการพิจารณา",
          },
          {
            tenantId,
            actorId: approver1.id,
            action: "APPROVED",
            description: "หัวหน้าภาควิชาลงนามเห็นชอบ เสนอต่อไปยังรองคณบดีฝ่ายวิชาการ",
          },
        ],
      },
    },
  });

  const doc2 = await prisma.document.upsert({
    where: {
      tenantId_documentNumber: {
        tenantId,
        documentNumber: "คำสั่ง คณะ วจ. ที่ 45/2569",
      },
    },
    update: {},
    create: {
      tenantId,
      documentNumber: "คำสั่ง คณะ วจ. ที่ 45/2569",
      title: "แต่งตั้งคณะกรรมการปรับปรุงหลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ ประจำปี 2569",
      category: "ORDER",
      urgency: "NORMAL",
      confidentiality: "NORMAL",
      senderName: "งานหลักสูตรและวิชาการ",
      recipientName: "คณาจารย์ผู้ได้รับการแต่งตั้ง",
      summary: "เพื่อให้การบริหารและพัฒนาหลักสูตรเป็นไปตามเกณฑ์มาตรฐาน สป.อว. จึงขอแต่งตั้งคณะกรรมการผู้รับผิดชอบหลักสูตรและคณะกรรมการพัฒนาหลักสูตรตามรายนามที่แนบ",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      status: "APPROVED",
      departmentId: department?.id,
      createdById: creator.id,
      approvals: {
        create: [
          {
            tenantId,
            approverId: approver1.id,
            stepOrder: 1,
            roleTitle: "รองคณบดีฝ่ายวิชาการ",
            status: "APPROVED",
            comment: "ตรวจสอบรายชื่อและองค์ประกอบคณะกรรมการถูกต้องตามเกณฑ์มาตรฐานหลักสูตร",
            actedAt: new Date(Date.now() - 172800000),
          },
          {
            tenantId,
            approverId: approver2.id,
            stepOrder: 2,
            roleTitle: "คณบดีคณะวิทยาการจัดการ",
            status: "APPROVED",
            comment: "อนุมัติและลงนามคำสั่งแต่งตั้ง มีผลบังคับใช้ตั้งแต่วันที่ 1 ตุลาคม 2569",
            actedAt: new Date(Date.now() - 86400000),
          },
        ],
      },
      histories: {
        create: [
          {
            tenantId,
            actorId: creator.id,
            action: "SUBMITTED",
            description: "ร่างคำสั่งแต่งตั้งคณะกรรมการและส่งเข้าสู่การพิจารณา",
          },
          {
            tenantId,
            actorId: approver1.id,
            action: "APPROVED",
            description: "รองคณบดีฝ่ายวิชาการตรวจสอบและลงนามเห็นชอบ",
          },
          {
            tenantId,
            actorId: approver2.id,
            action: "APPROVED",
            description: "คณบดีลงนามอนุมัติคำสั่งเรียบร้อยแล้ว",
          },
        ],
      },
    },
  });

  const doc3 = await prisma.document.upsert({
    where: {
      tenantId_documentNumber: {
        tenantId,
        documentNumber: "ศธ 0514.02/ว0088",
      },
    },
    update: {},
    create: {
      tenantId,
      documentNumber: "ศธ 0514.02/ว0088",
      title: "ขออนุมัติเดินทางไปราชการเพื่อนำเสนอบทความวิจัยระดับนานาชาติ IEEE ICIS 2026",
      category: "REQUEST",
      urgency: "MOST_URGENT",
      confidentiality: "NORMAL",
      senderName: "อ.ดร. นภัสสร วงศ์พิชิต",
      recipientName: "คณบดีคณะวิทยาการจัดการ",
      summary: "ขออนุมัติเดินทางไปราชการ ณ ประเทศญี่ปุ่น พร้อมขอรับทุนสนับสนุนการนำเสนอผลงานวิจัย จำนวน 35,000 บาท ระหว่างวันที่ 12-16 พฤศจิกายน 2569",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      status: "IN_PROGRESS",
      departmentId: department?.id,
      createdById: creator.id,
      approvals: {
        create: [
          {
            tenantId,
            approverId: creator.id,
            stepOrder: 1,
            roleTitle: "รองคณบดีฝ่ายบริหารและยุทธศาสตร์",
            status: "PENDING",
            comment: null,
          },
        ],
      },
      histories: {
        create: [
          {
            tenantId,
            actorId: creator.id,
            action: "SUBMITTED",
            description: "ยื่นเสนอขออนุมัติเดินทางไปราชการต่างประเทศ",
          },
        ],
      },
    },
  });

  console.log(`✅ Seed เอกสารสำเร็จ: ${doc1.documentNumber}, ${doc2.documentNumber}, ${doc3.documentNumber}`);
}

main()
  .catch((e) => {
    console.error("❌ เกิดข้อผิดพลาดในการ seed documents:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
