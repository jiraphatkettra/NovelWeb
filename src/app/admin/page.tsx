"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Shield,
  Users,
  DollarSign,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Edit2,
  Coins,
  FileCheck,
  Eye,
  Sliders,
  Settings,
  UserCheck,
  ShoppingBag,
  Star,
  Bell,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { UserManagementModal, AdminUserDetail } from "@/components/admin/UserManagementModal";
import { StoryModerationModal, StoryModerationDetail } from "@/components/admin/StoryModerationModal";
import { ReportsManagementTab } from "@/components/admin/ReportsManagementTab";
import { AuditLogsTab } from "@/components/admin/AuditLogsTab";
import { BroadcastTab } from "@/components/admin/BroadcastTab";

interface AdminOverviewData {
  adminRole: string;
  metrics: {
    totalUsers: number;
    totalStories: number;
    totalOrders: number;
    totalRevenueThb: number;
    pendingPayoutsCount: number;
  };
  pendingPayouts: Array<{
    id: string;
    amountThb: number;
    netAmountThb: number;
    bankName: string;
    bankAccountNo: string;
    accountName: string;
    createdAt: string;
    author: {
      user: { name: string; penName?: string; email: string };
    };
  }>;
  recentReports: Array<{
    id: string;
    targetType: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: { name: string };
  }>;
}

type UserItem = AdminUserDetail;
type StoryItem = StoryModerationDetail;

interface CoinPackageItem {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceThb: number;
  badge?: string | null;
  isPopular: boolean;
  active: boolean;
}

interface AuthorApplicationItem {
  id: string;
  userId: string;
  bio?: string;
  idCardNumber?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  kycStatus: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    penName?: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

type AdminTab =
  | "overview"
  | "users"
  | "content"
  | "reports"
  | "payouts"
  | "packages"
  | "applications"
  | "broadcast"
  | "auditLogs";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Applications state
  const [applicationsList, setApplicationsList] = useState<AuthorApplicationItem[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);

  // Content state
  const [storiesList, setStoriesList] = useState<StoryItem[]>([]);
  const [contentFilter, setContentFilter] = useState("ALL");
  const [contentLoading, setContentLoading] = useState(false);
  const [selectedStoryForModeration, setSelectedStoryForModeration] = useState<StoryModerationDetail | null>(null);

