import { test, expect } from "@playwright/test";

const PROGRAM_ID = "2972fe70-2a1e-458d-a7eb-eb2a68b03aa0";

test.describe("การทดสอบระบบทุก Feature บน Google Chrome", () => {

  test("Feature 1: หน้าพอร์ทัลสาธารณะและ Navbar (Portal & Navigation)", async ({ page }) => {
    await page.goto("/");
    // ตรวจสอบ Navbar
    const nav = page.locator("header");
    await expect(nav).toBeVisible();
    await expect(page.getByText(/VibeCore|วิทยาลัยสงฆ์นครพนม|มจร/i).first()).toBeVisible();
    // ตรวจสอบปุ่มเมนูลัด Staff Console หรือ Avatar เมื่อล็อกอินแล้ว
    await expect(page.locator("a[href*='/dashboard'], a[href*='/admin'], button[aria-haspopup='menu']").first()).toBeVisible();
  });

  test("Feature 2: ข้อมูลบุคลากรสงฆ์และระบบความปลอดภัย PDPA (/admin/personnel)", async ({ page }) => {
    await page.goto("/admin/personnel");
    await expect(page.getByText(/ทำเนียบคณาจารย์และบุคลากร/i)).toBeVisible();

    // ตรวจสอบข้อมูลพระภิกษุสงฆ์ในตาราง
    const table = page.locator("table");
    await expect(table).toBeVisible();
    await expect(page.getByText(/พระมหาพิทยา|พระราชสิริวัฒน์|พระครู/i).first()).toBeVisible();

    // ตรวจสอบการ Mask เลขประจำตัวประชาชน
    const maskedText = page.getByText(/\*{4}/).first();
    await expect(maskedText).toBeVisible();

    // ทดสอบคลิกปุ่มลูกตาเพื่อดูเลขเต็ม (Unmask with Audit Log)
    const eyeBtn = page.locator("button[title*='แสดงเลขบัตร'], button:has(svg.lucide-eye)").first();
    if (await eyeBtn.isVisible()) {
      await eyeBtn.click();
      await expect(page.locator("table").getByText(/\d{7,13}/).first()).toBeVisible();
    }
  });

  test("Feature 3: ระบบบริหารหลักสูตรพุทธศาสตรบัณฑิต (/admin/programs)", async ({ page }) => {
    await page.goto("/admin/programs");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/หลักสูตร|Curriculum/i);

    // ต้องพบหลักสูตรสาขาวิชาพระพุทธศาสนา
    await expect(page.getByText(/พุทธศาสตรบัณฑิต|B-BUDDHIST/i).first()).toBeVisible();
    await expect(page.getByText(/140/).first()).toBeVisible();

    // ต้องมีปุ่มไปยังหน้าตารางสอน (Calendar icon)
    const scheduleLink = page.locator(`a[href='/admin/programs/${PROGRAM_ID}/schedule']`);
    await expect(scheduleLink).toBeVisible();

    // ต้องมีปุ่มไปยังหน้ามอบหมายผู้สอน
    const teachingLink = page.locator(`a[href='/admin/programs/${PROGRAM_ID}/teaching']`);
    await expect(teachingLink).toBeVisible();

    // ต้องมีปุ่มไปยังหน้ารายงาน มคอ.๒
    const reportLink = page.locator(`a[href='/admin/programs/${PROGRAM_ID}/report']`);
    await expect(reportLink).toBeVisible();
  });

  test("Feature 4: การมอบหมายภาระงานสอนประจำหลักสูตร (/admin/programs/[id]/teaching)", async ({ page }) => {
    await page.goto(`/admin/programs/${PROGRAM_ID}/teaching`);
    await expect(page.getByText(/มอบหมาย|ภาระงานสอน/i).first()).toBeVisible();

    // ต้องพบรายวิชาพระพุทธศาสนา เช่น BUD101 หรือ พระไตรปิฎกศึกษา
    await expect(page.getByText(/BUD101|พระไตรปิฎกศึกษา|BUD102/i).first()).toBeVisible();
    // ต้องมีปุ่มเพิ่มการมอบหมาย
    await expect(page.getByRole("button", { name: /มอบหมาย|เพิ่ม/i }).first()).toBeVisible();
  });

  test("Feature 5: รายงานทางการ มคอ.๒ และ Export PDF (/admin/programs/[id]/report)", async ({ page }) => {
    await page.goto(`/admin/programs/${PROGRAM_ID}/report`);

    // ตรวจสอบหัวเอกสารราชการและตราสัญลักษณ์
    await expect(page.getByText(/พุทธศาสตรบัณฑิต/i).first()).toBeVisible();
    await expect(page.getByText(/วิทยาลัยสงฆ์นครพนม/i).first()).toBeVisible();

    // ตรวจสอบหมวดต่างๆ ใน มคอ.๒
    await expect(page.getByText(/หมวดที่ ๑|ข้อมูลทั่วไป/i).first()).toBeVisible();
    await expect(page.getByText(/หมวดที่ ๒|อาจารย์/i).first()).toBeVisible();
    await expect(page.getByText(/หมวดที่ ๓|รายวิชา/i).first()).toBeVisible();
    await expect(page.getByText(/หมวดที่ ๔|ลงนาม/i).first()).toBeVisible();

    // ตรวจสอบบล็อกลงนามผู้บริหาร 3 ฝ่าย
    await expect(page.getByText(/ประธานหลักสูตร/i).first()).toBeVisible();
    await expect(page.getByText(/ผู้อำนวยการวิทยาลัยสงฆ์นครพนม/i).first()).toBeVisible();

    // ตรวจสอบปุ่มพิมพ์รายงาน
    await expect(page.getByRole("button", { name: /พิมพ์|PDF/i }).first()).toBeVisible();
  });

  test("Feature 6: ระบบบริหารจัดการตารางสอน มุมมองคู่ และตัวกรอง (/admin/programs/[id]/schedule)", async ({ page }) => {
    await page.goto(`/admin/programs/${PROGRAM_ID}/schedule`);
    await expect(page.getByText(/ระบบบริหารจัดการตารางสอนและตารางเรียน/i)).toBeVisible();

    // ตรวจสอบปุ่มสลับมุมมอง (Matrix vs Ledger)
    const matrixBtn = page.getByRole("button", { name: /ตารางรวม/i });
    const ledgerBtn = page.getByRole("button", { name: /บัญชีรายการ/i });
    await expect(matrixBtn).toBeVisible();
    await expect(ledgerBtn).toBeVisible();

    // สลับเป็นบัญชีรายการ
    await ledgerBtn.click();
    await expect(page.getByText(/SCH-2569/i).first()).toBeVisible();

    // สลับกลับเป็นตารางรวม
    await matrixBtn.click();

    // ตรวจสอบปุ่มพิมพ์รายงานตารางสอน
    const printLink = page.locator(`a[href*='/admin/programs/${PROGRAM_ID}/schedule/report']`);
    await expect(printLink).toBeVisible();
  });

  test("Feature 7: เครื่องยนต์ตรวจจับการชนของตารางสอนและเวลาฉันเพล (Conflict Engine)", async ({ page }) => {
    await page.goto(`/admin/programs/${PROGRAM_ID}/schedule`);

    // เปิด Modal เพิ่มตารางสอนใหม่
    await page.getByRole("button", { name: /เพิ่มคาบเรียนในตาราง/i }).click();
    await expect(page.getByText(/เพิ่มคาบเรียนในตารางสอน/i)).toBeVisible();

    // 1. ทดสอบตรวจจับเวลาฉันภัตตาหารเพล (11:15 - 13:00 น.)
    const startTimeInput = page.locator("input[placeholder*='08:30']");
    const endTimeInput = page.locator("input[placeholder*='11:15']");
    await startTimeInput.fill("11:30");
    await endTimeInput.fill("12:45");

    const roomInput = page.locator("input[placeholder*='ห้อง'], input[name='room']").first();
    await roomInput.fill("ห้องทดสอบฉันเพล");

    // รอผลการตรวจสอบแบบ Real-time (debounce 300ms)
    await expect(page.getByText(/แจ้งเตือนเวลาฉันเพล/i)).toBeVisible({ timeout: 5000 });

    // ปิด Modal
    await page.keyboard.press("Escape");
  });

  test("Feature 8: รายงานตารางสอนทางการและโหมดการพิมพ์คู่ (/admin/programs/[id]/schedule/report)", async ({ page }) => {
    await page.goto(`/admin/programs/${PROGRAM_ID}/schedule/report`);

    // ตรวจสอบหัวรายงานและตราสัญลักษณ์
    await expect(page.getByText(/ตารางสอนและตารางเรียน/i).first()).toBeVisible();
    await expect(page.getByText(/วิทยาลัยสงฆ์นครพนม/i).first()).toBeVisible();

    // ตรวจสอบปุ่มสลับโหมดการพิมพ์ Matrix vs Ledger
    const matrixBtn = page.getByRole("button", { name: /ตารางสอนรายสัปดาห์|Matrix/i });
    const ledgerBtn = page.getByRole("button", { name: /บัญชีรายละเอียด|Ledger/i });
    await expect(matrixBtn).toBeVisible();
    await expect(ledgerBtn).toBeVisible();

    // โหมด Matrix แนวนอน แสดงแถบเวลาฉันเพล
    await matrixBtn.click();
    await expect(page.getByText(/เวลาฉันเพล/i).first()).toBeVisible();

    // สลับเป็นโหมด Ledger แนวตั้ง
    await ledgerBtn.click();
    await expect(page.getByText(/SCH-2569/i).first()).toBeVisible();

    // ตรวจสอบบล็อกลงนาม 3 ฝ่าย
    await expect(page.getByText(/ประธานหลักสูตร/i).first()).toBeVisible();
    await expect(page.getByText(/หัวหน้าฝ่ายวิชาการ/i).first()).toBeVisible();
    await expect(page.getByText(/ผู้อำนวยการวิทยาลัยสงฆ์นครพนม/i).first()).toBeVisible();
  });

  test("Feature 9: ระบบข่าวสารและประชาสัมพันธ์วิทยาลัย (/admin/news)", async ({ page }) => {
    await page.goto("/admin/news");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/ข่าวสาร|News/i);
    await expect(page.getByRole("button", { name: /สร้างข่าว|เพิ่มข่าว/i }).first()).toBeVisible();
  });

  test("Feature 10: การตั้งค่าระบบและชุดสีธีม Liyon (/settings)", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(/ตั้งค่าองค์กร|โทนสี/i).first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-palette", /.+/);
  });

});
