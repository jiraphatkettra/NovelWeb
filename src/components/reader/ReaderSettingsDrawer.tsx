"use client";

import React, { useState } from "react";
import { THAI_FONTS, ThaiFontOption } from "@/lib/fonts";
import {
  X,
  Type,
  Sun,
  Moon,
  Bookmark,
  Sliders,
  AlignLeft,
  AlignJustify,
  Maximize2,
  Minimize2,
  Check,
  Sparkles,
} from "lucide-react";

export interface ReaderSettings {
  fontId: string;
  fontSize: number; // in px, e.g. 18
  lineHeight: number; // 1.5, 1.8, 2.1, 2.4
  pageWidth: "narrow" | "standard" | "wide" | "full";
  textAlign: "left" | "justify";
  theme: "light" | "sepia" | "night" | "black";
  autoScrollSpeed: number; // 0 = off, 1 = slow, 2 = normal, 3 = fast
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

  const selectedFont = THAI_FONTS.find((f) => f.id === settings.fontId) || THAI_FONTS[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-prompt">การตั้งค่าการอ่าน (Reader Settings)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("font")}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === "font"
                ? "border-amber-400 text-amber-400 bg-amber-500/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>ฟอนต์ไทย (11 แบบ)</span>
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === "layout"
                ? "border-amber-400 text-amber-400 bg-amber-500/5"
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
                ? "border-amber-400 text-amber-400 bg-amber-500/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>ธีมสี & เลื่อนจอ</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* TAB 1: THAI FONTS SELECTOR */}
          {activeTab === "font" && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: "all", label: "ทั้งหมด (11)" },
                  { id: "formal", label: "ทางการ / มีหัว" },
                  { id: "modern", label: "โมเดิร์น / ไร้หัว" },
                  { id: "casual", label: "เป็นกันเอง / อบอุ่น" },
                  { id: "creative", label: "ลายมือ / วรรณกรรม" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFontCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition ${
                      fontCategory === cat.id
                        ? "bg-amber-500 text-black font-semibold"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Font Cards List */}
              <div className="space-y-2.5">
                {filteredFonts.map((font) => {
                  const isSelected = settings.fontId === font.id;
                  return (
                    <div
                      key={font.id}
                      onClick={() => onUpdateSettings({ fontId: font.id })}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition relative group ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-500/10"
                          : "bg-zinc-800/60 border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white font-prompt">
                            {font.nameTh} ({font.name})
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/60 text-zinc-300">
                            {font.category}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mb-2">{font.description}</p>

                      {/* Font Rendered Preview Box */}
                      <div
                        className={`p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-sm leading-relaxed ${font.className} ${
                          isSelected ? "text-amber-200 font-medium" : "text-zinc-300"
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
            <div className="space-y-6">
              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-300">ขนาดตัวหนังสือ (Font Size)</label>
                  <span className="text-sm font-bold text-amber-400 font-prompt">{settings.fontSize} px</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-lg font-bold flex items-center justify-center border border-zinc-700"
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
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <button
                    onClick={() => onUpdateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-lg font-bold flex items-center justify-center border border-zinc-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">ระยะห่างระหว่างบรรทัด (Line Height)</label>
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
                      className={`py-2 rounded-xl border text-xs font-medium transition ${
                        settings.lineHeight === lh.val
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                          : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      }`}
                    >
                      {lh.label} ({lh.val})
                    </button>
                  ))}
                </div>
              </div>

              {/* Reading Margin Width */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">ความกว้างหน้ากระดาษ (Reading Margin)</label>
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
                      className={`py-2 rounded-xl border text-xs flex flex-col items-center transition ${
                        settings.pageWidth === mw.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                          : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      }`}
                    >
                      <span>{mw.label}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">{mw.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">การจัดหน้า (Text Alignment)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ textAlign: "left" })}
                    className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition ${
                      settings.textAlign === "left"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    <span>ชิดซ้าย (Left)</span>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ textAlign: "justify" })}
                    className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition ${
                      settings.textAlign === "justify"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    <AlignJustify className="w-4 h-4" />
                    <span>กระจายสม่ำเสมอ (Justify)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THEMES & AUTO SCROLL */}
          {activeTab === "theme" && (
            <div className="space-y-6">
              {/* Reading Color Themes */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">ธีมสีถนอมสายตา (Reading Themes)</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Day Light */}
                  <button
                    onClick={() => onUpdateSettings({ theme: "light" })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                      settings.theme === "light"
                        ? "border-amber-400 ring-2 ring-amber-400/30"
                        : "border-zinc-700 hover:border-zinc-500"
                    } bg-white text-zinc-900`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center">
                      <Sun className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 font-prompt">สว่าง / ขาว</p>
                      <p className="text-[10px] text-zinc-500">Day Clean</p>
                    </div>
                  </button>

                  {/* Sepia Paper */}
                  <button
                    onClick={() => onUpdateSettings({ theme: "sepia" })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                      settings.theme === "sepia"
                        ? "border-amber-400 ring-2 ring-amber-400/30"
                        : "border-amber-800/40 hover:border-amber-700"
                    } bg-[#f7efe2] text-[#433422]`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#ebdcc4] flex items-center justify-center">
                      <Bookmark className="w-4 h-4 text-[#96691c]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#433422] font-prompt">ถนอมสายตา</p>
                      <p className="text-[10px] text-[#7d6b53]">Sepia Warm Paper</p>
                    </div>
                  </button>

                  {/* Night Charcoal */}
                  <button
                    onClick={() => onUpdateSettings({ theme: "night" })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                      settings.theme === "night"
                        ? "border-amber-400 ring-2 ring-amber-400/30"
                        : "border-zinc-700 hover:border-zinc-500"
                    } bg-[#1c1d22] text-[#d1d5db]`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Moon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white font-prompt">มืดสบายตา</p>
                      <p className="text-[10px] text-zinc-400">Night Charcoal</p>
                    </div>
                  </button>

                  {/* AMOLED Black */}
                  <button
                    onClick={() => onUpdateSettings({ theme: "black" })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                      settings.theme === "black"
                        ? "border-amber-400 ring-2 ring-amber-400/30"
                        : "border-zinc-800 hover:border-zinc-600"
                    } bg-black text-zinc-300`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Moon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white font-prompt">ดำสนิท</p>
                      <p className="text-[10px] text-zinc-500">AMOLED Black</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Auto Scroll Controller */}
              <div className="bg-zinc-800/50 border border-zinc-700/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200">ระบบเลื่อนหน้าอัตโนมัติ (Auto-Scroll)</label>
                  <span className="text-xs font-bold text-amber-400">
                    {settings.autoScrollSpeed === 0 ? "ปิดอยู่" : `ความเร็วระดับ ${settings.autoScrollSpeed}`}
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
                      className={`py-2 rounded-xl border text-xs font-medium transition ${
                        settings.autoScrollSpeed === s.speed
                          ? "bg-amber-500 text-black font-bold border-amber-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
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
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={() => onUpdateSettings(DEFAULT_READER_SETTINGS)}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            รีเซ็ตค่าเริ่มต้น
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
