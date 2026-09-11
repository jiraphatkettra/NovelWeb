"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Gift, Sparkles, CheckCircle2, Clock, X, Ticket, ArrowRight } from "lucide-react";
import Link from "next/link";

interface GiftBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimed?: () => void;
}

export function GiftBoxModal({ isOpen, onClose, onClaimed }: GiftBoxModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [canClaim, setCanClaim] = useState(true);
  const [ticketCount, setTicketCount] = useState(0);
  const [claimedReward, setClaimedReward] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/tickets");
      const json = await res.json();
      if (json.success) {
        setCanClaim(json.data.canClaimDaily);
        setTicketCount(json.data.ticketCount);
      }
    } catch {
      console.error("Failed to load ticket status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setClaimedReward(null);
      fetchStatus();
    }
  }, [isOpen, user]);

  const handleClaim = async () => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนเปิดกล่องของขวัญ");
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch("/api/v1/tickets", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setClaimedReward(json.data.message || "คุณได้รับตั๋วอ่านฟรี 1 ใบ!");
        setCanClaim(false);
        setTicketCount((prev) => prev + 1);
        if (onClaimed) onClaimed();
      } else {
        alert(json.error?.message || "ไม่สามารถเปิดกล่องของขวัญได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121318] border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gift Box Icon / Animation */}
        <div className="relative mx-auto my-4 w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/30 to-amber-400/10 border border-amber-500/40 flex items-center justify-center shadow-inner group">
          <Gift className={`w-12 h-12 text-amber-400 transition duration-500 ${claiming ? "animate-bounce" : "group-hover:scale-110"}`} />
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-300 animate-pulse" />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-black text-white font-prompt tracking-tight">
          กล่องของขวัญ Kakao
        </h2>
        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
          รับตั๋วอ่านฟรีประจำวัน (Daily Free Pass) เพื่อใช้ปลดล็อกตอนที่ร่วมรายการได้ทันที!
        </p>

        {/* Ticket Stats */}
        <div className="my-6 p-4 rounded-2xl bg-zinc-900/90 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs text-zinc-400">ตั๋วอ่านฟรีคงเหลือ</div>
              <div className="text-lg font-bold text-white font-prompt">
                {ticketCount} <span className="text-xs font-normal text-zinc-400">ใบ</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-zinc-400">สถานะวันนี้</div>
            <div className="text-xs font-semibold">
              {canClaim ? (
                <span className="text-emerald-400">พร้อมรับ</span>
              ) : (
                <span className="text-zinc-500">รับแล้ว</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {claimedReward ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div className="text-xs font-medium leading-relaxed">{claimedReward}</div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-sm hover:from-amber-400 hover:to-yellow-300 transition shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              รับทราบ / เริ่มอ่านเลย
            </button>
          </div>
        ) : !user ? (
          <div className="space-y-3">
            <Link
              href="/auth/login"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <span>เข้าสู่ระบบเพื่อรับตั๋ว</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : canClaim ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-black font-bold text-base transition duration-300 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {claiming ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Gift className="w-5 h-5" />
                <span>เปิดกล่องรับตั๋วฟรีวันนี้</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span>คุณรับตั๋วของวันนี้ไปแล้ว กลับมาใหม่ในวันพรุ่งนี้!</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
