"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, UserCheck } from "lucide-react";

interface AuthorFollowButtonProps {
  authorId: string;
  authorName?: string;
  className?: string;
}

export function AuthorFollowButton({ authorId, authorName, className = "" }: AuthorFollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function checkFollow() {
      try {
        const res = await fetch(`/api/v1/author/${authorId}/follow`);
        const json = await res.json();
        if (json.success) {
          setIsFollowing(json.data.isFollowing);
          setFollowerCount(json.data.followerCount);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (authorId) {
      checkFollow();
    }
  }, [authorId, user]);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนกดติดตามนักเขียน");
      return;
    }

    if (user.id === authorId) {
      alert("ไม่สามารถติดตามบัญชีตนเองได้");
      return;
    }

    setToggling(true);
    try {
      const res = await fetch(`/api/v1/author/${authorId}/follow`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setIsFollowing(json.data.isFollowing);
        setFollowerCount(json.data.followerCount);
      } else {
        alert(json.error?.message || "ดำเนินการไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setToggling(false);
    }
  };

  if (user && user.id === authorId) return null;

  return (
    <button
      onClick={handleToggleFollow}
      disabled={toggling}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition active:scale-95 disabled:opacity-50 ${
        isFollowing
          ? "bg-white/10 hover:bg-rose-500/20 text-neutral-200 hover:text-rose-300 border border-white/15 hover:border-rose-500/30"
          : "bg-white text-black hover:bg-neutral-200 font-bold shadow-sm"
      } ${className}`}
      title={isFollowing ? "คลิกเพื่อเลิกติดตาม" : `กดติดตาม ${authorName || "นักเขียน"}`}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>กำลังติดตาม</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>ติดตาม</span>
        </>
      )}
      {followerCount > 0 && (
        <span className="text-[10px] opacity-70 ml-0.5">({followerCount})</span>
      )}
    </button>
  );
}
