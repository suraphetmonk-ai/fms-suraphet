import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 เริ่มต้นการนำเข้าข้อมูลหลักสูตร มคอ. ๒ สาขาวิชาพระพุทธศาสนา...");

  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  if (!tenant) {
    throw new Error("No tenant found!");
  }
  const tenantId = tenant.id;

  // 1. ภาควิชาพระพุทธศาสนา (Department of Buddhist Studies)
  const deptBuddhist = await prisma.department.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: "BUD",
      },
    },
    update: {
      nameTh: "ภาควิชาพระพุทธศาสนา",
      nameEn: "Department of Buddhist Studies",
      orderIndex: 1,
    },
    create: {
      tenantId,
      code: "BUD",
      nameTh: "ภาควิชาพระพุทธศาสนา",
      nameEn: "Department of Buddhist Studies",
      orderIndex: 1,
    },
  });

  // 2. อาจารย์ผู้รับผิดชอบหลักสูตร 6 รูป/ท่าน (จาก มคอ. ๒ หน้า ๔๘-๕๐)
  console.log("👨‍🏫 บันทึกข้อมูลคณาจารย์ประจำหลักสูตร...");
  const facultyMembers = [
    {
      code: "MCU-FAC-01",
      academicRank: "ผศ.ดร.",
      monasticTitle: "พระมหาวีระชาติ",
      chaya: "ธีรสิทฺโธ",
      paliDegree: "ป.ธ.๔",
      firstNameTh: "วีระชาติ",
      lastNameTh: "เพ็งแจ่ม",
      firstNameEn: "Weerachat",
      lastNameEn: "Phengjaem",
      positionTh: "ประธานหลักสูตร / ผู้ช่วยศาสตราจารย์",
      positionEn: "Curriculum Chair / Assistant Professor",
      email: "weerachat.p@mcu.ac.th",
      biographyTh: "พธ.ด.(พระพุทธศาสนา), พธ.ม.(พระพุทธศาสนา), วศ.บ.(วิศวกรรมโยธา), คอ.บ.(วิศวกรรมอุตสาหการ), ป.วน.(วิปัสสนาภาวนา)",
      expertise: ["พระพุทธศาสนา", "วิศวกรรมศาสตร์และเทคโนโลยี", "วิปัสสนาภาวนา", "พุทธนวัตกรรม"],
      avatarUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    },
    {
      code: "MCU-FAC-02",
      academicRank: "ดร.",
      firstNameTh: "ปรียาภรณ์",
      lastNameTh: "ฤทธาพรม",
      firstNameEn: "Preeyaporn",
      lastNameEn: "Ritthaprom",
      positionTh: "อาจารย์ผู้รับผิดชอบหลักสูตร",
      positionEn: "Curriculum Committee / Lecturer",
      email: "preeyaporn.r@mcu.ac.th",
      biographyTh: "พธ.ด.(พระพุทธศาสนา), พธ.ม.(พระพุทธศาสนา), บธ.บ.(บริหารธุรกิจ)",
      expertise: ["พระพุทธศาสนา", "การบริหารธุรกิจเชิงพุทธ", "พุทธจิตวิทยา"],
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    },
    {
      code: "MCU-FAC-03",
      academicRank: "อาจารย์",
      monasticTitle: "พระสมุห์",
      chaya: "ญาณธโร",
      firstNameTh: "กองสี",
      lastNameTh: "พรมโพธิ์",
      firstNameEn: "Kongsee",
      lastNameEn: "Prompho",
      positionTh: "อาจารย์ผู้รับผิดชอบหลักสูตร",
      positionEn: "Curriculum Committee / Lecturer",
      email: "kongsee.p@mcu.ac.th",
      biographyTh: "พธ.ม.(พระพุทธศาสนา), พธ.บ.(การบริหารรัฐกิจ)",
      expertise: ["พระพุทธศาสนา", "การบริหารรัฐกิจแนวพุทธ", "ศาสนพิธี"],
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    },
    {
      code: "MCU-FAC-04",
      academicRank: "ดร.",
      monasticTitle: "พระอธิการ",
      chaya: "ภทฺทธมฺโม",
      firstNameTh: "ธีรวัฒน์",
      lastNameTh: "ศิริบุตร",
      firstNameEn: "Theerawat",
      lastNameEn: "Siribut",
      positionTh: "อาจารย์ผู้รับผิดชอบหลักสูตร",
      positionEn: "Curriculum Committee / Lecturer",
      email: "theerawat.s@mcu.ac.th",
      biographyTh: "พธ.ด.(พระพุทธศาสนา), พธ.ม.(พระพุทธศาสนา), พธ.บ.(ศาสนา)",
      expertise: ["พระพุทธศาสนา", "พระไตรปิฎกศึกษา", "พุทธปรัชญา"],
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    },
    {
      code: "MCU-FAC-05",
      academicRank: "ผศ.ดร.",
      firstNameTh: "สิปป์มงคล",
      lastNameTh: "ป้องภา",
      firstNameEn: "Sippamongkol",
      lastNameEn: "Pongpha",
      positionTh: "อาจารย์ผู้รับผิดชอบหลักสูตร / ผู้ช่วยศาสตราจารย์",
      positionEn: "Curriculum Committee / Assistant Professor",
      email: "sippamongkol.p@mcu.ac.th",
      biographyTh: "Ph.D.(Pali-Prakrit/Philosophy) Magadh University India, M.A.(Buddhist Studies), พธ.บ.(ภาษาอังกฤษ)",
      expertise: ["Pali-Prakrit", "Buddhist Philosophy", "ภาษาอังกฤษเพื่อการสื่อสารทางศาสนา"],
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    },
    {
      code: "MCU-FAC-06",
      academicRank: "ดร.",
      monasticTitle: "พระอธิการ",
      chaya: "ปมุตฺโต",
      firstNameTh: "บุญเพ็ง",
      lastNameTh: "ปยุตโต",
      firstNameEn: "Boonpeng",
      lastNameEn: "Payutto",
      positionTh: "อาจารย์ผู้รับผิดชอบหลักสูตร",
      positionEn: "Curriculum Committee / Lecturer",
      email: "boonpeng.p@mcu.ac.th",
      biographyTh: "พธ.ด.(พระพุทธศาสนา), พธ.ม.(พระพุทธศาสนา), พธ.บ.(ศาสนา), ป.บส.",
      expertise: ["พระพุทธศาสนา", "พุทธนวัตกรรมและการบริหาร", "การพัฒนาชุมชน"],
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    },
  ];

  for (let i = 0; i < facultyMembers.length; i++) {
    const m = facultyMembers[i];
    await prisma.personnelProfile.upsert({
      where: { id: `00000000-0000-0000-0000-0000000000b${i + 1}` },
      update: {
        departmentId: deptBuddhist.id,
        academicRank: m.academicRank,
        monasticTitle: m.monasticTitle,
        chaya: m.chaya,
        paliDegree: m.paliDegree,
        firstNameTh: m.firstNameTh,
        lastNameTh: m.lastNameTh,
        firstNameEn: m.firstNameEn,
        lastNameEn: m.lastNameEn,
        positionTh: m.positionTh,
        positionEn: m.positionEn,
        email: m.email,
        biographyTh: m.biographyTh,
        expertise: m.expertise,
        avatarUrl: m.avatarUrl,
        orderIndex: i + 1,
        isActive: true,
      },
      create: {
        id: `00000000-0000-0000-0000-0000000000b${i + 1}`,
        tenantId,
        departmentId: deptBuddhist.id,
        personnelCode: m.code,
        academicRank: m.academicRank,
        monasticTitle: m.monasticTitle,
        chaya: m.chaya,
        paliDegree: m.paliDegree,
        firstNameTh: m.firstNameTh,
        lastNameTh: m.lastNameTh,
        firstNameEn: m.firstNameEn,
        lastNameEn: m.lastNameEn,
        positionTh: m.positionTh,
        positionEn: m.positionEn,
        email: m.email,
        biographyTh: m.biographyTh,
        expertise: m.expertise,
        avatarUrl: m.avatarUrl,
        orderIndex: i + 1,
        isActive: true,
      },
    });
  }

  // 3. สร้างหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (ปรับปรุง ๒๕๗๐)
  console.log("📜 บันทึกข้อมูลหลักสูตรพุทธศาสตรบัณฑิต...");
  const programCode = "25611851100597";

  const program = await prisma.program.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: programCode,
      },
    },
    update: {
      nameTh: "หลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรปรับปรุง พ.ศ. ๒๕๗๐)",
      nameEn: "Bachelor of Arts Program in Buddhist Studies",
      degreeLevel: "BACHELOR",
      degreeNameTh: "พุทธศาสตรบัณฑิต (พระพุทธศาสนา) - พธ.บ.",
      degreeNameEn: "Bachelor of Arts (Buddhist Studies) - B.A.",
      departmentId: deptBuddhist.id,
      totalCredits: 132,
      durationYears: 4,
      tuitionFee: "ประมาณการ ๘,๐๐๐ บาท / ปีการศึกษา",
      descriptionTh: `“จัดการศึกษาพระพุทธศาสนาบูรณาการกับศาสตร์สมัยใหม่ ผลิตบัณฑิตให้มีความรู้ดี มีศีลธรรม นำสังคมสู่สันติสุข”

เป้าหมายหลักสูตร:
มุ่งผลิตบัณฑิตให้เป็น “พุทธนวัตกร” (Buddhist Innovators) ที่มีความรอบรู้ในคัมภีร์พระไตรปิฎก ควบคู่กับความตื่นรู้ในศาสตร์สมัยใหม่ อาทิ สังคมวิทยา จิตวิทยา รัฐศาสตร์ วิทยาศาสตร์ เทคโนโลยีดิจิทัล และสิทธิมนุษยชน

ผลลัพธ์การเรียนรู้ที่คาดหวัง (PLOs):
• PLO ๑ (ด้านความรู้): มีความรอบรู้ในหลักพระพุทธศาสนาและศาสตร์ที่เกี่ยวข้อง สามารถประยุกต์องค์ความรู้กับศาสตร์สมัยใหม่ได้อย่างเหมาะสม
• PLO ๒ (ด้านทักษะ): มีทักษะการถ่ายทอดหลักพุทธธรรมกับศาสตร์สมัยใหม่ เพื่อการเผยแผ่และการแก้ไขปัญหาสังคมในยุคปัจจุบันได้
• PLO ๓ (ด้านจริยธรรม): สามารถปฏิบัติตนตามหลักคุณธรรม จริยธรรม ยึดมั่นในหลักพระพุทธศาสนา มีความรับผิดชอบต่อสังคม และเป็นแบบอย่างที่ดีในการดำเนินชีวิต
• PLO ๔ (ด้านลักษณะบุคคล): มีภาวะผู้นำ สามารถทำงานร่วมกับผู้อื่นและปฏิบัติงานเป็นทีมได้อย่างเหมาะสมพร้อมทั้งมีทักษะการเรียนรู้ตลอดชีวิตและสามารถปรับตัวต่อการเปลี่ยนแปลงของสังคมในศตวรรษที่ ๒๑
• PLO ๕ (ด้านเทคโนโลยี): สามารถใช้เทคโนโลยีดิจิทัล สารสนเทศ พุทธนวัตกรรม เพื่อการสื่อสาร การเผยแผ่พระพุทธศาสนา การจัดการศึกษา และการบริหารองค์กรได้อย่างเหมาะสม`,
      descriptionEn: `“Buddhist Studies Integrated with Modern Sciences to Produce Graduates with Wisdom and Morality Leading Society to Sustainable Peace.”

Curriculum Focus:
Cultivating “Buddhist Innovators” who master the Buddhist canon (Tipitaka) while synthesizing modern sciences such as sociology, psychology, political science, and digital innovation to serve community welfare.

Program Learning Outcomes (PLOs):
• PLO 1: Profound knowledge in Buddhist doctrines and integration with modern disciplines.
• PLO 2: Communication and propagation skills to resolve contemporary social dilemmas.
• PLO 3: Moral integrity, meditation practice, social responsibility, and mindfulness lifestyle.
• PLO 4: 21st-century leadership, collaborative team-building, and life-long adaptability.
• PLO 5: Effective application of digital tools and Buddhist Innovations for educational and cultural outreach.`,
      careerOpportunitiesTh: `๑. สายงานภาครัฐและรัฐวิสาหกิจ:
   - นักวิชาการศาสนา (สำนักงานพระพุทธศาสนาแห่งชาติ และกระทรวงวัฒนธรรม)
   - เจ้าหน้าที่กองศาสนพิธี (กระทรวงวัฒนธรรม)
   - อนุศาสนาจารย์ (กองทัพบก กองทัพเรือ กองทัพอากาศ และสำนักงานตำรวจแห่งชาติ)
   - นักวิชาการพัฒนาสังคม / นักสังคมสงเคราะห์ (กรมราชทัณฑ์ กรมสุขภาพจิต หรือกระทรวง พม.)
   - บุคลากรทางการศึกษา / ครูผู้สอนกลุ่มสาระสังคมศึกษา ศาสนา และวัฒนธรรม / พระสอนศีลธรรมในสถานศึกษา

๒. สายงานการส่งเสริมสุขภาพจิต สุขภาวะ และสมาธิบำบัด:
   - นักจัดกระบวนการเรียนรู้และสมาธิบำบัด (Mindfulness & Meditation Facilitator)
   - นักเยียวยาจิตใจและผู้ดูแลสุขภาวะทางจิตวิญญาณ (Spiritual Caregiver) ในโรงพยาบาลและศูนย์ดูแลผู้ป่วยระยะสุดท้าย (Palliative Care)
   - นักพัฒนาสังคมและฟื้นฟูจิตใจในองค์กรสาธารณกุศลและองค์กรพัฒนาเอกชน (NGOs)

๓. สายงานสื่อ เศรษฐกิจสร้างสรรค์ และการท่องเที่ยวเชิงวัฒนธรรม:
   - นักสร้างสรรค์เนื้อหาทางศาสนา ศิลปวัฒนธรรม และมรดกท้องถิ่น (Religious & Cultural Content Creator)
   - นักจัดการและผู้นำเที่ยวเชิงจิตวิญญาณและพุทธศิลป์ (Spiritual & Cultural Tourism Specialist)
   - ภัณฑารักษ์และนักจัดการมรดกทางวัฒนธรรมในแหล่งเรียนรู้หรือพิพิธภัณฑ์ท้องถิ่น

๔. สายงานการบริหารทรัพยากรมนุษย์และองค์กรเอกชน:
   - เจ้าหน้าที่ฝึกอบรมและพัฒนาทรัพยากรมนุษย์ (Human Resource Development Officer)
   - เจ้าหน้าที่ดำเนินงานด้านความรับผิดชอบต่อสังคมและสิ่งแวดล้อมขององค์กร (CSR Officer)

๕. สายงานการเผยแผ่และส่งเสริมพระพุทธศาสนา:
   - พระธรรมทูต (ทั้งในประเทศและต่างประเทศ)
   - พระวิปัสสนาจารย์ / วิทยากรบรรยายธรรม
   - นักวิจัยด้านพุทธศาสน์ศึกษาและท้องถิ่นศึกษา`,
      careerOpportunitiesEn: `1. Public Sector & Civil Services:
   - Religious Affairs Officer (National Office of Buddhism / Ministry of Culture)
   - Ceremonial Affairs Officer, Military & Police Chaplain (Army, Navy, Air Force, Police)
   - Social Development Specialist & Social Worker (Dept of Corrections, Dept of Mental Health)
   - Secondary School Religious & Social Studies Educator, Dharma Teacher

2. Mental Health, Spiritual Well-being & Social Welfare:
   - Mindfulness & Meditation Facilitator
   - Spiritual Caregiver in Hospitals and Palliative Care Centers
   - Mental Restoration and Social Development Worker in Non-profit Organizations & NGOs

3. Creative Economy, Media & Cultural Tourism:
   - Religious & Cultural Content Creator
   - Spiritual & Buddhist Art Tourism Specialist
   - Museum Curator & Cultural Heritage Manager

4. Corporate Human Resource & CSR:
   - Human Resource Development (HRD) Officer
   - Corporate Social Responsibility (CSR) Officer

5. Buddhist Propagation & Monastic Careers:
   - Dhammaduta (Buddhist Missionary Monk/Educator in Thailand and abroad)
   - Vipassana Meditation Master & Buddhist Lecturer
   - Buddhist Studies & Regional Wisdom Researcher`,
      pdfUrl: "/documents/tqf2-buddhist-studies-2570.pdf",
      isOpenAdmission: true,
      status: "ACTIVE",
    },
    create: {
      tenantId,
      code: programCode,
      nameTh: "หลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรปรับปรุง พ.ศ. ๒๕๗๐)",
      nameEn: "Bachelor of Arts Program in Buddhist Studies",
      degreeLevel: "BACHELOR",
      degreeNameTh: "พุทธศาสตรบัณฑิต (พระพุทธศาสนา) - พธ.บ.",
      degreeNameEn: "Bachelor of Arts (Buddhist Studies) - B.A.",
      departmentId: deptBuddhist.id,
      totalCredits: 132,
      durationYears: 4,
      tuitionFee: "ประมาณการ ๘,๐๐๐ บาท / ปีการศึกษา",
      descriptionTh: `“จัดการศึกษาพระพุทธศาสนาบูรณาการกับศาสตร์สมัยใหม่ ผลิตบัณฑิตให้มีความรู้ดี มีศีลธรรม นำสังคมสู่สันติสุข”

เป้าหมายหลักสูตร:
มุ่งผลิตบัณฑิตให้เป็น “พุทธนวัตกร” (Buddhist Innovators) ที่มีความรอบรู้ในคัมภีร์พระไตรปิฎก ควบคู่กับความตื่นรู้ในศาสตร์สมัยใหม่ อาทิ สังคมวิทยา จิตวิทยา รัฐศาสตร์ วิทยาศาสตร์ เทคโนโลยีดิจิทัล และสิทธิมนุษยชน

ผลลัพธ์การเรียนรู้ที่คาดหวัง (PLOs):
• PLO ๑ (ด้านความรู้): มีความรอบรู้ในหลักพระพุทธศาสนาและศาสตร์ที่เกี่ยวข้อง สามารถประยุกต์องค์ความรู้กับศาสตร์สมัยใหม่ได้อย่างเหมาะสม
• PLO ๒ (ด้านทักษะ): มีทักษะการถ่ายทอดหลักพุทธธรรมกับศาสตร์สมัยใหม่ เพื่อการเผยแผ่และการแก้ไขปัญหาสังคมในยุคปัจจุบันได้
• PLO ๓ (ด้านจริยธรรม): สามารถปฏิบัติตนตามหลักคุณธรรม จริยธรรม ยึดมั่นในหลักพระพุทธศาสนา มีความรับผิดชอบต่อสังคม และเป็นแบบอย่างที่ดีในการดำเนินชีวิต
• PLO ๔ (ด้านลักษณะบุคคล): มีภาวะผู้นำ สามารถทำงานร่วมกับผู้อื่นและปฏิบัติงานเป็นทีมได้อย่างเหมาะสมพร้อมทั้งมีทักษะการเรียนรู้ตลอดชีวิตและสามารถปรับตัวต่อการเปลี่ยนแปลงของสังคมในศตวรรษที่ ๒๑
• PLO ๕ (ด้านเทคโนโลยี): สามารถใช้เทคโนโลยีดิจิทัล สารสนเทศ พุทธนวัตกรรม เพื่อการสื่อสาร การเผยแผ่พระพุทธศาสนา การจัดการศึกษา และการบริหารองค์กรได้อย่างเหมาะสม`,
      descriptionEn: `“Buddhist Studies Integrated with Modern Sciences to Produce Graduates with Wisdom and Morality Leading Society to Sustainable Peace.”

Curriculum Focus:
Cultivating “Buddhist Innovators” who master the Buddhist canon (Tipitaka) while synthesizing modern sciences such as sociology, psychology, political science, and digital innovation to serve community welfare.

Program Learning Outcomes (PLOs):
• PLO 1: Profound knowledge in Buddhist doctrines and integration with modern disciplines.
• PLO 2: Communication and propagation skills to resolve contemporary social dilemmas.
• PLO 3: Moral integrity, meditation practice, social responsibility, and mindfulness lifestyle.
• PLO 4: 21st-century leadership, collaborative team-building, and life-long adaptability.
• PLO 5: Effective application of digital tools and Buddhist Innovations for educational and cultural outreach.`,
      careerOpportunitiesTh: `๑. สายงานภาครัฐและรัฐวิสาหกิจ:
   - นักวิชาการศาสนา (สำนักงานพระพุทธศาสนาแห่งชาติ และกระทรวงวัฒนธรรม)
   - เจ้าหน้าที่กองศาสนพิธี (กระทรวงวัฒนธรรม)
   - อนุศาสนาจารย์ (กองทัพบก กองทัพเรือ กองทัพอากาศ และสำนักงานตำรวจแห่งชาติ)
   - นักวิชาการพัฒนาสังคม / นักสังคมสงเคราะห์ (กรมราชทัณฑ์ กรมสุขภาพจิต หรือกระทรวง พม.)
   - บุคลากรทางการศึกษา / ครูผู้สอนกลุ่มสาระสังคมศึกษา ศาสนา และวัฒนธรรม / พระสอนศีลธรรมในสถานศึกษา

๒. สายงานการส่งเสริมสุขภาพจิต สุขภาวะ และสมาธิบำบัด:
   - นักจัดกระบวนการเรียนรู้และสมาธิบำบัด (Mindfulness & Meditation Facilitator)
   - นักเยียวยาจิตใจและผู้ดูแลสุขภาวะทางจิตวิญญาณ (Spiritual Caregiver) ในโรงพยาบาลและศูนย์ดูแลผู้ป่วยระยะสุดท้าย (Palliative Care)
   - นักพัฒนาสังคมและฟื้นฟูจิตใจในองค์กรสาธารณกุศลและองค์กรพัฒนาเอกชน (NGOs)

๓. สายงานสื่อ เศรษฐกิจสร้างสรรค์ และการท่องเที่ยวเชิงวัฒนธรรม:
   - นักสร้างสรรค์เนื้อหาทางศาสนา ศิลปวัฒนธรรม และมรดกท้องถิ่น (Religious & Cultural Content Creator)
   - นักจัดการและผู้นำเที่ยวเชิงจิตวิญญาณและพุทธศิลป์ (Spiritual & Cultural Tourism Specialist)
   - ภัณฑารักษ์และนักจัดการมรดกทางวัฒนธรรมในแหล่งเรียนรู้หรือพิพิธภัณฑ์ท้องถิ่น

๔. สายงานการบริหารทรัพยากรมนุษย์และองค์กรเอกชน:
   - เจ้าหน้าที่ฝึกอบรมและพัฒนาทรัพยากรมนุษย์ (Human Resource Development Officer)
   - เจ้าหน้าที่ดำเนินงานด้านความรับผิดชอบต่อสังคมและสิ่งแวดล้อมขององค์กร (CSR Officer)

๕. สายงานการเผยแผ่และส่งเสริมพระพุทธศาสนา:
   - พระธรรมทูต (ทั้งในประเทศและต่างประเทศ)
   - พระวิปัสสนาจารย์ / วิทยากรบรรยายธรรม
   - นักวิจัยด้านพุทธศาสน์ศึกษาและท้องถิ่นศึกษา`,
      careerOpportunitiesEn: `1. Public Sector & Civil Services:
   - Religious Affairs Officer (National Office of Buddhism / Ministry of Culture)
   - Ceremonial Affairs Officer, Military & Police Chaplain (Army, Navy, Air Force, Police)
   - Social Development Specialist & Social Worker (Dept of Corrections, Dept of Mental Health)
   - Secondary School Religious & Social Studies Educator, Dharma Teacher

2. Mental Health, Spiritual Well-being & Social Welfare:
   - Mindfulness & Meditation Facilitator
   - Spiritual Caregiver in Hospitals and Palliative Care Centers
   - Mental Restoration and Social Development Worker in Non-profit Organizations & NGOs

3. Creative Economy, Media & Cultural Tourism:
   - Religious & Cultural Content Creator
   - Spiritual & Buddhist Art Tourism Specialist
   - Museum Curator & Cultural Heritage Manager

4. Corporate Human Resource & CSR:
   - Human Resource Development (HRD) Officer
   - Corporate Social Responsibility (CSR) Officer

5. Buddhist Propagation & Monastic Careers:
   - Dhammaduta (Buddhist Missionary Monk/Educator in Thailand and abroad)
   - Vipassana Meditation Master & Buddhist Lecturer
   - Buddhist Studies & Regional Wisdom Researcher`,
      pdfUrl: "/documents/tqf2-buddhist-studies-2570.pdf",
      isOpenAdmission: true,
      status: "ACTIVE",
    },
  });

  // 4. แผนการศึกษาตามชั้นปี (Study Plans YLOs จาก มคอ. ๒ หน้า ๑๓)
  console.log("📅 บันทึกแผนการศึกษา ๔ ชั้นปี (YLOs)...");
  await prisma.programStudyPlan.deleteMany({ where: { programId: program.id } });

  await prisma.programStudyPlan.createMany({
    data: [
      {
        programId: program.id,
        nameTh: "แผนการศึกษาชั้นปีที่ ๑ (เน้นความรู้พื้นฐาน - PLO ๑)",
        nameEn: "Year 1: Buddhist Doctrines Foundations (PLO 1)",
        orderIndex: 1,
      },
      {
        programId: program.id,
        nameTh: "แผนการศึกษาชั้นปีที่ ๒ (เน้นพหุวัฒนธรรมและนวัตกรรม - PLO ๑, ๕)",
        nameEn: "Year 2: Liturgical Practices & Media Innovation (PLO 1, 5)",
        orderIndex: 2,
      },
      {
        programId: program.id,
        nameTh: "แผนการศึกษาชั้นปีที่ ๓ (เน้นบูรณาการกับศาสตร์สมัยใหม่ - PLO ๑, ๓, ๔)",
        nameEn: "Year 3: Interdisciplinary Synthesis with Modern Sciences (PLO 1, 3, 4)",
        orderIndex: 3,
      },
      {
        programId: program.id,
        nameTh: "แผนการศึกษาชั้นปีที่ ๔ (เน้นพุทธนวัตกรและการเผยแผ่ - PLO ๒, ๔, ๕)",
        nameEn: "Year 4: Buddhist Innovator Capstone & Research (PLO 2, 4, 5)",
        orderIndex: 4,
      },
    ],
  });

  // 5. รายวิชาเด่นตามโครงสร้าง มคอ. ๒ หมวดที่ ๓
  console.log("📚 บันทึกรายวิชาในหลักสูตร...");
  const coursesData = [
    // หมวดศึกษาทั่วไป
    {
      code: "000101",
      nameTh: "มนุษย์กับสังคม",
      nameEn: "Man and Society",
      credits: "3(3-0-6)",
      category: "หมวดวิชาศึกษาทั่วไป (วิชาบังคับ)",
      descriptionTh: "ศึกษาความหมายและความเป็นมาเกี่ยวกับมนุษย์กับสังคม พฤติกรรมมนุษย์กับการพัฒนาตน สถาบันสังคม การแก้ปัญหาสังคมแบบสันติวิธี และความเป็นพลเมืองยุค New Normal",
      group: "หมวดวิชาศึกษาทั่วไป",
      year: 1,
      sem: 1,
    },
    {
      code: "000102",
      nameTh: "กฎหมายทั่วไป",
      nameEn: "General Law",
      credits: "3(3-0-6)",
      category: "หมวดวิชาศึกษาทั่วไป (วิชาบังคับ)",
      descriptionTh: "ศึกษาวิวัฒนาการและลักษณะของกฎหมาย กฎหมายเกี่ยวกับบุคคล ครอบครัว นิติกรรมสัญญา กฎหมายอาญา และกระบวนการยุติธรรมของไทย",
      group: "หมวดวิชาศึกษาทั่วไป",
      year: 1,
      sem: 1,
    },
    {
      code: "000103",
      nameTh: "คอมพิวเตอร์และเทคโนโลยีดิจิทัล",
      nameEn: "Computer and Digital Technology",
      credits: "3(3-0-6)",
      category: "หมวดวิชาศึกษาทั่วไป (วิชาบังคับ)",
      descriptionTh: "ศึกษาแพลตฟอร์มคอมพิวเตอร์ ความปลอดภัยและจริยธรรมดิจิทัล ทักษะการใช้สื่อสารสนเทศ และการนำเสนอข้อมูลในยุคดิจิทัล",
      group: "หมวดวิชาศึกษาทั่วไป",
      year: 2,
      sem: 1,
    },
    {
      code: "000204",
      nameTh: "ภาษาอังกฤษเพื่อการสื่อสาร",
      nameEn: "English for Communications",
      credits: "3(3-0-6)",
      category: "หมวดวิชาศึกษาทั่วไป (วิชาบังคับ)",
      descriptionTh: "ฝึกทักษะการใช้ภาษาอังกฤษในการฟัง พูด อ่าน และเขียนเพื่อการสื่อสารในชีวิตประจำวัน และการนำเสนอความคิดเห็นอย่างมีประสิทธิภาพ",
      group: "หมวดวิชาศึกษาทั่วไป",
      year: 2,
      sem: 1,
    },
    {
      code: "000205",
      nameTh: "ปรัชญาเบื้องต้น",
      nameEn: "Introduction to Philosophy",
      credits: "3(3-0-6)",
      category: "หมวดวิชาศึกษาทั่วไป (วิชาบังคับ)",
      descriptionTh: "ศึกษาความหมาย ขอบเขต สาขาของปรัชญา พัฒนาการปรัชญาตะวันออกและตะวันตก หลักการและวิธีให้เหตุผลทางปรัชญา",
      group: "หมวดวิชาศึกษาทั่วไป",
      year: 2,
      sem: 2,
    },
    {
      code: "000206",
      nameTh: "คณิตศาสตร์และสถิติเพื่อการวิจัย",
      nameEn: "Mathematics and Statistics for Research",
      credits: "3(3-0-6)",
      category: "หมวดวิชาศึกษาทั่วไป (วิชาบังคับ)",
      descriptionTh: "ศึกษาหลักพื้นฐานทางคณิตศาสตร์ สถิติพรรณนา สถิติอ้างอิง การทดสอบสมมติฐาน และการวิเคราะห์ข้อมูลด้วยโปรแกรมคอมพิวเตอร์เพื่อการวิจัย",
      group: "หมวดวิชาศึกษาทั่วไป",
      year: 1,
      sem: 2,
    },

    // หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา
    {
      code: "000134",
      nameTh: "วรรณกรรมพระพุทธศาสนา",
      nameEn: "Buddhist Literature",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาประวัติและพัฒนาการวรรณกรรมบาลี วิเคราะห์คัมภีร์วรรณกรรมสำคัญ เช่น วิสุทธิมรรค มิลินทปัญหา เตภูมิกถา มังคลัตถทีปนี พุทธธรรม",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 2,
      sem: 2,
    },
    {
      code: "000135",
      nameTh: "พระไตรปิฎกศึกษา",
      nameEn: "Tipitaka Studies",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาประวัติ โครงสร้าง และสารัตถะสำคัญของพระวินัยปิฎก พระสุตตันตปิฎก และพระอภิธรรมปิฎก และการสืบทอดพระไตรปิฎกในประเทศไทย",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 2,
      sem: 2,
    },
    {
      code: "000136",
      nameTh: "ภาษาบาลี",
      nameEn: "Pali",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาบาลีไวยากรณ์ อักขรวิธี วจีวิภาค และหลักการแปล-แต่งประโยคบาลีเบื้องต้นเพื่อใช้ในการค้นคว้าคัมภีร์",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 1,
      sem: 1,
    },
    {
      code: "000237",
      nameTh: "ประวัติพระพุทธศาสนา",
      nameEn: "History of Buddhism",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาประวัติพระพุทธศาสนาในอินเดีย การแผ่ขยายสู่ดินแดนต่างๆ ขบวนการพุทธศาสนาร่วมสมัย และบทบาทของคณะสงฆ์ไทยในเวทีโลก",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 1,
      sem: 2,
    },
    {
      code: "000238",
      nameTh: "เทศกาลและพิธีกรรมพระพุทธศาสนา",
      nameEn: "Buddhist Festival and Traditions",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาเทศกาลและพิธีกรรมทางพระพุทธศาสนา คุณค่าทางจริยธรรม การปฏิบัติศาสนพิธี และอิทธิพลต่อวัฒนธรรมไทย",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 2,
      sem: 1,
    },
    {
      code: "000140",
      nameTh: "กรรมฐาน ๑",
      nameEn: "Buddhist Meditation I",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาสมถกรรมฐาน ๔๐ วิปัสสนาภูมิ ๖ สติปัฏฐาน ๔ และฝึกปฏิบัติวิปัสสนากรรมฐานโดยการเดินจงกรม นั่งสมาธิ และการส่งอารมณ์",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 1,
      sem: 1,
    },
    {
      code: "000241",
      nameTh: "กรรมฐาน ๒",
      nameEn: "Buddhist Meditation II",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาการเจริญสติปัฏฐานตามแนวกายานุปัสสนา อานาปานสติสูตร และฝึกปฏิบัติวิปัสสนากรรมฐานเข้มข้น",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 2,
      sem: 1,
    },
    {
      code: "000342",
      nameTh: "กรรมฐาน ๓",
      nameEn: "Buddhist Meditation III",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาการเจริญสติปัฏฐานตามแนวเวทนานุปัสสนา การปรับอินทรีย์ ๕ และการก้าวข้ามเวทนา",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 3,
      sem: 1,
    },
    {
      code: "000443",
      nameTh: "กรรมฐาน ๔",
      nameEn: "Buddhist Meditation IV",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (กลุ่มพระพุทธศาสนา)",
      descriptionTh: "ศึกษาการเจริญสติปัฏฐานตามแนวจิตตานุปัสสนาและธัมมานุปัสสนา ไตรลักษณ์ วิปัสสนาญาณ ๑๖ และการพัฒนาจิตขั้นสูง",
      group: "หมวดวิชาเฉพาะ - กลุ่มพระพุทธศาสนา",
      year: 4,
      sem: 1,
    },

    // หมวดวิชาเฉพาะ - วิชาแกนพระพุทธศาสนา
    {
      code: "101311",
      nameTh: "หลักพุทธธรรม",
      nameEn: "Principles of Buddhism",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ศึกษาอริยสัจ ๔ ปฏิจจสมุปบาท ไตรลักษณ์ ขันธ์ ๕ กรรม และโพธิปักขิยธรรม เพื่อการประยุกต์ใช้ในชีวิตร่วมสมัย [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 1,
      sem: 1,
    },
    {
      code: "101312",
      nameTh: "พุทธปรัชญาเถรวาท",
      nameEn: "Theravada Buddhist Philosophy",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ศึกษาแนวคิดพุทธปรัชญาเถรวาทด้านอภิปรัชญา ญาณวิทยา และจริยศาสตร์ เพื่อประยุกต์แก้ปัญหาสังคมร่วมสมัย [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 3,
      sem: 1,
    },
    {
      code: "101313",
      nameTh: "ธรรมบทศึกษา",
      nameEn: "Dhammapada Study",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ศึกษาโครงสร้างและหลักธรรมสำคัญในคัมภีร์ธรรมบท แนวคิดเชิงเศรษฐกิจ สังคม และคุณค่าต่อวิถีชีวิต [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 2,
      sem: 1,
    },
    {
      code: "101314",
      nameTh: "วิสุทธิมรรคศึกษา",
      nameEn: "Visuddhimagga Study",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ศึกษาคัมภีร์วิสุทธิมรรคตามหลักไตรสิกขา (ศีล สมาธิ ปัญญา) และคุณค่าต่อการพัฒนาจิตวิญญาณ [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 3,
      sem: 1,
    },
    {
      code: "101415",
      nameTh: "ชาดกศึกษา",
      nameEn: "Jataka Studies and Social Landscape",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ศึกษาแนวคิดหลักธรรมที่ปรากฏในชาดก อิทธิพลของชาดกต่อสังคม วัฒนธรรม วรรณกรรมท้องถิ่น และการประยุกต์ใช้ [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 1,
      sem: 2,
    },
    {
      code: "101416",
      nameTh: "พระพุทธศาสนามหายาน",
      nameEn: "Mahayana Buddhism",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ศึกษาประวัติ พัฒนาการ หลักธรรม พระสูตรสำคัญ แนวคิดเรื่องพระโพธิสัตว์ และนิกายต่างๆ ในมหายาน [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 3,
      sem: 2,
    },
    {
      code: "101417",
      nameTh: "พุทธศิลปกรรม",
      nameEn: "Buddhist Arts",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ศึกษาสถาปัตยกรรม จิตรกรรม ประติมากรรมทางพระพุทธศาสนา และการฝึกปฏิบัติการภาคสนามเพื่อการอนุรักษ์ [PLO ๒]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 4,
      sem: 2,
    },
    {
      code: "101418",
      nameTh: "ภาษาอังกฤษสำหรับพระพุทธศาสนา",
      nameEn: "English for Buddhism",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ฝึกทักษะภาษาอังกฤษเพื่ออธิบายหลักธรรม แนะนำการปฏิบัติกรรมฐาน และการจัดทำสื่อเผยแผ่ระดับสากล [PLO ๒]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 4,
      sem: 1,
    },
    {
      code: "101419",
      nameTh: "มังคลัตถทีปนีศึกษา",
      nameEn: "Mangalatthadipani Study",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ศึกษาโครงสร้างและเนื้อหาสาระของคัมภีร์มังคลัตถทีปนี และการประยุกต์ใช้เพื่อเสริมสร้างทักษะชีวิตในศตวรรษที่ ๒๑ [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 2,
      sem: 2,
    },
    {
      code: "101420",
      nameTh: "ศึกษาอิสระทางพระพุทธศาสนา",
      nameEn: "Independent Study on Buddhism",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ค้นคว้าวิจัยอิสระประยุกต์ใช้ในกิจการพระพุทธศาสนา กำหนดประเด็น เก็บรวบรวมข้อมูล วิเคราะห์ และนำเสนอผลงาน [PLO ๒]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 4,
      sem: 2,
    },
    {
      code: "101421",
      nameTh: "สัมมนาพระพุทธศาสนา",
      nameEn: "Seminar on Buddhism",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (วิชาแกน)",
      descriptionTh: "ดำเนินการสัมมนาประเด็นท้าทายเกี่ยวกับพระพุทธศาสนา ฝึกปฏิบัติการนำเสนอผลงานและการอภิปรายเชิงวิชาการ [PLO ๒]",
      group: "หมวดวิชาเฉพาะ - วิชาแกน",
      year: 4,
      sem: 2,
    },

    // หมวดวิชาเฉพาะ - วิชาเฉพาะด้านพระพุทธศาสนา (Interdisciplinary)
    {
      code: "101101",
      nameTh: "พระพุทธศาสนากับวิทยาศาสตร์",
      nameEn: "Buddhism and Science",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "วิเคราะห์การแสวงหาความจริงระหว่างพุทธศาสตร์กับวิทยาศาสตร์ ทฤษฎีวิวัฒนาการ ควอนตัมฟิสิกส์ และทัศนะวิทยาศาสตร์ร่วมสมัย [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 1,
      sem: 2,
    },
    {
      code: "101102",
      nameTh: "พระพุทธศาสนากับสังคมสงเคราะห์",
      nameEn: "Buddhism and Social Works",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ศึกษาหลักการและวิธีการสังคมสงเคราะห์เชิงพุทธ พระจริยาของพระพุทธเจ้า และการออกแบบกิจกรรมสังคมสงเคราะห์ [PLO ๒]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 2,
      sem: 1,
    },
    {
      code: "101103",
      nameTh: "นิเทศศาสตร์ในพระไตรปิฎก",
      nameEn: "Communication in Tipitaka",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ศึกษาศิลปะการสื่อสารของพระพุทธเจ้าและพระสาวก จริยธรรมการสื่อสาร และการออกแบบสื่อดิจิทัลเพื่อเผยแผ่ธรรม [PLO ๒]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 4,
      sem: 1,
    },
    {
      code: "101205",
      nameTh: "พระพุทธศาสนากับนิเวศวิทยา",
      nameEn: "Buddhism and Ecology",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ศึกษานิเวศวิทยาเชิงพุทธ การอยู่ร่วมกับธรรมชาติ จิตสำนึกรักษ์โลก และบทบาทของชาวพุทธในการพัฒนาที่ยั่งยืน [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 3,
      sem: 1,
    },
    {
      code: "101206",
      nameTh: "จิตวิทยาในพระไตรปิฎก",
      nameEn: "Psychology in Tipitaka",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ศึกษาธรรมชาติของจิต เจตสิก รูป กลไกการรับรู้ พฤติกรรมตามแนวจริต ๖ และการเยียวยาจิตใจด้วยธรรมะ [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 2,
      sem: 2,
    },
    {
      code: "101307",
      nameTh: "รัฐศาสตร์ในพระไตรปิฎก",
      nameEn: "Political Science in Tipitaka",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ศึกษาทฤษฎีการเมือง การปกครองตามหลักธรรมาธิปไตย นิติรัฐ และการประยุกต์พุทธธรรมเพื่อส่งเสริมธรรมาภิบาล [PLO ๑]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 2,
      sem: 2,
    },
    {
      code: "101308",
      nameTh: "พระพุทธศาสนากับสิทธิมนุษยชน",
      nameEn: "Buddhism and Human Rights",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ศึกษาศักดิ์ศรีความเป็นมนุษย์ สิทธิ เสรีภาพ ความเสมอภาค ตามปฏิญญาสากลและทรรศนะพระพุทธศาสนา [PLO ๓]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 3,
      sem: 1,
    },
    {
      code: "101309",
      nameTh: "พระพุทธศาสนากับการพัฒนาที่ยั่งยืน",
      nameEn: "Buddhism and Sustainable Development",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ศึกษาเป้าหมายการพัฒนาที่ยั่งยืน (SDGs) ผสานเศรษฐกิจพอเพียง และหลักพุทธธรรมเพื่อความสมดุลของสังคม [PLO ๔]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 3,
      sem: 2,
    },
    {
      code: "101310",
      nameTh: "พระพุทธศาสนากับสาธารณสุข",
      nameEn: "Buddhism and Healthy Care",
      credits: "3(3-0-6)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ศึกษาสุขภาพแบบองค์รวม กาย จิต ปัญญา สังคม การบริโภคปัจจัย ๔ และแนวคิดสุขภาวะเชิงพุทธ [PLO ๓]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 3,
      sem: 2,
    },
    {
      code: "101321",
      nameTh: "พุทธนวัตกรรมเพื่อการเผยแผ่พระพุทธศาสนา",
      nameEn: "Buddhist Innovation for Propagation of Buddhism",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเฉพาะ (เฉพาะด้าน)",
      descriptionTh: "ออกแบบและพัฒนาพุทธนวัตกรรม สื่อดิจิทัล เครือข่ายสังคมออนไลน์ เพื่อตอบสนองต่อปัญหาและบริบทสังคมยุคใหม่ [PLO ๕]",
      group: "หมวดวิชาเฉพาะ - วิชาเฉพาะด้าน",
      year: 4,
      sem: 1,
    },

    // วิชาเลือกเฉพาะสาขา (เชื่อมโยงอัตลักษณ์ท้องถิ่นอีสาน)
    {
      code: "101495",
      nameTh: "ภูมิปัญญาท้องถิ่นติดพิมพ์เทียนพรรษาศึกษา",
      nameEn: "Local Wisdom on Ubon Ratchathani Molded Wax Candle Crafting",
      credits: "3(1-4-4)",
      category: "หมวดวิชาเลือกเฉพาะสาขา (ภูมิปัญญาท้องถิ่น)",
      descriptionTh: "ศึกษาและสำรวจภูมิปัญญาท้องถิ่นจังหวัดอุบลราชธานีด้านการติดพิมพ์เทียนพรรษา การวิจัยเชิงปฏิบัติการ และการสร้างสื่อดิจิทัลอนุรักษ์",
      group: "หมวดวิชาเลือกเฉพาะสาขา",
      year: 3,
      sem: 1,
    },
    {
      code: "101496",
      nameTh: "ภูมิปัญญาท้องถิ่นพุทธศิลป์สถาปัตยกรรมสิมอีสานศึกษา",
      nameEn: "Buddhist Art and Architecture of Isan Sim Studies",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเลือกเฉพาะสาขา (ภูมิปัญญาท้องถิ่น)",
      descriptionTh: "วิเคราะห์และปฏิบัติภาคสนามเกี่ยวกับพุทธศิลป์ สถาปัตยกรรมสิมอีสาน แหล่งเรียนรู้วัฒนธรรมในแถบอุบลราชธานีและอีสานใต้",
      group: "หมวดวิชาเลือกเฉพาะสาขา",
      year: 3,
      sem: 2,
    },
    {
      code: "101396",
      nameTh: "อารยธรรมชุมชนโบราณลุ่มน้ำมูล-โขงศึกษา",
      nameEn: "Ancient Community Civilizations of the Mun-Mekong River Basin Studies",
      credits: "3(2-2-5)",
      category: "หมวดวิชาเลือกเฉพาะสาขา (ภูมิปัญญาท้องถิ่น)",
      descriptionTh: "ศึกษาและสำรวจอารยธรรม วิถีชีวิต ประวัติศาสตร์ โบราณคดี ในแถบลุ่มน้ำมูลและแม่น้ำโขง (อุบลราชธานี ศรีสะเกษ สุรินทร์ นครพนม)",
      group: "หมวดวิชาเลือกเฉพาะสาขา",
      year: 3,
      sem: 2,
    },
  ];

  for (const c of coursesData) {
    const course = await prisma.course.upsert({
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
        courseCategory: c.category,
        descriptionTh: c.descriptionTh,
      },
      create: {
        tenantId,
        code: c.code,
        nameTh: c.nameTh,
        nameEn: c.nameEn,
        credits: c.credits,
        courseCategory: c.category,
        descriptionTh: c.descriptionTh,
      },
    });

    // ผูกวิชาเข้ากับหลักสูตร
    await prisma.programCourse.upsert({
      where: {
        programId_courseId: {
          programId: program.id,
          courseId: course.id,
        },
      },
      update: {
        courseGroup: c.group,
        yearLevel: c.year,
        semester: c.sem,
      },
      create: {
        programId: program.id,
        courseId: course.id,
        courseGroup: c.group,
        yearLevel: c.year,
        semester: c.sem,
      },
    });
  }

  console.log("🎉 นำเข้าข้อมูลหลักสูตรพุทธศาสตรบัณฑิต (มคอ. ๒ ปรับปรุง ๒๕๗๐) สำเร็จสมบูรณ์!");
  console.log(`- หลักสูตร: ${program.nameTh} (${program.code})`);
  console.log(`- หน่วยกิตรวม: ${program.totalCredits} นก.`);
  console.log(`- จำนวนรายวิชาที่นำเข้า: ${coursesData.length} วิชา`);
  console.log(`- จำนวนอาจารย์ประจำหลักสูตร: ${facultyMembers.length} ท่าน`);
}

main()
  .catch((e) => {
    console.error("Error seeding TQF 2 Buddhist Studies:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
