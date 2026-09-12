export const MESSAGES = {
  // Roles & Permissions
  "roles.module.student": { th: "ระบบบริหารจัดการนิสิต", en: "Student Management" },
  "perm.student:read": { th: "ดูข้อมูลทะเบียนนิสิต", en: "Read student records" },
  "perm.student:manage": { th: "จัดการทะเบียนนิสิต (เพิ่ม/แก้ไข/ลบ/เปลี่ยนสถานะ)", en: "Manage students (create/edit/delete/status)" },
  "perm.student:advisees.read": { th: "ดูรายชื่อนิสิตในความดูแล (Advisees)", en: "View advisees list" },
  "perm.student:advising.log": { th: "บันทึกประวัติการให้คำปรึกษา", en: "Log advising records" },
  "perm.student:confidential.read": { th: "อ่านบันทึกคำปรึกษาที่เป็นความลับ (PDPA)", en: "Read confidential advising records" },
  "perm.student:batch_assign": { th: "จับคู่อาจารย์ที่ปรึกษาแบบกลุ่ม", en: "Batch assign academic advisors" },
  "perm.student:scholarship.manage": { th: "จัดการข้อมูลทุนการศึกษา", en: "Manage student scholarships" },

  // Navigation & Page Titles
  "students.nav": { th: "ระบบทะเบียนนิสิตและที่ปรึกษา", en: "Student & Advising" },
  "students.title": { th: "การบริหารจัดการนิสิตและอาจารย์ที่ปรึกษา", en: "Student Management & Academic Advising" },
  "students.description": {
    th: "ทะเบียนประวัตินิสิต การดูแลติดตามผลการเรียน กลุ่มความเสี่ยง และบันทึกการให้คำปรึกษา",
    en: "Student records, academic monitoring, risk assessment, and advising logs",
  },

  // Tabs
  "students.tab.advisees": { th: "นิสิตในความดูแล (My Advisees)", en: "My Advisees" },
  "students.tab.all": { th: "ทะเบียนนิสิตทั้งหมด (All Students)", en: "All Students" },
  "students.tab.batch": { th: "จับคู่อาจารย์ที่ปรึกษา (Batch Assignment)", en: "Batch Advisor Assignment" },

  // Statuses
  "students.status": { th: "สถานะภาพนิสิต", en: "Student Status" },
  "students.status.STUDYING": { th: "กำลังศึกษา", en: "Studying" },
  "students.status.ON_LEAVE": { th: "ลาพักการเรียน", en: "On Leave" },
  "students.status.GRADUATED": { th: "สำเร็จการศึกษา", en: "Graduated" },
  "students.status.RETIRED": { th: "พ้นสภาพการเป็นนิสิต", en: "Retired / Dismissed" },

  // Risk Levels
  "students.risk": { th: "ระดับความเสี่ยง", en: "Academic Risk" },
  "students.risk.NORMAL": { th: "ผลการเรียนปกติ", en: "Normal Standing" },
  "students.risk.WARNING": { th: "เฝ้าระวัง (GPA < 2.50)", en: "Academic Warning" },
  "students.risk.CRITICAL": { th: "วิทยาทัณฑ์ (GPA < 2.00)", en: "Academic Probation" },
  "students.riskAlert": { th: "แจ้งเตือนนิสิตกลุ่มเสี่ยงวิทยาทัณฑ์!", en: "Academic Probation Alert!" },

  // Student Fields
  "students.code": { th: "รหัสนิสิต", en: "Student ID" },
  "students.titleField": { th: "คำนำหน้า", en: "Title" },
  "students.nameTh": { th: "ชื่อ-นามสกุล (ไทย)", en: "Full Name (Thai)" },
  "students.nameEn": { th: "ชื่อ-นามสกุล (อังกฤษ)", en: "Full Name (English)" },
  "students.firstNameTh": { th: "ชื่อ (ไทย)", en: "First Name (Thai)" },
  "students.lastNameTh": { th: "นามสกุล (ไทย)", en: "Last Name (Thai)" },
  "students.firstNameEn": { th: "ชื่อ (อังกฤษ)", en: "First Name (English)" },
  "students.lastNameEn": { th: "นามสกุล (อังกฤษ)", en: "Last Name (English)" },
  "students.program": { th: "หลักสูตร / สาขาวิชา", en: "Degree Program" },
  "students.advisor": { th: "อาจารย์ที่ปรึกษา", en: "Academic Advisor" },
  "students.noAdvisor": { th: "ยังไม่มีอาจารย์ที่ปรึกษา", en: "No Advisor Assigned" },
  "students.admissionYear": { th: "ปีการศึกษาที่เข้า (พ.ศ.)", en: "Admission Year" },
  "students.gpa": { th: "เกรดเฉลี่ยสะสม (GPAX)", en: "GPAX" },
  "students.email": { th: "อีเมลติดต่อ", en: "Email" },
  "students.phone": { th: "เบอร์โทรศัพท์", en: "Phone" },
  "students.avatarUrl": { th: "ลิงก์รูปถ่ายนิสิต", en: "Avatar Image URL" },

  // Advising Records
  "advising.title": { th: "ประวัติการให้คำปรึกษา", en: "Advising Records" },
  "advising.newLog": { th: "บันทึกการให้คำปรึกษาใหม่", en: "New Advising Log" },
  "advising.topic": { th: "หัวข้อการให้คำปรึกษา", en: "Advising Topic" },
  "advising.detail": { th: "รายละเอียดการปรึกษา", en: "Discussion Details" },
  "advising.actionPlan": { th: "แนวทางช่วยเหลือ / แผนปฏิบัติการ", en: "Action Plan / Recommendation" },
  "advising.date": { th: "วันที่ให้คำปรึกษา", en: "Advising Date" },
  "advising.isConfidential": { th: "บันทึกลับ (Confidential - PDPA)", en: "Confidential Record (PDPA)" },
  "advising.confidentialHelp": {
    th: "หากเลือกเป็นบันทึกลับ เฉพาะอาจารย์ที่ปรึกษาประจำตัวและผู้บริหารระดับสูงเท่านั้นที่สามารถเปิดดูเนื้อหานี้ได้",
    en: "Confidential records can only be viewed by the primary advisor and designated leadership.",
  },
  "advising.confidentialBadge": { th: "เอกสารลับเฉพาะ", en: "Confidential" },
  "advising.noRecords": { th: "ยังไม่มีประวัติการให้คำปรึกษา", en: "No advising records found" },

  // Scholarships
  "scholarship.title": { th: "ข้อมูลทุนการศึกษา", en: "Scholarships" },
  "scholarship.name": { th: "ชื่อทุนการศึกษา", en: "Scholarship Name" },
  "scholarship.year": { th: "ปีการศึกษา", en: "Academic Year" },
  "scholarship.amount": { th: "จำนวนเงินทุน (บาท)", en: "Amount (THB)" },
  "scholarship.add": { th: "เพิ่มประวัติทุน", en: "Add Scholarship" },
  "scholarship.noData": { th: "ไม่มีข้อมูลการรับทุนการศึกษา", en: "No scholarship records" },

  // Batch Assignment & CSV
  "students.batchTitle": { th: "กำหนดอาจารย์ที่ปรึกษาแบบกลุ่ม", en: "Batch Advisor Assignment" },
  "students.selectAdvisor": { th: "เลือกอาจารย์ที่ปรึกษาที่ต้องการมอบหมาย", en: "Select Target Advisor" },
  "students.selectedCount": { th: "จำนวนนิสิตที่เลือก", en: "Selected Students" },
  "students.applyBatch": { th: "บันทึกการมอบหมายอาจารย์ที่ปรึกษา", en: "Assign Selected to Advisor" },
  "students.importCsv": { th: "นำเข้าข้อมูลจาก CSV / Excel", en: "Import Students from CSV" },
  "students.importHelp": {
    th: "คอลัมน์ที่รองรับ: studentCode, title, firstNameTh, lastNameTh, firstNameEn, lastNameEn, admissionYear, gpa, email, phone",
    en: "Supported columns: studentCode, title, firstNameTh, lastNameTh, firstNameEn, lastNameEn, admissionYear, gpa, email, phone",
  },
  "students.importSuccess": { th: "นำเข้าข้อมูลนิสิตสำเร็จ", en: "Students imported successfully" },

  // Public Student Verification Portal
  "verify.title": { th: "ระบบตรวจสอบสถานภาพนิสิตและผู้สำเร็จการศึกษา", en: "Student & Graduate Verification Portal" },
  "verify.subtitle": {
    th: "บริการสืบค้นและยืนยันสถานะความเป็นนิสิตหรือการสำเร็จการศึกษาอย่างเป็นทางการ คณะวิทยาการและเทคโนโลยีสารสนเทศ",
    en: "Official verification service for student enrollment and graduate credentials",
  },
  "verify.searchPlaceholder": { th: "กรอกรหัสนิสิต (เช่น 66010001)", en: "Enter Student ID (e.g. 66010001)" },
  "verify.searchButton": { th: "ตรวจสอบสถานะ", en: "Verify Status" },
  "verify.resultTitle": { th: "ผลการตรวจสอบสถานภาพนิสิต", en: "Verification Results" },
  "verify.officialNotice": {
    th: "ข้อมูลนี้ได้รับการรับรองความถูกต้องตามระบบทะเบียนคณะฯ โดยเป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
    en: "Officially verified against the faculty academic registry in compliance with data privacy regulations (PDPA).",
  },
  "verify.notFound": { th: "ไม่พบข้อมูลนิสิตตามรหัสที่ระบุ กรุณาตรวจสอบรหัสอีกครั้ง", en: "No student found with the provided ID. Please re-check and try again." },

  // Modals & General Actions
  "students.add": { th: "เพิ่มทะเบียนนิสิตใหม่", en: "Add New Student" },
  "students.edit": { th: "แก้ไขข้อมูลนิสิต", en: "Edit Student" },
  "students.detail": { th: "รายละเอียดและประวัตินิสิต", en: "Student Profile & History" },
  "students.delete": { th: "ลบทะเบียนนิสิต", en: "Delete Student" },
  "students.deleteConfirm": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบนิสิตท่านนี้?", en: "Are you sure you want to delete this student record?" },
  "students.allYears": { th: "ทุกปีการศึกษา", en: "All Admission Years" },
  "students.allPrograms": { th: "ทุกหลักสูตร", en: "All Programs" },
  "students.allStatuses": { th: "ทุกสถานภาพ", en: "All Statuses" },
  "students.search": { th: "ค้นหาด้วยรหัสนิสิต หรือชื่อ-นามสกุล...", en: "Search by Student ID or Name..." },
  "students.totalCount": { th: "จำนวนนิสิตทั้งหมด", en: "Total Students" },
  "students.adviseesCount": { th: "นิสิตในความดูแลของท่าน", en: "Your Advisees" },
  "students.probationCount": { th: "นิสิตกลุ่มวิทยาทัณฑ์", en: "Students on Probation" },
  "students.graduatedCount": { th: "สำเร็จการศึกษาแล้ว", en: "Graduated Students" },
} as const;
