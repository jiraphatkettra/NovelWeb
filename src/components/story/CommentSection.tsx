"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { MessageSquare, Send, Reply, Pin, Trash2, Heart, Flame } from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  hasLiked?: boolean;
  isPinned?: boolean;
  user: {
    id: string;
    name: string;
    penName?: string;
    avatar?: string;
    role?: string;
  };
  replies?: CommentItem[];
}

interface CommentSectionProps {
  storyId?: string;
  chapterId?: string;
  authorId?: string;
}

export function CommentSection({
  storyId,
  chapterId,
  authorId,
}: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check if current user is comment author OR admin/moderator
  const canDeleteComment = (commentUserId: string) => {
    if (!user) return false;
    return (
      user.id === commentUserId ||
      user.role === "SUPER_ADMIN" ||
      user.role === "MODERATOR" ||
      (user.role as string) === "ADMIN"
    );
  };

  const handleDeleteComment = async (commentId: string, parentId?: string) => {
    if (!window.confirm("คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(`/api/v1/comments?id=${commentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ลบความคิดเห็นเรียบร้อยแล้ว");
        if (parentId) {
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: (c.replies || []).filter((r) => r.id !== commentId),
                };
              }
              return c;
            })
          );
        } else {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
        }
      } else {
        toast.error("ลบความคิดเห็นไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบความคิดเห็น");
    }
  };

  const handleLikeComment = async (commentId: string, parentId?: string) => {
    if (!user) {
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนกดไลค์ความคิดเห็น");
      return;
    }

    // Optimistic update
    if (parentId) {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: (c.replies || []).map((r) => {
                if (r.id === commentId) {
                  const newHasLiked = !r.hasLiked;
                  return {
                    ...r,
                    hasLiked: newHasLiked,
                    likes: newHasLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 0) - 1),
                  };
                }
                return r;
              }),
            };
          }
          return c;
        })
      );
    } else {
      setComments((prev) => {
        const updated = prev.map((c) => {
          if (c.id === commentId) {
            const newHasLiked = !c.hasLiked;
            return {
              ...c,
              hasLiked: newHasLiked,
              likes: newHasLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1),
            };
          }
          return c;
        });
        // Re-sort: isPinned DESC, likes DESC, createdAt DESC
        return [...updated].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if ((b.likes || 0) !== (a.likes || 0)) return (b.likes || 0) - (a.likes || 0);
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
    }

    try {
      const res = await fetch(`/api/v1/comments/${commentId}/like`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        fetchComments();
        toast.error("ไม่สามารถกดไลค์ได้", json.error?.message);
      }
    } catch {
      fetchComments();
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const fetchComments = async () => {
    try {
      const query = chapterId
        ? `chapterId=${chapterId}`
        : `storyId=${storyId}`;
      const res = await fetch(`/api/v1/comments?${query}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setComments(json.data);
      }
    } catch {
      console.error("Failed to fetch comments");
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
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนแสดงความคิดเห็น");
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
        setComments((prev) => [json.data, ...prev]);
        toast.success("แสดงความคิดเห็นเรียบร้อยแล้ว");
      } else {
        toast.error("ส่งความคิดเห็นไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งความคิดเห็น");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!user) {
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนตอบกลับ");
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
        toast.success("ตอบกลับเรียบร้อยแล้ว");
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
        toast.error("ตอบกลับไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการตอบกลับ");
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-neutral-400" />
          <h3 className="text-base font-bold text-white font-prompt">
            ความคิดเห็น ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
          </h3>
        </div>
      </div>

      {/* Write Comment Box */}
      <form onSubmit={handlePostComment} className="space-y-3">
        <div className="relative rounded-xl bg-[#121215] border border-white/[0.08] focus-within:border-[#8B5CF6]/60 transition p-3">
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
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
            <span className="text-neutral-500 text-[11px]">
              {user ? `ความคิดเห็นในชื่อ: ${user.name}` : "ยังไม่ได้เข้าสู่ระบบ"}
            </span>
            <button
              type="submit"
              disabled={!user || !newComment.trim() || submitting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] text-white font-semibold text-xs transition disabled:opacity-30 hover:bg-[#7C3AED] shadow-sm shadow-purple-500/20"
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
          <div className="animate-spin w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-neutral-500 text-xs">
          ยังไม่มีความคิดเห็น ร่วมเป็นคนแรกที่แสดงความคิดเห็น!
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const maxLikes = Math.max(0, ...comments.map((c) => c.likes || 0));
            return comments.map((item) => {
              const isStoryAuthor = authorId && item.user.id === authorId;
              const isTopComment = !item.isPinned && (item.likes || 0) > 0 && (item.likes || 0) === maxLikes;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl transition space-y-2.5 ${
                    item.isPinned
                      ? "bg-[#8B5CF6]/5 border border-[#8B5CF6]/30 shadow-md shadow-purple-950/10"
                      : isTopComment
                      ? "bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.02] to-transparent border border-amber-500/40 shadow-lg shadow-amber-950/20"
                      : "bg-white/[0.02] border border-white/[0.06]"
                  }`}
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
                        className="w-7 h-7 rounded-full object-cover bg-neutral-800 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {item.user.penName || item.user.name}
                          </span>
                          {isStoryAuthor && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] font-semibold border border-[#8B5CF6]/30">
                              นักเขียน
                            </span>
                          )}
                          {item.user.role === "SUPER_ADMIN" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
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

                    <div className="flex items-center gap-1.5">
                      {isTopComment && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 shadow-sm">
                          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ท็อปเมนท์
                        </span>
                      )}

                      {item.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] text-[#C4B5FD] font-semibold bg-[#8B5CF6]/15 px-2 py-0.5 rounded border border-[#8B5CF6]/20">
                          <Pin className="w-3 h-3 text-[#A78BFA]" />
                          ปักหมุด
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-xs text-neutral-200 pl-9 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>

                  {/* Action Bar */}
                  <div className="flex items-center gap-3 pl-9 pt-0.5 text-xs text-neutral-400">
                    {/* Like Comment Button */}
                    <button
                      onClick={() => handleLikeComment(item.id)}
                      className={`flex items-center gap-1.5 transition text-[11px] font-medium px-2 py-0.5 rounded-md ${
                        item.hasLiked
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "hover:text-rose-400 text-neutral-400 hover:bg-white/[0.04]"
                      }`}
                      title={item.hasLiked ? "ยกเลิกถูกใจ" : "ถูกใจความคิดเห็น"}
                    >
                      <Heart className={`w-3.5 h-3.5 transition-transform ${item.hasLiked ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
                      <span>{item.likes || 0}</span>
                    </button>

                    <button
                      onClick={() => setReplyToId(replyToId === item.id ? null : item.id)}
                      className="flex items-center gap-1 hover:text-white transition text-[11px]"
                    >
                      <Reply className="w-3 h-3" />
                      <span>ตอบกลับ</span>
                    </button>

                    {canDeleteComment(item.user.id) && (
                      <button
                        onClick={() => handleDeleteComment(item.id)}
                        className="flex items-center gap-1 text-neutral-500 hover:text-rose-400 transition text-[11px]"
                        title="ลบความคิดเห็น"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ลบ</span>
                      </button>
                    )}
                  </div>

                  {/* Reply Input Box */}
                  {replyToId === item.id && (
                    <div className="ml-9 mt-2 p-2.5 rounded-xl bg-black border border-white/[0.08] space-y-2 animate-in fade-in">
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
                          className="px-2.5 py-1 rounded text-[11px] text-neutral-400 hover:text-white"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={() => handlePostReply(item.id)}
                          disabled={!replyContent.trim()}
                          className="px-3 py-1 rounded bg-[#8B5CF6] text-white text-[11px] font-semibold hover:bg-[#7C3AED] disabled:opacity-40"
                        >
                          ตอบกลับ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {item.replies && item.replies.length > 0 && (
                    <div className="ml-7 mt-2 space-y-2 border-l border-white/[0.08] pl-3">
                      {item.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04]"
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
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] font-semibold border border-[#8B5CF6]/25">
                                นักเขียน
                              </span>
                            )}
                            <span className="text-[10px] text-neutral-500 ml-auto">
                              {new Date(reply.createdAt).toLocaleDateString("th-TH")}
                            </span>
                            {canDeleteComment(reply.user.id) && (
                              <button
                                onClick={() => handleDeleteComment(reply.id, item.id)}
                                className="text-neutral-500 hover:text-rose-400 transition p-1"
                                title="ลบคำตอบ"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-neutral-300 mt-1 pl-7">{reply.content}</p>

                          {/* Reply Action Bar */}
                          <div className="flex items-center gap-3 pl-7 pt-1.5 text-[11px] text-neutral-400">
                            <button
                              onClick={() => handleLikeComment(reply.id, item.id)}
                              className={`flex items-center gap-1 transition text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                reply.hasLiked
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : "hover:text-rose-400 text-neutral-500 hover:bg-white/[0.04]"
                              }`}
                              title={reply.hasLiked ? "ยกเลิกถูกใจ" : "ถูกใจความคิดเห็น"}
                            >
                              <Heart className={`w-3 h-3 ${reply.hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                              <span>{reply.likes || 0}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
