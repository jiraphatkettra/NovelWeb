import React from "react";
import Link from "next/link";
import { Feather, ArrowLeft } from "lucide-react";

export default function AuthorAgreementPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        <span>กลับสู่หน้าหลัก</span>
      </Link>

      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl font-extrabold text-white font-prompt">สัญญาและข้อตกลงนักเขียน (Author Agreement)</h1>
        <p className="text-xs text-neutral-400">ข้อตกลงระหว่างนักเขียนผู้สร้างสรรค์ผลงาน และ แพลตฟอร์ม ReadVerse</p>
      </div>

      <div className="prose prose-invert max-w-none text-xs sm:text-sm text-neutral-300 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">1. การรักษาสิทธิในทรัพย์สินทางปัญญา</h2>
          <p>
            นักเขียนยังคงเป็นเจ้าของลิขสิทธิ์ สิทธิบัตร และทรัพย์สินทางปัญญาทั้งหมดในผลงานนิยาย มังงะ ภาพประกอบ และตัวละครอย่างสมบูรณ์แบบ แพลตฟอร์ม ReadVerse ได้รับสิทธิ์อนุญาตแบบไม่จำกัดแต่เพียงผู้เดียว (Non-exclusive License) ในการจัดเก็บ ให้บริการ แสดงผล และจำหน่ายสิทธิ์การเข้าถึงผ่านระบบเหรียญบนแพลตฟอร์มเท่านั้น
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">2. การแบ่งปันรายได้ (Revenue Sharing Model 70/30)</h2>
          <p>
            แพลตฟอร์มตกลงจัดสรรส่วนแบ่งรายได้ 70% ของมูลค่าเหรียญที่ผู้อ่านใช้ปลดล็อกอ่านตอนผลงานของนักเขียนให้แก่นักเขียน โดยแพลตฟอร์มจะคิดค่าธรรมเนียมบริการระบบ 30% เพื่อเป็นค่าบำรุงรักษาเซิร์ฟเวอร์ ระบบความปลอดภัย และระบบชำระเงิน
          </p>
          <p>
            นักเขียนสามารถยื่นคำขอถอนเงินได้เมื่อมียอดรายได้สะสมขั้นต่ำ 300 บาท โดยระบบจะโอนเข้าบัญชีธนาคารในประเทศไทยที่นักเขียนได้ผูกไว้ตอนสมัคร KYC
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">3. การรับประกันความถูกต้องและความเป็นเจ้าของ</h2>
          <p>
            นักเขียนรับรองว่าผลงานทั้งหมดที่เผยแพร่ เป็นผลงานที่นักเขียนได้สร้างสรรค์ขึ้นด้วยตนเอง ไม่ได้คัดลอก แปล ดัดแปลง หรือละเมิดลิขสิทธิ์ของบุคคลอื่นโดยไม่ได้รับอนุญาต หากเกิดกรณีการละเมิดลิขสิทธิ์หรือข้อพิพาททางกฎหมาย นักเขียนจะต้องเป็นผู้รับผิดชอบค่าเสียหายทั้งหมดแต่เพียงผู้เดียว
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">4. มาตรฐานเนื้อหาและจรรยาบรรณชุมชน</h2>
          <p>
            ห้ามมิให้เผยแพร่เนื้อหาที่มีลักษณะ: (1) ละเมิดสถาบันพระมหากษัตริย์หรือความมั่นคงแห่งรัฐ (2) สื่อลามกอนาจารเด็ก (3) การยุยงให้เกิดความเกลียดชัง ความรุนแรง หรือการก่อการร้าย ทั้งนี้ สำหรับเนื้อหาสำหรับผู้ใหญ่ (18+) นักเขียนมีหน้าที่ต้องกำหนดเรตติ้งของเรื่องเป็น MATURE 18+ เสมอ
          </p>
        </section>
      </div>
    </div>
  );
}
