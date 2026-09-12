export const messages = {
  // RBAC Role & Permission Labels
  "roles.module.attendance": { th: "ระบบเช็คเวลาทำงาน", en: "Attendance System" },
  "roles.module.leave": { th: "ระบบการลา", en: "Leave System" },
  "perm.attendance:read": { th: "ดูเวลาทำงานและสถิติ", en: "View attendance and statistics" },
  "perm.attendance:checkin": { th: "ลงเวลาเข้า-ออกงาน", en: "Check in and check out" },
  "perm.attendance:manage": { th: "จัดการบันทึกเวลาและกะเวลา", en: "Manage attendance records and shifts" },
  "perm.leave:request": { th: "ยื่นใบลา", en: "Request leave" },
  "perm.leave:approve": { th: "อนุมัติการลา", en: "Approve or reject leave" },

  // Navigation & Page Titles
  "attendance.nav": { th: "เช็คเวลาทำงานและวันลา", en: "Attendance & Leaves" },
  "attendance.title": { th: "ระบบเช็คเวลาทำงานและจัดการการลา", en: "Attendance & Leave Management" },
  "attendance.subtitle": { th: "บันทึกเวลาเข้า-ออกงาน จัดการคำขอลา และรายงานสถิติบุคลากร คณะวิทยาการจัดการ", en: "Track faculty & staff work hours, leaves, and attendance analytics" },

  // Tabs
  "attendance.tab.my": { th: "ลงเวลาของฉัน", en: "My Attendance" },
  "attendance.tab.all": { th: "บันทึกเวลาบุคลากร", en: "All Attendance" },
  "attendance.tab.leave": { th: "จัดการคำขอลา", en: "Leave Requests" },
  "attendance.tab.reports": { th: "สรุปและสถิติ", en: "Reports & Analytics" },
  "attendance.tab.shifts": { th: "กะเวลาทำงาน", en: "Work Shifts" },

  // Check-in Types
  "attendance.type.on_site": { th: "ปฏิบัติงานในคณะ", en: "On-Site (Faculty)" },
  "attendance.type.wfh": { th: "ปฏิบัติงานที่บ้าน (WFH)", en: "Work From Home (WFH)" },
  "attendance.type.field_work": { th: "ไปราชการ / นอกสถานที่", en: "Field Work / Official Travel" },
  "attendance.type.teaching": { th: "ปฏิบัติการสอน", en: "Teaching / Lectures" },

  // Statuses
  "attendance.status.on_time": { th: "ตรงเวลา", en: "On Time" },
  "attendance.status.late": { th: "มาสาย", en: "Late" },
  "attendance.status.early_leave": { th: "กลับก่อน", en: "Early Leave" },
  "attendance.status.absent": { th: "ขาดงาน", en: "Absent" },
  "attendance.status.on_leave": { th: "ลางาน", en: "On Leave" },
  "attendance.status.holiday": { th: "วันหยุด", en: "Holiday" },
  "attendance.status.overtime": { th: "ล่วงเวลา", en: "Overtime" },

  // Leave Types
  "leave.type.sick": { th: "ลาป่วย", en: "Sick Leave" },
  "leave.type.personal": { th: "ลากิจส่วนตัว", en: "Personal Leave" },
  "leave.type.annual": { th: "ลาพักผ่อน", en: "Annual Vacation" },
  "leave.type.official": { th: "ไปราชการ / ฝึกอบรม", en: "Official Duty / Seminar" },
  "leave.type.maternity": { th: "ลาคลอดบุตร", en: "Maternity Leave" },
  "leave.type.military": { th: "ระดมพล / ทหาร", en: "Military Service" },
  "leave.type.other": { th: "ลาอื่นๆ", en: "Other Leave" },

  // Leave Statuses
  "leave.status.pending": { th: "รออนุมัติ", en: "Pending Approval" },
  "leave.status.approved": { th: "อนุมัติแล้ว", en: "Approved" },
  "leave.status.rejected": { th: "ไม่อนุมัติ", en: "Rejected" },
  "leave.status.cancelled": { th: "ยกเลิกแล้ว", en: "Cancelled" },

  // Metrics
  "attendance.metric.total_staff": { th: "บุคลากรทั้งหมด", en: "Total Staff" },
  "attendance.metric.present_today": { th: "มาปฏิบัติงานวันนี้", en: "Present Today" },
  "attendance.metric.late_today": { th: "มาสาย", en: "Late Today" },
  "attendance.metric.on_leave_today": { th: "ลางาน", en: "On Leave" },
  "attendance.metric.wfh_today": { th: "ทำงานที่บ้าน (WFH)", en: "WFH Today" },
  "attendance.metric.attendance_rate": { th: "อัตราการเข้างาน", en: "Attendance Rate" },
  "attendance.metric.avg_work_hours": { th: "ชั่วโมงทำงานเฉลี่ย", en: "Avg Work Hours" },

  // Clock & Self Check-in Widget
  "attendance.clock.current_time": { th: "เวลาปัจจุบัน", en: "Current Time" },
  "attendance.clock.today_shift": { th: "กะการทำงานวันนี้", en: "Today's Work Shift" },
  "attendance.clock.check_in_btn": { th: "ลงเวลาเข้างาน", en: "Check In" },
  "attendance.clock.check_out_btn": { th: "ลงเวลาเลิกงาน", en: "Check Out" },
  "attendance.clock.already_checked_in": { th: "ลงเวลาเข้างานแล้ว", en: "Checked In" },
  "attendance.clock.already_checked_out": { th: "ลงเวลาเลิกงานแล้ว", en: "Checked Out" },
  "attendance.clock.select_type": { th: "ประเภทการปฏิบัติงาน", en: "Work Mode / Type" },
  "attendance.clock.location": { th: "พิกัดสถานที่", en: "Location" },
  "attendance.clock.get_location": { th: "ระบุตำแหน่ง GPS", en: "Detect GPS" },
  "attendance.clock.location_detected": { th: "พิกัดที่ตรวจพบ", en: "GPS Detected" },
  "attendance.clock.remarks_placeholder": { th: "หมายเหตุเพิ่มเติม (ถ้ามี)...", en: "Additional remarks (optional)..." },
  "attendance.clock.success_in": { th: "บันทึกเวลาเข้างานสำเร็จ", en: "Checked in successfully" },
  "attendance.clock.success_out": { th: "บันทึกเวลาเลิกงานสำเร็จ", en: "Checked out successfully" },

  // Actions & Buttons
  "attendance.action.request_leave": { th: "ยื่นใบลา", en: "Request Leave" },
  "attendance.action.adjust": { th: "ปรับแก้เวลา", en: "Adjust Time" },
  "attendance.action.export_csv": { th: "ส่งออก CSV", en: "Export CSV" },
  "attendance.action.filter": { th: "กรองข้อมูล", en: "Filter" },
  "attendance.action.reset": { th: "ล้างค่า", en: "Reset" },
  "attendance.action.approve": { th: "อนุมัติ", en: "Approve" },
  "attendance.action.reject": { th: "ไม่อนุมัติ", en: "Reject" },
  "attendance.action.save": { th: "บันทึกข้อมูล", en: "Save" },
  "attendance.action.cancel": { th: "ยกเลิก", en: "Cancel" },

  // Table Headers
  "attendance.th.date": { th: "วันที่", en: "Date" },
  "attendance.th.name": { th: "ชื่อ-นามสกุล", en: "Name" },
  "attendance.th.department": { th: "สาขาวิชา/ฝ่าย", en: "Department" },
  "attendance.th.type": { th: "ประเภทงาน", en: "Work Type" },
  "attendance.th.check_in": { th: "เวลาเข้า", en: "Check In" },
  "attendance.th.check_out": { th: "เวลาออก", en: "Check Out" },
  "attendance.th.hours": { th: "ชั่วโมงทำงาน", en: "Work Hours" },
  "attendance.th.status": { th: "สถานะ", en: "Status" },
  "attendance.th.late_duration": { th: "สาย (นาที)", en: "Late (mins)" },
  "attendance.th.actions": { th: "จัดการ", en: "Actions" },

  // Leave Form & Dialog
  "leave.form.title": { th: "แบบฟอร์มขอลาหยุดงาน", en: "Leave Request Form" },
  "leave.form.type": { th: "ประเภทการลา", en: "Leave Type" },
  "leave.form.start_date": { th: "ตั้งแต่วันที่", en: "Start Date" },
  "leave.form.end_date": { th: "ถึงวันที่", en: "End Date" },
  "leave.form.is_half_day": { th: "ลาครึ่งวัน", en: "Half Day Leave" },
  "leave.form.half_period": { th: "ช่วงเวลา", en: "Period" },
  "leave.form.morning": { th: "ช่วงเช้า", en: "Morning" },
  "leave.form.afternoon": { th: "ช่วงบ่าย", en: "Afternoon" },
  "leave.form.total_days": { th: "รวมจำนวนวันลา", en: "Total Days" },
  "leave.form.reason": { th: "เหตุผลความจำเป็นในการลา", en: "Reason for Leave" },
  "leave.form.phone": { th: "เบอร์โทรศัพท์ที่ติดต่อได้", en: "Contact Phone" },
  "leave.form.address": { th: "ที่อยู่ระหว่างลา", en: "Contact Address" },
  "leave.form.attachment": { th: "เอกสารแนบ (URL / ลิงก์)", en: "Attachment Link / URL" },
  "leave.form.submit": { th: "ส่งคำขอลา", en: "Submit Request" },
  "leave.form.reject_reason": { th: "ระบุเหตุผลที่ไม่อนุมัติ", en: "Reason for Rejection" },

  // Adjust Dialog
  "adjust.dialog.title": { th: "ปรับแก้บันทึกเวลาทำงาน", en: "Adjust Attendance Record" },
  "adjust.dialog.reason": { th: "เหตุผลในการปรับแก้เวลา (จำเป็น)", en: "Reason for Adjustment (Required)" },
  "adjust.dialog.reason_placeholder": { th: "เช่น ลืมลงเวลา, ระบบเครือข่ายขัดข้อง, ได้รับมอบหมายงานด่วน", en: "e.g., Forgot to check in, Network issue, Urgent assignment" },
  "adjust.dialog.success": { th: "ปรับแก้ข้อมูลเวลาเรียบร้อยแล้ว", en: "Attendance record adjusted successfully" },

  // Shifts
  "shifts.title": { th: "กำหนดกะเวลาทำงาน", en: "Work Shift Configurations" },
  "shifts.name_th": { th: "ชื่อกะ (ไทย)", en: "Shift Name (TH)" },
  "shifts.name_en": { th: "ชื่อกะ (อังกฤษ)", en: "Shift Name (EN)" },
  "shifts.start_time": { th: "เวลาเริ่มงาน", en: "Start Time" },
  "shifts.end_time": { th: "เวลาเลิกงาน", en: "End Time" },
  "shifts.late_threshold": { th: "ระยะเวลายกเว้นการมาสาย (นาที)", en: "Late Grace Period (Minutes)" },
  "shifts.save_success": { th: "บันทึกการตั้งค่ากะเวลาสำเร็จ", en: "Shift settings saved successfully" },
} as const;

export const MESSAGES = messages;
