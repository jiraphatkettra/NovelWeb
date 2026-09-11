import {
  Sarabun,
  Bai_Jamjuree,
  Prompt,
  Kanit,
  Mitr,
  Chonburi,
  Charm,
  Mali,
  Kodchasan,
  Noto_Sans_Thai,
  IBM_Plex_Sans_Thai,
} from "next/font/google";

export const fontSarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

export const fontBaiJamjuree = Bai_Jamjuree({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-baijamjuree",
  display: "swap",
});

export const fontPrompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

export const fontKanit = Kanit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
  display: "swap",
});

export const fontMitr = Mitr({
  weight: ["300", "400", "500", "600"],
  subsets: ["thai", "latin"],
  variable: "--font-mitr",
  display: "swap",
});

export const fontChonburi = Chonburi({
  weight: ["400"],
  subsets: ["thai", "latin"],
  variable: "--font-chonburi",
  display: "swap",
});

export const fontCharm = Charm({
  weight: ["400", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-charm",
  display: "swap",
});

export const fontMali = Mali({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-mali",
  display: "swap",
});

export const fontKodchasan = Kodchasan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-kodchasan",
  display: "swap",
});

export const fontNoto = Noto_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-noto",
  display: "swap",
});

export const fontIbm = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-ibm",
  display: "swap",
});

export const allFontVariables = [
  fontSarabun.variable,
  fontBaiJamjuree.variable,
  fontPrompt.variable,
  fontKanit.variable,
  fontMitr.variable,
  fontChonburi.variable,
  fontCharm.variable,
  fontMali.variable,
  fontKodchasan.variable,
  fontNoto.variable,
  fontIbm.variable,
].join(" ");

export interface ThaiFontOption {
  id: string;
  name: string;
  nameTh: string;
  category: "formal" | "modern" | "casual" | "creative";
  className: string;
  description: string;
  sampleText: string;
}

export const THAI_FONTS: ThaiFontOption[] = [
  {
    id: "sarabun",
    name: "Sarabun",
    nameTh: "สารบัญ",
    category: "formal",
    className: "font-sarabun",
    description: "ฟอนต์ทางการ มีหัว อ่านง่าย สบายตาระยะยาว",
    sampleText: "กาลครั้งหนึ่งนานมาแล้ว ในดินแดนอันไกลโพ้น",
  },
  {
    id: "baijamjuree",
    name: "Bai Jamjuree",
    nameTh: "ใบจามจุรี",
    category: "formal",
    className: "font-baijamjuree",
    description: "กึ่งมีหัว โมเดิร์น คมชัด เรียบหรูสไตล์สากล",
    sampleText: "สายลมพัดผ่านยอดไม้เบาๆ ยามราตรีมาเยือน",
  },
  {
    id: "prompt",
    name: "Prompt",
    nameTh: "พร้อมท์",
    category: "modern",
    className: "font-prompt",
    description: "ไม่มีหัว สไตล์โมเดิร์น คลีน เรียบเท่ ยอดนิยม",
    sampleText: "แสงไฟในห้องค่อยๆ หรี่ลง เมื่อเรื่องราวดำเนินต่อ",
  },
  {
    id: "kanit",
    name: "Kanit",
    nameTh: "คณิต",
    category: "modern",
    className: "font-kanit",
    description: "ไม่มีหัว น้ำหนักชัดเจน เส้นโค้งเรขาคณิต ทรงพลัง",
    sampleText: "การต่อสู้เพิ่งเริ่มต้นขึ้นในพริบตาเดียว",
  },
  {
    id: "noto",
    name: "Noto Sans Thai",
    nameTh: "โนโตะ แซนส์",
    category: "modern",
    className: "font-noto",
    description: "ไม่มีหัว มาตรฐานสูง คมกริบ อ่านได้ทุกอุปกรณ์",
    sampleText: "ท่วงทำนองแห่งความเงียบสงบในยามเช้า",
  },
  {
    id: "ibm",
    name: "IBM Plex Sans Thai",
    nameTh: "ไอบีเอ็ม เพล็กซ์",
    category: "modern",
    className: "font-ibm",
    description: "กึ่งมีหัว สไตล์สิ่งพิมพ์พรีเมียม มีเอกลักษณ์สูง",
    sampleText: "ตัวหนังสือที่ผ่านการบรรจงร้อยเรียงด้วยหัวใจ",
  },
  {
    id: "mitr",
    name: "Mitr",
    nameTh: "มิตร",
    category: "casual",
    className: "font-mitr",
    description: "ไม่มีหัว เส้นมน อบอุ่น เป็นกันเอง ชวนผ่อนคลาย",
    sampleText: "รอยยิ้มที่สดใสในวันแดดอ่อนๆ ริมหน้าต่าง",
  },
  {
    id: "mali",
    name: "Mali",
    nameTh: "มะลิ",
    category: "casual",
    className: "font-mali",
    description: "สไตล์ลายมือน่ารัก อ่อนโยน มีชีวิตชีวา สดใส",
    sampleText: "เรื่องรักหวานๆ ใต้แสงตะวันสีส้มอบอุ่น",
  },
  {
    id: "kodchasan",
    name: "Kodchasan",
    nameTh: "คชสาร",
    category: "casual",
    className: "font-kodchasan",
    description: "ลายมือวัยรุ่น ขี้เล่น สนุกสนาน ไม่เป็นทางการ",
    sampleText: "วันนี้อากาศดีจัง ไปเดินเล่นด้วยกันไหมนะ",
  },
  {
    id: "charm",
    name: "Charm",
    nameTh: "ชาร์ม",
    category: "creative",
    className: "font-charm",
    description: "สไตล์ลายมือเขียนพริ้วไหว โรแมนติก อ่อนหวาน",
    sampleText: "ดั่งต้องมนตร์เสน่ห์แห่งรักแรกพบในความฝัน",
  },
  {
    id: "chonburi",
    name: "Chonburi",
    nameTh: "ชลบุรี",
    category: "creative",
    className: "font-chonburi",
    description: "มีหัว หนานุ่ม คลาสสิก เหมาะกับแนวย้อนยุค พีเรียด",
    sampleText: "ประวัติศาสตร์และเรื่องเล่าขานแต่โบราณกาล",
  },
];
