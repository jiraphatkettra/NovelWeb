"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Send, Bug, DollarSign, BookOpen, User, MessageSquare, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAuthModal } from "@/context/AuthModalContext";

const CATEGORIES = [
  { id: "BUG", label: "บั๊กของระบบ", icon: Bug, desc: "หน้าเว็บแสดงผลผิดพลาด ฟังก์ชันค้าง" },
  { id: "COIN", label: "เหรียญและการชำระเงิน", icon: DollarSign, desc: "เติมเงินไม่เข้า หักเหรียญผิดพลาด" },
  { id: "CONTENT", label: "ตอนอ่านและเนื้อหา", icon: BookOpen, desc: "ภาพไม่โหลด ตอนหาย หรือเนื้อหาซ้ำ" },
  { id: "ACCOUNT", label: "บัญชีผู้ใช้", icon: User, desc: "เข้าสู่ระบบไม่ได้ เปลี่ยนข้อมูลไม่ผ่าน" },
  { id: "OTHER", label: "ข้อเสนอแนะ / อื่นๆ", icon: MessageSquare, desc: "แนะนำฟังก์ชัน หรือแจ้งเรื่องทั่วไป" },
];

export default function ReportPage() {
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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>กลับหน้าแรก</span>
      </Link>

      <div className="rounded-2xl bg-[#111114] border border-[var(--border)] p-6 sm:p-8 shadow-2xl">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white font-prompt">ส่งรายงานปัญหาเรียบร้อยแล้ว</h2>
            <p className="text-sm text-neutral-400 max-w-md">
              ขอบคุณสำหรับข้อมูล ทีมงาน ReadVerse จะเร่งตรวจสอบและดำเนินการแก้ไขอย่างเร็วที่สุด
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition"
              >
                กลับสู่หน้าแรก
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-semibold mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>ReadVerse Support Center</span>
              </div>
              <h1 className="text-2xl font-bold text-white font-prompt">แจ้งปัญหาการใช้งาน</h1>
              <p className="text-xs text-neutral-400 mt-1">
                พบเจอบั๊ก ฟังก์ชันผิดปกติ หรือมีข้อสงสัยใดๆ สามารถแจ้งให้ทีมพัฒนาทราบได้ที่นี่
              </p>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                หมวดหมู่ปัญหา <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? "bg-[var(--accent)]/10 border-[var(--accent)] text-white shadow-sm"
                          : "bg-white/[0.02] border-[var(--border)] text-neutral-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? "text-[var(--accent)]" : "text-neutral-500"}`} />
                      <div>
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[11px] text-neutral-500">{item.desc}</div>
                      </div>
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
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "LOW", label: "ไม่เร่งด่วน" },
                  { id: "MEDIUM", label: "ปกติ" },
                  { id: "HIGH", label: "ด่วน" },
                  { id: "URGENT", label: "วิกฤต (พัง)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPriority(item.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition ${
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
                placeholder="สรุปปัญหาพอสังเขป เช่น หน้าอ่านมังงะตอนที่ 4 รูปไม่โหลด"
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
                rows={5}
                placeholder="ระบุรายละเอียด เช่น เกิดขึ้นบนอุปกรณ์อะไร บราวเซอร์อะไร ลิงก์ตอน หรือขั้นตอนที่ทำแล้วเกิดปัญหา"
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

            {/* Submit button */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white hover:bg-neutral-200 text-black text-sm font-bold transition disabled:opacity-50 active:scale-[0.99] shadow-lg shadow-white/5"
              >
                {isSubmitting ? (
                  <span>กำลังส่งข้อมูล...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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