  // Packages state
  const [packagesList, setPackagesList] = useState<CoinPackageItem[]>([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CoinPackageItem | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgCoins, setPkgCoins] = useState(100);
  const [pkgBonus, setPkgBonus] = useState(0);
  const [pkgPrice, setPkgPrice] = useState(100);
  const [pkgBadge, setPkgBadge] = useState("");
  const [pkgPopular, setPkgPopular] = useState(false);

  // Fetch Overview
  const fetchOverview = async () => {
    try {
      const res = await fetch("/api/v1/admin/overview");
      const json = await res.json();
      if (json.success) {
        setOverview(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (userRoleFilter !== "ALL") params.set("role", userRoleFilter);
      if (userStatusFilter !== "ALL") params.set("status", userStatusFilter);

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsersList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Content Moderation
  const fetchContent = async () => {
    setContentLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/content?filter=${contentFilter}`);
      const json = await res.json();
      if (json.success) {
        setStoriesList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContentLoading(false);
    }
  };

  // Fetch Coin Packages
  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/v1/admin/packages");
      const json = await res.json();
      if (json.success) {
        setPackagesList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Author Applications
  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/author-applications?status=PENDING");
      const json = await res.json();
      if (json.success) {
        setApplicationsList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (user && ["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(user.role)) {
      fetchOverview();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "content") fetchContent();
    if (activeTab === "packages") fetchPackages();
    if (activeTab === "applications") fetchApplications();
  }, [activeTab, contentFilter, userRoleFilter, userStatusFilter]);

  // Section E: Approve/Reject Author Application
  const handleApplicationAction = async (profileId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/v1/admin/author-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        fetchApplications();
        fetchOverview();
      } else {
        toast.error("ดำเนินการไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบใบสมัคร");
    }
  };

  // Toggle User Status (Suspend/Activate)
  const handleToggleUserStatus = async (targetUserId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        fetchUsers();
      } else {
        toast.error("ดำเนินการไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้");
    }
  };

  // Content Moderation Action (Approve/Reject)
  const handleContentAction = async (storyId: string, status: "PUBLISHED" | "SUSPENDED") => {
    let rejectReason = "";
    if (status === "SUSPENDED") {
      const input = prompt("กรุณาระบุเหตุผลในการระงับ/ส่งคืนเนื้อหา:");
      if (!input) return;
      rejectReason = input;
    }

    try {
      const res = await fetch("/api/v1/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, status, rejectReason }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        fetchContent();
        fetchOverview();
      } else {
        toast.error("ดำเนินการไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบเนื้อหา");
    }
  };

  // Quick Toggle Featured Story
  const handleQuickToggleFeatured = async (storyId: string, currentFeatured: boolean) => {
    const targetStory = storiesList.find((s) => s.id === storyId);
    const storyTitle = targetStory?.title || "ผลงาน";

    // Optimistic UI update
    setStoriesList((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, isFeatured: !currentFeatured } : s))
    );

    try {
      const res = await fetch("/api/v1/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, isFeatured: !currentFeatured }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          !currentFeatured
            ? `ดันเรื่อง "${storyTitle}" ขึ้น Hero Section หน้าแรกเรียบร้อยแล้ว!`
            : `นำเรื่อง "${storyTitle}" ออกจาก Hero Section เรียบร้อยแล้ว`
        );
      } else {
        setStoriesList((prev) =>
          prev.map((s) => (s.id === storyId ? { ...s, isFeatured: currentFeatured } : s))
        );
        toast.error("ดำเนินการไม่สำเร็จ", json.error?.message);
      }
    } catch {
      setStoriesList((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, isFeatured: currentFeatured } : s))
      );
      toast.error("เกิดข้อผิดพลาดในการปรับสถานะแนะนำ");
    }
  };

  // Payout Approval Action
  const handlePayoutAction = async (payoutId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/v1/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId,
          action,
          transferSlip: action === "APPROVE" ? `SLIP-TX-${Date.now()}` : undefined,
          rejectedReason: action === "REJECT" ? "ข้อมูลบัญชีไม่สอดคล้อง" : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        fetchOverview();
      } else {
        toast.error("ดำเนินการไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการจัดการคำขอถอนเงิน");
    }
  };

  // Coin Package Save / Edit
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingPackage ? "PUT" : "POST";
      const body = {
        id: editingPackage?.id,
        name: pkgName,
        coins: Number(pkgCoins),
        bonusCoins: Number(pkgBonus),
        priceThb: Number(pkgPrice),
        badge: pkgBadge,
        isPopular: pkgPopular,
      };

      const res = await fetch("/api/v1/admin/packages", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        setShowPackageModal(false);
        setEditingPackage(null);
        fetchPackages();
      } else {
        toast.error("บันทึกแพ็กเกจไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกแพ็กเกจ");
    }
  };

  const handleTogglePackageActive = async (pkg: CoinPackageItem) => {
    try {
      const res = await fetch("/api/v1/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pkg.id, active: !pkg.active }),
      });
      const json = await res.json();
      if (json.success) {
        fetchPackages();
      }
    } catch {}
  };

  if (!user || !["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(user.role)) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-neutral-500">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white font-prompt mb-2">แผงควบคุมระบบ (Admin Panel)</h1>
        <p className="text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
          ส่วนนี้สงวนไว้สำหรับทีมงานและผู้ดูแลระบบเท่านั้น กรุณาสลับบทบาทเป็น Super Admin, Moderator หรือ Finance Admin เพื่อเข้าถึง
        </p>
      </div>
    );
  }

  // Navigation Items Definition with Grouping
  const navSections = [
    {
      group: "ภาพรวม & รายงาน",
      items: [
        {
          id: "overview" as AdminTab,
          label: "ภาพรวมระบบ",
          icon: TrendingUp,
          roles: ["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"],
        },
        {
          id: "reports" as AdminTab,
          label: "ข้อร้องเรียน",
          icon: AlertTriangle,
          badge: overview?.recentReports?.length || 0,
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          roles: ["SUPER_ADMIN", "MODERATOR"],
        },
      ],
    },
    {
      group: "ผู้ใช้งาน & นักเขียน",
      items: [
        {
          id: "users" as AdminTab,
          label: "จัดการผู้ใช้งาน",
          icon: Users,
          roles: ["SUPER_ADMIN", "MODERATOR"],
        },
        {
          id: "applications" as AdminTab,
          label: "ใบสมัครนักเขียน",
          icon: UserCheck,
          badge: applicationsList.length,
          badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
          roles: ["SUPER_ADMIN", "MODERATOR"],
        },
      ],
    },
    {
      group: "เนื้อหา & ผลงาน",
      items: [
        {
          id: "content" as AdminTab,
          label: "ตรวจเนื้อหา & Hero",
          icon: BookOpen,
          roles: ["SUPER_ADMIN", "MODERATOR"],
        },
      ],
    },
    {
      group: "การเงิน & ร้านค้า",
      items: [
        {
          id: "payouts" as AdminTab,
          label: "อนุมัติการถอนเงิน",
          icon: DollarSign,
          badge: overview?.metrics.pendingPayoutsCount || 0,
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          roles: ["SUPER_ADMIN", "FINANCE_ADMIN"],
        },
        {
          id: "packages" as AdminTab,
          label: "แพ็กเกจเหรียญ",
          icon: Coins,
          roles: ["SUPER_ADMIN", "FINANCE_ADMIN"],
        },
      ],
    },
    {
      group: "ระบบ & ความปลอดภัย",
      items: [
        {
          id: "broadcast" as AdminTab,
          label: "ประกาศระบบ",
          icon: Bell,
          roles: ["SUPER_ADMIN"],
        },
        {
          id: "auditLogs" as AdminTab,
          label: "ประวัติแอดมิน",
          icon: Shield,
          roles: ["SUPER_ADMIN"],
        },
      ],
    },
  ];

  // Helper to switch tab and close mobile drawer
  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Get current active tab label
  const currentTabInfo = navSections
    .flatMap((s) => s.items)
    .find((i) => i.id === activeTab);

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7]">
      {/* ─────────────────────────────────────────────────────────────
          1. STICKY TOP HEADER (For Mobile & Tablet & Desktop Quick Info)
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition active:scale-95"
              aria-label="เปิดเมนูแอดมิน"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white font-prompt truncate">
                    {currentTabInfo?.label || "แผงควบคุมระบบ"}
                  </h1>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : user.role === "FINANCE_ADMIN"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 hidden sm:block">
                  ReadVerse Governance Console
                </p>
              </div>
            </div>
          </div>

          {/* Quick Refresh & User Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchOverview();
                if (activeTab === "users") fetchUsers();
                if (activeTab === "content") fetchContent();
                if (activeTab === "payouts") fetchOverview();
                if (activeTab === "applications") fetchApplications();
                toast.success("รีเฟรชข้อมูลเรียบร้อย");
              }}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-400 hover:text-white transition active:scale-95"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-white">{user.name}</div>
              <div className="text-[10px] text-neutral-400">{user.email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN SHELL: SIDEBAR + CONTENT AREA
          ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-8">
        {/* ── DESKTOP / TABLET SIDEBAR ── */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="sticky top-20 bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-4 backdrop-blur-md shadow-xl space-y-5">
            {navSections.map((sec, secIdx) => {
              const visibleItems = sec.items.filter((item) =>
                item.roles.includes(user.role)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={secIdx} className="space-y-1">
                  <p className="text-[11px] font-bold font-prompt uppercase tracking-wider text-neutral-500 px-3 mb-1.5">
                    {sec.group}
                  </p>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                          isActive
                            ? "bg-[#8B5CF6] text-white font-bold shadow-lg shadow-[#8B5CF6]/20 translate-x-1"
                            : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                              isActive
                                ? "bg-white/20 text-white border-white/30"
                                : item.badgeColor || "bg-neutral-800 text-neutral-300 border-neutral-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── MOBILE / TABLET DRAWER OVERLAY ── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Sheet */}
            <div className="relative w-4/5 max-w-xs bg-neutral-950 border-r border-neutral-800 h-full p-5 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#A78BFA]" />
                    <span className="font-bold font-prompt text-white text-sm">เมนูผู้ดูแลระบบ</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  {navSections.map((sec, secIdx) => {
                    const visibleItems = sec.items.filter((item) =>
                      item.roles.includes(user.role)
                    );
                    if (visibleItems.length === 0) return null;

                    return (
                      <div key={secIdx} className="space-y-1.5">
                        <p className="text-[10px] font-bold font-prompt uppercase tracking-wider text-neutral-500 px-3">
                          {sec.group}
                        </p>
                        {visibleItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectTab(item.id)}
                              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition ${
                                isActive
                                  ? "bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25"
                                  : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </div>
                              {item.badge !== undefined && item.badge > 0 && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                    isActive
                                      ? "bg-white/20 text-white border-white/30"
                                      : item.badgeColor || "bg-neutral-800 text-neutral-300 border-neutral-700"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800 text-xs text-neutral-500">
                <p>ReadVerse Admin Console v2.2</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">Optimized for Mobile, Tablet & PC</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT WORKSPACE ── */}
        <main className="flex-1 min-w-0">
          {loading || !overview ? (
            <div className="py-24 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-neutral-400">กำลังเชื่อมต่อข้อมูลแดชบอร์ด...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: OVERVIEW WITH 1-CLICK JUMP CARDS
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                    {/* Total Users */}
                    <button
                      onClick={() => handleSelectTab("users")}
                      className="p-5 rounded-3xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition text-left group relative overflow-hidden active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] text-neutral-500 group-hover:text-blue-400 flex items-center gap-1 transition">
                          ดูรายชื่อ <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">ผู้ใช้งานทั้งหมด</p>
                      <p className="text-2xl font-black text-white font-prompt mt-1">
                        {overview.metrics.totalUsers.toLocaleString()} <span className="text-xs font-normal text-neutral-500">บัญชี</span>
                      </p>
                    </button>

                    {/* Total Stories */}
                    <button
                      onClick={() => handleSelectTab("content")}
                      className="p-5 rounded-3xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition text-left group relative overflow-hidden active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] text-neutral-500 group-hover:text-amber-400 flex items-center gap-1 transition">
                          ตรวจผลงาน <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">ผลงานนิยาย & มังงะ</p>
                      <p className="text-2xl font-black text-white font-prompt mt-1">
                        {overview.metrics.totalStories.toLocaleString()} <span className="text-xs font-normal text-neutral-500">เรื่อง</span>
                      </p>
                    </button>

                    {/* Total Revenue */}
                    <button
                      onClick={() => handleSelectTab("packages")}
                      className="p-5 rounded-3xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition text-left group relative overflow-hidden active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] text-neutral-500 group-hover:text-emerald-400 flex items-center gap-1 transition">
                          แพ็กเกจ <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">รายได้การซื้อเหรียญ</p>
                      <p className="text-2xl font-black text-emerald-400 font-prompt mt-1">
                        ฿{overview.metrics.totalRevenueThb.toLocaleString()}
                      </p>
                    </button>

                    {/* Pending Payouts */}
                    <button
                      onClick={() => handleSelectTab("payouts")}
                      className="p-5 rounded-3xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition text-left group relative overflow-hidden active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] text-neutral-500 group-hover:text-rose-400 flex items-center gap-1 transition">
                          อนุมัติถอน <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">คำขอถอนเงินรอตรวจ</p>
                      <p className="text-2xl font-black text-amber-300 font-prompt mt-1">
                        {overview.metrics.pendingPayoutsCount} <span className="text-xs font-normal text-neutral-500">รายการ</span>
                      </p>
                    </button>
                  </div>

                  {/* Recent Reports Widget */}
                  <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <h2 className="text-base sm:text-lg font-bold text-white font-prompt">
                          รายงานเนื้อหาล่าสุด (Content Reports)
                        </h2>
                      </div>
                      <button
                        onClick={() => handleSelectTab("reports")}
                        className="text-xs font-semibold text-[#A78BFA] hover:text-white flex items-center gap-1 transition"
                      >
                        ดูทั้งหมด <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="divide-y divide-neutral-800/80 text-xs">
                      {overview.recentReports.length === 0 ? (
                        <div className="py-10 text-center text-neutral-500">
                          ไม่มีรายงานเนื้อหาที่ค้างอยู่ สภาพแวดล้อมแพลตฟอร์มปกติเรียบร้อย
                        </div>
                      ) : (
                        overview.recentReports.map((rep) => (
                          <div
                            key={rep.id}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-800/20 px-2 rounded-xl transition"
                          >
                            <div>
                              <p className="font-semibold text-white text-sm">{rep.reason}</p>
                              <p className="text-neutral-400 text-xs mt-0.5">
                                ผู้รายงาน: <span className="text-neutral-300">{rep.reporter.name}</span> • หมวด: {rep.targetType}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 self-start sm:self-auto font-medium text-[11px]">
                              {rep.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: USERS MANAGEMENT (Touch & Responsive Card View)
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "users" && (
                <div className="space-y-4">
                  {/* Search and Filters Bar */}
                  <div className="p-4 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-md">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") fetchUsers(); }}
                        placeholder="ค้นหาชื่อ, นามปากกา, อีเมล..."
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="flex-1 sm:flex-initial px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                      >
                        <option value="ALL">ทุกบทบาท (Role)</option>
                        <option value="READER">ผู้อ่าน (READER)</option>
                        <option value="AUTHOR">นักเขียน (AUTHOR)</option>
                        <option value="MODERATOR">ผู้ตรวจ (MODERATOR)</option>
                        <option value="FINANCE_ADMIN">ฝ่ายการเงิน (FINANCE)</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>

                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        className="flex-1 sm:flex-initial px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                      >
                        <option value="ALL">ทุกสถานะ</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>

                      <button
                        onClick={fetchUsers}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition"
                      >
                        ค้นหา
                      </button>
                    </div>
                  </div>

                  {/* Users Cards / List */}
                  <div className="space-y-3">
                    {usersLoading ? (
                      <div className="py-16 text-center text-neutral-400">
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                        กำลังค้นหาข้อมูลสมาชิก...
                      </div>
                    ) : usersList.length === 0 ? (
                      <div className="py-16 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-sm">
                        ไม่พบผู้ใช้ตามเงื่อนไขที่ค้นหา
                      </div>
                    ) : (
                      usersList.map((u) => {
                        const paidCoins = u.wallet?.paidBalance || 0;
                        const freeCoins = u.wallet?.freeBalance || 0;
                        const totalCoins = paidCoins + freeCoins;

                        return (
                          <div
                            key={u.id}
                            className="p-4 sm:p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                          >
                            {/* User Info */}
                            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt={u.name}
                                  className="w-12 h-12 rounded-2xl object-cover bg-neutral-800 border border-neutral-700 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-pink-500/20 border border-neutral-700 flex items-center justify-center text-white font-bold text-base shrink-0">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-white text-sm truncate">{u.name}</span>
                                  {u.penName && (
                                    <span className="text-amber-300 text-xs">({u.penName})</span>
                                  )}
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                      u.role === "SUPER_ADMIN"
                                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                        : u.role === "AUTHOR"
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                        : u.role === "FINANCE_ADMIN"
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : u.role === "MODERATOR"
                                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                        : "bg-neutral-800 text-neutral-300"
                                    }`}
                                  >
                                    {u.role}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      u.status === "ACTIVE"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    }`}
                                  >
                                    {u.status}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 mt-1">
                                  <span>{u.email}</span>
                                  <span className="text-neutral-600 hidden sm:inline">•</span>
                                  <span className="font-mono text-[11px] text-neutral-500">ID: {u.id.slice(0, 8)}...</span>
                                  {u._count && (
                                    <>
                                      <span className="text-neutral-600 hidden sm:inline">•</span>
                                      <span className="text-neutral-400 text-[11px]">
                                        แต่ง {u._count.stories} เรื่อง • ซื้อ {u._count.purchases} ตอน
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Coins Balance & Actions */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-800">
                              <div className="text-left md:text-right">
                                <div className="flex items-center md:justify-end gap-1.5 font-prompt">
                                  <Coins className="w-4 h-4 text-amber-400" />
                                  <span className="font-bold text-amber-400 text-sm">
                                    {totalCoins.toLocaleString()}
                                  </span>
                                  <span className="text-[11px] text-neutral-400">เหรียญ</span>
                                </div>
                                <p className="text-[10px] text-neutral-500">
                                  (ซื้อ: {paidCoins.toLocaleString()} | ฟรี: {freeCoins.toLocaleString()})
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition shadow flex items-center gap-1.5 active:scale-95"
                                  title="ตรวจสอบโปรไฟล์และจัดการผู้ใช้"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  <span>จัดการ</span>
                                </button>

                                {user.role === "SUPER_ADMIN" && (
                                  <button
                                    onClick={() => handleToggleUserStatus(u.id, u.status)}
                                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                                      u.status === "ACTIVE"
                                        ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                        : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                    }`}
                                    title={u.status === "ACTIVE" ? "ระงับบัญชี" : "ปลดระงับ"}
                                  >
                                    {u.status === "ACTIVE" ? "ระงับ" : "ปลด"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: CONTENT MODERATION & HERO PROMOTION
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "content" && (
                <div className="space-y-4">
                  {/* Filter Header */}
                  <div className="p-4 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[#A78BFA]" />
                      <h2 className="text-base sm:text-lg font-bold text-white font-prompt">
                        คิวตรวจสอบและอนุมัติผลงาน ({storiesList.length} เรื่อง)
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-neutral-400 shrink-0">สถานะ:</span>
                      <select
                        value={contentFilter}
                        onChange={(e) => setContentFilter(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                      >
                        <option value="ALL">ทั้งหมด</option>
                        <option value="PENDING_REVIEW">รอการอนุมัติ (PENDING_REVIEW)</option>
                        <option value="PUBLISHED">เผยแพร่แล้ว (PUBLISHED)</option>
                        <option value="SUSPENDED">ถูกระงับ (SUSPENDED)</option>
                        <option value="DRAFT">ร่าง (DRAFT)</option>
                      </select>
                    </div>
                  </div>

                  {/* Stories List */}
                  {contentLoading ? (
                    <div className="py-16 text-center text-neutral-400">
                      <div className="animate-spin w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full mx-auto mb-2" />
                      กำลังโหลดรายการผลงาน...
                    </div>
                  ) : storiesList.length === 0 ? (
                    <div className="p-16 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-sm">
                      ไม่มีเนื้อหาที่ตรงกับเงื่อนไขการค้นหา
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {storiesList.map((story) => (
                        <div
                          key={story.id}
                          className="p-4 sm:p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            <img
                              src={story.coverUrl}
                              alt={story.title}
                              className="w-14 sm:w-16 aspect-[2/3] object-cover rounded-2xl bg-neutral-800 shrink-0 border border-white/[0.08]"
                            />
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-medium">
                                  {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                                </span>
                                <span className="font-bold text-white text-sm sm:text-base font-prompt line-clamp-1">
                                  {story.title}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    story.status === "PUBLISHED"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : story.status === "PENDING_REVIEW"
                                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                      : story.status === "DRAFT"
                                      ? "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  }`}
                                >
                                  {story.status}
                                </span>
                                {story.isFeatured && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 fill-[#8B5CF6] text-[#8B5CF6]" />
                                    อยู่บน Hero
                                  </span>
                                )}
                                {story.contentRating === "MATURE_18" && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600/20 text-rose-400 border border-rose-500/30">
                                    18+ 🔞
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                                <span>
                                  นักเขียน: <span className="text-neutral-200">{story.author.penName || story.author.name}</span>
                                </span>
                                <span className="text-neutral-600">•</span>
                                <span>หมวด: {story.category}</span>
                                <span className="text-neutral-600">•</span>
                                <span>{story.chapters?.length ?? story._count?.chapters ?? 0} ตอน</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                            {/* 1-Click Hero Star */}
                            <button
                              onClick={() => handleQuickToggleFeatured(story.id, Boolean(story.isFeatured))}
                              className={`px-3 py-2 rounded-xl border transition text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 ${
                                story.isFeatured
                                  ? "bg-[#8B5CF6] text-white font-bold border-[#8B5CF6] shadow-[#8B5CF6]/20 hover:bg-[#7C3AED]"
                                  : "bg-white/[0.04] border-white/[0.1] text-neutral-300 hover:text-white hover:bg-white/[0.08]"
                              }`}
                              title={story.isFeatured ? "คลิกเพื่อนำออกจาก Hero Section" : "คลิกเพื่อดันเรื่องนี้ขึ้น Hero Section"}
                            >
                              <Star className={`w-3.5 h-3.5 ${story.isFeatured ? "fill-white text-white" : "text-[#A78BFA]"}`} />
                              <span>{story.isFeatured ? "★ แนะนำแล้ว" : "☆ ดันแนะนำ"}</span>
                            </button>

                            {/* Inspection Modal Button */}
                            <button
                              onClick={() => setSelectedStoryForModeration(story)}
                              className="px-3.5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>ตรวจ & จัดการ</span>
                            </button>

                            {story.status !== "PUBLISHED" && (
                              <button
                                onClick={() => handleContentAction(story.id, "PUBLISHED")}
                                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm active:scale-95"
                              >
                                อนุมัติ
                              </button>
                            )}
                            {story.status !== "SUSPENDED" && (
                              <button
                                onClick={() => handleContentAction(story.id, "SUSPENDED")}
                                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition active:scale-95"
                              >
                                ระงับ
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 4: PAYOUTS (Invoice Card View)
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "payouts" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-base sm:text-lg font-bold text-white font-prompt">
                        คำขอถอนเงินรออนุมัติ ({overview.pendingPayouts.length} รายการ)
                      </h2>
                    </div>
                  </div>

                  {overview.pendingPayouts.length === 0 ? (
                    <div className="p-16 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-sm">
                      ไม่มีคำขอถอนเงินที่รอการอนุมัติในขณะนี้
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {overview.pendingPayouts.map((p) => (
                        <div
                          key={p.id}
                          className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-white text-lg font-prompt">฿{p.amountThb.toLocaleString()} บาท</span>
                              <span className="text-xs text-emerald-400 font-semibold">(สุทธิ ฿{p.netAmountThb.toLocaleString()} บาท)</span>
                            </div>
                            <p className="text-xs text-neutral-300">
                              นักเขียน: <span className="font-semibold text-white">{p.author.user.penName || p.author.user.name}</span> ({p.author.user.email})
                            </p>
                            <p className="text-[11px] text-neutral-400">
                              โอนเข้า: <span className="text-neutral-200">{p.bankName}</span> • เลขที่บัญชี <span className="font-mono text-white">{p.bankAccountNo}</span> ({p.accountName})
                            </p>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                            <button
                              onClick={() => handlePayoutAction(p.id, "REJECT")}
                              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition active:scale-95"
                            >
                              ปฏิเสธ
                            </button>
                            <button
                              onClick={() => handlePayoutAction(p.id, "APPROVE")}
                              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-md active:scale-95"
                            >
                              อนุมัติการโอน
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 5: COIN PACKAGES
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "packages" && (
                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white font-prompt">
                        จัดการแพ็กเกจเหรียญร้านค้า ({packagesList.length} รายการ)
                      </h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        การแก้ไขหรือเพิ่มแพ็กเกจจะมีผลต่อหน้าร้านค้าเหรียญ (/coin-shop) ของผู้ใช้ทันที
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingPackage(null);
                        setPkgName("");
                        setPkgCoins(100);
                        setPkgBonus(0);
                        setPkgPrice(100);
                        setPkgBadge("");
                        setPkgPopular(false);
                        setShowPackageModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มแพ็กเกจใหม่</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packagesList.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-5 rounded-3xl border flex flex-col justify-between transition ${
                          pkg.active
                            ? "bg-neutral-900/80 border-neutral-800"
                            : "bg-neutral-950/60 border-neutral-900 opacity-60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white font-prompt">{pkg.name}</span>
                            {pkg.badge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                {pkg.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-1.5 my-2">
                            <Coins className="w-4 h-4 text-amber-400" />
                            <span className="text-2xl font-black text-white font-prompt">
                              {(pkg.coins + pkg.bonusCoins).toLocaleString()}
                            </span>
                            <span className="text-xs text-neutral-400">เหรียญ</span>
                          </div>

                          {pkg.bonusCoins > 0 && (
                            <p className="text-xs text-amber-300">
                              (หลัก {pkg.coins.toLocaleString()} + โบนัส {pkg.bonusCoins.toLocaleString()})
                            </p>
                          )}

                          <p className="text-sm font-semibold text-neutral-300 mt-2">
                            ราคา: ฿{pkg.priceThb.toLocaleString()} บาท
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-800 text-xs">
                          <button
                            onClick={() => {
                              setEditingPackage(pkg);
                              setPkgName(pkg.name);
                              setPkgCoins(pkg.coins);
                              setPkgBonus(pkg.bonusCoins);
                              setPkgPrice(pkg.priceThb);
                              setPkgBadge(pkg.badge || "");
                              setPkgPopular(pkg.isPopular);
                              setShowPackageModal(true);
                            }}
                            className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition text-center"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleTogglePackageActive(pkg)}
                            className={`px-3 py-2 rounded-xl font-medium transition ${
                              pkg.active
                                ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                            }`}
                          >
                            {pkg.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modal: Add/Edit Package */}
                  {showPackageModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-white font-prompt mb-4">
                          {editingPackage ? "แก้ไขแพ็กเกจเหรียญ" : "เพิ่มแพ็กเกจเหรียญใหม่"}
                        </h3>

                        <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
                          <div>
                            <label className="block text-neutral-400 mb-1">ชื่อแพ็กเกจ</label>
                            <input
                              type="text"
                              required
                              value={pkgName}
                              onChange={(e) => setPkgName(e.target.value)}
                              placeholder="เช่น Standard Pack"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-neutral-400 mb-1">เหรียญหลัก</label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={pkgCoins}
                                onChange={(e) => setPkgCoins(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
                              />
                            </div>
                            <div>
                              <label className="block text-neutral-400 mb-1">เหรียญโบนัส</label>
                              <input
                                type="number"
                                min={0}
                                value={pkgBonus}
                                onChange={(e) => setPkgBonus(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-neutral-400 mb-1">ราคา (บาท)</label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={pkgPrice}
                                onChange={(e) => setPkgPrice(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
                              />
                            </div>
                            <div>
                              <label className="block text-neutral-400 mb-1">ป้ายกำกับ (Badge)</label>
                              <input
                                type="text"
                                value={pkgBadge}
                                onChange={(e) => setPkgBadge(e.target.value)}
                                placeholder="เช่น HOT, ยอดนิยม"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="isPopular"
                              checked={pkgPopular}
                              onChange={(e) => setPkgPopular(e.target.checked)}
                              className="rounded bg-neutral-950 border-neutral-800 text-amber-500"
                            />
                            <label htmlFor="isPopular" className="text-neutral-300">
                              ตั้งเป็นแพ็กเกจยอดนิยม (Highlight)
                            </label>
                          </div>

                          <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
                            <button
                              type="button"
                              onClick={() => {
                                setShowPackageModal(false);
                                setEditingPackage(null);
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-semibold"
                            >
                              ยกเลิก
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200"
                            >
                              {editingPackage ? "บันทึกการแก้ไข" : "สร้างแพ็กเกจ"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 6: AUTHOR APPLICATIONS (KYC)
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "applications" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800">
                    <h2 className="text-base sm:text-lg font-bold text-white font-prompt">
                      คิวตรวจสอบใบสมัครนักเขียน (Author Applications)
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      อนุมัติให้ผู้อ่านเปลี่ยนสถานะเป็นนักเขียน (Author) เพื่อเริ่มสร้างและเผยแพร่ผลงาน
                    </p>
                  </div>

                  {applicationsLoading ? (
                    <div className="py-16 text-center text-neutral-400">
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                      กำลังโหลดใบสมัคร...
                    </div>
                  ) : applicationsList.length === 0 ? (
                    <div className="p-16 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-sm">
                      ไม่มีใบสมัครนักเขียนที่รอการตรวจสอบในขณะนี้
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {applicationsList.map((app) => (
                        <div
                          key={app.id}
                          className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs shadow-sm"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-white text-sm">{app.user.name}</span>
                              <span className="text-amber-300 font-semibold">(นามปากกา: {app.user.penName || "ไม่ระบุ"})</span>
                              <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 text-[10px]">
                                {app.user.email}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                                {app.kycStatus}
                              </span>
                            </div>

                            {app.bio && (
                              <p className="text-neutral-300 italic">"{app.bio}"</p>
                            )}

                            <div className="text-[11px] text-neutral-400 space-y-0.5">
                              <p>
                                เลขบัตรประชาชน: <span className="font-mono text-white">{app.idCardNumber || "-"}</span>
                              </p>
                              <p>
                                ข้อมูลรับเงิน: <span className="text-white">{app.bankName}</span> • บัญชี{" "}
                                <span className="font-mono text-white">{app.bankAccountNo}</span> ({app.bankAccountName})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                            <button
                              onClick={() => handleApplicationAction(app.id, "REJECT")}
                              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold transition active:scale-95"
                            >
                              ปฏิเสธ
                            </button>
                            <button
                              onClick={() => handleApplicationAction(app.id, "APPROVE")}
                              className="flex-1 lg:flex-initial px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition shadow-md active:scale-95"
                            >
                              อนุมัติเป็นนักเขียน
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 7: REPORTS MANAGEMENT
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "reports" && ["SUPER_ADMIN", "MODERATOR"].includes(user.role) && (
                <ReportsManagementTab />
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 8: BROADCAST ANNOUNCEMENTS
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "broadcast" && user.role === "SUPER_ADMIN" && (
                <BroadcastTab totalUsers={overview?.metrics.totalUsers} />
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 9: AUDIT LOGS
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === "auditLogs" && user.role === "SUPER_ADMIN" && (
                <AuditLogsTab />
              )}
            </div>
          )}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODALS
          ───────────────────────────────────────────────────────────── */}
      {selectedUser && (
        <UserManagementModal
          user={selectedUser}
          currentAdminRole={user.role}
          onClose={() => setSelectedUser(null)}
          onUserUpdated={(updated) => {
            setSelectedUser(updated);
            setUsersList((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            );
            fetchOverview();
          }}
        />
      )}

      {selectedStoryForModeration && (
        <StoryModerationModal
          story={selectedStoryForModeration}
          currentAdminRole={user.role}
          onClose={() => setSelectedStoryForModeration(null)}
          onStoryUpdated={(updated) => {
            setSelectedStoryForModeration((prev) => (prev ? { ...prev, ...updated } : null));
            setStoriesList((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            );
            fetchOverview();
          }}
          onStoryDeleted={(deletedId) => {
            setSelectedStoryForModeration(null);
            setStoriesList((prev) => prev.filter((item) => item.id !== deletedId));
            fetchOverview();
          }}
        />
      )}
    </div>
  );
}
