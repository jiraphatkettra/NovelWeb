"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Lock,
  Mail,
  User,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  PenTool,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";

export function LoginModal() {
  const { isOpen, tab, setTab, closeAuthModal } = useAuthModal();
  const { login, loginWithGoogle, register, switchDemoRole } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [penName, setPenName] = useState("");

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
        toast.success("สมัครสมาชิกสำเร็จ!", "ยินดีต้อนรับสมาชิกใหม่สู่ ReadVerse");
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
      toast.error("เกิดข้อผิดพลาดในการสลับบัญชี");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Initialization
  const DEFAULT_GOOGLE_CLIENT_ID = "175750601040-6mu2snpdi2taks4vdq7gh7cf3q8gqh2f.apps.googleusercontent.com";
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  const triggerGooglePrompt = () => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.()) {
          console.warn("Google prompt not displayed:", notification.getNotDisplayedReason());
          toast.warning(
            "ไม่สามารถเปิด Google Sign-In ได้",
            "หากไม่ขึ้นป๊อปอัป กรุณาตรวจสอบว่าได้ตั้งค่า Authorized JavaScript Origins ใน Google Cloud Console เรียบร้อยแล้ว"
          );
        }
      });
    } else {
      toast.warning("กำลังเตรียมระบบ Google Sign-In", "กรุณารอสักครู่แล้วลองใหม่อีกครั้ง หรือเข้าสู่ระบบด้วยอีเมล");
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleCredentialResponse = async (response: any) => {
      if (response?.credential) {
        setLoading(true);
        try {
          const res = await loginWithGoogle(response.credential);
          if (res.success) {
            toast.success("เข้าสู่ระบบด้วย Google สำเร็จ!", "ยินดีต้อนรับสู่ ReadVerse");
            closeAuthModal();
          } else {
            toast.error("เข้าสู่ระบบด้วย Google ไม่สำเร็จ", res.message);
          }
        } catch {
          toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google");
        } finally {
          setLoading(false);
        }
      }
    };

    const renderGoogleBtn = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const container = document.getElementById("google-signin-btn-container");
          if (container) {
            container.innerHTML = "";
            (window as any).google.accounts.id.renderButton(container, {
              type: "icon",
              shape: "circle",
              size: "large",
              theme: "outline",
            });
          }
        } catch (e) {
          console.error("Error rendering Google button:", e);
        }
      }
    };

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      renderGoogleBtn();
    } else {
      const existingScript = document.getElementById("google-gsi-client");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-gsi-client";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderGoogleBtn();
        };
        script.onerror = () => {
          console.warn("Failed to load Google Identity Services SDK");
        };
        document.head.appendChild(script);
      } else {
        existingScript.onload = () => {
          renderGoogleBtn();
        };
      }
    }
  }, [isOpen, tab, clientId]);

  if (!isOpen) return null;

  // Render circular Google button with separator label
  const renderGoogleCircleSection = (label: string) => (
    <div className="space-y-3 pt-1">
      <div className="relative flex items-center justify-center">
        <div className="border-t border-white/[0.08] w-full" />
        <span className="bg-[#131317] px-3 text-[11px] text-neutral-400 font-sarabun absolute">
          {label}
        </span>
      </div>
      <div className="flex justify-center items-center">
        {/* Google Circular Button */}
        <div
          id="google-signin-btn-container"
          className="flex justify-center items-center rounded-full"
        >
          <button
            type="button"
            onClick={triggerGooglePrompt}
            className="w-12 h-12 rounded-full bg-white hover:bg-neutral-100 flex items-center justify-center shadow-lg shadow-black/40 hover:shadow-purple-500/30 transition-all duration-200 active:scale-95 border border-white/20 ring-1 ring-white/10 group cursor-pointer"
            title={tab === "LOGIN" ? "เข้าสู่ระบบด้วย Google" : "สมัครสมาชิกด้วย Google"}
            aria-label="Google Sign-In"
          >
            <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#131317] border border-white/[0.1] shadow-2xl max-h-[88vh] overflow-y-auto p-5 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5 pt-0.5">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#8B5CF6]/30 font-bold mb-1">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-prompt tracking-tight">
            ReadVerse
          </h3>
          <p className="text-xs text-neutral-400 font-sarabun">
            {tab === "LOGIN"
              ? "เข้าสู่ระบบเพื่ออ่าน ปลดล็อกตอน และติดตามเรื่องโปรด"
              : "สร้างบัญชีใหม่เพื่อร่วมสนุกในคอมมูนิตี้นิยายและมังงะ"}
          </p>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] flex gap-1">
          <button
            type="button"
            onClick={() => setTab("LOGIN")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === "LOGIN"
                ? "bg-[#8B5CF6] text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setTab("REGISTER")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === "REGISTER"
                ? "bg-[#8B5CF6] text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {/* Form Body */}
        {tab === "LOGIN" ? (
          <div className="space-y-3.5">
            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-0.5">
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    รหัสผ่าน
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    onClick={closeAuthModal}
                    className="text-[11px] text-neutral-400 hover:text-[#C4B5FD] transition"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded transition"
                    aria-label="แสดงหรือซ่อนรหัสผ่าน"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-bold shadow-md shadow-[#8B5CF6]/20 hover:shadow-[#8B5CF6]/30 transition duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Google Circle Sign-In for LOGIN (Placed BELOW the input fields, just like register) */}
            {renderGoogleCircleSection("หรือเข้าสู่ระบบด้วย Google")}
          </div>
        ) : (
          <div className="space-y-3.5">
            <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-0.5">
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                  นามปากกา (สำหรับนักเขียน)
                </label>
                <input
                  type="text"
                  value={penName}
                  onChange={(e) => setPenName(e.target.value)}
                  placeholder="เช่น DarkDragon (ไม่บังคับ)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ขั้นต่ำ 6 ตัวอักษร"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded transition"
                    aria-label="แสดงหรือซ่อนรหัสผ่าน"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-bold shadow-md shadow-[#8B5CF6]/20 hover:shadow-[#8B5CF6]/30 transition duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>สร้างบัญชีและเริ่มต้นใช้งาน</span>
                )}
              </button>
            </form>

            {/* Google Circle Sign-In for REGISTER (Placed BELOW the registration fields) */}
            {renderGoogleCircleSection("หรือสมัครสมาชิกด้วย Google")}
          </div>
        )}

        {/* Quick Demo Test Section */}
        <div className="pt-3 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
              ทดลองใช้งานด่วน (คลิกเดียว)
            </span>
            <span className="text-[10px] text-neutral-500">ไม่ต้องพิมพ์รหัส</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("READER")}
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 transition-all text-left flex flex-col items-center justify-center gap-1 group active:scale-[0.97]"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 group-hover:text-white flex items-center justify-center transition">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-neutral-200">ผู้อ่าน</span>
              <span className="text-[9px] text-neutral-500">มี 280 เหรียญ</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("AUTHOR")}
              className="p-2.5 rounded-xl bg-[#8B5CF6]/[0.08] hover:bg-[#8B5CF6]/[0.15] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 transition-all text-left flex flex-col items-center justify-center gap-1 group active:scale-[0.97]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 text-[#C4B5FD] flex items-center justify-center transition">
                <PenTool className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#C4B5FD]">นักเขียน</span>
              <span className="text-[9px] text-neutral-400">สตูดิโอแต่ง</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("SUPER_ADMIN")}
              className="p-2.5 rounded-xl bg-purple-500/[0.06] hover:bg-purple-500/[0.12] border border-purple-500/25 hover:border-purple-500/50 transition-all text-left flex flex-col items-center justify-center gap-1 group active:scale-[0.97]"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center transition">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-purple-300">แอดมิน</span>
              <span className="text-[9px] text-neutral-400">จัดการระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
