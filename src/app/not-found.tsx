import React from "react";
import Link from "next/link";
import { BookOpen, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-black text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#121215] border border-white/10 flex items-center justify-center mx-auto text-[#FFE600]">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/20 text-[#FFE600] text-xs font-bold font-mono">
            404 NOT FOUND
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-prompt text-white">
            ไม่พบหน้าที่คุณกำลังค้นหา
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
            หน้าที่คุณต้องการอาจถูกลบ ย้าย หรือไม่มีอยู่จริงในระบบ ลองกลับไปหน้าหลักหรือค้นหาเรื่องใหม่
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>

          <Link
            href="/search"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#121215] hover:bg-neutral-900 border border-white/10 text-white font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Search className="w-4 h-4 text-[#FFE600]" />
            <span>ค้นหาผลงาน</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
