"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, Sparkles, Lock, Mail, User, Coins } from "lucide-react";
import confetti from "canvas-confetti";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [penName, setPenName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("2000-01-01");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await register({
      email,
      password,
      name,
      penName: penName || name,
      birthdate,
    });

    if (res.success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      router.push("/");
    } else {
      setErrorMsg(res.message || "ลงทะเบียนไม่สำเร็จ");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Welcome Bonus Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-300 font-prompt">โบนัสต้อนรับสมาชิกใหม่!</p>
            <p className="text-[11px] text-zinc-300">สมัครวันนี้ รับเหรียญฟรีทันที 100 เหรียญ</p>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white font-prompt">สมัครสมาชิกใหม่</h1>
          <p className="text-xs text-zinc-400">เริ่มต้นการเดินทางในโลกจินตนาการ</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">ชื่อผู้ใช้งาน</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อของคุณ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

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
            <label className="text-zinc-300 font-semibold block mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">วันเกิด (ยืนยันอายุ 18+)</label>
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Author Mode Notice */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-2.5 text-[11px] text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              ทุกบัญชีเริ่มต้นเป็นผู้อ่าน และสามารถกด <strong className="text-amber-300 font-semibold">"เปิดโหมดนักเขียน"</strong> เพื่อลงนิยายหรือมังงะได้ฟรีทุกเมื่อหลังเข้าสู่ระบบ
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50 mt-2"
          >
            {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก & รับฟรี 100 เหรียญ"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          มีบัญชีสมาชิกอยู่แล้ว?{" "}
          <Link href="/auth/login" className="text-amber-400 font-semibold hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}
