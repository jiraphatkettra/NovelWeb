import type { Metadata } from "next";
import { allFontVariables } from "@/lib/fonts";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReadVerse — แพลตฟอร์มอ่าน-เขียนนิยายและมังงะออนไลน์พรีเมียม",
  description:
    "เพลิดเพลินกับการอ่านนิยายและมังงะคุณภาพสูง พร้อมระบบสลับฟอนต์ไทยสไตล์ ReadAWrite และระบบเหรียญสนับสนุนนักเขียน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={allFontVariables}>
      <body className="min-h-screen flex flex-col bg-black text-[#f5f5f7] selection:bg-white selection:text-black">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>

          {/* Global Minimalist Footer */}
          <footer className="border-t border-white/[0.06] bg-black py-12 px-4 sm:px-6 lg:px-8 text-xs text-neutral-400">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand Col */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-base font-bold text-white font-prompt tracking-tight">ReadVerse</span>
                </div>
                <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
                  แพลตฟอร์มคอนเทนต์สำหรับนักอ่านและนักเขียนนิยาย-มังงะ โฟกัสประสบการณ์อ่านแบบไร้สิ่งรบกวน พร้อมระบบส่วนแบ่งรายได้ 70% สู่ผู้สร้างสรรค์
                </p>
              </div>

              {/* Navigation Links */}
              <div>
                <h4 className="text-xs font-semibold text-white font-prompt uppercase tracking-wider mb-3">เมนูหลัก</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="hover:text-white transition-colors">หน้าแรก</Link></li>
                  <li><Link href="/?type=NOVEL" className="hover:text-white transition-colors">นิยายออนไลน์</Link></li>
                  <li><Link href="/?type=MANGA" className="hover:text-white transition-colors">มังงะ & เว็บตูน</Link></li>
                  <li><Link href="/coin-shop" className="hover:text-white transition-colors">ร้านค้าเหรียญ</Link></li>
                  <li><Link href="/library" className="hover:text-white transition-colors">ชั้นหนังสือของฉัน</Link></li>
                </ul>
              </div>

              {/* Legal & Policy Links */}
              <div>
                <h4 className="text-xs font-semibold text-white font-prompt uppercase tracking-wider mb-3">นโยบาย</h4>
                <ul className="space-y-2">
                  <li><Link href="/profile" className="hover:text-white transition-colors">สิทธิ์ข้อมูลส่วนบุคคล (PDPA)</Link></li>
                  <li><Link href="/legal/terms" className="hover:text-white transition-colors">ข้อตกลงการใช้งาน</Link></li>
                  <li><Link href="/legal/privacy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link></li>
                  <li><Link href="/legal/author-agreement" className="hover:text-white transition-colors">สัญญาข้อตกลงนักเขียน</Link></li>
                  <li><Link href="/help" className="hover:text-white transition-colors">ศูนย์ช่วยเหลือและแจ้งปัญหา</Link></li>
                </ul>
              </div>
            </div>

            <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-600">
              <p>© 2026 ReadVerse Platform. Built according to AGENTS_v2.1.md specification.</p>
              <p className="flex items-center gap-1">
                Crafted for Thai Writers & Readers
              </p>
            </div>
          </footer>
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
