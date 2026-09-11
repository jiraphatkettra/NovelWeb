import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        <span>กลับสู่หน้าหลัก</span>
      </Link>

      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl font-extrabold text-white font-prompt">นโยบายความเป็นส่วนตัว (Privacy Policy & PDPA)</h1>
        <p className="text-xs text-neutral-400">คุ้มครองข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>
      </div>

      <div className="prose prose-invert max-w-none text-xs sm:text-sm text-neutral-300 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">1. ข้อมูลที่เราเก็บรวบรวม</h2>
          <p>เราเก็บรวบรวมข้อมูลส่วนบุคคลที่จำเป็นสำหรับการให้บริการแพลตฟอร์ม ได้แก่:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>ข้อมูลบัญชี: ชื่อ, นามปากกา, อีเมล, รหัสผ่านที่ผ่านการเข้ารหัส (Hash)</li>
            <li>ข้อมูลการยืนยันตัวตน (สำหรับนักเขียน): เลขบัตรประจำตัวประชาชน, ข้อมูลบัญชีธนาคารสำหรับโอนเงินส่วนแบ่ง</li>
            <li>ข้อมูลการใช้งาน: ประวัติการอ่าน, ประวัติการปลดล็อกตอน, รายการบุ๊คมาร์ค, ความคิดเห็น และคะแนนรีวิว</li>
            <li>ข้อมูลทางเทคนิค: หมายเลข IP Address, ชนิดอุปกรณ์, เบราว์เซอร์ และคุกกี้ที่จำเป็นต่อระบบ</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">2. วัตถุประสงค์ในการประมวลผลข้อมูล</h2>
          <p>
            เราใช้ข้อมูลของคุณเพื่อ: (1) ให้บริการระบบอ่านและเขียนนิยาย/มังงะ (2) ประมวลผลการซื้อเหรียญและการปลดล็อกตอน (3) จ่ายส่วนแบ่งรายได้ให้นักเขียน (4) รักษาความปลอดภัยของบัญชีและป้องกันการทุจริต (5) พัฒนาและปรับปรุงประสบการณ์การใช้งาน
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">3. สิทธิ์ของเจ้าของข้อมูลส่วนบุคคล (PDPA Rights)</h2>
          <p>ตามกฎหมาย PDPA คุณมีสิทธิ์ดังต่อไปนี้:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>สิทธิ์ในการเข้าถึงและขอรับสำเนา</strong>: สามารถขอส่งออกข้อมูลทั้งหมดของคุณในรูปแบบ JSON ได้ตลอดเวลาจากหน้าโปรไฟล์</li>
            <li><strong>สิทธิ์ในการแก้ไขข้อมูล</strong>: สามารถแก้ไขชื่อ นามปากกา รูปโปรไฟล์ และรหัสผ่านได้ด้วยตนเอง</li>
            <li><strong>สิทธิ์ในการขอลบข้อมูล</strong>: สามารถยื่นคำขอลบบัญชีผู้ใช้และข้อมูลทั้งหมดได้จากหน้าโปรไฟล์</li>
            <li><strong>สิทธิ์ในการถอนความยินยอม</strong>: สามารถจัดการการตั้งค่าคุกกี้และความเป็นส่วนตัวได้</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">4. การติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)</h2>
          <p>
            หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวหรือต้องการใช้สิทธิ์ตาม PDPA สามารถติดต่อทีมงานได้ที่หน้า <Link href="/help" className="text-white underline">ศูนย์ช่วยเหลือ</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
