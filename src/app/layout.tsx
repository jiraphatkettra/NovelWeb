import type { Metadata, Viewport } from "next";
import { allFontVariables } from "@/lib/fonts";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { ToastProvider } from "@/context/ToastContext";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { LoginModal } from "@/components/auth/LoginModal";
import Link from "next/link";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { ParticleCanvas } from "@/components/effects/ParticleCanvas";
import { AnimatedGradientOrbs } from "@/components/effects/AnimatedGradientOrbs";
import { SidePanelProvider } from "@/context/SidePanelContext";
import { SidePanel } from "@/components/layout/SidePanel";
import { GlobalIssueModal } from "@/components/support/GlobalIssueModal";
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
  title: "ReadVerse — อ่านนิยายและมังงะออนไลน์",
  description:
    "แพลตฟอร์มอ่านนิยายและมังงะคุณภาพ พร้อมระบบสนับสนุนนักเขียน",
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
      <body className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)]">
        <AuthProvider>
          <AuthModalProvider>
            <SidePanelProvider>
              <ToastProvider>
                {/* Visual effects disabled for minimal mode */}
                {/* <ParticleCanvas /> */}
                {/* <AnimatedGradientOrbs /> */}

                <Navbar />
                <LoginModal />
                <SidePanel />
                <GlobalIssueModal />

                <div className="flex-1 pb-14 md:pb-0 relative z-10">{children}</div>

                {/* Minimalist Editorial Footer */}
                <footer className="border-t border-white/[0.06] bg-[#09090b] py-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 relative z-10">
                  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left: Brand & Tagline */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-zinc-200 font-prompt">
                        ReadVerse
                      </span>
                      <span className="text-zinc-700">|</span>
                      <span className="text-xs text-zinc-500">
                        แพลตฟอร์มอ่านนิยายและมังงะออนไลน์
                      </span>
                    </div>

                    {/* Center: Main Links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
                      <Link href="/?type=NOVEL" className="hover:text-zinc-200 transition">นิยาย</Link>
                      <Link href="/?type=MANGA" className="hover:text-zinc-200 transition">มังงะ</Link>
                      <Link href="/schedule" className="hover:text-zinc-200 transition">ตารางอัปเดต</Link>
                      <Link href="/coin-shop" className="hover:text-zinc-200 transition">เหรียญ</Link>
                      <Link href="/library" className="hover:text-zinc-200 transition">ชั้นหนังสือ</Link>
                      <Link href="/report" className="text-rose-400/80 hover:text-rose-300 transition">แจ้งปัญหา</Link>
                      <Link href="/help" className="hover:text-zinc-200 transition">ช่วยเหลือ</Link>
                    </div>

                    {/* Right: Legal & Copyright */}
                    <div className="flex items-center gap-4 text-[11px] text-zinc-600">
                      <Link href="/legal/terms" className="hover:text-zinc-400 transition">ข้อตกลง</Link>
                      <span>·</span>
                      <Link href="/legal/privacy" className="hover:text-zinc-400 transition">ความเป็นส่วนตัว</Link>
                      <span>·</span>
                      <span>© 2026 ReadVerse</span>
                    </div>
                  </div>
                </footer>

                <CookieConsentBanner />
                <MobileBottomNav />
              </ToastProvider>
            </SidePanelProvider>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
