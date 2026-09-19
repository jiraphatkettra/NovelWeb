"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  X,
  Coins,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";

interface BecomeAuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BecomeAuthorModal({ isOpen, onClose, onSuccess }: BecomeAuthorModalProps) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [penName, setPenName] = useState(user?.penName || user?.name || "");
  const [bio, setBio] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementAccepted) {
      setErrorMsg("กรุณายอมรับข้อตกลงและเงื่อนไขการเป็นนักเขียน");
      return;
    }

    if (!penName.trim()) {
      setErrorMsg("กรุณาระบุนามปากกา");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/author/become", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penName: penName.trim(),
          bio: bio.trim(),
          agreementAccepted,
        }),
      });

      const json = await res.json();

      if (json.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        await refreshUser();
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/author");
        }
      } else {
        setErrorMsg(json.error?.message || "เกิดข้อผิดพลาดในการเปิดใช้งาน");
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141418] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#A78BFA] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ReadVerse Creator Studio</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-prompt flex items-center gap-2.5">
            <PenTool className="w-6 h-6 text-[#A78BFA]" />
            <span>เริ่มต้นเป็นนักเขียนทันที</span>
          </h2>
          <p className="text-xs text-neutral-400">
            เปิดพื้นที่สร้างสรรค์ผลงานของคุณ ไม่ว่าจะเป็นนิยายบรรยายหรือการ์ตูนมังงะ พร้อมสร้างรายได้จากผู้อ่านทั่วประเทศ
          </p>
        </div>

        {/* Feature Highlights Bento */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center space-y-1">
            <Coins className="w-4 h-4 text-[#A78BFA] mx-auto" />
            <p className="text-xs font-bold text-white">ส่วนแบ่ง 70%</p>
            <p className="text-[10px] text-neutral-400">จากยอดปลดล็อกตอน</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center space-y-1">
            <BookOpen className="w-4 h-4 text-sky-400 mx-auto" />
            <p className="text-xs font-bold text-white">นิยาย & มังงะ</p>
            <p className="text-[10px] text-neutral-400">รองรับทั้ง 2 รูปแบบ</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-white">เปิดใช้ฟรี</p>
            <p className="text-[10px] text-neutral-400">ไม่มีค่าใช้จ่ายแอบแฝง</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1.5">
              นามปากกา (Pen Name) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              placeholder="นามปากกาที่คุณต้องการใช้แสดง"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1.5">
              แนะนำตัวสั้นๆ หรือแนวที่ชอบเขียน (Bio)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="เช่น เขียนแนวกำลังภายใน แฟนตาซี หรือรักโรแมนติก..."
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] resize-none"
            />
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-[#8B5CF6] focus:ring-[#8B5CF6] bg-neutral-900"
            />
            <span className="text-[11px] text-neutral-400 leading-relaxed">
              ฉันยืนยันว่าเนื้อหาผลงานที่นำมาลงเป็นผลงานที่สร้างสรรค์ขึ้นเอง และยินยอมปฏิบัติตาม{" "}
              <a
                href="/legal/author-agreement"
                target="_blank"
                rel="noreferrer"
                className="text-[#A78BFA] underline hover:text-[#C4B5FD]"
              >
                สัญญาข้อตกลงนักเขียน (Author Agreement)
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-bold text-sm shadow-lg shadow-[#8B5CF6]/25 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>กำลังเปิดใช้งาน...</span>
            ) : (
              <>
                <span>เปิดใช้งานสตูดิโอนักเขียนทันที</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
