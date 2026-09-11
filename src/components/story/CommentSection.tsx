"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Send, Reply, Heart, Pin, CornerDownRight } from "lucide-react";

interface CommentUser {
  id: string;
  name: string;
  penName?: string | null;
  avatar?: string | null;
  role: string;
}

interface CommentItem {
  id: string;
  content: string;
  likes: number;
  isPinned: boolean;
  createdAt: string;
  user: CommentUser;
  replies?: CommentItem[];
}

interface CommentSectionProps {
  storyId?: string;
  chapterId?: string;
  authorId?: string;
}

export function CommentSection({ storyId, chapterId, authorId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchComments = async () => {
    try {
      const param = chapterId ? `chapterId=${chapterId}` : `storyId=${storyId}`;
      const res = await fetch(`/api/v1/comments?${param}`);
      const json = await res.json();
      if (json.success) {
        setComments(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storyId || chapterId) {
      fetchComments();
    }
  }, [storyId, chapterId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          chapterId,
          content: newComment.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewComment("");
        // Prepend new comment to local list immediately
        setComments((prev) => [json.data, ...prev]);
      } else {
        alert(json.error?.message || "ส่งความคิดเห็นไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการส่งความคิดเห็น");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนตอบกลับ");
      return;
    }
    if (!replyContent.trim()) return;

    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          chapterId,
          parentId,
          content: replyContent.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyToId(null);
        setReplyContent("");
        // Add reply to parent comment in state
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), json.data],
              };
            }
            return c;
          })
        );
      } else {
        alert(json.error?.message || "ตอบกลับไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการตอบกลับ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-neutral-400" />
          <h3 className="text-lg font-bold text-white font-prompt">
            ความคิดเห็น ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
          </h3>
        </div>
      </div>

      {/* Write Comment Box */}
      <form onSubmit={handlePostComment} className="space-y-3">
        <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 focus-within:border-white/30 transition p-3">
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
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none resize-none"
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
            <span className="text-neutral-500 text-[11px]">
              {user ? `แสดงความเห็นในชื่อ: ${user.name}` : "ยังไม่ได้เข้าสู่ระบบ"}
            </span>
            <button
              type="submit"
              disabled={!user || !newComment.trim() || submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs transition disabled:opacity-30 hover:bg-neutral-200 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "กำลังส่ง..." : "ส่งความคิดเห็น"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="py-10 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-10 text-center text-neutral-500 text-xs">
          ยังไม่มีความคิดเห็น มาร่วมเป็นคนแรกที่แสดงความคิดเห็นในตอนนี้!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((item) => {
            const isStoryAuthor = authorId && item.user.id === authorId;
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-3"
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
                      className="w-8 h-8 rounded-full object-cover bg-neutral-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {item.user.penName || item.user.name}
                        </span>
                        {isStoryAuthor && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            นักเขียน
                          </span>
                        )}
                        {item.user.role === "SUPER_ADMIN" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                            แอดมิน
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500">
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
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded">
                      <Pin className="w-3 h-3" />
                      ปักหมุด
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-xs text-neutral-200 whitespace-pre-line leading-relaxed pl-10">
                  {item.content}
                </p>

                {/* Action Bar */}
                <div className="flex items-center gap-4 pl-10 pt-1 text-xs text-neutral-400">
                  <button
                    onClick={() => setReplyToId(replyToId === item.id ? null : item.id)}
                    className="flex items-center gap-1 hover:text-white transition"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>ตอบกลับ</span>
                  </button>
                </div>

                {/* Reply Input Box */}
                {replyToId === item.id && (
                  <div className="ml-10 mt-2 p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 animate-in fade-in">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`ตอบกลับ ${item.user.name}...`}
                      className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setReplyToId(null);
                          setReplyContent("");
                        }}
                        className="px-3 py-1 rounded-lg text-[11px] text-neutral-400 hover:text-white"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => handlePostReply(item.id)}
                        disabled={!replyContent.trim()}
                        className="px-3 py-1 rounded-lg bg-white text-black text-[11px] font-semibold hover:bg-neutral-200 disabled:opacity-40"
                      >
                        ตอบกลับ
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {item.replies && item.replies.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2 border-l border-neutral-800 pl-3">
                    {item.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              reply.user.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                            }
                            alt={reply.user.name}
                            className="w-5 h-5 rounded-full object-cover bg-neutral-800"
                          />
                          <span className="text-[11px] font-bold text-white">
                            {reply.user.penName || reply.user.name}
                          </span>
                          {authorId && reply.user.id === authorId && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold">
                              นักเขียน
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-500 ml-auto">
                            {new Date(reply.createdAt).toLocaleDateString("th-TH")}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1 pl-7">{reply.content}</p>
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
