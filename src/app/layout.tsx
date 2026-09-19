import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { allFontVariables } from "@/lib/fonts";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { ToastProvider } from "@/context/ToastContext";
import { AmbientSoundProvider } from "@/context/AmbientSoundContext";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { LoginModal } from "@/components/auth/LoginModal";
import Link from "next/link";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { ParticleCanvas } from "@/components/effects/ParticleCanvas";
import { AnimatedGradientOrbs } from "@/components/effects/AnimatedGradientOrbs";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ReadVerse — อ่านมังงะและเว็บตูนออนไลน์ (Webtoon & Manga)",
  description:
    "แพลตฟอร์มอ่านมังงะและเว็บตูนคุณภาพ ภาพคมชัด พร้อมระบบสนับสนุนนักวาดและครีเอเตอร์",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ReadVerse",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={allFontVariables}>
      <body className="min-h-screen flex flex-col bg-black text-[#f5f5f7]">
        <AuthProvider>
          <AuthModalProvider>
            <ToastProvider>
              <AmbientSoundProvider>
                {/* 🎆 Ambient Visual Effects */}
                <ParticleCanvas />
                <AnimatedGradientOrbs />

                <Suspense fallback={<header className="h-14 bg-black w-full border-b border-kakao-border" />}>
                  <Navbar />
                </Suspense>
                <LoginModal />
                <div className="flex-1 pb-6 md:pb-0 relative z-10">{children}</div>

              {/* Footer — Clean & Minimal */}
              <footer className="border-t border-kakao-border bg-black py-8 px-4 sm:px-6 lg:px-8 text-xs text-neutral-500 relative z-10 mb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:mb-0">
                <div className="max-w-7xl mx-auto">
                  {/* Links row */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
                    <Link href="/" className="text-white font-bold font-prompt text-sm">
                      ReadVerse
                    </Link>
                    <Link href="/?type=MANGA" className="hover:text-white transition">มังงะ & เว็บตูน</Link>
                    <Link href="/coin-shop" className="hover:text-white transition">เหรียญ</Link>
                    <Link href="/library" className="hover:text-white transition">ชั้นหนังสือ</Link>
                    <Link href="/help" className="hover:text-white transition">ช่วยเหลือ</Link>
                  </div>

                  {/* Legal row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-neutral-600">
                    <Link href="/legal/terms" className="hover:text-neutral-400 transition">ข้อตกลงการใช้งาน</Link>
                    <span>·</span>
                    <Link href="/legal/privacy" className="hover:text-neutral-400 transition">นโยบายความเป็นส่วนตัว</Link>
                    <span>·</span>
                    <Link href="/legal/author-agreement" className="hover:text-neutral-400 transition">ข้อตกลงนักเขียน</Link>
                  </div>

                  {/* Copyright */}
                  <p className="text-neutral-700">
                    © 2026 ReadVerse. สงวนลิขสิทธิ์ทุกประการ
                  </p>
                </div>
              </footer>

              <CookieConsentBanner />
              <MobileBottomNav />
            </AmbientSoundProvider>
          </ToastProvider>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
