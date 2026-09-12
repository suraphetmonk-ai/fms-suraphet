import type { Dictionary } from "@/shared/lib/i18n/translate";

export const MESSAGES: Dictionary = {
  // Roles & Permissions
  "roles.module.document": { th: "ระบบบริหารจัดการและอนุมัติเอกสาร", en: "E-Document & Approval Module" },
  "perm.document:read": { th: "ดูข้อมูลและอ่านเอกสาร", en: "Read documents" },
  "perm.document:create": { th: "สร้างและยื่นเสนอเอกสารใหม่", en: "Create and submit documents" },
  "perm.document:approve": { th: "พิจารณาลงนามและอนุมัติเอกสาร", en: "Review and approve documents" },
  "perm.document:manage": { th: "จัดการระบบเอกสารทั้งหมด", en: "Manage all documents" },

  // Navigation & Header
  "documents.nav": { th: "จัดการและอนุมัติเอกสาร", en: "E-Documents & Approval" },
  "documents.title": { th: "ระบบบริหารจัดการและอนุมัติเอกสาร", en: "E-Document Management & Approval" },
  "documents.subtitle": {
    th: "หนังสือราชการ บันทึกข้อความ ประกาศ คำสั่ง และระบบแฟ้มเสนอเซ็น/อนุมัติตามลำดับขั้น",
    en: "Official letters, memos, orders, and multi-step approval workflow",
  },

  // Tabs
  "documents.tab.pending": { th: "แฟ้มเสนอด่วนรอฉันอนุมัติ", en: "Pending My Approval" },
  "documents.tab.all": { th: "ทะเบียนเอกสารทั้งหมด", en: "All Documents" },
  "documents.tab.mySubmissions": { th: "เอกสารที่ฉันเสนอ", en: "My Submissions" },

  // Summary Metrics
  "documents.metric.pending": { th: "รอฉันอนุมัติ", en: "Pending My Review" },
  "documents.metric.inProgress": { th: "กำลังเวียนเสนอ", en: "In Progress" },
  "documents.metric.approved": { th: "อนุมัติแล้ว", en: "Approved" },
  "documents.metric.total": { th: "เอกสารทั้งหมด", en: "Total Documents" },

  // Actions
  "documents.create": { th: "สร้างเอกสารใหม่", en: "Create Document" },
  "documents.approve": { th: "ลงนาม / อนุมัติ", en: "Approve / Sign" },
  "documents.reject": { th: "ไม่อนุมัติ", en: "Reject" },
  "documents.requestChanges": { th: "ส่งกลับให้แก้ไข", en: "Request Changes" },
  "documents.view": { th: "เปิดดูเอกสาร", en: "View Document" },
  "documents.saveDraft": { th: "บันทึกฉบับร่าง", en: "Save Draft" },
  "documents.submit": { th: "ยื่นเสนอพิจารณา", en: "Submit for Approval" },
  "documents.cancel": { th: "ยกเลิก", en: "Cancel" },

  // Fields
  "documents.documentNumber": { th: "เลขที่หนังสือ/เอกสาร", en: "Document No." },
  "documents.subject": { th: "เรื่อง", en: "Subject / Title" },
  "documents.category": { th: "ประเภทเอกสาร", en: "Document Type" },
  "documents.urgency": { th: "ระดับความเร่งด่วน", en: "Urgency Level" },
  "documents.confidentiality": { th: "ชั้นความลับ", en: "Confidentiality" },
  "documents.sender": { th: "จาก / ผู้เสนอ", en: "From / Initiator" },
  "documents.recipient": { th: "เรียน / ผู้รับ", en: "To / Recipient" },
  "documents.department": { th: "ภาควิชา/ส่วนงาน", en: "Department" },
  "documents.summary": { th: "สาระสำคัญ / ข้อความ", en: "Summary / Details" },
  "documents.attachment": { th: "ไฟล์แนบเอกสาร (PDF)", en: "Attachment (PDF URL)" },
  "documents.status": { th: "สถานะ", en: "Status" },
  "documents.approvers": { th: "สายการพิจารณาอนุมัติ", en: "Approval Chain" },
  "documents.comment": { th: "ข้อคิดเห็น / ข้อสั่งการ", en: "Comments / Directives" },
  "documents.step": { th: "ลำดับขั้น", en: "Step" },
  "documents.timeline": { th: "ประวัติและเส้นทางการเดินเอกสาร", en: "Routing Timeline" },
  "documents.createdAt": { th: "วันที่ยื่นเสนอ", en: "Submitted Date" },

  // Categories
  "documents.category.memo": { th: "บันทึกข้อความ", en: "Memorandum (Memo)" },
  "documents.category.order": { th: "คำสั่ง", en: "Official Order" },
  "documents.category.announcement": { th: "ประกาศ", en: "Announcement" },
  "documents.category.circular": { th: "หนังสือเวียน", en: "Circular Notice" },
  "documents.category.request": { th: "หนังสือขออนุมัติ", en: "Approval Request" },
  "documents.category.general": { th: "ทั่วไป", en: "General Document" },

  // Urgency
  "documents.urgency.normal": { th: "ปกติ", en: "Normal" },
  "documents.urgency.urgent": { th: "ด่วน", en: "Urgent" },
  "documents.urgency.veryUrgent": { th: "ด่วนมาก", en: "Very Urgent" },
  "documents.urgency.mostUrgent": { th: "ด่วนที่สุด", en: "Most Urgent" },

  // Statuses
  "documents.status.draft": { th: "ฉบับร่าง", en: "Draft" },
  "documents.status.submitted": { th: "ยื่นแล้ว", en: "Submitted" },
  "documents.status.inProgress": { th: "กำลังเวียนพิจารณา", en: "In Progress" },
  "documents.status.approved": { th: "อนุมัติสมบูรณ์", en: "Approved" },
  "documents.status.rejected": { th: "ไม่อนุมัติ", en: "Rejected" },
  "documents.status.cancelled": { th: "ยกเลิก", en: "Cancelled" },

  // Messages
  "documents.createSuccess": { th: "สร้างและยื่นเสนอเอกสารเรียบร้อยแล้ว", en: "Document created and submitted successfully" },
  "documents.approveSuccess": { th: "ลงนามอนุมัติเอกสารเรียบร้อยแล้ว", en: "Document approved successfully" },
  "documents.rejectSuccess": { th: "บันทึกการปฏิเสธเอกสารเรียบร้อยแล้ว", en: "Document rejected successfully" },
  "documents.empty": { th: "ยังไม่มีรายการเอกสารในหมวดนี้", en: "No documents found in this section" },
  "documents.noPending": { th: "ยอดเยี่ยม! ไม่มีเอกสารค้างรอการอนุมัติในแฟ้มของคุณ", en: "Great! No pending documents awaiting your approval" },
};
