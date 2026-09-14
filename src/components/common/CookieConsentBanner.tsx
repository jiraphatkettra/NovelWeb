"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem("cookie_consent_accepted");
      if (!accepted) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("cookie_consent_accepted", "true");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 sm:p-5 rounded-2xl bg-[#121215] border border-white/10 shadow-2xl space-y-3 text-xs text-neutral-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-white font-bold font-prompt">
            <Cookie className="w-4 h-4 text-[#FFE600]" />
            <span>นโยบายการใช้งานคุกกี้ (PDPA)</span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-neutral-500 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-neutral-400 leading-relaxed">
          เราใช้คุกกี้เพื่อพัฒนาและมอบประสบการณ์การอ่านและเขียนที่ดีที่สุด รวมถึงบันทึกการตั้งค่าการอ่านและเซสชันของคุณ คุณสามารถศึกษารายละเอียดเพิ่มเติมได้ที่{" "}
          <Link href="/legal/privacy" className="text-white underline underline-offset-2">
            นโยบายความเป็นส่วนตัว
          </Link>
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition shadow-sm"
          >
            ยอมรับทั้งหมด
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-neutral-300 text-xs font-semibold transition"
          >
            ปฏิเสธ
          </button>
        </div>
      </div>
    </div>
  );
}
