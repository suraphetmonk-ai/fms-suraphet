export const messages = {
  // Permissions & Role Module
  "roles.module.booking": { th: "ระบบจองห้องประชุมและยานพาหนะ", en: "Facility & Fleet Bookings" },
  "perm.booking:read": { th: "ดูตารางและประวัติการจอง", en: "View bookings and schedules" },
  "perm.booking:create": { th: "ยื่นคำขอจองห้องประชุมและรถยนต์", en: "Create booking requests" },
  "perm.booking:cancel": { th: "ยกเลิกคำขอจองของตนเอง", en: "Cancel own booking requests" },
  "perm.booking:approve": { th: "พิจารณาอนุมัติ/ไม่อนุมัติคำขอจอง", en: "Approve or reject bookings" },
  "perm.booking:manage": { th: "บริหารจัดการข้อมูลห้องและยานพาหนะ", en: "Manage rooms and vehicles" },

  // Navigation & Headings
  "bookings.nav": { th: "จองห้องประชุมและยานพาหนะ", en: "Room & Vehicle Bookings" },
  "bookings.title": { th: "ระบบจองห้องประชุมและยานพาหนะ", en: "Facility & Fleet Booking System" },
  "bookings.subtitle": {
    th: "ศูนย์กลางบริหารจัดการ ตรวจสอบตารางเวลา และอนุมัติการจองห้องประชุมและยานพาหนะของคณะ",
    en: "Centralized management, scheduling, and approval for faculty rooms and fleet vehicles",
  },
  "bookings.public.title": { th: "ตารางการใช้ห้องประชุมและยานพาหนะ", en: "Room & Vehicle Schedule" },
  "bookings.public.subtitle": {
    th: "ตรวจสอบความพร้อมใช้งานและกำหนดการใช้ห้องประชุมและยานพาหนะของคณะ",
    en: "Check real-time availability and reservation schedules for faculty facilities and vehicles",
  },

  // Stat Cards
  "bookings.stats.pending": { th: "รอพิจารณาอนุมัติ", en: "Pending Approvals" },
  "bookings.stats.today": { th: "ใช้งานในวันนี้", en: "Active Today" },
  "bookings.stats.rooms": { th: "ห้องประชุมทั้งหมด", en: "Total Meeting Rooms" },
  "bookings.stats.vehicles": { th: "ยานพาหนะทั้งหมด", en: "Total Fleet Vehicles" },

  // Tabs
  "bookings.tabs.pending": { th: "คำขอด่วนรออนุมัติ", en: "Pending Approvals" },
  "bookings.tabs.schedule": { th: "ปฏิทินและตารางการใช้", en: "Schedule & Calendar" },
  "bookings.tabs.all": { th: "ทะเบียนการจองทั้งหมด", en: "All Bookings" },
  "bookings.tabs.rooms": { th: "จัดการห้องประชุม", en: "Manage Rooms" },
  "bookings.tabs.vehicles": { th: "จัดการยานพาหนะ", en: "Manage Vehicles" },

  // Resource Types
  "bookings.resource.room": { th: "ห้องประชุม/สถานที่", en: "Meeting Room / Facility" },
  "bookings.resource.vehicle": { th: "ยานพาหนะส่วนกลาง", en: "Faculty Vehicle" },

  // Statuses
  "bookings.status.pending": { th: "รอพิจารณาอนุมัติ", en: "Pending Approval" },
  "bookings.status.approved": { th: "อนุมัติเรียบร้อย", en: "Approved" },
  "bookings.status.rejected": { th: "ไม่อนุมัติ", en: "Rejected" },
  "bookings.status.cancelled": { th: "ยกเลิกแล้ว", en: "Cancelled" },
  "bookings.status.completed": { th: "เสร็จสิ้นการใช้งาน", en: "Completed" },

  // Availability Statuses
  "bookings.avail.available": { th: "พร้อมใช้งาน", en: "Available" },
  "bookings.avail.maintenance": { th: "ปิดปรับปรุงชั่วคราว", en: "Under Maintenance" },
  "bookings.avail.inactive": { th: "ระงับการใช้งาน", en: "Inactive" },

  // Room Types
  "bookings.roomtype.meeting": { th: "ห้องประชุมย่อย", en: "Meeting Room" },
  "bookings.roomtype.conference": { th: "ห้องประชุมคณะ/บอร์ด", en: "Conference Boardroom" },
  "bookings.roomtype.seminar": { th: "ห้องสัมมนา/ห้องบรรยาย", en: "Seminar / Lecture Hall" },
  "bookings.roomtype.lab": { th: "ห้องปฏิบัติการคอมพิวเตอร์", en: "Computer & Tech Lab" },

  // Vehicle Types
  "bookings.vehicletype.van": { th: "รถตู้ส่วนกลาง", en: "Passenger Van" },
  "bookings.vehicletype.sedan": { th: "รถเก๋งประจำคณะ", en: "Executive Sedan" },
  "bookings.vehicletype.suv": { th: "รถยนต์อเนกประสงค์ (SUV)", en: "SUV" },
  "bookings.vehicletype.bus": { th: "รถบัสปรับอากาศ", en: "Air-conditioned Bus" },
  "bookings.vehicletype.pickup": { th: "รถกระบะขนย้าย", en: "Pickup Truck" },

  // Form Fields & Labels
  "bookings.code": { th: "รหัสใบจอง", en: "Booking Code" },
  "bookings.titleLabel": { th: "หัวข้อ/วัตถุประสงค์การใช้", en: "Purpose / Event Title" },
  "bookings.startTime": { th: "เวลาเริ่มต้น", en: "Start Time" },
  "bookings.endTime": { th: "เวลาสิ้นสุด", en: "End Time" },
  "bookings.participantCount": { th: "จำนวนผู้เข้าร่วม (คน)", en: "Participants" },
  "bookings.contactName": { th: "ผู้ติดต่อ/ผู้ประสานงาน", en: "Contact Person" },
  "bookings.contactPhone": { th: "เบอร์โทรศัพท์ติดต่อ", en: "Phone Number" },
  "bookings.department": { th: "หน่วยงาน/ภาควิชา", en: "Department / Office" },
  "bookings.destination": { th: "สถานที่/จุดหมายปลายทาง (สำหรับรถ)", en: "Destination (For Vehicle)" },
  "bookings.driverRequired": { th: "ขอพนักงานขับรถ", en: "Driver Required" },
  "bookings.specialRequests": { th: "ความต้องการเพิ่มเติม/การจัดห้อง", en: "Special Requests / Layout" },
  "bookings.rejectReason": { th: "เหตุผลที่ไม่อนุมัติ", en: "Reason for Rejection" },
  "bookings.approvedBy": { th: "ผู้อนุมัติ", en: "Approved By" },
  "bookings.approvedAt": { th: "เวลาที่อนุมัติ", en: "Approved At" },

  // Room Form Fields
  "bookings.room.code": { th: "รหัสห้อง", en: "Room Code" },
  "bookings.room.nameTh": { th: "ชื่อห้อง (ภาษาไทย)", en: "Room Name (TH)" },
  "bookings.room.nameEn": { th: "ชื่อห้อง (ภาษาอังกฤษ)", en: "Room Name (EN)" },
  "bookings.room.building": { th: "อาคาร", en: "Building" },
  "bookings.room.floor": { th: "ชั้น", en: "Floor" },
  "bookings.room.capacity": { th: "ความจุผู้ร่วมประชุม (คน)", en: "Capacity (People)" },
  "bookings.room.type": { th: "ประเภทห้อง", en: "Room Type" },
  "bookings.room.facilities": { th: "อุปกรณ์และสิ่งอำนวยความสะดวก", en: "Facilities & Equipment" },
  "bookings.room.imageUrl": { th: "ลิงก์รูปภาพห้อง", en: "Image URL" },

  // Vehicle Form Fields
  "bookings.vehicle.plate": { th: "หมายเลขทะเบียนรถ", en: "License Plate" },
  "bookings.vehicle.brand": { th: "ยี่ห้อ", en: "Brand" },
  "bookings.vehicle.model": { th: "รุ่นรถ", en: "Model" },
  "bookings.vehicle.type": { th: "ประเภทรถ", en: "Vehicle Type" },
  "bookings.vehicle.capacity": { th: "จำนวนที่นั่ง", en: "Seats Capacity" },
  "bookings.vehicle.driverName": { th: "ชื่อคนขับประจำรถ", en: "Driver Name" },
  "bookings.vehicle.driverPhone": { th: "เบอร์ติดต่อคนขับ", en: "Driver Phone" },

  // Actions & Buttons
  "bookings.action.new": { th: "ยื่นคำขอจองใหม่", en: "New Reservation" },
  "bookings.action.addRoom": { th: "เพิ่มห้องประชุมใหม่", en: "Add Meeting Room" },
  "bookings.action.addVehicle": { th: "เพิ่มยานพาหนะใหม่", en: "Add Vehicle" },
  "bookings.action.approve": { th: "อนุมัติคำขอ", en: "Approve" },
  "bookings.action.reject": { th: "ไม่อนุมัติ", en: "Reject" },
  "bookings.action.cancel": { th: "ยกเลิกการจอง", en: "Cancel Booking" },
  "bookings.action.edit": { th: "แก้ไข", en: "Edit" },
  "bookings.action.delete": { th: "ลบ", en: "Delete" },
  "bookings.action.save": { th: "บันทึกข้อมูล", en: "Save" },
  "bookings.action.close": { th: "ปิดหน้าต่าง", en: "Close" },
  "bookings.action.search": { th: "ค้นหาการจอง...", en: "Search bookings..." },

  // Conflict & Validation Alerts
  "bookings.alert.conflict": {
    th: "ช่วงเวลาที่เลือกทับซ้อนกับการจองอื่นที่มีอยู่แล้ว กรุณาเลือกช่วงเวลาหรือทรัพยากรอื่น",
    en: "Selected time slot conflicts with an existing reservation. Please select another time or resource.",
  },
  "bookings.alert.invalidTime": {
    th: "เวลาสิ้นสุดต้องหลังจากเวลาเริ่มต้น",
    en: "End time must be later than start time.",
  },
  "bookings.alert.success": {
    th: "ดำเนินการเรียบร้อยแล้ว",
    en: "Operation completed successfully.",
  },
} as const;
