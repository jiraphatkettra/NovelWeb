import React from "react";
import Link from "next/link";
import { BookOpen, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-black text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#121215] border border-white/10 flex items-center justify-center mx-auto text-[#A78BFA]">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#A78BFA] text-xs font-bold font-mono">
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
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>

          <Link
            href="/search"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#121215] hover:bg-neutral-900 border border-white/10 text-white font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Search className="w-4 h-4 text-[#A78BFA]" />
            <span>ค้นหาผลงาน</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
