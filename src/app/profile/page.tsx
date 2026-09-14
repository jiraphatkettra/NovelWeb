"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
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
  ArrowRight,
  PenTool,
} from "lucide-react";
import { BecomeAuthorModal } from "@/components/author/BecomeAuthorModal";
import { ImageUploadDropzone } from "@/components/common/ImageUploadDropzone";
import { useToast } from "@/context/ToastContext";

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
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showBecomeModal, setShowBecomeModal] = useState(false);

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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, penName, avatar, bio }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("บันทึกข้อมูลเรียบร้อยแล้ว", "ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว");
        refreshUser();
      } else {
        toast.error("บันทึกไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning("รหัสผ่านไม่ตรงกัน", "กรุณากรอกรหัสผ่านใหม่และยืนยันให้ตรงกัน");
      return;
    }
    setChangingPass(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("เปลี่ยนรหัสผ่านสำเร็จ!", "กรุณาใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("เปลี่ยนรหัสผ่านไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setChangingPass(false);
    }
  };

  const handleRevokeAll = async () => {
    try {
      const res = await fetch("/api/v1/users/sessions", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("ออกจากระบบอุปกรณ์อื่นเรียบร้อยแล้ว");
        fetchSessions();
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการยกเลิกเซสชัน");
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/users/export-pdpa");
      const json = await res.json();
      if (json.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `user_data_${user?.id}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("ส่งออกข้อมูลสำเร็จ", "ไฟล์ JSON ถูกดาวน์โหลดลงในอุปกรณ์แล้ว");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/v1/users/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePass }),
      });
      const json = await res.json();
      if (json.success) {
        toast.info("ลบบัญชีเรียบร้อยแล้ว", "ข้อมูลทั้งหมดของคุณถูกลบออกจากระบบ");
        logout();
      } else {
        toast.error("ลบบัญชีไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบบัญชี");
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-white font-prompt mb-2">โปรดเข้าสู่ระบบ</h1>
        <p className="text-xs text-neutral-400 mb-5">คุณต้องเข้าสู่ระบบก่อนเพื่อจัดการข้อมูลส่วนตัว</p>
        <Link
          href="/auth/login"
          className="px-5 py-2.5 rounded-xl bg-[#FFE600] text-black font-bold text-xs hover:bg-[#F5DC00] transition"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Profile Overview Card */}
      <div className="p-6 rounded-xl bg-[#121215] border border-white/[0.08] flex flex-col sm:flex-row items-center gap-5">
        <img
          src={
            user.avatar ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          }
          alt={user.name}
          className="w-20 h-20 rounded-full object-cover bg-neutral-900 border-2 border-white/10"
        />

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-white font-prompt">{user.name}</h1>
            <span className="px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 text-[11px] font-medium">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-neutral-400">{user.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ยืนยันอายุ 18+ แล้ว</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-neutral-300" />
              <span>สถานะ: {user.status}</span>
            </div>
            {user.wallet && (
              <div className="text-[#FFE600] font-bold">
                เหรียญ: {(user.wallet.paidBalance || 0) + (user.wallet.freeBalance || 0)} 🪙
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BECOME AN AUTHOR CTA (For Readers) */}
      {user.role === "READER" && (
        <div className="p-5 rounded-xl bg-[#121215] border border-[#FFE600]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFE600]">
              <Feather className="w-3.5 h-3.5" />
              <span>ก้าวสู่การเป็นนักเขียน</span>
            </div>
            <h3 className="text-sm font-bold text-white font-prompt">
              ต้องการเริ่มต้นเผยแพร่ผลงานนิยายหรือมังงะของคุณใช่ไหม?
            </h3>
            <p className="text-xs text-neutral-400 max-w-lg leading-relaxed">
              สมัครเป็นนักเขียนเพื่อสร้างสรรค์ผลงาน ตั้งราคาเหรียญ และรับส่วนแบ่งรายได้ 70% สู่บัญชีธนาคาร
            </p>
          </div>

          <div>
            <button
              onClick={() => setShowBecomeModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition active:scale-[0.99]"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>เปิดโหมดนักเขียนทันที (ฟรี)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* EDIT PROFILE DETAILS */}
      <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-4">
        <div className="border-b border-white/[0.08] pb-3">
          <h2 className="text-sm font-bold text-white font-prompt flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#FFE600]" />
            <span>แก้ไขข้อมูลส่วนตัว</span>
          </h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            ชื่อและรูปโปรไฟล์จะแสดงในทุกความคิดเห็นและผลงานของคุณ
          </p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">ชื่อที่แสดง</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">นามปากกา (สำหรับนักเขียน)</label>
              <input
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="เช่น นามปากกาสุดเท่"
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
              />
            </div>
          </div>

          <div>
            <ImageUploadDropzone
              value={avatar}
              onChange={(val) => setAvatar(typeof val === "string" ? val : val[0] || "")}
              label="รูปโปรไฟล์ (Avatar)"
              helperText="ลากรูปมาวาง หรือคลิกเพื่ออัปโหลดจากอุปกรณ์ (JPG, PNG, WEBP)"
              aspectRatio="avatar"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">คำอธิบายตัวตน / Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="บอกเล่าเรื่องราวความชอบ หรือสไตล์งานเขียนของคุณ..."
              className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600] resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CHANGE PASSWORD */}
      <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-4">
        <div className="border-b border-white/[0.08] pb-3">
          <h2 className="text-sm font-bold text-white font-prompt flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FFE600]" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            ระบุรหัสผ่านเดิมเพื่อความปลอดภัยในการตั้งรหัสผ่านใหม่
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs max-w-md">
          <div>
            <label className="block text-neutral-400 mb-1">รหัสผ่านเดิม</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">รหัสผ่านใหม่</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs transition border border-white/[0.08] disabled:opacity-50"
          >
            {changingPass ? "กำลังเปลี่ยนรหัส..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      </div>

      {/* Session Management */}
      <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-bold text-white font-prompt">
              จัดการอุปกรณ์ที่เข้าสู่ระบบ
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              ตรวจสอบอุปกรณ์ที่ล็อกอินอยู่ในปัจจุบัน เพื่อความปลอดภัยของบัญชี
            </p>
          </div>
          <button
            onClick={handleRevokeAll}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบอุปกรณ์อื่น</span>
          </button>
        </div>

        {loadingSessions ? (
          <p className="text-xs text-neutral-500 py-3">กำลังโหลดข้อมูลอุปกรณ์...</p>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-neutral-500 py-3">มีเพียงเซสชันปัจจุบันของคุณเท่านั้น</p>
        ) : (
          <div className="divide-y divide-white/[0.06] text-xs">
            {sessions.map((sess) => (
              <div key={sess.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-neutral-400">
                    <Laptop className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-xs">{sess.deviceName}</p>
                    <p className="text-[10px] text-neutral-500">
                      IP: {sess.ipAddress || "127.0.0.1"} • เข้าใช้งาน:{" "}
                      {new Date(sess.lastActive).toLocaleString("th-TH")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                  ใช้งานอยู่
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDPA Data Rights & Delete Account */}
      <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white font-prompt">
            สิทธิ์ในข้อมูลส่วนบุคคลและจัดการบัญชี (PDPA Rights)
          </h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            คุณสามารถขอรับสำเนาข้อมูลส่วนตัว หรือยื่นคำขอลบบัญชีผู้ใช้ของคุณได้ตามกฎหมาย PDPA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-neutral-300" />
            <span>{exporting ? "กำลังส่งออก..." : "ขอส่งออกข้อมูล (Export Data JSON)"}</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ขอลบบัญชีผู้ใช้</span>
          </button>
        </div>
      </div>

      {/* Modal: Delete Account Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121215] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white font-prompt">ยืนยันการขอลบบัญชีผู้ใช้</h3>
              <p className="text-xs text-neutral-400 mt-1">
                การลบบัญชีจะยุติการเข้าถึงยอดเหรียญ ชั้นหนังสือ และผลงานทั้งหมดของคุณอย่างถาวร
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">กรุณากรอกรหัสผ่านเพื่อยืนยัน</label>
                <input
                  type="password"
                  required
                  value={deletePass}
                  onChange={(e) => setDeletePass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-xl bg-white/[0.06] text-neutral-300 font-semibold hover:bg-white/[0.1]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {deletingAccount ? "กำลังลบ..." : "ยืนยันลบบัญชี"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Become Author Modal */}
      <BecomeAuthorModal
        isOpen={showBecomeModal}
        onClose={() => setShowBecomeModal(false)}
        onSuccess={() => refreshUser()}
      />
    </div>
  );
}
