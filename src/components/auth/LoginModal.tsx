"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import { X, BookOpen, Mail, Lock, User, ArrowRight } from "lucide-react";

export function LoginModal() {
  const { isOpen, closeAuthModal, tab: modalTab, setTab: setModalTab } = useAuthModal();
  const { login, register, switchDemoRole } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"LOGIN" | "REGISTER">(modalTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [penName, setPenName] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync state if opened from external context
  React.useEffect(() => {
    setTab(modalTab);
  }, [modalTab]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success("เข้าสู่ระบบสำเร็จ!", "ยินดีต้อนรับกลับสู่ ReadVerse");
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
    setLoading(true);
    try {
      const res = await register({
        email,
        password,
        name,
        penName: penName.trim() || undefined,
      });
      if (res.success) {
        toast.success("สมัครสมาชิกสำเร็จ!", "บัญชีของคุณพร้อมใช้งานแล้ว");
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

  const handleQuickDemo = async (role: "READER" | "AUTHOR" | "SUPER_ADMIN") => {
    setLoading(true);
    try {
      await switchDemoRole(role);
      toast.success("เข้าสู่ระบบด้วยบัญชีทดสอบ", `เปลี่ยนบทบาทเป็น ${role} เรียบร้อยแล้ว`);
      closeAuthModal();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121215] border border-white/[0.1] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center mx-auto shadow-md">
            <BookOpen className="w-5 h-5 text-zinc-950" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100 font-prompt tracking-tight">
            ReadVerse
          </h3>
          <p className="text-xs text-zinc-400 font-sarabun">
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
            className={`flex-1 pb-2.5 text-xs font-semibold transition border-b-2 font-prompt ${
              tab === "LOGIN"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setTab("REGISTER")}
            className={`flex-1 pb-2.5 text-xs font-semibold transition border-b-2 font-prompt ${
              tab === "REGISTER"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {/* Form Body */}
        {tab === "LOGIN" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 font-prompt shadow-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
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
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                ชื่อที่แสดง
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น นักอ่านสายชิล"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                นามปากกา (ถ้าต้องการเป็นนักเขียน)
              </label>
              <input
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="เช่น DarkDragon (ไม่บังคับ)"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ขั้นต่ำ 6 ตัวอักษร"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 font-prompt shadow-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>สร้างบัญชีและเริ่มต้นใช้งาน</span>
              )}
            </button>
          </form>
        )}

        {/* Quick Demo Test Accounts */}
        <div className="pt-3 border-t border-white/[0.08]">
          <span className="text-[10px] text-zinc-500 block mb-2 text-center uppercase tracking-wider font-mono">
            หรือทดสอบด้วยบทบาทจำลอง (DEMO LOGIN)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("READER")}
              className="py-1.5 px-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-zinc-300 hover:text-white transition font-medium text-center"
            >
              ผู้อ่าน
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("AUTHOR")}
              className="py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] text-amber-300 transition font-medium text-center"
            >
              นักเขียน
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("SUPER_ADMIN")}
              className="py-1.5 px-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[11px] text-purple-300 hover:text-white transition font-medium text-center"
            >
              แอดมิน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
