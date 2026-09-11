import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "./lib/require-database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  console.log("🌱 กำลัง Seed ข้อมูลจำลองสำหรับ Faculty Web Platform (Phase 1)...");

  // 1. หา Tenant หลัก
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("❌ ไม่พบ Tenant ในระบบ กรุณารัน npm run db:seed ก่อน");
    return;
  }
  const tenantId = tenant.id;

  // 2. Departments
  console.log("🏢 สร้างข้อมูลภาควิชา...");
  const deptDean = await prisma.department.upsert({
    where: { tenantId_code: { tenantId, code: "DEAN" } },
    update: {},
    create: {
      tenantId,
      code: "DEAN",
      nameTh: "สำนักงานคณบดี",
      nameEn: "Dean's Office",
      orderIndex: 1,
    },
  });

  const deptCS = await prisma.department.upsert({
    where: { tenantId_code: { tenantId, code: "CS" } },
    update: {},
    create: {
      tenantId,
      code: "CS",
      nameTh: "ภาควิชาวิทยาการคอมพิวเตอร์",
      nameEn: "Department of Computer Science",
      orderIndex: 2,
    },
  });

  const deptIT = await prisma.department.upsert({
    where: { tenantId_code: { tenantId, code: "IT" } },
    update: {},
    create: {
      tenantId,
      code: "IT",
      nameTh: "ภาควิชาเทคโนโลยีสารสนเทศ",
      nameEn: "Department of Information Technology",
      orderIndex: 3,
    },
  });

  const deptAIDS = await prisma.department.upsert({
    where: { tenantId_code: { tenantId, code: "AIDS" } },
    update: {},
    create: {
      tenantId,
      code: "AIDS",
      nameTh: "ภาควิชาปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูล",
      nameEn: "Department of AI and Data Science",
      orderIndex: 4,
    },
  });

  // 3. Personnel Profiles
  console.log("👥 สร้างข้อมูลคณาจารย์และบุคลากร...");
  const p1 = await prisma.personnelProfile.create({
    data: {
      tenantId,
      academicRank: "ศ.ดร.",
      firstNameTh: "สุรเชษฐ์",
      lastNameTh: "สุวรรณสิทธิ์",
      firstNameEn: "Suraphet",
      lastNameEn: "Suwannasit",
      departmentId: deptDean.id,
      positionTh: "คณบดี",
      positionEn: "Dean of Faculty",
      personnelType: "ACADEMIC",
      email: "dean@fms.ac.th",
      phoneExt: "1001",
      roomNumber: "อาคาร 1 ชั้น 5 ห้อง 501",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      biographyTh: "สำเร็จการศึกษาระดับปริญญาเอกด้าน Computer Science จาก Carnegie Mellon University มีประสบการณ์บริหารงานวิชาการและวิจัยด้าน Distributed Systems และ Enterprise AI กว่า 20 ปี",
      biographyEn: "Ph.D. in Computer Science from Carnegie Mellon University. Over 20 years of academic leadership and research experience in Distributed Systems and Enterprise AI.",
      expertise: ["Distributed Systems", "Cloud Computing", "Enterprise AI Architecture"],
      orderIndex: 1,
      isActive: true,
      works: {
        create: [
          {
            title: "High-Throughput Consensus Protocols for Enterprise Blockchain Architectures",
            workType: "JOURNAL",
            year: 2025,
            citationText: "IEEE Transactions on Parallel and Distributed Systems, Vol. 36, No. 4, pp. 812-825",
            url: "https://doi.org/10.1109/TPDS.2025.1001",
          },
          {
            title: "Scalable Microservice Monoliths in Higher Education Institutions",
            workType: "CONFERENCE",
            year: 2024,
            citationText: "ACM Conference on Computer Science Education (SIGCSE 2024)",
            url: "https://doi.org/10.1145/3600000.360001",
          },
        ],
      },
    },
  });

  const p2 = await prisma.personnelProfile.create({
    data: {
      tenantId,
      academicRank: "รศ.ดร.",
      firstNameTh: "พรพรรณ",
      lastNameTh: "สิริวัฒนา",
      firstNameEn: "Pornpan",
      lastNameEn: "Siriwattana",
      departmentId: deptCS.id,
      positionTh: "รองคณบดีฝ่ายวิชาการและวิจัย",
      positionEn: "Associate Dean for Academic Affairs",
      personnelType: "ACADEMIC",
      email: "pornpan.s@fms.ac.th",
      phoneExt: "1002",
      roomNumber: "อาคาร 1 ชั้น 5 ห้อง 502",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
      biographyTh: "เชี่ยวชาญด้าน Software Engineering, Requirements Engineering และ Modern Web Architecture มุ่งเน้นการปฏิรูปหลักสูตรสู่อุตสาหกรรมซอฟต์แวร์ระดับโลก",
      biographyEn: "Specialist in Software Engineering and Modern Web Architecture. Leading curriculum modernization aligned with global industry standards.",
      expertise: ["Software Architecture", "Domain-Driven Design", "Agile & DevOps"],
      orderIndex: 2,
      isActive: true,
      works: {
        create: [
          {
            title: "Modern Modular Monolith Patterns for Next-Generation Fullstack Applications",
            workType: "JOURNAL",
            year: 2025,
            citationText: "Journal of Systems and Software, Vol. 210, Article 111950",
            url: "https://doi.org/10.1016/j.jss.2025.111950",
          },
        ],
      },
    },
  });

  const p3 = await prisma.personnelProfile.create({
    data: {
      tenantId,
      academicRank: "ผศ.ดร.",
      firstNameTh: "กิตติศักดิ์",
      lastNameTh: "เจริญพร",
      firstNameEn: "Kittisak",
      lastNameEn: "Charoenporn",
      departmentId: deptCS.id,
      positionTh: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์",
      positionEn: "Head of Computer Science Department",
      personnelType: "ACADEMIC",
      email: "kittisak.c@fms.ac.th",
      phoneExt: "2101",
      roomNumber: "อาคาร 2 ชั้น 3 ห้อง 301",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      biographyTh: "เชี่ยวชาญด้าน Cyber Security, Zero Trust Architecture และ Network Infrastructure",
      biographyEn: "Expertise in Cyber Security, Zero Trust Architecture, and Network Infrastructure.",
      expertise: ["Cybersecurity", "Zero Trust Architecture", "Cloud Security"],
      orderIndex: 3,
      isActive: true,
    },
  });

  const p4 = await prisma.personnelProfile.create({
    data: {
      tenantId,
      academicRank: "อ.ดร.",
      firstNameTh: "ณภัทร",
      lastNameTh: "วงศ์สว่าง",
      firstNameEn: "Naphat",
      lastNameEn: "Wongsawang",
      departmentId: deptAIDS.id,
      positionTh: "อาจารย์ประจำสาขาวิชาปัญญาประดิษฐ์",
      positionEn: "Lecturer in Artificial Intelligence",
      personnelType: "ACADEMIC",
      email: "naphat.w@fms.ac.th",
      phoneExt: "3105",
      roomNumber: "อาคาร 3 ชั้น 4 ห้อง 408",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      biographyTh: "จบการศึกษาด้าน AI และ Natural Language Processing มีผลงานวิจัยการประมวลผลภาษาไทยด้วย Large Language Models",
      biographyEn: "Ph.D. specializing in AI and NLP, with active research in Thai Large Language Models.",
      expertise: ["Generative AI", "Natural Language Processing", "Computer Vision"],
      orderIndex: 4,
      isActive: true,
    },
  });

  // 4. News Categories and Articles
  console.log("📰 สร้างหมวดหมู่และข่าวสารประชาสัมพันธ์...");
  const catGeneral = await prisma.articleCategory.findFirst({ where: { tenantId, slug: "general" } });
  const catActivity = await prisma.articleCategory.findFirst({ where: { tenantId, slug: "activities" } });
  const catAcademic = await prisma.articleCategory.findFirst({ where: { tenantId, slug: "academic" } });

  if (catGeneral && catActivity && catAcademic) {
    await prisma.article.createMany({
      data: [
        {
          tenantId,
          categoryId: catGeneral.id,
          titleTh: "คณะวิทยาการและเทคโนโลยีสารสนเทศ เปิดรับสมัครนิสิตใหม่ TCAS69 ทุกสาขาวิชา",
          titleEn: "Admission Announcement: Undergraduate Programs for Academic Year 2026 (TCAS69)",
          slug: "admission-announcement-tcas-2026",
          excerptTh: "เปิดรับสมัครนิสิตใหม่ระดับปริญญาตรี ประจำปีการศึกษา 2569 รอบที่ 1 Portfolio พร้อมทุนการศึกษาสำหรับผู้มีความสามารถพิเศษทางคอมพิวเตอร์และปัญญาประดิษฐ์",
          excerptEn: "Undergraduate admissions for 2026 are now officially open. Generous merit scholarships available for exceptional students in Computer Science and AI.",
          contentTh: `คณะวิทยาการและเทคโนโลยีสารสนเทศ ขอประกาศเปิดรับสมัครคัดเลือกบุคคลเข้าศึกษาในระดับปริญญาตรี ประจำปีการศึกษา 2569 (TCAS รอบที่ 1 Portfolio)

หลักสูตรที่เปิดรับสมัคร:
1. หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ (CS)
2. หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ (IT)
3. หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูล (AI & Data Science)

คุณสมบัติของผู้สมัคร:
- สำเร็จการศึกษาหรือกำลังศึกษาชั้นมัธยมศึกษาปีที่ 6 แผนการเรียนวิทยาศาสตร์-คณิตศาสตร์ หรือเทียบเท่า
- มีผลการเรียนเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า 3.00
- มีแฟ้มสะสมผลงาน (Portfolio) ด้านคอมพิวเตอร์ การเขียนโปรแกรม นวัตกรรมดิจิทัล หรือการแข่งขันทางวิชาการ

กำหนดการรับสมัคร:
- เปิดรับสมัครออนไลน์: 1 พฤศจิกายน 2568 - 15 มกราคม 2569
- ประกาศรายชื่อผู้มีสิทธิ์สอบสัมภาษณ์: 25 มกราคม 2569
- สอบสัมภาษณ์: 1 กุมภาพันธ์ 2569

ผู้สนใจสามารถศึกษารายละเอียดและยื่นใบสมัครออนไลน์ได้ที่เว็บไซต์ของคณะ`,
          contentEn: `The Faculty of Computing & Information Technology announces undergraduate admissions for Academic Year 2026. Programs include Computer Science, Information Technology, and Artificial Intelligence & Data Science. Apply online now.`,
          coverImageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
          status: "PUBLISHED",
          publishedAt: new Date(),
          isPinned: true,
          viewCount: 2450,
        },
        {
          tenantId,
          categoryId: catAcademic.id,
          titleTh: "ขอแสดงความยินดีกับทีมนักวิจัยคณะฯ คว้ารางวัลชนะเลิศการแข่งขันนวัตกรรม AI ระดับประเทศ",
          titleEn: "Congratulations to Faculty Research Team for Winning First Prize in National AI Challenge 2026",
          slug: "national-ai-challenge-2026-award",
          excerptTh: "ทีมนักวิจัยและนิสิตคณะฯ ได้รับรางวัลถ้วยพระราชทานอันดับ 1 จากผลงานระบบตรวจจับและวิเคราะห์ข้อมูลการแพทย์ด้วย AI",
          excerptEn: "Our faculty research team and students achieved 1st place in the prestigious National AI Innovation Challenge for their clinical decision support system.",
          contentTh: `ขอแสดงความยินดีอย่างยิ่งกับทีมนักวิจัย คณะวิทยาการและเทคโนโลยีสารสนเทศ ที่ได้รับรางวัลชนะเลิศอันดับ 1 ในการแข่งขัน National AI Challenge ประจำปี 2569

ผลงานที่ได้รับรางวัลคือ 'MedVision AI' ระบบช่วยแพทย์วิเคราะห์ภาพถ่ายทางการแพทย์เพื่อตรวจจับความผิดปกติระยะเริ่มต้นอย่างแม่นยำสูง โดยใช้สถาปัตยกรรม Deep Learning และ Foundation Models

คณบดีกล่าวชื่นชมทีมวิจัยที่ได้นำองค์ความรู้จากห้องปฏิบัติการมาสร้างประโยชน์อย่างเป็นรูปธรรมแก่ระบบสาธารณสุขของประเทศ`,
          contentEn: `Congratulations to our faculty researchers for winning the National AI Challenge 2026 with their innovative MedVision AI project.`,
          coverImageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
          status: "PUBLISHED",
          publishedAt: new Date(Date.now() - 86400000 * 2),
          isPinned: false,
          viewCount: 1320,
        },
        {
          tenantId,
          categoryId: catActivity.id,
          titleTh: "ขอเชิญร่วมงานประชุมวิชาการระดับนานาชาติ The 10th International Conference on Smart Computing",
          titleEn: "Invitation: The 10th International Conference on Smart Computing and Data Analytics",
          slug: "international-conference-smart-computing-2026",
          excerptTh: "คณะฯ ร่วมเป็นเจ้าภาพจัดการประชุมวิชาการระดับนานาชาติ โดยมี Keynote Speakers ชั้นนำจาก MIT และ Stanford University",
          excerptEn: "The Faculty cordially invites researchers and students to join the 10th International Conference on Smart Computing featuring keynote speakers from MIT and Stanford.",
          contentTh: `ขอเชิญคณาจารย์ นักวิจัย นิสิต และผู้สนใจ เข้าร่วมการประชุมวิชาการระดับนานาชาติ The 10th International Conference on Smart Computing and Data Analytics (ICSCDA 2026) ระหว่างวันที่ 18-20 สิงหาคม 2569 ณ หอประชุมใหญ่ คณะวิทยาการและเทคโนโลยีสารสนเทศ`,
          contentEn: `Join us for the 10th International Conference on Smart Computing and Data Analytics featuring world-class keynote speeches and paper presentations.`,
          coverImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
          status: "PUBLISHED",
          publishedAt: new Date(Date.now() - 86400000 * 5),
          isPinned: false,
          viewCount: 890,
        },
      ],
    });
  }

  // 5. Programs & Curriculum
  console.log("🎓 สร้างข้อมูลหลักสูตรการศึกษา...");
  await prisma.program.create({
    data: {
      tenantId,
      code: "CS-66",
      nameTh: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์",
      nameEn: "Bachelor of Science Program in Computer Science",
      degreeLevel: "BACHELOR",
      degreeNameTh: "วิทยาศาสตรบัณฑิต (วิทยาการคอมพิวเตอร์) - วท.บ.",
      degreeNameEn: "Bachelor of Science (Computer Science) - B.Sc.",
      departmentId: deptCS.id,
      totalCredits: 128,
      durationYears: 4,
      tuitionFee: "22,000 บาท / ภาคการศึกษา",
      descriptionTh: "มุ่งเน้นการสร้างบัณฑิตที่มีความรู้ความสามารถเชิงทฤษฎีและปฏิบัติการขั้นสูงในการออกแบบและพัฒนาซอฟต์แวร์ อัลกอริทึม ระบบประมวลผลแบบกระจาย และความมั่นคงปลอดภัยไซเบอร์ พร้อมรับมือกับการเปลี่ยนแปลงอย่างรวดเร็วของเทคโนโลยี",
      descriptionEn: "Focuses on providing advanced theoretical foundation and practical mastery in software engineering, algorithms, distributed systems, and cybersecurity.",
      careerOpportunitiesTh: "วิศวกรซอฟต์แวร์ (Software Engineer), นักพัฒนาฟูลสแตก (Full-stack Developer), สถาปนิกระบบคลาวด์ (Cloud Architect), นักวิเคราะห์ระบบ (Systems Analyst), วิศวกรความมั่นคงปลอดภัย (Security Engineer)",
      careerOpportunitiesEn: "Software Engineer, Full-stack Developer, Cloud Architect, Systems Analyst, Security Engineer",
      isOpenAdmission: true,
      status: "ACTIVE",
      studyPlans: {
        create: [
          { nameTh: "แผนการเรียนปกติ (Regular Track)", nameEn: "Regular Study Plan", orderIndex: 1 },
          { nameTh: "แผนสหกิจศึกษา (Cooperative Education Track)", nameEn: "Co-op Study Plan", orderIndex: 2 },
        ],
      },
    },
  });

  await prisma.program.create({
    data: {
      tenantId,
      code: "IT-66",
      nameTh: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ",
      nameEn: "Bachelor of Science Program in Information Technology",
      degreeLevel: "BACHELOR",
      degreeNameTh: "วิทยาศาสตรบัณฑิต (เทคโนโลยีสารสนเทศ) - วท.บ.",
      degreeNameEn: "Bachelor of Science (Information Technology) - B.Sc.",
      departmentId: deptIT.id,
      totalCredits: 126,
      durationYears: 4,
      tuitionFee: "22,000 บาท / ภาคการศึกษา",
      descriptionTh: "เน้นการประยุกต์ใช้เทคโนโลยีดิจิทัลสมัยใหม่เพื่อขับเคลื่อนองค์กรธุรกิจ การบริหารจัดการโครงสร้างพื้นฐานคลาวด์ และการบูรณาการระบบระดับองค์กร",
      descriptionEn: "Empowers students with modern digital technologies to transform enterprise business, cloud infrastructure management, and systems integration.",
      careerOpportunitiesTh: "วิศวกรระบบไอที (IT Infrastructure Engineer), ผู้ดูแลระบบคลาวด์ (Cloud Administrator), นักพัฒนาเว็บแอปพลิเคชัน (Web Developer), ผู้เชี่ยวชาญด้าน DevOps",
      careerOpportunitiesEn: "IT Infrastructure Engineer, Cloud Administrator, Web Developer, DevOps Specialist",
      isOpenAdmission: true,
      status: "ACTIVE",
    },
  });

  await prisma.program.create({
    data: {
      tenantId,
      code: "AI-67",
      nameTh: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูล",
      nameEn: "Bachelor of Science Program in Artificial Intelligence and Data Science",
      degreeLevel: "BACHELOR",
      degreeNameTh: "วิทยาศาสตรบัณฑิต (ปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูล) - วท.บ.",
      degreeNameEn: "Bachelor of Science (AI and Data Science) - B.Sc.",
      departmentId: deptAIDS.id,
      totalCredits: 130,
      durationYears: 4,
      tuitionFee: "26,000 บาท / ภาคการศึกษา",
      descriptionTh: "หลักสูตรล้ำสมัยที่บูรณาการศาสตร์ปัญญาประดิษฐ์ การเรียนรู้ของเครื่อง (Machine Learning) และการวิเคราะห์ข้อมูลขนาดใหญ่ (Big Data Analytics) เพื่อสร้างนวัตกรรมระดับโลก",
      descriptionEn: "Cutting-edge curriculum integrating AI, Machine Learning, and Big Data Analytics to foster world-class digital innovators.",
      careerOpportunitiesTh: "วิศวกรปัญญาประดิษฐ์ (AI Engineer), นักวิทยาศาสตร์ข้อมูล (Data Scientist), วิศวกรการเรียนรู้ของเครื่อง (ML Engineer), นักวิเคราะห์ข้อมูลธุรกิจ (BI Analyst)",
      careerOpportunitiesEn: "AI Engineer, Data Scientist, Machine Learning Engineer, Business Intelligence Analyst",
      isOpenAdmission: true,
      status: "ACTIVE",
    },
  });

  await prisma.program.create({
    data: {
      tenantId,
      code: "MS-CS",
      nameTh: "หลักสูตรวิทยาศาสตรมหาบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์และนวัตกรรมดิจิทัล",
      nameEn: "Master of Science Program in Computer Science and Digital Innovation",
      degreeLevel: "MASTER",
      degreeNameTh: "วิทยาศาสตรมหาบัณฑิต (วิทยาการคอมพิวเตอร์และนวัตกรรมดิจิทัล) - วท.ม.",
      degreeNameEn: "Master of Science (Computer Science & Digital Innovation) - M.Sc.",
      departmentId: deptCS.id,
      totalCredits: 36,
      durationYears: 2,
      tuitionFee: "45,000 บาท / ภาคการศึกษา",
      descriptionTh: "หลักสูตรระดับบัณฑิตศึกษาเพื่อผลิตนักวิจัยและผู้เชี่ยวชาญระดับสูง รองรับทั้งการทำวิทยานิพนธ์และการศึกษาอิสระเชิงอุตสาหกรรม",
      descriptionEn: "Graduate program designed for researchers and senior technical leaders, supporting both academic thesis and industry capstone tracks.",
      careerOpportunitiesTh: "นักวิจัยอาวุโส (Senior Researcher), หัวหน้าทีมสถาปัตยกรรมซอฟต์แวร์ (Lead Software Architect), ผู้บริหารเทคโนโลยีสารสนเทศ (CTO)",
      careerOpportunitiesEn: "Senior Researcher, Lead Software Architect, Chief Technology Officer (CTO)",
      isOpenAdmission: true,
      status: "ACTIVE",
    },
  });

  console.log("🎉 Seed ข้อมูล Phase 1 เสร็จสมบูรณ์แล้ว!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Phase 1 ล้มเหลว:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
