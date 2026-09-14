"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";

export function LoginModal() {
  const { isOpen, tab, setTab, closeAuthModal } = useAuthModal();
  const { login, register, switchDemoRole } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [penName, setPenName] = useState("");

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน", "ใส่อีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success("เข้าสู่ระบบสำเร็จ!", "ยินดีต้อนรับกลับเข้าสู่ NovelWeb");
        closeAuthModal();
      } else {
        toast.error("เข้าสู่ระบบไม่สำเร็จ", res.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน", "ชื่อ อีเมล และรหัสผ่านจำเป็นต้องระบุ");
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        email,
        password,
        name,
        penName: penName || undefined,
        role: "READER",
      });
      if (res.success) {
        toast.success("สมัครสมาชิกสำเร็จ!", "ยินดีต้อนรับสมาชิกใหม่");
        closeAuthModal();
      } else {
        toast.error("สมัครสมาชิกไม่สำเร็จ", res.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: string) => {
    setLoading(true);
    try {
      await switchDemoRole(role);
      toast.success("สลับบัญชีทดสอบเรียบร้อย", `เข้าใช้งานในบทบาท ${role}`);
      closeAuthModal();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121215] border border-white/[0.1] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-[#FFE600] text-black flex items-center justify-center mx-auto shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-prompt tracking-tight">
            NovelWeb
          </h3>
          <p className="text-xs text-neutral-400 font-sarabun">
            {tab === "LOGIN"
              ? "เข้าสู่ระบบเพื่ออ่าน ปลดล็อกตอน และติดตามเรื่องโปรด"
              : "สร้างบัญชีใหม่เพื่อร่วมสนุกในคอมมูนิตี้นิยายและมังงะ"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/[0.08]">
          <button
            type="button"
            onClick={() => setTab("LOGIN")}
            className={`flex-1 pb-2.5 text-xs font-semibold transition border-b-2 ${
              tab === "LOGIN"
                ? "border-[#FFE600] text-[#FFE600]"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setTab("REGISTER")}
            className={`flex-1 pb-2.5 text-xs font-semibold transition border-b-2 ${
              tab === "REGISTER"
                ? "border-[#FFE600] text-[#FFE600]"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {/* Form Body */}
        {tab === "LOGIN" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@novelweb.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#FFE600] text-black text-xs font-bold hover:bg-[#F5DC00] transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                ชื่อที่แสดง
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น มังกรทมิฬ"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                นามปากกา (ถ้าต้องการเขียนผลงาน)
              </label>
              <input
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="เช่น DarkDragon (ไม่บังคับ)"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@novelweb.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ขั้นต่ำ 6 ตัวอักษร"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#FFE600] text-black text-xs font-bold hover:bg-[#F5DC00] transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>สร้างบัญชีและเริ่มต้นใช้งาน</span>
              )}
            </button>
          </form>
        )}

        {/* Quick Demo Test Buttons */}
        <div className="pt-3 border-t border-white/[0.08]">
          <span className="text-[10px] text-neutral-500 block mb-2 text-center uppercase tracking-wider font-mono">
            หรือทดสอบด้วยบัญชีตัวอย่าง
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("READER")}
              className="py-2 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-neutral-300 hover:text-white transition font-medium text-center"
            >
              ผู้อ่าน
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("AUTHOR")}
              className="py-2 px-2.5 rounded-xl bg-[#FFE600]/10 hover:bg-[#FFE600]/20 border border-[#FFE600]/30 text-[11px] text-[#FFE600] transition font-medium text-center"
            >
              นักเขียน
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("SUPER_ADMIN")}
              className="py-2 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[11px] text-purple-300 hover:text-white transition font-medium text-center"
            >
              แอดมิน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
