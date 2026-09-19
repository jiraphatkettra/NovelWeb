"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Coins, Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react";
import confetti from "canvas-confetti";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [penName, setPenName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [birthdate, setBirthdate] = useState("2000-01-01");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const DEFAULT_GOOGLE_CLIENT_ID = "175750601040-6mu2snpdi2taks4vdq7gh7cf3q8gqh2f.apps.googleusercontent.com";
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  const triggerGooglePrompt = () => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.()) {
          toast.warning(
            "ไม่สามารถเปิด Google Sign-In ได้",
            "หากไม่ขึ้นป๊อปอัป กรุณาตรวจสอบว่าได้ตั้งค่า Authorized JavaScript Origins ใน Google Cloud Console เรียบร้อยแล้ว"
          );
        }
      });
    } else {
      toast.warning("กำลังเตรียมระบบ Google Sign-In", "กรุณารอสักครู่แล้วลองใหม่อีกครั้ง หรือสมัครด้วยอีเมล");
    }
  };

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      if (response?.credential) {
        setLoading(true);
        try {
          const res = await loginWithGoogle(response.credential);
          if (res.success) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
            toast.success("สมัครสมาชิก/เข้าสู่ระบบด้วย Google สำเร็จ!", "ยินดีต้อนรับสู่ ReadVerse");
            router.push("/");
          } else {
            setErrorMsg(res.message || "สมัครด้วย Google ไม่สำเร็จ");
          }
        } catch {
          setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google");
        } finally {
          setLoading(false);
        }
      }
    };

    const initGoogle = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.error("Google init error:", e);
        }
      }
    };

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      initGoogle();
    } else {
      const existing = document.getElementById("google-gsi-client");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "google-gsi-client";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.head.appendChild(script);
      } else {
        existing.onload = initGoogle;
      }
    }
  }, [clientId, loginWithGoogle, router, toast]);

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
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Welcome Bonus Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/20 to-[#7C3AED]/20 border border-[#8B5CF6]/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center font-bold shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#C4B5FD] font-prompt">โบนัสต้อนรับสมาชิกใหม่!</p>
            <p className="text-[11px] text-zinc-300">สมัครวันนี้ รับเหรียญฟรีทันที 100 เหรียญ</p>
          </div>
        </div>

        <div className="text-center space-y-1.5 pt-0.5">
          <h1 className="text-2xl font-bold text-white font-prompt">สมัครสมาชิกใหม่</h1>
          <p className="text-xs text-zinc-400">เริ่มต้นการเดินทางในโลกจินตนาการ</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5">ชื่อผู้ใช้งาน</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อของคุณ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5">อีเมล</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded transition"
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

          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5">วันเกิด (ยืนยันอายุ 18+)</label>
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* Author Mode Notice */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-2.5 text-[11px] text-zinc-400">
            <Sparkles className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
            <span>
              ทุกบัญชีเริ่มต้นเป็นผู้อ่าน และสามารถกด <strong className="text-[#C4B5FD] font-semibold">"เปิดโหมดนักเขียน"</strong> เพื่อลงนิยายหรือมังงะได้ฟรีทุกเมื่อหลังเข้าสู่ระบบ
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก & รับฟรี 100 เหรียญ"}
          </button>
        </form>

        {/* Google Sign-In Circular Button (Positioned BELOW registration fields for REGISTER) */}
        <div className="space-y-3 pt-1">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-900 px-3 text-[11px] text-zinc-400 font-sarabun absolute">
              หรือสมัครสมาชิกด้วย Google
            </span>
          </div>
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={triggerGooglePrompt}
              className="w-12 h-12 rounded-full bg-white hover:bg-neutral-100 flex items-center justify-center shadow-lg shadow-black/40 hover:shadow-purple-500/30 transition-all duration-200 active:scale-95 border border-white/20 ring-1 ring-white/10 group cursor-pointer"
              title="สมัครสมาชิกด้วย Google"
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

        <p className="text-center text-xs text-zinc-400 pt-0.5">
          มีบัญชีสมาชิกอยู่แล้ว?{" "}
          <Link href="/auth/login" className="text-[#A78BFA] font-semibold hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}
