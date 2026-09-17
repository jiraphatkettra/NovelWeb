"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  MessageSquare,
  Send,
  Reply,
  Pin,
  Clock,
  User,
  MoreVertical,
  CheckCircle,
} from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    penName?: string;
    avatar?: string;
    role: string;
  };
  replies?: CommentItem[];
}

interface CommentSectionProps {
  storyId: string;
  chapterId?: string;
  authorId?: string;
}

export function CommentSection({ storyId, chapterId, authorId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const params = new URLSearchParams();
      params.set("storyId", storyId);
      if (chapterId) params.set("chapterId", chapterId);

      const res = await fetch(`/api/v1/comments?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setComments(json.data);
      }
    } catch {
      console.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [storyId, chapterId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    if (!user) {
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนแสดงความคิดเห็น");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          chapterId: chapterId || undefined,
          content: newComment.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewComment("");
        toast.success("ส่งความคิดเห็นสำเร็จ!");
        fetchComments();
      } else {
        toast.error("ส่งความเห็นไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    if (!user) {
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนตอบกลับความคิดเห็น");
      return;
    }

    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          chapterId: chapterId || undefined,
          parentId,
          content: replyContent.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyContent("");
        setReplyToId(null);
        toast.success("ตอบกลับสำเร็จ!");
        fetchComments();
      }
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-100 font-prompt">
            ความคิดเห็น ({comments.length})
          </h3>
        </div>
      </div>

      {/* Write Comment Box */}
      <form onSubmit={handlePostComment} className="space-y-3">
        <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.08] focus-within:border-white/20 transition p-3.5">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              user
                ? "แสดงความคิดเห็นหรือให้กำลังใจนักเขียน..."
                : "กรุณาเข้าสู่ระบบเพื่อร่วมแสดงความคิดเห็น"
            }
            disabled={!user || submitting}
            rows={3}
            className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed font-sarabun"
          />

          <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs">
            <span className="text-zinc-500 text-[11px]">
              {user ? `แสดงความเห็นในชื่อ: ${user.name}` : "ยังไม่ได้เข้าสู่ระบบ"}
            </span>
            <button
              type="submit"
              disabled={!user || !newComment.trim() || submitting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition disabled:opacity-30 shadow-sm font-prompt"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "กำลังส่ง..." : "ส่งความเห็น"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="py-10 text-center">
          <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 text-xs rounded-xl border border-white/[0.04] bg-white/[0.01]">
          ยังไม่มีความคิดเห็น ร่วมเป็นคนแรกที่แสดงความคิดเห็น!
        </div>
      ) : (
        <div className="space-y-2.5">
          {comments.map((item) => {
            const isStoryAuthor = authorId && item.user.id === authorId;
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        item.user.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                      }
                      alt={item.user.name}
                      className="w-7 h-7 rounded-full object-cover bg-zinc-800 shrink-0 ring-1 ring-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200 font-prompt">
                          {item.user.penName || item.user.name}
                        </span>
                        {isStoryAuthor && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                            นักเขียน
                          </span>
                        )}
                        {item.user.role === "SUPER_ADMIN" && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                            แอดมิน
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(item.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {item.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                      <Pin className="w-3 h-3" />
                      ปักหมุด
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed pl-9 font-sarabun">
                  {item.content}
                </p>

                {/* Action Bar */}
                <div className="flex items-center gap-4 pl-9 pt-0.5 text-xs text-zinc-500">
                  <button
                    onClick={() => setReplyToId(replyToId === item.id ? null : item.id)}
                    className="flex items-center gap-1 hover:text-zinc-200 transition text-[11px]"
                  >
                    <Reply className="w-3 h-3" />
                    <span>ตอบกลับ</span>
                  </button>
                </div>

                {/* Reply Input Box */}
                {replyToId === item.id && (
                  <div className="ml-9 mt-2 p-2.5 rounded-xl bg-black/50 border border-white/[0.08] space-y-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`ตอบกลับ ${item.user.name}...`}
                      className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setReplyToId(null);
                          setReplyContent("");
                        }}
                        className="px-2.5 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-200"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => handlePostReply(item.id)}
                        disabled={!replyContent.trim()}
                        className="px-3 py-1 rounded bg-zinc-100 text-zinc-950 text-[11px] font-semibold hover:bg-white disabled:opacity-40"
                      >
                        ตอบกลับ
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {item.replies && item.replies.length > 0 && (
                  <div className="ml-7 mt-2 space-y-2 border-l border-white/[0.06] pl-3">
                    {item.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.04]"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              reply.user.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                            }
                            alt={reply.user.name}
                            className="w-5 h-5 rounded-full object-cover bg-zinc-800"
                          />
                          <span className="text-[11px] font-semibold text-zinc-200">
                            {reply.user.penName || reply.user.name}
                          </span>
                          {authorId && reply.user.id === authorId && (
                            <span className="text-[9px] font-mono px-1 rounded bg-amber-500/15 text-amber-300">
                              นักเขียน
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                            {new Date(reply.createdAt).toLocaleDateString("th-TH")}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 pl-7 font-sarabun">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
