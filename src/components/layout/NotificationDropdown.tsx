"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  BookOpen,
  MessageSquare,
  Gift,
  Coins,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/notifications");
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch("/api/v1/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-neutral-400 hover:text-white transition"
        title="การแจ้งเตือน"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-kakao-yellow text-[10px] font-bold text-white ring-2 ring-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Glassmorphism Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#111114] border border-kakao-border shadow-2xl shadow-black/80 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-kakao-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-prompt">
                การแจ้งเตือน
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-kakao-yellow/10 text-kakao-yellow text-[10px] font-bold">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-kakao-border">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-2 text-neutral-500">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-400 font-medium">ยังไม่มีการแจ้งเตือนในขณะนี้</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  เมื่อนักเขียนที่คุณติดตามอัปเดตตอนใหม่ จะแจ้งให้ทราบที่นี่
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isChapter = notif.type === "CHAPTER_RELEASE";
                const isReward = notif.type === "REWARD";
                const isComment = notif.type === "COMMENT_REPLY";

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                      notif.isRead
                        ? "bg-transparent hover:bg-white/[0.03]"
                        : "bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs mt-0.5 ${
                        isChapter
                          ? "bg-kakao-yellow/10 text-kakao-yellow"
                          : isReward
                          ? "bg-green-500/10 text-green-400"
                          : isComment
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-white/5 text-neutral-400"
                      }`}
                    >
                      {isChapter ? (
                        <Sparkles className="w-4 h-4" />
                      ) : isReward ? (
                        <Coins className="w-4 h-4" />
                      ) : isComment ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            notif.isRead ? "text-neutral-300" : "text-white"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-kakao-yellow shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 font-sarabun leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
