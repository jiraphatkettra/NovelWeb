"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Rss, BookOpen, Clock, ChevronRight, UserCheck, Sparkles } from "lucide-react";

interface FeedChapter {
  id: string;
  chapterNumber: number;
  title: string;
  coinPrice: number;
  isFree: boolean;
  publishedAt: string;
  story: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
    type: string;
    category: string;
    author: {
      id: string;
      name: string;
      penName?: string;
      avatar?: string;
    };
  };
}

export default function FeedPage() {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<FeedChapter[]>([]);
  const [hasFollows, setHasFollows] = useState(false);
  const [followedCount, setFollowedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        const res = await fetch("/api/v1/feed");
        const json = await res.json();
        if (json.success) {
          setChapters(json.data.items || []);
          setHasFollows(json.data.hasFollows);
          setFollowedCount(json.data.followedCount);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [user]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-white">
            <Rss className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-prompt tracking-tight">
              ฟีดตอนใหม่ (Updates Feed)
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {hasFollows
                ? `อัปเดตตอนใหม่จากนักเขียนที่คุณกำลังติดตาม (${followedCount} คน)`
                : "ตอนใหม่ล่าสุดบนแพลตฟอร์ม (กดติดตามนักเขียนที่คุณชอบเพื่อปรับแต่งฟีดของคุณ)"}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
        </div>
      ) : chapters.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-neutral-900/50 border border-neutral-800 p-8">
          <Sparkles className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white font-prompt">ยังไม่มีตอนใหม่ในฟีด</h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto mb-6">
            เมื่อนักเขียนที่คุณติดตามเผยแพร่ตอนใหม่ ตอนเหล่านั้นจะปรากฏที่นี่ทันที
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs transition hover:bg-neutral-200"
          >
            สำรวจผลงานยอดนิยม
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((ch) => {
            const readerUrl = `/reader/${ch.story.type === "MANGA" ? "manga" : "novel"}/${ch.id}`;
            return (
              <Link
                key={ch.id}
                href={readerUrl}
                className="group flex items-center justify-between p-4 rounded-xl bg-[#121215] hover:bg-neutral-900 border border-white/[0.06] hover:border-white/20 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={ch.story.coverUrl}
                    alt={ch.story.title}
                    className="w-12 aspect-[2/3] object-cover rounded-lg bg-neutral-800 shrink-0 shadow group-hover:scale-105 transition duration-300"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 font-medium">
                        มังงะ
                      </span>
                      <span className="text-[11px] text-neutral-400 truncate">
                        {ch.story.title}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition truncate font-prompt">
                      ตอนที่ {ch.chapterNumber}: {ch.title}
                    </h3>

                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                      <span>โดย: <strong className="text-neutral-300">{ch.story.author.penName || ch.story.author.name}</strong></span>
                      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <Clock className="w-3 h-3" />
                        {new Date(ch.publishedAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {ch.isFree || ch.coinPrice === 0 ? (
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      อ่านฟรี
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#A78BFA] text-xs font-bold font-mono">
                      {ch.coinPrice} เหรียญ
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-[#A78BFA] group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
