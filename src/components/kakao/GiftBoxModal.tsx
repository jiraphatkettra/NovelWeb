"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Gift, CheckCircle2, Clock, X, Ticket, ArrowRight } from "lucide-react";
import Link from "next/link";

interface GiftBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimed?: () => void;
}

export function GiftBoxModal({ isOpen, onClose, onClaimed }: GiftBoxModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
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
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบเพื่อเปิดกล่องของขวัญ");
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch("/api/v1/tickets", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const rewardMsg = json.data.message || "คุณได้รับตั๋วอ่านฟรี 1 ใบ!";
        setClaimedReward(rewardMsg);
        toast.success("ยินดีด้วย!", rewardMsg);
        setCanClaim(false);
        setTicketCount((prev) => prev + 1);
        if (onClaimed) onClaimed();
      } else {
        toast.error("ไม่สามารถเปิดได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121215] border border-white/[0.1] rounded-2xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gift Box Icon */}
        <div className="relative mx-auto my-3 w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Gift className={`w-7 h-7 text-amber-400 transition duration-300 ${claiming ? "animate-bounce" : ""}`} />
        </div>

        {/* Header */}
        <h2 className="text-lg font-bold text-zinc-100 font-prompt tracking-tight">
          กล่องของขวัญประจำวัน
        </h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          รับตั๋วอ่านฟรีประจำวัน (Daily Free Pass) เพื่อใช้ปลดล็อกตอนที่ร่วมรายการ
        </p>

        {/* Ticket Stats */}
        <div className="my-5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ตั๋วอ่านฟรีคงเหลือ</div>
              <div className="text-sm font-bold text-zinc-100 font-mono">
                {ticketCount} <span className="text-xs font-normal text-zinc-500">ใบ</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">สถานะวันนี้</div>
            <div className="text-xs font-semibold">
              {canClaim ? (
                <span className="text-amber-400">พร้อมรับ</span>
              ) : (
                <span className="text-zinc-500">รับแล้ว</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {claimedReward ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2.5 text-left">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="text-xs font-medium leading-relaxed">{claimedReward}</div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition active:scale-[0.99] font-prompt"
            >
              เริ่มอ่านเลย
            </button>
          </div>
        ) : !user ? (
          <div className="space-y-3">
            <Link
              href="/auth/login"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition font-prompt shadow-sm"
            >
              <span>เข้าสู่ระบบเพื่อรับตั๋ว</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : canClaim ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 font-prompt shadow-sm"
          >
            {claiming ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Gift className="w-4 h-4" />
                <span>เปิดกล่องรับตั๋วฟรีวันนี้</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-400 text-xs flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span>คุณรับตั๋วของวันนี้ไปแล้ว พบกันใหม่พรุ่งนี้</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium transition"
            >
              ปิด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
