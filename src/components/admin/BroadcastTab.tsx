"use client";

import React, { useState } from "react";
import {
  Send,
  Bell,
  Users,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export function BroadcastTab({ totalUsers = 0 }: { totalUsers?: number }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSentInfo, setLastSentInfo] = useState<string | null>(null);

  const presets = [
    {
      title: "แจ้งปิดปรับปรุงเซิร์ฟเวอร์ประจำสัปดาห์",
      msg: "ระบบจะทำการอัปเกรดประสิทธิภาพในคืนนี้เวลา 02:00 - 04:00 น. ขออภัยในความไม่สะดวก",
      link: "/help",
    },
    {
      title: "กิจกรรมแจกตั๋วอ่านฟรีประจำสัปดาห์!",
      msg: "ล็อกอินวันนี้เพื่อรับตั๋วของขวัญอ่านฟรีได้ที่กล่องของขวัญทันที!",
      link: "/coin-shop",
    },
    {
      title: "เปิดรับสมัครผลงานนิยายและมังงะประจำฤดูกาล",
      msg: "ขอเชิญชวนนักเขียนทุกคนร่วมส่งผลงานใหม่พร้อมรับสิทธิพิเศษและส่วนแบ่งรายได้สูงสุด",
      link: "/author",
    },
  ];

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน", "ระบุทั้งหัวข้อและข้อความประกาศ");
      return;
    }

    const confirmed = window.confirm(
      `📢 ยืนยันการส่งประกาศระบบถึงกลุ่มเป้าหมาย (${targetRole})?\n\nข้อความนี้จะถูกส่งเข้ากล่องแจ้งเตือนของผู้ใช้ทันที`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const res = await fetch("/api/v1/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetRole,
          link: link.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("ส่งประกาศทั้งระบบสำเร็จ!", json.data.message);
        setLastSentInfo(`ส่งประกาศล่าสุดเมื่อ ${new Date().toLocaleTimeString("th-TH")} ถึง ${json.data.recipientsCount} บัญชี`);
        setTitle("");
        setMessage("");
        setLink("");
      } else {
        toast.error("ส่งประกาศไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white font-prompt flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#A78BFA]" />
          ระบบส่งประกาศและแจ้งเตือนทั้งระบบ (Broadcast Announcements)
        </h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          ส่งข้อความแจ้งเตือนสำคัญ ข่าวสาร หรือกิจกรรมเข้าสู่กล่องแจ้งเตือนของผู้ใช้โดยตรง
        </p>
      </div>

      {lastSentInfo && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lastSentInfo}</span>
        </div>
      )}

      {/* Broadcast Composer Form */}
      <form onSubmit={handleSendBroadcast} className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-5">
        {/* Preset quick buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
            เทมเพลตสำเร็จรูป:
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setMessage(p.msg);
                  setLink(p.link);
                }}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white transition"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Target Group */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-2">
            กลุ่มเป้าหมายผู้รับประกาศ
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { val: "ALL", label: "ผู้ใช้ทุกคน (ALL)", sub: `ประมาณ ${totalUsers} บัญชี` },
              { val: "READER", label: "เฉพาะผู้อ่าน (READER)", sub: "ส่งถึงผู้ใช้งานทั่วไป" },
              { val: "AUTHOR", label: "เฉพาะนักเขียน (AUTHOR)", sub: "ส่งถึงครีเอเตอร์และนักเขียน" },
            ].map((target) => (
              <button
                key={target.val}
                type="button"
                onClick={() => setTargetRole(target.val)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-0.5 ${
                  targetRole === target.val
                    ? "bg-[#8B5CF6]/10 border-[#8B5CF6]/50 text-white"
                    : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span className={`text-xs font-bold ${targetRole === target.val ? "text-[#A78BFA]" : "text-white"}`}>
                  {target.label}
                </span>
                <span className="text-[10px] text-neutral-500">{target.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
            หัวข้อประกาศ (Title)
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น แจ้งปิดปรับปรุงเซิร์ฟเวอร์ / กิจกรรมต้อนรับเทศกาล"
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
            เนื้อหาประกาศ (Message)
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="พิมพ์รายละเอียดประกาศที่จะแสดงในแจ้งเตือนของผู้ใช้..."
            className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition resize-none leading-relaxed"
          />
        </div>

        {/* Optional Link */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
            ลิงก์ปลายทางเมื่อผู้ใช้คลิก (ไม่บังคับ)
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="เช่น /coin-shop หรือ /author"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition shadow-lg shadow-[#8B5CF6]/20 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ส่งประกาศไปยังกลุ่มเป้าหมาย</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
