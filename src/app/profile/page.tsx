"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Shield,
  Laptop,
  LogOut,
  Download,
  CheckCircle2,
  Trash2,
  Lock,
  Edit3,
  Feather,
  AlertCircle,
  Save,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface SessionItem {
  id: string;
  deviceName: string;
  ipAddress?: string;
  lastActive: string;
}

interface ApplicationStatus {
  hasApplied: boolean;
  kycStatus?: string;
  bankName?: string;
  penName?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Profile Edit State
  const [name, setName] = useState("");
  const [penName, setPenName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  // Author Application Status State
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePass, setDeletePass] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPenName(user.penName || "");
      setAvatar(user.avatar || "");
      setBio(user.authorProfile?.bio || "");
      fetchSessions();
      fetchAppStatus();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/v1/users/sessions");
      const json = await res.json();
      if (json.success) setSessions(json.data);
    } catch {}
    finally {
      setLoadingSessions(false);
    }
  };

  const fetchAppStatus = async () => {
    try {
      const res = await fetch("/api/v1/author/apply");
      const json = await res.json();
      if (json.success) setAppStatus(json.data);
    } catch {}
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/v1/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, penName, avatar, bio }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.data.message);
        refreshUser();
      } else {
        alert(json.error?.message || "บันทึกข้อมูลไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setChangingPass(true);
    try {
      const res = await fetch("/api/v1/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.data.message);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(json.error?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setChangingPass(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("คุณต้องการออกจากระบบจากทุกอุปกรณ์อื่นหรือไม่?")) return;
    try {
      const res = await fetch("/api/v1/users/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE_ALL_OTHERS" }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.data.message);
        fetchSessions();
      }
    } catch {}
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/users/export");
      const json = await res.json();
      if (json.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `pdpa-export-${user?.id || "user"}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch {
      alert("ไม่สามารถส่งออกข้อมูลได้");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePass) return;
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/v1/users/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePass }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.data.message);
        logout();
        window.location.href = "/";
      } else {
        alert(json.error?.message || "รหัสผ่านไม่ถูกต้อง ไม่สามารถลบบัญชีได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการลบบัญชี");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <User className="w-16 h-16 text-neutral-600 mb-4" />
        <h1 className="text-2xl font-bold text-white font-prompt mb-2">โปรไฟล์ผู้ใช้งาน</h1>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">กรุณาเข้าสู่ระบบเพื่อดูข้อมูลส่วนตัว</p>
        <Link href="/auth/login" className="px-6 py-2 rounded-full bg-white text-black font-semibold text-xs">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Profile Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group">
          <img
            src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
            alt={user.name}
            className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white/20 shadow-xl"
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white font-prompt">{user.name}</h1>
            {user.penName && (
              <span className="text-sm text-neutral-400 font-medium font-prompt">({user.penName})</span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/15">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-neutral-400">{user.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-neutral-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ยืนยันอายุ 18+ แล้ว</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>สถานะ: {user.status}</span>
            </div>
            {user.wallet && (
              <div className="text-amber-400 font-bold">
                เหรียญคงเหลือ: {(user.wallet.paidBalance || 0) + (user.wallet.freeBalance || 0)} เหรียญ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION E: BECOME AN AUTHOR CTA (For Readers) */}
      {user.role === "READER" && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Feather className="w-4 h-4" />
              <span>ก้าวสู่การเป็นนักเขียน (หมวด E)</span>
            </div>
            <h3 className="text-lg font-bold text-white font-prompt">
              คุณต้องการเริ่มต้นเผยแพร่ผลงานนิยายหรือมังงะของคุณใช่ไหม?
            </h3>
            <p className="text-xs text-neutral-400 max-w-lg">
              สมัครเป็นนักเขียนเพื่อสร้างสรรค์ผลงาน ตั้งราคาเหรียญ และรับส่วนแบ่งรายได้ 70% สู่บัญชีธนาคารของคุณโดยตรง
            </p>
          </div>

          <div>
            {appStatus?.hasApplied ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-800 border border-neutral-700 text-xs font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">
                  สถานะใบสมัคร: {appStatus.kycStatus === "PENDING" ? "กำลังรอแอดมินตรวจสอบ" : appStatus.kycStatus}
                </span>
              </div>
            ) : (
              <Link
                href="/author/apply"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition shadow-md shadow-white/10"
              >
                <span>สมัครเป็นนักเขียนทันที</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* SECTION D: EDIT PROFILE DETAILS (Universal Profile Settings) */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-base font-bold text-white font-prompt flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-white" />
            <span>แก้ไขข้อมูลส่วนตัว (Edit Personal Info)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            ชื่อและรูปโปรไฟล์จะอัปเดตไปยังทุกความคิดเห็นและผลงานของคุณ
          </p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1.5">ชื่อที่แสดง (Display Name)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1.5">นามปากกา (Pen Name - สำหรับนักเขียน)</label>
              <input
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="เช่น นามปากกาสุดเท่"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1.5">URL รูปโปรไฟล์ (Avatar URL)</label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1.5">คำอธิบายตัวตน / Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="บอกเล่าเรื่องราวความชอบ หรือสไตล์งานเขียนของคุณ..."
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40 resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION D: CHANGE PASSWORD */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-base font-bold text-white font-prompt flex items-center gap-2">
            <Lock className="w-4 h-4 text-white" />
            <span>เปลี่ยนรหัสผ่าน (Change Password)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            ต้องระบุรหัสผ่านเดิมเพื่อความปลอดภัยในการตั้งรหัสผ่านใหม่
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-lg">
          <div>
            <label className="block text-neutral-400 mb-1.5">รหัสผ่านเดิม</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1.5">รหัสผ่านใหม่</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {changingPass ? "กำลังเปลี่ยนรหัส..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      </div>

      {/* Session Management */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white font-prompt">
              จัดการอุปกรณ์ที่เข้าสู่ระบบ (Session Management)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              ตรวจสอบอุปกรณ์ที่ล็อกอินอยู่ในปัจจุบัน เพื่อความปลอดภัยของบัญชี
            </p>
          </div>
          <button
            onClick={handleRevokeAll}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบอุปกรณ์อื่นทั้งหมด</span>
          </button>
        </div>

        {loadingSessions ? (
          <p className="text-xs text-neutral-500 py-4">กำลังโหลดข้อมูลอุปกรณ์...</p>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4">มีเพียงเซสชันปัจจุบันของคุณเท่านั้น</p>
        ) : (
          <div className="divide-y divide-neutral-800 text-xs">
            {sessions.map((sess) => (
              <div key={sess.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{sess.deviceName}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      IP: {sess.ipAddress || "127.0.0.1"} • เข้าใช้งานล่าสุด:{" "}
                      {new Date(sess.lastActive).toLocaleString("th-TH")}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                  ใช้งานอยู่
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDPA Data Rights & Delete Account */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white font-prompt">
            สิทธิ์ในข้อมูลส่วนบุคคลและจัดการบัญชี (PDPA Rights)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            คุณสามารถขอรับสำเนาข้อมูลส่วนตัว หรือยื่นคำขอลบบัญชีผู้ใช้ของคุณได้ตามกฎหมาย PDPA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="px-5 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-white" />
            <span>{exporting ? "กำลังส่งออก..." : "ขอส่งออกข้อมูล (Export Data JSON)"}</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>ขอลบบัญชีผู้ใช้ (Delete Account)</span>
          </button>
        </div>
      </div>

      {/* Modal: Delete Account Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white font-prompt">ยืนยันการขอลบบัญชีผู้ใช้</h3>
              <p className="text-xs text-neutral-400 mt-1">
                การลบบัญชีจะยุติการเข้าถึงยอดเหรียญ ชั้นหนังสือ และผลงานทั้งหมดของคุณอย่างถาวร
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">กรุณากรอกรหัสผ่านเพื่อยืนยัน</label>
                <input
                  type="password"
                  required
                  value={deletePass}
                  onChange={(e) => setDeletePass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {deletingAccount ? "กำลังลบ..." : "ยืนยันลบบัญชี"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
