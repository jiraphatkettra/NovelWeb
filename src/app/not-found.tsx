"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[#09090b] text-zinc-100">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-300">
          <BookOpen className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold font-mono">
            404 NOT FOUND
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-prompt text-zinc-100">
            ไม่พบหน้าที่คุณกำลังค้นหา
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            หน้าที่คุณต้องการอาจถูกลบ ย้าย หรือไม่มีอยู่จริงในระบบ ลองกลับไปหน้าหลักหรือค้นหาผลงานใหม่
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm font-prompt"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>

          <Link
            href="/search"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white font-medium text-xs transition flex items-center justify-center gap-2 active:scale-[0.98] font-prompt"
          >
            <Search className="w-4 h-4 text-zinc-400" />
            <span>ค้นหาผลงาน</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
