import type { Dictionary } from "@/shared/lib/i18n/translate";
import { MESSAGES as core } from "./messages/core";
import { MESSAGES as identity } from "@/features/identity/messages";
import { MESSAGES as sample } from "@/features/sample/messages";
import { MESSAGES as news } from "@/features/news/messages";
import { MESSAGES as personnel } from "@/features/personnel/messages";
import { MESSAGES as curriculum } from "@/features/curriculum/messages";
import { MESSAGES as students } from "@/features/students/messages";
import { MESSAGES as documents } from "@/features/documents/messages";
import { messages as bookings } from "@/features/bookings/messages";
import { messages as attendance } from "@/features/attendance/messages";

/** พจนานุกรม UI ทั้งระบบ — feature ใหม่เพิ่มบรรทัด import ที่นี่ · key ต้องไม่ซ้ำข้าม feature */
export const UI_MESSAGES: Dictionary = {
  ...core,
  ...identity,
  ...sample,
  ...news,
  ...personnel,
  ...curriculum,
  ...students,
  ...documents,
  ...bookings,
  ...attendance,
};
