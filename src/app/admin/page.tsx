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
  Sparkles,
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  Clock,
  Bug,
} from "lucide-react";
import { UserManagementModal, AdminUserDetail } from "@/components/admin/UserManagementModal";

export interface SupportTicketItem {
  id: string;
  userId: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  description: string;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  };
}

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

interface StoryItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  category: string;
  coverUrl: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    penName?: string;
    email: string;
  };
  _count: {
    chapters: number;
    comments: number;
  };
}

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

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "content" | "payouts" | "packages" | "applications" | "tickets">("overview");
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Support Tickets state
  const [ticketsList, setTicketsList] = useState<SupportTicketItem[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("ALL");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [ticketAdminNotes, setTicketAdminNotes] = useState("");
  const [updatingTicketStatus, setUpdatingTicketStatus] = useState(false);

  // Applications state (Section E)
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

  // Fetch Users (C.1 Checklist)
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

  // Fetch Content Moderation (C.2 Checklist)
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

  // Fetch Coin Packages (C.3 Checklist)
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

  useEffect(() => {
    if (user && ["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(user.role)) {
      fetchOverview();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch Author Applications (Section E)
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

  // Fetch Support Tickets
  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const params = new URLSearchParams();
      if (ticketStatusFilter !== "ALL") params.set("status", ticketStatusFilter);
      if (ticketCategoryFilter !== "ALL") params.set("category", ticketCategoryFilter);

      const res = await fetch(`/api/v1/support-tickets?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTicketsList(json.data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleUpdateTicket = async (id: string, newStatus: string) => {
    setUpdatingTicketStatus(true);
    try {
      const res = await fetch(`/api/v1/support-tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: ticketAdminNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("อัปเดตสถานะปัญหาเรียบร้อยแล้ว");
        setSelectedTicket(null);
        fetchTickets();
      } else {
        toast.error("ไม่สามารถอัปเดตสถานะได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setUpdatingTicketStatus(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "content") fetchContent();
    if (activeTab === "packages") fetchPackages();
    if (activeTab === "applications") fetchApplications();
    if (activeTab === "tickets") fetchTickets();
  }, [activeTab, contentFilter, userRoleFilter, userStatusFilter, ticketStatusFilter, ticketCategoryFilter]);

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

  // C.1 Toggle User Status (Suspend/Activate)
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

  // C.2 Content Moderation Action (Approve/Reject)
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

  // C.3 Payout Approval Action
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

  // C.3 Coin Package Save / Edit
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <Shield className="w-16 h-16 text-neutral-600 mb-4" />
        <h1 className="text-2xl font-bold text-white font-prompt mb-2">แผงควบคุมระบบ (Admin Panel)</h1>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">
          หน้านี้สำหรับทีมงานและผู้ดูแลระบบเท่านั้น กรุณาสลับบทบาทเป็น Super Admin, Moderator หรือ Finance Admin จากแถบ DEMO ด้านบนเพื่อเข้าถึง
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Platform Governance & Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-prompt">
            แผงควบคุมระบบ ({user.role})
          </h1>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === "overview" ? "bg-white text-black font-bold shadow-sm" : "text-neutral-400 hover:text-white"
            }`}
          >
            ภาพรวม
          </button>

          {["SUPER_ADMIN", "MODERATOR"].includes(user.role) && (
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "users" ? "bg-white text-black font-bold shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              จัดการผู้ใช้ (C.1)
            </button>
          )}

          {["SUPER_ADMIN", "MODERATOR"].includes(user.role) && (
            <button
              onClick={() => setActiveTab("content")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "content" ? "bg-white text-black font-bold shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              ตรวจเนื้อหา (C.2)
            </button>
          )}

          {["SUPER_ADMIN", "FINANCE_ADMIN"].includes(user.role) && (
            <button
              onClick={() => setActiveTab("payouts")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "payouts" ? "bg-white text-black font-bold shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              อนุมัติถอนเงิน ({overview?.metrics.pendingPayoutsCount || 0})
            </button>
          )}

          {["SUPER_ADMIN", "MODERATOR"].includes(user.role) && (
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "applications" ? "bg-white text-black font-bold shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              ใบสมัครนักเขียน ({applicationsList.length})
            </button>
          )}

          {["SUPER_ADMIN", "FINANCE_ADMIN"].includes(user.role) && (
            <button
              onClick={() => setActiveTab("packages")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "packages" ? "bg-white text-black font-bold shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              แพ็กเกจเหรียญ (C.3)
            </button>
          )}

          {["SUPER_ADMIN", "MODERATOR"].includes(user.role) && (
            <button
              onClick={() => setActiveTab("tickets")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "tickets" ? "bg-white text-black font-bold shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              ปัญหาที่แจ้ง ({ticketsList.filter((t) => t.status === "OPEN").length})
            </button>
          )}
        </div>
      </div>

      {loading || !overview ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="my-8 space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800">
                  <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>ผู้ใช้งานทั้งหมด</span>
                  </div>
                  <p className="text-2xl font-black text-white font-prompt">{overview.metrics.totalUsers} บัญชี</p>
                </div>

                <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800">
                  <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>ผลงานนิยาย/มังงะ</span>
                  </div>
                  <p className="text-2xl font-black text-white font-prompt">{overview.metrics.totalStories} เรื่อง</p>
                </div>

                <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800">
                  <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>รายได้การซื้อเหรียญ</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-400 font-prompt">฿{overview.metrics.totalRevenueThb.toLocaleString()}</p>
                </div>

                <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800">
                  <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span>คำขอถอนเงินรอตรวจ</span>
                  </div>
                  <p className="text-2xl font-black text-amber-300 font-prompt">{overview.metrics.pendingPayoutsCount} รายการ</p>
                </div>
              </div>

              {/* Recent Reports Queue */}
              <div>
                <h3 className="text-lg font-bold text-white font-prompt mb-4">รายงานเนื้อหาล่าสุด (Content Reports)</h3>
                <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900/60 divide-y divide-neutral-800 text-xs">
                  {overview.recentReports.length === 0 ? (
                    <p className="p-6 text-center text-neutral-500">ไม่มีรายงานเนื้อหาที่ค้างอยู่</p>
                  ) : (
                    overview.recentReports.map((rep) => (
                      <div key={rep.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{rep.reason}</p>
                          <p className="text-neutral-500 text-[11px]">ผู้รายงาน: {rep.reporter.name} • ประเภท: {rep.targetType}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {rep.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT (C.1 Checklist) */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search box */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") fetchUsers(); }}
                    placeholder="ค้นหาชื่อ, นามปากกา, อีเมล..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
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
                    className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                  >
                    <option value="ALL">ทุกสถานะ (Status)</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>

                  <button
                    onClick={fetchUsers}
                    className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200"
                  >
                    ค้นหา
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900/60 divide-y divide-neutral-800 text-xs">
                {usersLoading ? (
                  <div className="py-12 text-center text-neutral-500">กำลังค้นหาข้อมูลผู้ใช้...</div>
                ) : usersList.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500">ไม่พบผู้ใช้ตามเงื่อนไขที่ค้นหา</div>
                ) : (
                  usersList.map((u) => {
                    const paidCoins = u.wallet?.paidBalance || 0;
                    const freeCoins = u.wallet?.freeBalance || 0;
                    const totalCoins = paidCoins + freeCoins;

                    return (
                      <div
                        key={u.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-800/30 transition"
                      >
                        {/* User Basic Info */}
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          {/* Avatar */}
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-11 h-11 rounded-xl object-cover bg-neutral-800 border border-neutral-700 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-neutral-700 flex items-center justify-center text-amber-300 font-bold text-base shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-white text-sm truncate">{u.name}</span>
                              {u.penName && (
                                <span className="text-neutral-400 text-xs">({u.penName})</span>
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

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-400 text-xs mt-1">
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

                        {/* Right: Coins Balance & Actions */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800/80">
                          {/* Coin badge */}
                          <div className="text-left md:text-right">
                            <div className="flex items-center md:justify-end gap-1.5 font-prompt">
                              <Coins className="w-3.5 h-3.5 text-amber-400" />
                              <span className="font-bold text-amber-400 text-sm">
                                {totalCoins.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-neutral-400">เหรียญ</span>
                            </div>
                            <p className="text-[10px] text-neutral-500">
                              (ซื้อ: {paidCoins.toLocaleString()} | ฟรี: {freeCoins.toLocaleString()})
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition shadow flex items-center gap-1"
                              title="ตรวจสอบโปรไฟล์และจัดการผู้ใช้"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>จัดการ</span>
                            </button>

                            {user.role === "SUPER_ADMIN" && (
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.status)}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
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

          {/* TAB 3: CONTENT MODERATION (C.2 Checklist) */}
          {activeTab === "content" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-neutral-400" />
                  <h3 className="text-lg font-bold text-white font-prompt">
                    คิวตรวจสอบและอนุมัติผลงาน ({storiesList.length} เรื่อง)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">กรองสถานะ:</span>
                  <select
                    value={contentFilter}
                    onChange={(e) => setContentFilter(e.target.value)}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                  >
                    <option value="ALL">ทั้งหมด</option>
                    <option value="PENDING_REVIEW">รอการอนุมัติ (PENDING_REVIEW)</option>
                    <option value="PUBLISHED">เผยแพร่แล้ว (PUBLISHED)</option>
                    <option value="SUSPENDED">ถูกระงับ (SUSPENDED)</option>
                    <option value="DRAFT">ร่าง (DRAFT)</option>
                  </select>
                </div>
              </div>

              {contentLoading ? (
                <div className="py-12 text-center text-neutral-500">กำลังโหลดเนื้อหา...</div>
              ) : storiesList.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-sm">
                  ไม่มีเนื้อหาที่ตรงกับเงื่อนไขการค้นหา
                </div>
              ) : (
                <div className="space-y-3">
                  {storiesList.map((story) => (
                    <div
                      key={story.id}
                      className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={story.coverUrl}
                          alt={story.title}
                          className="w-12 aspect-[2/3] object-cover rounded-lg bg-neutral-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                              {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                            </span>
                            <span className="font-bold text-white text-sm font-prompt">{story.title}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded ${
                                story.status === "PUBLISHED"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : story.status === "PENDING_REVIEW"
                                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                  : "bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {story.status}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            นักเขียน: {story.author.penName || story.author.name} ({story.author.email}) • {story._count.chapters} ตอน
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {story.status !== "PUBLISHED" && (
                          <button
                            onClick={() => handleContentAction(story.id, "PUBLISHED")}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm"
                          >
                            อนุมัติเผยแพร่
                          </button>
                        )}
                        {story.status !== "SUSPENDED" && (
                          <button
                            onClick={() => handleContentAction(story.id, "SUSPENDED")}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
                          >
                            ระงับเนื้อหา
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYOUTS (C.3 Checklist) */}
          {activeTab === "payouts" && (
            <div>
              <h3 className="text-lg font-bold text-white font-prompt mb-4">
                คำขอถอนเงินรออนุมัติ ({overview.pendingPayouts.length} รายการ)
              </h3>
              {overview.pendingPayouts.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-sm">
                  ไม่มีคำขอถอนเงินที่รอการอนุมัติในขณะนี้
                </div>
              ) : (
                <div className="space-y-4">
                  {overview.pendingPayouts.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">฿{p.amountThb.toLocaleString()} บาท</span>
                          <span className="text-xs text-neutral-400">(สุทธิ ฿{p.netAmountThb} บาท)</span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1">
                          นักเขียน: {p.author.user.penName || p.author.user.name} ({p.author.user.email})
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          โอนเข้า: {p.bankName} • บัญชี {p.bankAccountNo} ({p.accountName})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePayoutAction(p.id, "REJECT")}
                          className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
                        >
                          ปฏิเสธ
                        </button>
                        <button
                          onClick={() => handlePayoutAction(p.id, "APPROVE")}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-md"
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

          {/* TAB 5: COIN PACKAGES (C.3 Checklist) */}
          {activeTab === "packages" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white font-prompt">
                    จัดการแพ็กเกจเหรียญร้านค้า ({packagesList.length} รายการ)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    การแก้ไขหรือเพิ่มแพ็กเกจที่นี่จะมีผลต่อหน้าร้านค้าเหรียญ (/coin-shop) ของผู้อ่านทันที
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition shadow-sm"
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
                        ? "bg-neutral-900 border-neutral-800"
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
                          (หลัก {pkg.coins} + โบนัส {pkg.bonusCoins})
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
                        className="flex-1 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition text-center"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleTogglePackageActive(pkg)}
                        className={`px-3 py-1.5 rounded-xl font-medium transition ${
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
                          className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
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
                            className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-400 mb-1">เหรียญโบนัส</label>
                          <input
                            type="number"
                            min={0}
                            value={pkgBonus}
                            onChange={(e) => setPkgBonus(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
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
                            className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-400 mb-1">ป้ายกำกับ (Badge)</label>
                          <input
                            type="text"
                            value={pkgBadge}
                            onChange={(e) => setPkgBadge(e.target.value)}
                            placeholder="เช่น HOT, ยอดนิยม"
                            className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/30"
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

          {/* TAB 6: AUTHOR APPLICATIONS (Section E Checklist) */}
          {activeTab === "applications" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white font-prompt">
                    คิวตรวจสอบใบสมัครนักเขียน (Author Applications)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    อนุมัติให้ผู้อ่านเปลี่ยนสถานะเป็นนักเขียน (Author) เพื่อเริ่มสร้างและเผยแพร่ผลงาน
                  </p>
                </div>
              </div>

              {applicationsLoading ? (
                <div className="py-12 text-center text-neutral-500">กำลังโหลดใบสมัคร...</div>
              ) : applicationsList.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-sm">
                  ไม่มีใบสมัครนักเขียนที่รอการตรวจสอบในขณะนี้
                </div>
              ) : (
                <div className="space-y-4">
                  {applicationsList.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{app.user.name}</span>
                          <span className="text-amber-300 font-semibold">(นามปากกา: {app.user.penName || "ไม่ระบุ"})</span>
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px]">
                            {app.user.email}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
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

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApplicationAction(app.id, "REJECT")}
                          className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold transition"
                        >
                          ปฏิเสธ
                        </button>
                        <button
                          onClick={() => handleApplicationAction(app.id, "APPROVE")}
                          className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition shadow-md"
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

          {/* TAB 7: SUPPORT TICKETS & ISSUES */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              {/* Ticket Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <span className="text-xs text-neutral-400 block mb-1">ปัญหาทั้งหมดที่แจ้ง</span>
                  <p className="text-2xl font-bold text-white font-prompt">{ticketsList.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/20">
                  <span className="text-xs text-amber-400 block mb-1">รอดำเนินการ (Open)</span>
                  <p className="text-2xl font-bold text-amber-400 font-prompt">
                    {ticketsList.filter((t) => t.status === "OPEN").length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-900 border border-purple-500/20">
                  <span className="text-xs text-purple-400 block mb-1">กำลังตรวจสอบ (In Progress)</span>
                  <p className="text-2xl font-bold text-purple-400 font-prompt">
                    {ticketsList.filter((t) => t.status === "IN_PROGRESS").length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-900 border border-emerald-500/20">
                  <span className="text-xs text-emerald-400 block mb-1">แก้ไขแล้ว (Resolved)</span>
                  <p className="text-2xl font-bold text-emerald-400 font-prompt">
                    {ticketsList.filter((t) => t.status === "RESOLVED").length}
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 mr-1">สถานะ:</span>
                  {[
                    { id: "ALL", label: "ทั้งหมด" },
                    { id: "OPEN", label: "รอดำเนินการ" },
                    { id: "IN_PROGRESS", label: "กำลังตรวจ" },
                    { id: "RESOLVED", label: "แก้ไขแล้ว" },
                    { id: "CLOSED", label: "ปิดเรื่อง" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setTicketStatusFilter(s.id)}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        ticketStatusFilter === s.id
                          ? "bg-white text-black font-bold"
                          : "bg-white/[0.04] text-neutral-400 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 mr-1">หมวด:</span>
                  {[
                    { id: "ALL", label: "ทั้งหมด" },
                    { id: "BUG", label: "บั๊ก" },
                    { id: "COIN", label: "เหรียญ" },
                    { id: "CONTENT", label: "เนื้อหา" },
                    { id: "ACCOUNT", label: "บัญชี" },
                    { id: "OTHER", label: "อื่นๆ" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setTicketCategoryFilter(c.id)}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        ticketCategoryFilter === c.id
                          ? "bg-[var(--accent)] text-black font-bold"
                          : "bg-white/[0.04] text-neutral-400 hover:text-white"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket List */}
              {ticketsLoading ? (
                <div className="py-16 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
                </div>
              ) : ticketsList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-sm">
                  ไม่มีรายการแจ้งปัญหาในเงื่อนไขที่เลือก
                </div>
              ) : (
                <div className="space-y-3">
                  {ticketsList.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setTicketAdminNotes(ticket.adminNotes || "");
                      }}
                      className="p-4 sm:p-5 rounded-2xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ticket.status === "OPEN"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : ticket.status === "IN_PROGRESS"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : ticket.status === "RESOLVED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-neutral-800 text-neutral-400"
                            }`}
                          >
                            {ticket.status}
                          </span>

                          {/* Category Badge */}
                          <span className="px-2 py-0.5 rounded bg-white/[0.05] text-neutral-300 text-[10px]">
                            {ticket.category}
                          </span>

                          {/* Priority */}
                          {ticket.priority === "URGENT" && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold text-[10px]">
                              ด่วนมาก (วิกฤต)
                            </span>
                          )}

                          <span className="text-neutral-500 text-[11px]">
                            {new Date(ticket.createdAt).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition truncate">
                          {ticket.title}
                        </h3>

                        {/* Description Preview */}
                        <p className="text-neutral-400 line-clamp-1 text-[11px]">
                          {ticket.description}
                        </p>

                        {/* User info */}
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500">
                          <span>ผู้แจ้ง:</span>
                          <span className="text-neutral-300 font-medium">{ticket.user?.name || "ไม่ระบุ"}</span>
                          <span>({ticket.user?.email || "-"})</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-white/5 group-hover:bg-white text-neutral-300 group-hover:text-black font-semibold transition text-xs">
                          ดูรายละเอียด
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ticket Detail & Management Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="w-full max-w-xl rounded-2xl bg-[#111114] border border-neutral-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedTicket.status === "OPEN"
                        ? "bg-amber-500/15 text-amber-400"
                        : selectedTicket.status === "IN_PROGRESS"
                        ? "bg-purple-500/15 text-purple-400"
                        : selectedTicket.status === "RESOLVED"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                  <span className="text-xs text-neutral-400">หมวดหมู่: {selectedTicket.category}</span>
                  <span className="text-xs text-neutral-400">ระดับ: {selectedTicket.priority}</span>
                </div>
                <h2 className="text-lg font-bold text-white font-prompt">{selectedTicket.title}</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  ผู้แจ้ง: {selectedTicket.user?.name} ({selectedTicket.user?.email}) • บทบาท: {selectedTicket.user?.role}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Description Body */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] text-neutral-400 block mb-1">รายละเอียดปัญหาที่แจ้ง:</span>
              <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                บันทึกการแก้ไข / หมายเหตุจากทีมงาน (Admin Notes)
              </label>
              <textarea
                value={ticketAdminNotes}
                onChange={(e) => setTicketAdminNotes(e.target.value)}
                rows={3}
                placeholder="ระบุข้อความบันทึก เช่น ได้ตรวจสอบและแก้ไขบั๊กภาพไม่โหลดแล้ว หรืออยู่ระหว่างรอผู้ใช้ตอบกลับ..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition resize-none"
              />
            </div>

            {/* Status Change Buttons */}
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <span className="text-xs text-neutral-400 block">เปลี่ยนสถานะปัญหา:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={updatingTicketStatus}
                  onClick={() => handleUpdateTicket(selectedTicket.id, "IN_PROGRESS")}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold transition"
                >
                  กำลังตรวจสอบ (In Progress)
                </button>
                <button
                  disabled={updatingTicketStatus}
                  onClick={() => handleUpdateTicket(selectedTicket.id, "RESOLVED")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm"
                >
                  แก้ไขแล้ว (Resolved)
                </button>
                <button
                  disabled={updatingTicketStatus}
                  onClick={() => handleUpdateTicket(selectedTicket.id, "CLOSED")}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 text-xs transition"
                >
                  ปิดเรื่อง (Closed)
                </button>
                <button
                  disabled={updatingTicketStatus}
                  onClick={() => handleUpdateTicket(selectedTicket.id, "OPEN")}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs transition"
                >
                  รอดำเนินการ (Open)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management & Profile Inspection Modal */}
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
    </div>
  );
}
