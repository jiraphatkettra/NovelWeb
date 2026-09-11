import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        <span>กลับสู่หน้าหลัก</span>
      </Link>

      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl font-extrabold text-white font-prompt">ข้อตกลงและเงื่อนไขการใช้งาน (Terms of Service)</h1>
        <p className="text-xs text-neutral-400">อัปเดตล่าสุด: กันยายน 2026 • แพลตฟอร์ม ReadVerse</p>
      </div>

      <div className="prose prose-invert max-w-none text-xs sm:text-sm text-neutral-300 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">1. บทนำและข้อตกลงทั่วไป</h2>
          <p>
            ยินดีต้อนรับสู่ ReadVerse แพลตฟอร์มสำหรับอ่านและเขียนนิยาย มังงะ และเว็บตูนออนไลน์ การเข้าถึงหรือใช้งานแพลตฟอร์มนี้ถือว่าคุณได้อ่าน เข้าใจ และตกลงที่จะผูกพันตามข้อกำหนดและเงื่อนไขเหล่านี้ หากคุณไม่ยอมรับข้อตกลงเหล่านี้ โปรดระงับการใช้งานแพลตฟอร์ม
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">2. บัญชีผู้ใช้และความปลอดภัย</h2>
          <p>
            คุณต้องรับผิดชอบในการรักษาความลับของรหัสผ่านและข้อมูลบัญชีของคุณ คุณตกลงที่จะไม่เปิดเผยรหัสผ่านแก่บุคคลภายนอก และต้องแจ้งให้เราทราบทันทีหากพบการเข้าถึงโดยไม่ได้รับอนุญาต ทางแพลตฟอร์มขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีที่มีพฤติกรรมฉ้อโกง หรือละเมิดข้อกำหนด
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">3. เหรียญและการชำระเงิน (Coins & Payments)</h2>
          <p>
            เหรียญที่ซื้อด้วยเงินจริง (Paid Coins) และเหรียญโบนัส (Free Coins) เป็นสกุลเงินเสมือนภายในระบบ ใช้สำหรับปลดล็อกอ่านเนื้อหาพรีเมียมเท่านั้น ไม่สามารถแลกเปลี่ยนเป็นเงินสดหรือโอนย้ายไปยังบัญชีอื่นได้ เมื่อทำรายการชำระเงินสำเร็จแล้ว จะไม่สามารถขอคืนเงินได้ เว้นแต่มีข้อผิดพลาดทางเทคนิคที่พิสูจน์ได้
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">4. ทรัพย์สินทางปัญญาและลิขสิทธิ์</h2>
          <p>
            เนื้อหาทั้งหมดที่อัปโหลดโดยนักเขียน (รวมถึงข้อความ ภาพประกอบ หน้าปก) ยังคงเป็นลิขสิทธิ์ของนักเขียนเจ้าของผลงาน นักเขียนให้สิทธิ์แพลตฟอร์มในการจัดเก็บและเผยแพร่เท่านั้น ห้ามมิให้ผู้ใช้งานดาวน์โหลด บันทึกภาพ ทำซ้ำ ดัดแปลง หรือเผยแพร่ต่อเพื่อการค้าโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white font-prompt">5. เนื้อหาที่มีการจำกัดอายุ (Mature 18+)</h2>
          <p>
            ผู้ใช้งานต้องยืนยันว่ามีอายุครบ 18 ปีบริบูรณ์ขึ้นไปจึงจะสามารถเข้าถึงเนื้อหาที่จัดอยู่ในหมวดหมู่ 18+ ได้ ทางแพลตฟอร์มมีระบบยืนยันอายุ (Age Verification Gate) เพื่อความปลอดภัยและการปฏิบัติตามกฎหมาย
          </p>
        </section>
      </div>
    </div>
  );
}
