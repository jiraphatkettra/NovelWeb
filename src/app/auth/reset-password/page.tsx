"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("ไม่พบโทเค็นสำหรับการรีเซ็ตรหัสผ่าน");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 6) {
      alert("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        alert(json.error?.message || "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-white">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white font-prompt">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-xs text-neutral-400">กรุณาระบุรหัสผ่านใหม่ที่มีความยาวอย่างน้อย 6 ตัวอักษร</p>
      </div>

      {success ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4 animate-in fade-in">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <p className="text-sm text-emerald-300 font-semibold">
            ตั้งรหัสผ่านใหม่สำเร็จแล้ว!
          </p>
          <p className="text-xs text-neutral-400">
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition shadow-sm"
          >
            <span>ไปหน้าเข้าสู่ระบบ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1.5">รหัสผ่านใหม่</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white text-xs">กำลังโหลด...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
