"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, Sparkles, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await login(email, password);
    if (res.success) {
      router.push("/");
    } else {
      setErrorMsg(res.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
    setLoading(false);
  };

  const handleQuickDemo = async (role: string) => {
    await switchDemoRole(role);
    router.push("/");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-bold mx-auto mb-2 shadow-lg shadow-amber-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white font-prompt">เข้าสู่ระบบ ReadVerse</h1>
          <p className="text-xs text-zinc-400">ยินดีต้อนรับกลับสู่โลกแห่งนิยายและมังงะ</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">อีเมล</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-300 font-semibold block">รหัสผ่าน</label>
              <Link
                href="/auth/forgot-password"
                className="text-[11px] text-amber-400 hover:underline"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50 mt-2"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <p className="text-[11px] text-zinc-500 text-center font-medium">
            หรือคลิกเพื่อเข้าสู่ระบบทดสอบทันที (Demo Fast-Login):
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemo("READER")}
              className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
            >
              ผู้อ่าน (Reader 🪙300)
            </button>
            <button
              onClick={() => handleQuickDemo("AUTHOR")}
              className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
            >
              นักเขียน (Author)
            </button>
            <button
              onClick={() => handleQuickDemo("FINANCE_ADMIN")}
              className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
            >
              การเงิน (Finance)
            </button>
            <button
              onClick={() => handleQuickDemo("SUPER_ADMIN")}
              className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
            >
              Super Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400">
          ยังไม่มีบัญชีสมาชิก?{" "}
          <Link href="/auth/register" className="text-amber-400 font-semibold hover:underline">
            สมัครสมาชิกใหม่ (รับฟรี 100 เหรียญ)
          </Link>
        </p>
      </div>
    </div>
  );
}
