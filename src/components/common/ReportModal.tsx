"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "STORY" | "CHAPTER" | "COMMENT" | "USER";
  targetId: string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  "ละเมิดลิขสิทธิ์ / คัดลอกผลงานผู้อื่น",
  "มีเนื้อหาลามกอนาจารที่ไม่เหมาะสมหรือไม่ตั้งเรต 18+",
  "การใช้ถ้อยคำสร้างความเกลียดชัง หรือการกลั่นแกล้ง",
  "การแสวงหาผลประโยชน์ทางการเงินที่หลอกลวง / สแปม",
  "เนื้อหาเกี่ยวกับความรุนแรง หรือการทำร้ายตนเอง",
  "อื่นๆ",
];

export function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }: ReportModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนส่งรายงานเนื้อหา");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        toast.success("ส่งรายงานเรียบร้อยแล้ว", "ทีมงานจะดำเนินการตรวจสอบ");
      } else {
        toast.error("ส่งรายงานไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm font-prompt">
            <AlertTriangle className="w-4 h-4" />
            <span>รายงานเนื้อหาไม่เหมาะสม</span>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-3 animate-in fade-in">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white font-prompt">ส่งรายงานเรียบร้อยแล้ว</h3>
            <p className="text-xs text-neutral-400">
              ขอบคุณสำหรับความร่วมมือในการช่วยดูแลชุมชนให้ปลอดภัย ทีมงานจะตรวจสอบและดำเนินการโดยเร็ว
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {targetTitle && (
              <p className="text-neutral-400 text-xs">
                รายงาน: <strong className="text-white">"{targetTitle}"</strong>
              </p>
            )}

            <div>
              <label className="block text-neutral-400 mb-1.5 font-medium">สาเหตุการรายงาน *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-rose-500"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1.5 font-medium">รายละเอียดเพิ่มเติม</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="ระบุจุดที่พบปัญหา เช่น ตอนที่ 3 มีการคัดลอกข้อความมาจาก..."
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-neutral-300 font-semibold hover:bg-white/[0.1]"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition disabled:opacity-50"
              >
                {loading ? "กำลังส่ง..." : "ส่งรายงาน"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
