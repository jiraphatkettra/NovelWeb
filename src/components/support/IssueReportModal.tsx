"use client";

import React, { useState } from "react";
import { X, AlertCircle, Send, Bug, DollarSign, BookOpen, User, MessageSquare, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAuthModal } from "@/context/AuthModalContext";

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: "BUG", label: "บั๊กของระบบ", icon: Bug, desc: "หน้าเว็บแสดงผลผิดพลาด ฟังก์ชันค้าง" },
  { id: "COIN", label: "เหรียญและการชำระเงิน", icon: DollarSign, desc: "เติมเงินไม่เข้า หักเหรียญผิดพลาด" },
  { id: "CONTENT", label: "ตอนอ่านและเนื้อหา", icon: BookOpen, desc: "ภาพไม่โหลด ตอนหาย หรือเนื้อหาซ้ำ" },
  { id: "ACCOUNT", label: "บัญชีผู้ใช้", icon: User, desc: "เข้าสู่ระบบไม่ได้ เปลี่ยนข้อมูลไม่ผ่าน" },
  { id: "OTHER", label: "ข้อเสนอแนะ / อื่นๆ", icon: MessageSquare, desc: "แนะนำฟังก์ชัน หรือแจ้งเรื่องทั่วไป" },
];

export function IssueReportModal({ isOpen, onClose }: IssueReportModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { openAuthModal } = useAuthModal();

  const [category, setCategory] = useState("BUG");
  const [priority, setPriority] = useState("MEDIUM");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบ", "คุณต้องเข้าสู่ระบบก่อนทำการแจ้งปัญหา");
      openAuthModal("LOGIN");
      return;
    }

    if (!title.trim()) {
      toast.error("กรุณาระบุหัวข้อปัญหา");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("รายละเอียดสั้นเกินไป", "กรุณาอธิบายปัญหาอย่างน้อย 10 ตัวอักษร");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          priority,
          title,
          description,
          contactEmail: contactEmail || user.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        toast.success("ส่งข้อมูลเรียบร้อย", "ทีมงานได้รับรายงานปัญหาของคุณแล้ว");
        setTimeout(() => {
          setIsSuccess(false);
          setTitle("");
          setDescription("");
          onClose();
        }, 1800);
      } else {
        toast.error("เกิดข้อผิดพลาด", data.error?.message || "ไม่สามารถส่งข้อมูลได้");
      }
    } catch (err) {
      console.error(err);
      toast.error("การเชื่อมต่อล้มเหลว", "กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-2xl bg-[#111114] border border-[var(--border-strong)] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-prompt">ได้รับเรื่องเรียบร้อยแล้ว</h3>
            <p className="text-sm text-neutral-400 max-w-sm">
              ขอบคุณที่ช่วยแจ้งปัญหาให้เราทราบ ทีมงาน ReadVerse จะเร่งดำเนินการตรวจสอบและปรับปรุงระบบให้ดียิ่งขึ้น
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-semibold mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>ศูนย์ช่วยเหลือและรับเรื่องร้องเรียน</span>
              </div>
              <h2 className="text-xl font-bold text-white font-prompt">แจ้งปัญหาการใช้งาน</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                พบเจอบั๊ก หรือมีข้อขัดข้องประการใด แจ้งให้ทีมพัฒนาทราบได้ทันที
              </p>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                หมวดหมู่ปัญหา <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                        isSelected
                          ? "bg-[var(--accent)]/10 border-[var(--accent)] text-white shadow-sm"
                          : "bg-white/[0.02] border-[var(--border)] text-neutral-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-[var(--accent)]" : "text-neutral-500"}`} />
                      <span className="text-xs font-medium truncate w-full">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                ระดับความเร่งด่วน
              </label>
              <div className="flex gap-2">
                {[
                  { id: "LOW", label: "ไม่เร่งด่วน" },
                  { id: "MEDIUM", label: "ปกติ" },
                  { id: "HIGH", label: "ด่วน" },
                  { id: "URGENT", label: "วิกฤต (ระบบพัง)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPriority(item.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      priority === item.id
                        ? "bg-white text-black border-white font-bold"
                        : "bg-white/[0.02] border-[var(--border)] text-neutral-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject / Title */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                หัวข้อเรื่อง <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น อ่านตอนที่ 5 ไม่ได้ รูปไม่ขึ้น, เติมเหรียญแล้วไม่เข้า"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--border)] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--accent)] transition"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  รายละเอียดเพิ่มเติม <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-neutral-500">{description.length} ตัวอักษร</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="ระบุชื่อเรื่อง, ชื่อตอน, หรือขั้นตอนที่ทำให้เกิดปัญหาอย่างละเอียด เพื่อให้ทีมงานแก้ไขได้ตรงจุด"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--border)] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--accent)] transition resize-none"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                อีเมลสำหรับติดต่อกลับ
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-[var(--border)] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--accent)] transition"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition disabled:opacity-50 active:scale-95 shadow-lg shadow-white/5"
              >
                {isSubmitting ? (
                  <span>กำลังส่ง...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>ส่งรายงานปัญหา</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
