"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Flame, Coins, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

export function DailyCheckinModal({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    alreadyCheckedIn?: boolean;
    message?: string;
    coinsReward?: number;
    streakCount?: number;
  } | null>(null);

  const handleCheckin = async () => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนเช็คอิน");
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
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
          refreshUser();
        }
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเช็คอิน");
    } finally {
      setLoading(false);
    }
  };

  const streakDays = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-400 p-0.5 shadow-lg shadow-orange-500/30 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-8 h-8 text-orange-500 fill-orange-500/30 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white font-prompt">เช็คอินรายวัน รับเหรียญฟรี!</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            เข้าอ่านและเช็คอินต่อเนื่องเพื่อรับเหรียญโบนัสพิเศษ ยิ่งอ่านติดต่อกันมาก ยิ่งได้เยอะ!
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
                    ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10"
                    : isCompleted
                    ? "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                    : "bg-zinc-950/40 border-zinc-800/60 text-zinc-500"
                }`}
              >
                <span className="text-[10px] font-medium mb-1">วันที่ {day}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 my-0.5" />
                ) : (
                  <Coins className="w-4 h-4 text-zinc-500 my-0.5" />
                )}
                <span className="text-[10px] font-bold text-amber-300">+{10 + (day - 1) * 5}</span>
              </div>
            );
          })}
        </div>

        {/* Result Message or Action Button */}
        {result ? (
          <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-2xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-300">{result.message}</p>
            {result.coinsReward && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-zinc-300">
                <span>เหรียญฟรีที่ได้รับ:</span>
                <span className="font-bold text-white">+{result.coinsReward} 🪙</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-sm transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        ) : (
          <button
            onClick={handleCheckin}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:from-orange-400 hover:to-yellow-300 text-black font-bold text-base shadow-lg shadow-orange-500/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-black" />
            <span>{loading ? "กำลังเช็คอิน..." : "กดรับเหรียญฟรีวันนี้"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
