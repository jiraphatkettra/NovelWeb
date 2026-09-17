'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, CheckCircle, Sparkles, X, Gift } from 'lucide-react';

export default function CheckinModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { refreshUser } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);

  if (!isOpen) return null;

  const handleClaimReward = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/v1/gamification/checkin', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setClaimedToday(true);
        await refreshUser();
      } else {
        alert(data.error || 'คุณได้เช็คอินของวันนี้ไปแล้ว');
        setClaimedToday(true);
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setClaiming(false);
    }
  };

  const days = [
    { day: 1, coins: 5, status: 'DONE' },
    { day: 2, coins: 5, status: 'DONE' },
    { day: 3, coins: 10, status: 'DONE' },
    { day: 4, coins: 10, status: claimedToday ? 'DONE' : 'CURRENT' },
    { day: 5, coins: 15, status: 'LOCKED' },
    { day: 6, coins: 15, status: 'LOCKED' },
    { day: 7, coins: 30, status: 'LOCKED' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#161617] border border-white/[0.15] p-5 sm:p-8 shadow-2xl text-white max-h-[88vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-1">เช็คอินรับเหรียญฟรีประจำวัน</h3>
          <p className="text-xs text-white/50">รับเหรียญต่อเนื่องสูงสุด 30 Coins ทุกสัปดาห์</p>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-6">
          {days.map((d) => (
            <div
              key={d.day}
              className={`p-2 rounded-xl text-center border flex flex-col items-center justify-between ${
                d.status === 'DONE'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : d.status === 'CURRENT'
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                  : 'bg-black/40 border-white/[0.06] text-white/40'
              }`}
            >
              <span className="text-[10px] font-mono">D{d.day}</span>
              <div className="text-xs font-bold font-mono my-1">+{d.coins}</div>
              {d.status === 'DONE' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Gift className="w-3 h-3 opacity-40" />}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {claimedToday ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-400 font-medium flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>คุณได้รับเหรียญฟรีของวันนี้แล้ว!</span>
            </div>
          ) : (
            <button
              onClick={handleClaimReward}
              disabled={claiming}
              className="w-full py-3.5 rounded-full bg-amber-400 text-black font-semibold text-xs sm:text-sm hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.25)] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{claiming ? 'กำลังรับรางวัล...' : 'กดรับเหรียญฟรีวันนี้ (+10 Coins)'}</span>
            </button>
          )}

          <button onClick={onClose} className="w-full py-2.5 rounded-full bg-white/[0.06] text-white/60 hover:text-white text-xs">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
