"use client";

import React, { useState } from "react";
import { THAI_FONTS } from "@/lib/fonts";
import {
  X,
  Type,
  Sun,
  Moon,
  Bookmark,
  Sliders,
  AlignLeft,
  AlignJustify,
  Check,
} from "lucide-react";

export interface ReaderSettings {
  fontId: string;
  fontSize: number;
  lineHeight: number;
  pageWidth: "narrow" | "standard" | "wide" | "full";
  textAlign: "left" | "justify";
  theme: "light" | "sepia" | "night" | "black";
  autoScrollSpeed: number;
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontId: "sarabun",
  fontSize: 19,
  lineHeight: 1.8,
  pageWidth: "standard",
  textAlign: "left",
  theme: "night",
  autoScrollSpeed: 0,
};

interface ReaderSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export function ReaderSettingsDrawer({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: ReaderSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"font" | "layout" | "theme">("font");
  const [fontCategory, setFontCategory] = useState<string>("all");

  if (!isOpen) return null;

  const filteredFonts = THAI_FONTS.filter((f) => {
    if (fontCategory === "all") return true;
    return f.category === fontCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0c0c0e] h-full shadow-2xl border-l border-white/[0.08] flex flex-col animate-in slide-in-from-right duration-300 text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold font-prompt">การตั้งค่าการอ่าน</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-white/[0.06] text-xs font-medium">
          <button
            onClick={() => setActiveTab("font")}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === "font"
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>ฟอนต์ไทย</span>
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === "layout"
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>ขนาดและระยะ</span>
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === "theme"
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>ธีมและเลื่อน</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* TAB 1: THAI FONTS SELECTOR */}
          {activeTab === "font" && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {[
                  { id: "all", label: "ทั้งหมด" },
                  { id: "formal", label: "ทางการ / มีหัว" },
                  { id: "modern", label: "โมเดิร์น / ไร้หัว" },
                  { id: "casual", label: "เป็นกันเอง" },
                  { id: "creative", label: "วรรณกรรม" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFontCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-[11px] transition ${
                      fontCategory === cat.id
                        ? "bg-zinc-100 text-zinc-950 font-semibold"
                        : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Font Cards List */}
              <div className="space-y-2">
                {filteredFonts.map((font) => {
                  const isSelected = settings.fontId === font.id;
                  return (
                    <div
                      key={font.id}
                      onClick={() => onUpdateSettings({ fontId: font.id })}
                      className={`p-3 rounded-xl border cursor-pointer transition relative group ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/40"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-100 font-prompt">
                            {font.nameTh} ({font.name})
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 font-mono">
                            {font.category}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-500 mb-2">{font.description}</p>

                      {/* Font Rendered Preview Box */}
                      <div
                        className={`p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-xs leading-relaxed ${font.className} ${
                          isSelected ? "text-amber-300" : "text-zinc-300"
                        }`}
                      >
                        {font.sampleText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SIZE & LAYOUT */}
          {activeTab === "layout" && (
            <div className="space-y-5">
              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-300">ขนาดตัวหนังสือ</label>
                  <span className="text-xs font-semibold text-amber-400 font-mono">{settings.fontSize} px</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-base font-bold flex items-center justify-center border border-white/[0.08]"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="14"
                    max="28"
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <button
                    onClick={() => onUpdateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-base font-bold flex items-center justify-center border border-white/[0.08]"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-2">ระยะห่างระหว่างบรรทัด</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "แน่น", val: 1.5 },
                    { label: "ปกติ", val: 1.8 },
                    { label: "โปร่ง", val: 2.1 },
                    { label: "กว้าง", val: 2.4 },
                  ].map((lh) => (
                    <button
                      key={lh.val}
                      onClick={() => onUpdateSettings({ lineHeight: lh.val })}
                      className={`py-2 rounded-lg border text-xs font-medium transition ${
                        settings.lineHeight === lh.val
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold"
                          : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {lh.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reading Margin Width */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-2">ความกว้างหน้าอ่าน</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "narrow", label: "แคบ", desc: "640px" },
                    { id: "standard", label: "พอดี", desc: "768px" },
                    { id: "wide", label: "กว้าง", desc: "960px" },
                    { id: "full", label: "เต็มจอ", desc: "100%" },
                  ].map((mw) => (
                    <button
                      key={mw.id}
                      onClick={() => onUpdateSettings({ pageWidth: mw.id as ReaderSettings["pageWidth"] })}
                      className={`py-2 rounded-lg border text-xs flex flex-col items-center transition ${
                        settings.pageWidth === mw.id
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold"
                          : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span>{mw.label}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{mw.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-2">การจัดหน้า</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ textAlign: "left" })}
                    className={`py-2 rounded-lg border flex items-center justify-center gap-2 text-xs font-medium transition ${
                      settings.textAlign === "left"
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>ชิดซ้าย</span>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ textAlign: "justify" })}
                    className={`py-2 rounded-lg border flex items-center justify-center gap-2 text-xs font-medium transition ${
                      settings.textAlign === "justify"
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                    <span>กระจายข้อความ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THEMES & AUTO SCROLL */}
          {activeTab === "theme" && (
            <div className="space-y-5">
              {/* Reading Color Themes */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-2">ธีมสีถนอมสายตา</label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Day Light */}
                  <button
                    onClick={() => onUpdateSettings({ theme: "light" })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      settings.theme === "light"
                        ? "border-amber-400 ring-1 ring-amber-400"
                        : "border-neutral-300 hover:border-neutral-400"
                    } bg-white text-zinc-900`}
                  >
                    <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 font-prompt">สว่าง</p>
                      <p className="text-[10px] text-zinc-500">Day Clean</p>
                    </div>
                  </button>

                  {/* Sepia Paper */}
                  <button
                    onClick={() => onUpdateSettings({ theme: "sepia" })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      settings.theme === "sepia"
                        ? "border-amber-600 ring-1 ring-amber-600"
                        : "border-amber-800/30 hover:border-amber-700"
                    } bg-[#f7efe2] text-[#382c1e]`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#ebdcc4] flex items-center justify-center">
                      <Bookmark className="w-3.5 h-3.5 text-[#8c5b23]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#382c1e] font-prompt">ถนอมสายตา</p>
                      <p className="text-[10px] text-[#6f5f4b]">Sepia Paper</p>
                    </div>
                  </button>

                  {/* Night Charcoal */}
                  <button
                    onClick={() => onUpdateSettings({ theme: "night" })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      settings.theme === "night"
                        ? "border-amber-400 ring-1 ring-amber-400"
                        : "border-white/[0.08] hover:border-white/20"
                    } bg-[#18181c] text-white`}
                  >
                    <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center">
                      <Moon className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white font-prompt">มืดสบายตา</p>
                      <p className="text-[10px] text-neutral-400">Night Slate</p>
                    </div>
                  </button>

                  {/* AMOLED Black */}
                  <button
                    onClick={() => onUpdateSettings({ theme: "black" })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      settings.theme === "black"
                        ? "border-amber-400 ring-1 ring-amber-400"
                        : "border-white/[0.08] hover:border-white/20"
                    } bg-black text-white`}
                  >
                    <div className="w-7 h-7 rounded-full bg-neutral-900 border border-white/[0.08] flex items-center justify-center">
                      <Moon className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white font-prompt">ดำสนิท</p>
                      <p className="text-[10px] text-neutral-500">OLED Black</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Auto Scroll Controller */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">เลื่อนหน้าอัตโนมัติ (Auto-Scroll)</label>
                  <span className="text-xs font-semibold text-amber-400 font-mono">
                    {settings.autoScrollSpeed === 0 ? "ปิด" : `ระดับ ${settings.autoScrollSpeed}`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { speed: 0, label: "ปิด" },
                    { speed: 1, label: "ช้า" },
                    { speed: 2, label: "ปานกลาง" },
                    { speed: 3, label: "เร็ว" },
                  ].map((s) => (
                    <button
                      key={s.speed}
                      onClick={() => onUpdateSettings({ autoScrollSpeed: s.speed })}
                      className={`py-1.5 rounded-lg border text-xs font-medium transition ${
                        settings.autoScrollSpeed === s.speed
                          ? "bg-amber-400 text-zinc-950 font-bold border-amber-400"
                          : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Reset & Apply */}
        <div className="p-3.5 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <button
            onClick={() => onUpdateSettings(DEFAULT_READER_SETTINGS)}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            รีเซ็ตค่าเริ่มต้น
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
