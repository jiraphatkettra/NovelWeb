"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  MessageSquare,
  BookOpen,
  User,
  Trash2,
  Eye,
  Filter,
  Layers,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";

interface ReportItem {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
  status: string;
  actionTaken?: string | null;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    penName?: string | null;
    email: string;
    avatar?: string | null;
  };
  targetDetail?: any;
}

export function ReportsManagementTab() {
  const { toast } = useToast();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("targetType", typeFilter);

      const res = await fetch(`/api/v1/admin/reports?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data.reports || []);
      } else {
        toast.error("ดึงข้อมูลรายงานไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const handleUpdateStatus = async (reportId: string, newStatus: string, defaultAction?: string) => {
    let actionTaken = defaultAction;
    if (!actionTaken && newStatus === "RESOLVED") {
      actionTaken = prompt("ระบุการดำเนินการที่ได้จัดการ (เช่น ตักเตือนผู้ใช้ / แก้ไขเนื้อหา):") || "ตรวจสอบและจัดการเรียบร้อยแล้ว";
    }

    setProcessingId(reportId);
    try {
      const res = await fetch("/api/v1/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: newStatus, actionTaken }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: newStatus, actionTaken: actionTaken || r.actionTaken } : r))
        );
      } else {
        toast.error("ดำเนินการไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการปรับสถานะรายงาน");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteOffendingTarget = async (reportId: string) => {
    const confirmed = window.confirm("⚠️ ยืนยันการลบเนื้อหาที่ถูกร้องเรียนนี้ออกจากระบบทันที?");
    if (!confirmed) return;

    setProcessingId(reportId);
    try {
      const res = await fetch(`/api/v1/admin/reports?reportId=${reportId}&deleteTarget=true`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: "RESOLVED", actionTaken: "ลบเนื้อหาเป้าหมายและปิดเรื่อง" } : r))
        );
      } else {
        toast.error("ไม่สามารถลบเนื้อหาได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบเนื้อหา");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-prompt flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            ศูนย์จัดการข้อร้องเรียนและรายงาน ({reports.length} รายการ)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            มีข้อร้องเรียนรอการตรวจสอบ{" "}
            <span className="text-amber-400 font-bold">{pendingCount} รายการ</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FFE600]"
          >
            <option value="ALL">ทุกสถานะ (Status)</option>
            <option value="PENDING">รอตรวจสอบ (PENDING)</option>
            <option value="INVESTIGATING">กำลังตรวจสอบ (INVESTIGATING)</option>
            <option value="RESOLVED">แก้ไขแล้ว (RESOLVED)</option>
            <option value="DISMISSED">ปัดตก/ยกเลิก (DISMISSED)</option>
          </select>

          {/* Target Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FFE600]"
          >
            <option value="ALL">ทุกประเภทเป้าหมาย</option>
            <option value="STORY">ผลงาน (STORY)</option>
            <option value="COMMENT">คอมเมนต์ (COMMENT)</option>
            <option value="USER">ผู้ใช้งาน (USER)</option>
            <option value="CHAPTER">ตอน (CHAPTER)</option>
          </select>

          <button
            onClick={fetchReports}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition border border-white/[0.08]"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-16 text-center text-neutral-500">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
          กำลังโหลดข้อร้องเรียน...
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="font-semibold text-white">ไม่พบรายงานข้อร้องเรียน</p>
          <p className="text-xs text-neutral-500">ไม่มีรายงานที่ตรงกับเงื่อนไขการค้นหาในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      rep.status === "PENDING"
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : rep.status === "INVESTIGATING"
                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                        : rep.status === "RESOLVED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {rep.status}
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.08] text-neutral-300">
                    {rep.targetType}
                  </span>

                  <span className="text-xs font-bold text-amber-400">
                    สาเหตุ: {rep.reason}
                  </span>

                  <span className="text-[11px] text-neutral-500 font-mono">
                    {new Date(rep.createdAt).toLocaleString("th-TH")}
                  </span>
                </div>

                {/* Reporter and Target Snippet */}
                <div className="text-xs text-neutral-400">
                  ผู้รายงาน: <span className="text-neutral-200">{rep.reporter.name || rep.reporter.email}</span>
                </div>

                {/* Target Content Preview */}
                {rep.targetDetail && (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-1">
                    {rep.targetType === "COMMENT" && (
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                          ข้อความคอมเมนต์เป้าหมาย (เขียนโดย {rep.targetDetail.user?.name || "ผู้ใช้"}):
                        </span>
                        <p className="text-white font-serif italic mt-0.5">"{rep.targetDetail.content}"</p>
                        {rep.targetDetail.chapter && (
                          <span className="text-[10px] text-neutral-500 block mt-1">
                            ในเรื่อง: {rep.targetDetail.chapter.story?.title} (ตอนที่ {rep.targetDetail.chapter.chapterNumber})
                          </span>
                        )}
                      </div>
                    )}

                    {rep.targetType === "STORY" && (
                      <div className="flex items-center gap-2.5">
                        {rep.targetDetail.coverUrl && (
                          <img
                            src={rep.targetDetail.coverUrl}
                            alt=""
                            className="w-8 aspect-[2/3] object-cover rounded bg-neutral-800"
                          />
                        )}
                        <div>
                          <p className="font-bold text-white">{rep.targetDetail.title}</p>
                          <Link
                            href={`/stories/${rep.targetDetail.slug}`}
                            target="_blank"
                            className="text-[11px] text-[#FFE600] hover:underline flex items-center gap-1"
                          >
                            <span>เปิดดูผลงาน</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {rep.targetType === "USER" && (
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">ผู้ใช้ที่ถูกร้องเรียน:</span>
                        <p className="text-white font-bold">{rep.targetDetail.name} ({rep.targetDetail.email})</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Complaint Details Note */}
                {rep.details && (
                  <p className="text-xs text-neutral-300 italic bg-amber-500/[0.04] p-2.5 rounded-xl border border-amber-500/20">
                    รายละเอียดคำร้อง: "{rep.details}"
                  </p>
                )}

                {/* Action Taken Note */}
                {rep.actionTaken && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    การดำเนินการ: {rep.actionTaken}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800">
                {rep.targetType === "COMMENT" && rep.status !== "RESOLVED" && (
                  <button
                    disabled={processingId === rep.id}
                    onClick={() => handleDeleteOffendingTarget(rep.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                    title="ลบคอมเมนต์เป้าหมายและปิดเรื่อง"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบคอมเมนต์นี้</span>
                  </button>
                )}

                {rep.status !== "RESOLVED" && (
                  <button
                    disabled={processingId === rep.id}
                    onClick={() => handleUpdateStatus(rep.id, "RESOLVED")}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>จัดการแล้ว</span>
                  </button>
                )}

                {rep.status === "PENDING" && (
                  <button
                    disabled={processingId === rep.id}
                    onClick={() => handleUpdateStatus(rep.id, "INVESTIGATING", "กำลังตรวจสอบข้อเท็จจริง")}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                  >
                    เริ่มสอบสวน
                  </button>
                )}

                {rep.status !== "DISMISSED" && rep.status !== "RESOLVED" && (
                  <button
                    disabled={processingId === rep.id}
                    onClick={() => handleUpdateStatus(rep.id, "DISMISSED", "คำร้องไม่เป็นความจริง หรือไม่พบการละเมิด")}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white text-xs font-semibold transition"
                  >
                    ปัดตกคำร้อง
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
