"use client";

import React, { useState } from "react";
import {
  X,
  Shield,
  User,
  Mail,
  Calendar,
  Coins,
  Plus,
  Minus,
  Key,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Clock,
  BookOpen,
  ShoppingBag,
  MessageSquare,
  Bookmark,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  penName?: string | null;
  avatar?: string | null;
  role: string;
  status: string;
  ageVerified: boolean;
  birthdate?: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: {
    id: string;
    paidBalance: number;
    freeBalance: number;
    transactions?: Array<{
      id: string;
      type: string;
      amount: number;
      coinType: string;
      balanceAfter: number;
      note?: string | null;
      createdAt: string;
    }>;
  } | null;
  authorProfile?: {
    id: string;
    bio?: string | null;
    kycStatus: string;
    totalEarnings: number;
    pendingPayout: number;
  } | null;
  _count?: {
    stories: number;
    purchases: number;
    comments: number;
    bookmarks: number;
  };
}

interface UserManagementModalProps {
  user: AdminUserDetail;
  currentAdminRole: string;
  onClose: () => void;
  onUserUpdated: (updatedUser: AdminUserDetail) => void;
}

export function UserManagementModal({
  user,
  currentAdminRole,
  onClose,
  onUserUpdated,
}: UserManagementModalProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<AdminUserDetail>(user);
  const [activeTab, setActiveTab] = useState<"overview" | "coins" | "edit" | "password" | "danger">("overview");

  // Edit form state
  const [name, setName] = useState(currentUser.name);
  const [penName, setPenName] = useState(currentUser.penName || "");
  const [email, setEmail] = useState(currentUser.email);
  const [role, setRole] = useState(currentUser.role);
  const [status, setStatus] = useState(currentUser.status);
  const [savingEdit, setSavingEdit] = useState(false);

  // Coin Adjustment state
  const [coinAction, setCoinAction] = useState<"ADD" | "DEDUCT">("ADD");
  const [coinType, setCoinType] = useState<"PAID" | "FREE">("PAID");
  const [coinAmount, setCoinAmount] = useState<number>(100);
  const [coinNote, setCoinNote] = useState<string>("");
  const [savingCoins, setSavingCoins] = useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Copy ID feedback
  const [copiedId, setCopiedId] = useState(false);

  // Helper copy ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(currentUser.id);
    setCopiedId(true);
    toast.success("คัดลอกรหัสผู้ใช้แล้ว", currentUser.id);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Generate random safe password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  // 1. Submit Edit Info & Roles
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name,
          penName: penName.trim() || null,
          email,
          role,
          status,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.user) {
        toast.success("บันทึกข้อมูลสำเร็จ", `อัปเดตข้อมูลของ ${name} เรียบร้อยแล้ว`);
        setCurrentUser(json.data.user);
        onUserUpdated(json.data.user);
        setActiveTab("overview");
      } else {
        toast.error("บันทึกไม่สำเร็จ", json.error?.message || "กรุณาตรวจสอบข้อมูล");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSavingEdit(false);
    }
  };

  // 2. Submit Coin Adjustment
  const handleSaveCoinAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coinAmount <= 0) {
      toast.warning("จำนวนเหรียญไม่ถูกต้อง", "กรุณาระบุจำนวนเหรียญมากกว่า 0");
      return;
    }

    setSavingCoins(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          coinAdjustment: {
            amount: coinAmount,
            action: coinAction,
            coinType,
            note: coinNote.trim() || (coinAction === "ADD" ? "แอดมินเติมเหรียญให้" : "แอดมินหักเหรียญ"),
          },
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.user) {
        const actionText = coinAction === "ADD" ? `เติมเหรียญ +${coinAmount}` : `หักเหรียญ -${coinAmount}`;
        toast.success("ปรับปรุงเหรียญสำเร็จ", `${actionText} (${coinType === "PAID" ? "เหรียญซื้อ" : "เหรียญฟรี"})`);
        setCurrentUser(json.data.user);
        onUserUpdated(json.data.user);
        setCoinAmount(100);
        setCoinNote("");
        setActiveTab("overview");
      } else {
        toast.error("ปรับปรุงเหรียญไม่สำเร็จ", json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSavingCoins(false);
    }
  };

  // 3. Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.warning("รหัสผ่านสั้นเกินไป", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          newPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("รีเซ็ตรหัสผ่านสำเร็จ", `รหัสผ่านใหม่ของ ${currentUser.name} ถูกตั้งค่าเรียบร้อยแล้ว`);
        setNewPassword("");
        setActiveTab("overview");
      } else {
        toast.error("รีเซ็ตรหัสผ่านไม่สำเร็จ", json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSavingPassword(false);
    }
  };

  // 4. Soft Delete User
  const handleDeleteUser = async () => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการระงับและลบบัญชีของ "${currentUser.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/users?userId=${currentUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ลบบัญชีสำเร็จ", `บัญชีของ ${currentUser.name} ถูกระงับและตั้งค่าเป็นลบแล้ว`);
        onUserUpdated({ ...currentUser, status: "DELETED" });
        onClose();
      } else {
        toast.error("ลบบัญชีไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  const paidCoins = currentUser.wallet?.paidBalance || 0;
  const freeCoins = currentUser.wallet?.freeBalance || 0;
  const totalCoins = paidCoins + freeCoins;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header with Profile Card */}
        <div className="relative p-6 pb-4 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/20">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg bg-neutral-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-purple-600/30 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl shadow-lg">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-neutral-900 ${
                  currentUser.status === "ACTIVE"
                    ? "bg-emerald-500"
                    : currentUser.status === "SUSPENDED"
                    ? "bg-rose-500"
                    : "bg-neutral-500"
                }`}
                title={`Status: ${currentUser.status}`}
              />
            </div>

            {/* User Title & Badges */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white font-prompt truncate">
                  {currentUser.name}
                </h2>
                {currentUser.penName && (
                  <span className="text-xs text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-lg border border-neutral-700">
                    นามปากกา: {currentUser.penName}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    currentUser.role === "SUPER_ADMIN"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : currentUser.role === "AUTHOR"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : currentUser.role === "FINANCE_ADMIN"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : currentUser.role === "MODERATOR"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                  }`}
                >
                  {currentUser.role}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentUser.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {currentUser.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  {currentUser.email}
                </span>
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1 text-neutral-400 hover:text-amber-400 font-mono transition"
                  title="คลิกเพื่อคัดลอก User ID"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  ID: {currentUser.id.slice(0, 10)}...
                </button>
                <span className="flex items-center gap-1 text-neutral-500">
                  <Calendar className="w-3.5 h-3.5" />
                  สมัครเมื่อ: {new Date(currentUser.createdAt).toLocaleDateString("th-TH")}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                activeTab === "overview"
                  ? "bg-amber-400 text-black font-bold shadow"
                  : "bg-neutral-800/80 text-neutral-400 hover:text-white"
              }`}
            >
              ภาพรวม & เหรียญ
            </button>
            <button
              onClick={() => setActiveTab("coins")}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${
                activeTab === "coins"
                  ? "bg-amber-400 text-black font-bold shadow"
                  : "bg-neutral-800/80 text-neutral-400 hover:text-white"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              จัดการเหรียญ (เติม/หัก)
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${
                activeTab === "edit"
                  ? "bg-amber-400 text-black font-bold shadow"
                  : "bg-neutral-800/80 text-neutral-400 hover:text-white"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              แก้ไขข้อมูล & สิทธิ์
            </button>
            {currentAdminRole === "SUPER_ADMIN" && (
              <button
                onClick={() => setActiveTab("password")}
                className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${
                  activeTab === "password"
                    ? "bg-amber-400 text-black font-bold shadow"
                    : "bg-neutral-800/80 text-neutral-400 hover:text-white"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                รีเซ็ตรหัสผ่าน
              </button>
            )}
            {currentAdminRole === "SUPER_ADMIN" && (
              <button
                onClick={() => setActiveTab("danger")}
                className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ml-auto ${
                  activeTab === "danger"
                    ? "bg-rose-500 text-white font-bold"
                    : "text-rose-400 hover:bg-rose-500/10"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบบัญชี
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Coin Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    สถานะกระเป๋าเหรียญ (Coin Wallet)
                  </h3>
                  <button
                    onClick={() => setActiveTab("coins")}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เติม/หักเหรียญ
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total Coins */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30">
                    <p className="text-[11px] text-amber-300 font-medium">เหรียญรวมทั้งหมด</p>
                    <p className="text-2xl font-black text-amber-400 font-prompt mt-1">
                      {totalCoins.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-amber-200/80">เหรียญ</span>
                    </p>
                  </div>

                  {/* Paid Coins */}
                  <div className="p-4 rounded-2xl bg-neutral-800/50 border border-neutral-700/60">
                    <p className="text-[11px] text-neutral-400 font-medium">เหรียญที่ซื้อ (Paid Coins)</p>
                    <p className="text-xl font-bold text-white font-prompt mt-1">
                      {paidCoins.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-neutral-400">เหรียญ</span>
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1">ไม่มีวันหมดอายุ</p>
                  </div>

                  {/* Free Coins */}
                  <div className="p-4 rounded-2xl bg-neutral-800/50 border border-neutral-700/60">
                    <p className="text-[11px] text-neutral-400 font-medium">เหรียญฟรี / กิจกรรม</p>
                    <p className="text-xl font-bold text-emerald-400 font-prompt mt-1">
                      {freeCoins.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-neutral-400">เหรียญ</span>
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1">มีวันหมดอายุตามรอบ</p>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  สถิติกิจกรรมบนแพลตฟอร์ม
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-800">
                    <BookOpen className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white font-prompt">
                      {currentUser._count?.stories || 0}
                    </p>
                    <p className="text-[11px] text-neutral-400">เรื่องที่แต่ง</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-800">
                    <ShoppingBag className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white font-prompt">
                      {currentUser._count?.purchases || 0}
                    </p>
                    <p className="text-[11px] text-neutral-400">ตอนที่ปลดล็อก</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-800">
                    <MessageSquare className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white font-prompt">
                      {currentUser._count?.comments || 0}
                    </p>
                    <p className="text-[11px] text-neutral-400">คอมเมนต์</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-800">
                    <Bookmark className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white font-prompt">
                      {currentUser._count?.bookmarks || 0}
                    </p>
                    <p className="text-[11px] text-neutral-400">เข้าชั้นหนังสือ</p>
                  </div>
                </div>
              </div>

              {/* Author Profile Details if Author */}
              {currentUser.authorProfile && (
                <div className="p-4 rounded-2xl bg-neutral-800/40 border border-neutral-800 text-xs space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    ข้อมูลนักเขียน (Author Profile)
                  </h4>
                  {currentUser.authorProfile.bio && (
                    <p className="text-neutral-300 italic">&ldquo;{currentUser.authorProfile.bio}&rdquo;</p>
                  )}
                  <div className="flex flex-wrap gap-4 pt-1 text-neutral-400">
                    <span>
                      สถานะ KYC:{" "}
                      <strong className="text-emerald-400">
                        {currentUser.authorProfile.kycStatus}
                      </strong>
                    </span>
                    <span>
                      รายได้สะสม:{" "}
                      <strong className="text-white">
                        ฿{currentUser.authorProfile.totalEarnings.toLocaleString()}
                      </strong>
                    </span>
                    <span>
                      รอถอน:{" "}
                      <strong className="text-amber-400">
                        ฿{currentUser.authorProfile.pendingPayout.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Recent Coin Transactions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  ประวัติการทำรายการเหรียญล่าสุด (Transaction History)
                </h3>

                {(!currentUser.wallet?.transactions || currentUser.wallet.transactions.length === 0) ? (
                  <p className="p-6 text-center text-xs text-neutral-500 bg-neutral-800/30 rounded-2xl border border-neutral-800">
                    ยังไม่มีประวัติการทำรายการเหรียญ
                  </p>
                ) : (
                  <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900/60 divide-y divide-neutral-800/80 text-xs">
                    {currentUser.wallet.transactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <div key={tx.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">
                              {tx.note || tx.type}
                            </p>
                            <p className="text-[11px] text-neutral-500">
                              {new Date(tx.createdAt).toLocaleString("th-TH")} • คงเหลือ:{" "}
                              {tx.balanceAfter.toLocaleString()} เหรียญ
                            </p>
                          </div>
                          <span
                            className={`font-mono font-bold shrink-0 ${
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} เหรียญ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COIN ADJUSTMENT (ADD / DEDUCT) */}
          {activeTab === "coins" && (
            <form onSubmit={handleSaveCoinAdjustment} className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  ระบบปรับปรุงยอดเหรียญผู้ใช้งานโดยตรง (Admin Coin Adjustment)
                </p>
                <p className="text-neutral-400">
                  เหรียญที่ปรับปรุงจะมีผลต่อกระเป๋าเงินของผู้ใช้ทันที และระบบจะบันทึกประวัติลงใน CoinTransaction พร้อม Audit Log ของผู้ดูแลระบบ
                </p>
              </div>

              {/* Action Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  การดำเนินการ
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCoinAction("ADD")}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      coinAction === "ADD"
                        ? "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    เติมเหรียญให้ผู้ใช้ (+)
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoinAction("DEDUCT")}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      coinAction === "DEDUCT"
                        ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    หักเหรียญจากผู้ใช้ (-)
                  </button>
                </div>
              </div>

              {/* Coin Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  ประเภทกระเป๋าเหรียญ
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCoinType("PAID")}
                    className={`p-3 rounded-2xl border text-left text-xs transition ${
                      coinType === "PAID"
                        ? "bg-amber-400/15 border-amber-400 text-amber-300"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400"
                    }`}
                  >
                    <p className="font-bold">เหรียญซื้อ (Paid Balance)</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">ยอดปัจจุบัน: {paidCoins} เหรียญ</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoinType("FREE")}
                    className={`p-3 rounded-2xl border text-left text-xs transition ${
                      coinType === "FREE"
                        ? "bg-emerald-400/15 border-emerald-400 text-emerald-300"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400"
                    }`}
                  >
                    <p className="font-bold">เหรียญฟรี (Free Balance)</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">ยอดปัจจุบัน: {freeCoins} เหรียญ</p>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  จำนวนเหรียญ
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    required
                    className="flex-1 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400"
                  />
                  {[100, 500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCoinAmount(preset)}
                      className="px-3 py-2 bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-300 rounded-xl text-xs font-semibold"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  เหตุผล / หมายเหตุช่วยจำ (Note)
                </label>
                <input
                  type="text"
                  value={coinNote}
                  onChange={(e) => setCoinNote(e.target.value)}
                  placeholder="เช่น รางวัลกิจกรรม, ชดเชยระบบขัดข้อง, คืนเหรียญ..."
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={savingCoins}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 ${
                  coinAction === "ADD"
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "bg-rose-500 text-white hover:bg-rose-400"
                } disabled:opacity-50`}
              >
                {savingCoins && <RefreshCw className="w-4 h-4 animate-spin" />}
                ยืนยัน{coinAction === "ADD" ? "เติมเหรียญ" : "หักเหรียญ"} {coinAmount.toLocaleString()} เหรียญ
              </button>
            </form>
          )}

          {/* TAB 3: EDIT PROFILE & ROLES */}
          {activeTab === "edit" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">ชื่อแสดง (Name)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">นามปากกา (Pen Name)</label>
                <input
                  type="text"
                  value={penName}
                  onChange={(e) => setPenName(e.target.value)}
                  placeholder="เว้นว่างได้หากไม่มี"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">อีเมล (Email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    บทบาท / สิทธิ์ (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={currentAdminRole !== "SUPER_ADMIN"}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs disabled:opacity-60"
                  >
                    <option value="READER">ผู้อ่านทั่วไป (READER)</option>
                    <option value="AUTHOR">นักเขียน (AUTHOR)</option>
                    <option value="MODERATOR">ทีมตรวจสอบเนื้อหา (MODERATOR)</option>
                    <option value="FINANCE_ADMIN">ฝ่ายการเงิน (FINANCE_ADMIN)</option>
                    <option value="SUPER_ADMIN">ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    สถานะบัญชี (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs"
                  >
                    <option value="ACTIVE">ACTIVE (ใช้งานได้ปกติ)</option>
                    <option value="SUSPENDED">SUSPENDED (ถูกระงับชั่วคราว)</option>
                    <option value="DEACTIVATED">DEACTIVATED (ปิดใช้งาน)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full py-3 rounded-2xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingEdit && <RefreshCw className="w-4 h-4 animate-spin" />}
                  บันทึกการเปลี่ยนแปลงข้อมูล
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: RESET PASSWORD */}
          {activeTab === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  กำหนดรหัสผ่านใหม่โดยตรง (Admin Password Reset)
                </p>
                <p className="text-neutral-400">
                  รหัสผ่านจะถูกเข้ารหัสผ่านอัลกอริทึม Bcrypt เพื่อความปลอดภัยทันที ผู้ใช้จะสามารถใช้รหัสผ่านนี้ล็อกอินได้ทันที
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300">รหัสผ่านใหม่</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    สุ่มรหัสผ่านอัตโนมัติ
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-400"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword || newPassword.length < 6}
                className="w-full py-3 rounded-2xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingPassword && <RefreshCw className="w-4 h-4 animate-spin" />}
                บันทึกรหัสผ่านใหม่
              </button>
            </form>
          )}

          {/* TAB 5: DANGER ZONE */}
          {activeTab === "danger" && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-prompt">ระงับและลบบัญชีผู้ใช้งาน</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                  การกระทำนี้จะเปลี่ยนสถานะบัญชีของ {currentUser.name} เป็น DELETED และระงับสิทธิ์การเข้าใช้งานทั้งหมดทันที
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition shadow-lg"
              >
                ยืนยันการลบบัญชีผู้ใช้นี้
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
