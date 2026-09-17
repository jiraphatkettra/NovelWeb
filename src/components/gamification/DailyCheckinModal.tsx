"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { X, Flame, Coins, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

export function DailyCheckinModal({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    alreadyCheckedIn?: boolean;
    message?: string;
    coinsReward?: number;
    streakCount?: number;
  } | null>(null);

  const handleCheckin = async () => {
    if (!user) {
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนทำการเช็คอิน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/gamification/checkin", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
        if (!json.data.alreadyCheckedIn) {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
          toast.success("เช็คอินสำเร็จ!", `ได้รับ ${json.data.coinsReward || 10} เหรียญ`);
          refreshUser();
        } else {
          toast.info("เช็คอินแล้ว", json.data.message || "คุณได้ทำการเช็คอินของวันนี้แล้ว");
        }
      } else {
        toast.error("เช็คอินไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const streakDays = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121215] border border-white/[0.1] rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-100 font-prompt">เช็คอินรายวัน</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            เข้าอ่านและเช็คอินต่อเนื่องเพื่อรับเหรียญโบนัส ยิ่งต่อเนื่องยิ่งได้มาก
          </p>
        </div>

        {/* Streak Visualizer */}
        <div className="grid grid-cols-7 gap-1.5 my-6">
          {streakDays.map((day) => {
            const currentStreak = result?.streakCount || 1;
            const isCompleted = day <= currentStreak;
            const isToday = day === currentStreak;

            return (
              <div
                key={day}
                className={`flex flex-col items-center p-2 rounded-xl border text-center transition ${
                  isToday
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : isCompleted
                    ? "bg-white/[0.05] border-white/[0.08] text-zinc-200"
                    : "bg-white/[0.02] border-white/[0.04] text-zinc-600"
                }`}
              >
                <span className="text-[10px] font-mono mb-1">วัน {day}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 my-0.5" />
                ) : (
                  <Coins className="w-4 h-4 text-zinc-600 my-0.5" />
                )}
                <span className="text-[10px] font-mono font-bold text-amber-400">+{10 + (day - 1) * 5}</span>
              </div>
            );
          })}
        </div>

        {/* Result Message or Action Button */}
        {result ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-amber-400">{result.message}</p>
            {result.coinsReward && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-zinc-300">
                <span>เหรียญฟรีที่ได้รับ:</span>
                <span className="font-bold text-zinc-100 font-mono">+{result.coinsReward} 🪙</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-3 w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-medium text-xs transition"
            >
              ปิด
            </button>
          </div>
        ) : (
          <button
            onClick={handleCheckin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 font-prompt shadow-sm"
          >
            <Flame className="w-4 h-4" />
            <span>{loading ? "กำลังเช็คอิน..." : "กดรับเหรียญฟรีวันนี้"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
