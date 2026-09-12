import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "./lib/require-database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  console.log("🌱 กำลัง Seed ข้อมูลจำลองสำหรับระบบจองห้องประชุมและยานพาหนะ (Bookings & Facilities)...");

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("❌ ไม่พบ Tenant ในระบบ");
    return;
  }
  const tenantId = tenant.id;

  const users = await prisma.user.findMany({ take: 5 });
  if (users.length === 0) {
    console.error("❌ ไม่พบผู้ใช้ในระบบ");
    return;
  }

  const staffUser = users[0];
  const approverUser = users[1] || users[0];

  console.log("🏢 สร้างข้อมูลห้องประชุมตัวอย่าง...");
  const roomsData = [
    {
      roomCode: "MR-101",
      nameTh: "ห้องประชุมคณะวิทยาการจัดการ",
      nameEn: "Faculty Boardroom 101",
      building: "อาคาร 1 (บรมราชกุมารี)",
      floor: 4,
      capacity: 40,
      roomType: "CONFERENCE_ROOM",
      facilities: [
        "Smart Board 85 นิ้ว 4K",
        "ระบบประชุมทางไกล Zoom Rooms / Microsoft Teams",
        "เครื่องเสียงและไมโครโฟนประจำที่ 24 จุด",
        "ไมโครโฟนไร้สาย 4 ตัว",
        "ระบบบันทึกภาพและเสียงการประชุมอัตโนมัติ",
      ],
      imageUrl: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=1000&auto=format&fit=crop",
      status: "AVAILABLE",
      orderIndex: 1,
    },
    {
      roomCode: "MR-202",
      nameTh: "ห้องสัมมนาวิชาการเฉลิมพระเกียรติ",
      nameEn: "Grand Academic Seminar Hall 202",
      building: "อาคาร 2 (เฉลิมพระเกียรติ)",
      floor: 2,
      capacity: 120,
      roomType: "SEMINAR_HALL",
      facilities: [
        "โปรเจกเตอร์ 4K ความสว่างสูง จอคู่ 200 นิ้ว",
        "เครื่องเสียงรอบทิศทางระดับมืออาชีพ",
        "เวทีสัมมนาพร้อมโพเดียมดิจิทัล",
        "ระบบไฟส่องสว่างแบบสตูดิโอ",
        "Wi-Fi 6 ความเร็วสูงรองรับ 200 อุปกรณ์",
      ],
      imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1000&auto=format&fit=crop",
      status: "AVAILABLE",
      orderIndex: 2,
    },
    {
      roomCode: "MR-303",
      nameTh: "ห้องปฏิบัติการคอมพิวเตอร์และปัญญาประดิษฐ์",
      nameEn: "AI & High-Performance Computing Lab 303",
      building: "อาคาร 1 (บรมราชกุมารี)",
      floor: 3,
      capacity: 50,
      roomType: "COMPUTER_LAB",
      facilities: [
        "คอมพิวเตอร์ประมวลผลสูง GPU NVIDIA RTX 50 เครื่อง",
        "จอภาพ 27 นิ้ว 2K พร้อมหูฟัง",
        "ระบบถ่ายทอดสดหน้าจอผู้สอน (Screen Sharing System)",
        "เครือข่าย High-Speed Fiber 10Gbps",
      ],
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop",
      status: "AVAILABLE",
      orderIndex: 3,
    },
    {
      roomCode: "MR-404",
      nameTh: "ห้องประชุมย่อยผู้บริหารและกลยุทธ์",
      nameEn: "Executive Strategy Room 404",
      building: "อาคาร 1 (บรมราชกุมารี)",
      floor: 5,
      capacity: 12,
      roomType: "MEETING_ROOM",
      facilities: [
        "Smart TV 65 นิ้ว 4K Touch Screen",
        "กล้องหมุนติดตามผู้พูดอัจฉริยะ Jabra Panacast",
        "ไวท์บอร์ดกระจกนิรภัย",
        "ชุดโต๊ะประชุมไม้สักแท้",
      ],
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop",
      status: "AVAILABLE",
      orderIndex: 4,
    },
  ];

  const createdRooms: Record<string, string> = {};
  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: {
        tenantId_roomCode: {
          tenantId,
          roomCode: r.roomCode,
        },
      },
      update: {
        nameTh: r.nameTh,
        nameEn: r.nameEn,
        building: r.building,
        floor: r.floor,
        capacity: r.capacity,
        roomType: r.roomType,
        facilities: r.facilities,
        imageUrl: r.imageUrl,
        status: r.status,
        orderIndex: r.orderIndex,
      },
      create: {
        tenantId,
        ...r,
      },
    });
    createdRooms[r.roomCode] = room.id;
  }

  console.log("🚐 สร้างข้อมูลยานพาหนะตัวอย่าง...");
  const vehiclesData = [
    {
      plateNumber: "นข 4521 พิษณุโลก",
      brand: "Toyota",
      model: "Commuter VIP 3.0 (เบาะปรับเอนไฟฟ้า 10 ที่นั่ง)",
      vehicleType: "VAN",
      capacity: 10,
      driverName: "นายสมศักดิ์ ขับปลอดภัย",
      driverPhone: "081-234-5678",
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop",
      status: "AVAILABLE",
      orderIndex: 1,
    },
    {
      plateNumber: "ฮภ 8892 กรุงเทพมหานคร",
      brand: "Toyota",
      model: "Hiace Custom Tourer 13 ที่นั่ง",
      vehicleType: "VAN",
      capacity: 13,
      driverName: "นายวิเชียร บริการดี",
      driverPhone: "089-987-6543",
      imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1000&auto=format&fit=crop",
      status: "AVAILABLE",
      orderIndex: 2,
    },
    {
      plateNumber: "กข 7711 นครสวรรค์",
      brand: "Toyota",
      model: "Camry 2.5 HEV Premium Luxury",
      vehicleType: "SEDAN",
      capacity: 4,
      driverName: "นายประสงค์ เดินทางไว",
      driverPhone: "086-555-1234",
      imageUrl: "https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=1000&auto=format&fit=crop",
      status: "AVAILABLE",
      orderIndex: 3,
    },
  ];

  const createdVehicles: Record<string, string> = {};
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.upsert({
      where: {
        tenantId_plateNumber: {
          tenantId,
          plateNumber: v.plateNumber,
        },
      },
      update: {
        brand: v.brand,
        model: v.model,
        vehicleType: v.vehicleType,
        capacity: v.capacity,
        driverName: v.driverName,
        driverPhone: v.driverPhone,
        imageUrl: v.imageUrl,
        status: v.status,
        orderIndex: v.orderIndex,
      },
      create: {
        tenantId,
        ...v,
      },
    });
    createdVehicles[v.plateNumber] = vehicle.id;
  }

  console.log("📅 สร้างข้อมูลรายการจองตัวอย่าง...");
  const now = new Date();
  
  // Booking 1: Approved Room Booking
  const b1Start = new Date(now.getTime() + 24 * 3600 * 1000); // พรุ่งนี้ 09:00
  b1Start.setHours(9, 0, 0, 0);
  const b1End = new Date(b1Start.getTime() + 3 * 3600 * 1000); // พรุ่งนี้ 12:00

  await prisma.booking.upsert({
    where: {
      tenantId_bookingCode: {
        tenantId,
        bookingCode: "BK-2569-0001",
      },
    },
    update: {},
    create: {
      tenantId,
      bookingCode: "BK-2569-0001",
      resourceType: "ROOM",
      roomId: createdRooms["MR-101"],
      userId: staffUser.id,
      title: "ประชุมคณะกรรมการประจำคณะวิทยาการจัดการ ครั้งที่ 9/2569",
      startDateTime: b1Start,
      endDateTime: b1End,
      participantCount: 25,
      contactName: staffUser.name || "อ.ดร. นันทวัน รักษ์วิชา",
      contactPhone: "081-111-2233",
      department: "สำนักงานคณบดี",
      specialRequests: "ขอจัดโต๊ะแบบ Hollow Square พร้อมเตรียมเครื่องดื่มและอาหารว่างเบรค 25 ชุด",
      status: "APPROVED",
      approvedById: approverUser.id,
      approvedAt: now,
    },
  });

  // Booking 2: Approved Vehicle Booking
  const b2Start = new Date(now.getTime() + 48 * 3600 * 1000); // 2 วันข้างหน้า 06:00
  b2Start.setHours(6, 0, 0, 0);
  const b2End = new Date(b2Start.getTime() + 12 * 3600 * 1000); // 18:00

  await prisma.booking.upsert({
    where: {
      tenantId_bookingCode: {
        tenantId,
        bookingCode: "BK-2569-0002",
      },
    },
    update: {},
    create: {
      tenantId,
      bookingCode: "BK-2569-0002",
      resourceType: "VEHICLE",
      vehicleId: createdVehicles["นข 4521 พิษณุโลก"],
      userId: staffUser.id,
      title: "นำคณาจารย์และนิสิตเข้าร่วมการประชุมวิชาการระดับชาติ",
      startDateTime: b2Start,
      endDateTime: b2End,
      participantCount: 9,
      contactName: "ผศ.ดร. ธีรภัทร สมบูรณ์",
      contactPhone: "089-777-8899",
      department: "ภาควิชาวิทยาการคอมพิวเตอร์",
      destination: "มหาวิทยาลัยเชียงใหม่ จ.เชียงใหม่",
      driverRequired: true,
      specialRequests: "ออกเดินทางจากหน้าคณะเวลา 06:00 น. ตรง ขอเบิกค่าน้ำมันและเบี้ยเลี้ยงพนักงานขับรถตามระเบียบ",
      status: "APPROVED",
      approvedById: approverUser.id,
      approvedAt: now,
    },
  });

  // Booking 3: Pending Room Booking
  const b3Start = new Date(now.getTime() + 72 * 3600 * 1000); // 3 วันข้างหน้า 13:00
  b3Start.setHours(13, 0, 0, 0);
  const b3End = new Date(b3Start.getTime() + 4 * 3600 * 1000); // 17:00

  await prisma.booking.upsert({
    where: {
      tenantId_bookingCode: {
        tenantId,
        bookingCode: "BK-2569-0003",
      },
    },
    update: {},
    create: {
      tenantId,
      bookingCode: "BK-2569-0003",
      resourceType: "ROOM",
      roomId: createdRooms["MR-202"],
      userId: staffUser.id,
      title: "การบรรยายพิเศษ: ก้าวทัน Generative AI ในโลกธุรกิจดิจิทัล",
      startDateTime: b3Start,
      endDateTime: b3End,
      participantCount: 100,
      contactName: "อาจารย์ ดร. ศักดิ์ชัย วงศ์สวรรค์",
      contactPhone: "084-555-6677",
      department: "ภาควิชาการตลาดดิจิทัล",
      specialRequests: "ขอทดสอบสัญญาณไมค์ไร้สายและจอโปรเจกเตอร์ก่อนเริ่มงาน 30 นาที",
      status: "PENDING",
    },
  });

  // Booking 4: Pending Vehicle Booking
  const b4Start = new Date(now.getTime() + 96 * 3600 * 1000); // 4 วันข้างหน้า 08:30
  b4Start.setHours(8, 30, 0, 0);
  const b4End = new Date(b4Start.getTime() + 8 * 3600 * 1000); // 16:30

  await prisma.booking.upsert({
    where: {
      tenantId_bookingCode: {
        tenantId,
        bookingCode: "BK-2569-0004",
      },
    },
    update: {},
    create: {
      tenantId,
      bookingCode: "BK-2569-0004",
      resourceType: "VEHICLE",
      vehicleId: createdVehicles["กข 7711 นครสวรรค์"],
      userId: staffUser.id,
      title: "เดินทางไปประสานงานสถานประกอบการฝึกงานนิสิตและบันทึกข้อตกลง MOU",
      startDateTime: b4Start,
      endDateTime: b4End,
      participantCount: 3,
      contactName: "ผศ. สมศรี มีปัญญา",
      contactPhone: "082-333-4444",
      department: "งานวิเทศสัมพันธ์และสหกิจศึกษา",
      destination: "นิคมอุตสาหกรรม จ.พิจิตร และ จ.พิษณุโลก",
      driverRequired: true,
      specialRequests: "ต้องการเดินทางไป-กลับภายในวันเดียว",
      status: "PENDING",
    },
  });

  console.log("✅ การ Seed ข้อมูลระบบจองห้องประชุมและยานพาหนะเสร็จสมบูรณ์เรียบร้อย!");
}

main()
  .catch((e) => {
    console.error("❌ เกิดข้อผิดพลาดในการรัน Seed Bookings:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
