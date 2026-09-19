"use client";

import React, { useState } from "react";
import { CloudRain, Flame, Volume2, Sparkles, Sliders } from "lucide-react";
import { useAmbientSound, SoundType } from "@/context/AmbientSoundContext";

/**
 * Desktop Ambient Sound Trigger & Popover (Shown on lg: screens)
 */
export function AmbientSoundPlayer() {
  const { activeSound, volume, handleToggleSound, setVolume } = useAmbientSound();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
          activeSound !== "none"
            ? "bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[#C4B5FD] shadow-[0_0_12px_rgba(139,92,246,0.3)] animate-pulse"
            : "bg-white/[0.04] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
        }`}
        title="เสียงบรรยากาศสำหรับอ่าน"
      >
        {activeSound === "rain" ? (
          <CloudRain className="w-3.5 h-3.5 text-[#38BDF8]" />
        ) : activeSound === "fire" ? (
          <Flame className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
        <span>
          {activeSound === "rain" ? "ฝนตก" : activeSound === "fire" ? "กองไฟ" : "เสียงบรรยากาศ"}
        </span>
      </button>

      {/* Popover Drawer */}
      {isOpen && (
        <div
          className="absolute right-0 top-11 w-64 p-4 rounded-2xl bg-[#111116]/95 border border-[#8B5CF6]/30 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.08]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#A78BFA]" />
              เสียงบรรยากาศขณะอ่าน
            </span>
            {activeSound !== "none" && (
              <button
                onClick={() => handleToggleSound(activeSound)}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold transition"
              >
                ปิดเสียง
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Rain */}
            <button
              onClick={() => handleToggleSound("rain")}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                activeSound === "rain"
                  ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-md shadow-purple-500/25"
                  : "bg-black/40 border-white/[0.06] text-neutral-400 hover:text-white hover:border-white/20"
              }`}
            >
              <CloudRain className={`w-5 h-5 ${activeSound === "rain" ? "text-[#38BDF8]" : ""}`} />
              <span className="text-xs font-semibold">ฝนตกเบาๆ</span>
              <span className="text-[9px] text-neutral-500">Gentle Rain</span>
            </button>

            {/* Fireplace */}
            <button
              onClick={() => handleToggleSound("fire")}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                activeSound === "fire"
                  ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-md shadow-purple-500/25"
                  : "bg-black/40 border-white/[0.06] text-neutral-400 hover:text-white hover:border-white/20"
              }`}
            >
              <Flame className={`w-5 h-5 ${activeSound === "fire" ? "text-amber-400" : ""}`} />
              <span className="text-xs font-semibold">กองไฟอุ่น</span>
              <span className="text-[9px] text-neutral-500">Fireplace</span>
            </button>
          </div>

          {/* Volume Slider */}
          {activeSound !== "none" && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>ระดับเสียง</span>
                <span className="font-mono text-white">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-[#8B5CF6] cursor-pointer h-1 bg-neutral-800 rounded-lg"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile & Tablet Ambient Sound Control Panel (Inside 3-bar Hamburger Menu)
 */
export function AmbientSoundMobileControl() {
  const { activeSound, volume, handleToggleSound, setVolume } = useAmbientSound();

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#14141A] to-[#0D0D11] border border-white/[0.08] shadow-inner space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${
            activeSound !== "none"
              ? "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C4B5FD] animate-pulse"
              : "bg-white/[0.04] border-white/[0.06] text-neutral-400"
          }`}>
            {activeSound === "rain" ? (
              <CloudRain className="w-4 h-4 text-[#38BDF8]" />
            ) : activeSound === "fire" ? (
              <Flame className="w-4 h-4 text-amber-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white font-prompt">เสียงบรรยากาศขณะอ่าน</span>
              <Sparkles className="w-3 h-3 text-[#A78BFA]" />
            </div>
            <p className="text-[10px] text-neutral-500">
              {activeSound === "rain"
                ? "กำลังเปิดเสียงฝนตก 🌧️"
                : activeSound === "fire"
                ? "กำลังเปิดเสียงกองไฟ 🔥"
                : "ช่วยให้มีสมาธิและอินกับเนื้อเรื่อง"}
            </p>
          </div>
        </div>

        {activeSound !== "none" && (
          <button
            onClick={() => handleToggleSound(activeSound)}
            className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-300 hover:text-rose-200 font-semibold transition active:scale-95"
          >
            ปิดเสียง
          </button>
        )}
      </div>

      {/* Sound Selection Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleToggleSound("rain")}
          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition active:scale-95 ${
            activeSound === "rain"
              ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-md shadow-purple-500/20 ring-1 ring-[#8B5CF6]/50"
              : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activeSound === "rain" ? "bg-[#38BDF8]/20 text-[#38BDF8]" : "bg-white/[0.04] text-neutral-400"}`}>
            <CloudRain className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-bold leading-tight">ฝนตกเบาๆ</p>
            <p className="text-[9px] text-neutral-500 leading-tight">Gentle Rain</p>
          </div>
        </button>

        <button
          onClick={() => handleToggleSound("fire")}
          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition active:scale-95 ${
            activeSound === "fire"
              ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-md shadow-purple-500/20 ring-1 ring-[#8B5CF6]/50"
              : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activeSound === "fire" ? "bg-amber-400/20 text-amber-400" : "bg-white/[0.04] text-neutral-400"}`}>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-bold leading-tight">กองไฟอุ่น</p>
            <p className="text-[9px] text-neutral-500 leading-tight">Fireplace</p>
          </div>
        </button>
      </div>

      {/* Volume Slider (Reveals when sound is active) */}
      {activeSound !== "none" && (
        <div className="pt-2 border-t border-white/[0.06] space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-[#A78BFA]" />
              ระดับเสียงบรรยากาศ
            </span>
            <span className="font-mono text-white font-semibold">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-[#8B5CF6] cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
