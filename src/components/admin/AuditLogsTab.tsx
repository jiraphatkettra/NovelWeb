"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Search,
  RefreshCw,
  User,
  BookOpen,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Send,
  Eye,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface AuditLogItem {
  id: string;
  adminId: string;
  adminRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    penName?: string | null;
    email: string;
    role: string;
  };
}

export function AuditLogsTab() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [targetTypeFilter, setTargetTypeFilter] = useState("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (targetTypeFilter !== "ALL") params.set("targetType", targetTypeFilter);

      const res = await fetch(`/api/v1/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
      } else {
        toast.error("ดึงข้อมูลบันทึกความปลอดภัยไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetTypeFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVE")) {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (action.includes("SUSPEND") || action.includes("DELETE") || action.includes("REJECT")) {
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }
    if (action.includes("BROADCAST") || action.includes("COIN")) {
      return "bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30";
    }
    return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-prompt flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            บันทึกประวัติการทำงานของทีมงาน (Audit Logs)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            ติดตามทุกคำสั่งและมาตรการตรวจสอบเพื่อความโปร่งใส ({logs.length} รายการล่าสุด)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="ALL">ทุกการกระทำ (Action)</option>
            <option value="CONTENT">ตรวจเนื้อหา (CONTENT)</option>
            <option value="CHAPTER">จัดการตอน (CHAPTER)</option>
            <option value="USER">จัดการผู้ใช้ (USER)</option>
            <option value="PAYOUT">อนุมัติถอนเงิน (PAYOUT)</option>
            <option value="REPORT">จัดการรายงาน (REPORT)</option>
            <option value="BROADCAST">ประกาศระบบ (BROADCAST)</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="ALL">ทุกประเภทเป้าหมาย</option>
            <option value="STORY">STORY (ผลงาน)</option>
            <option value="CHAPTER">CHAPTER (ตอน)</option>
            <option value="USER">USER (ผู้ใช้)</option>
            <option value="PAYOUT">PAYOUT (ถอนเงิน)</option>
            <option value="REPORT">REPORT (รายงาน)</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition border border-white/[0.08]"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Logs Table / Timeline */}
      {loading ? (
        <div className="py-16 text-center text-neutral-500">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
          กำลังโหลดบันทึกความปลอดภัย...
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-400">
          <p className="font-semibold text-white">ไม่พบบันทึกการทำงานที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900/60 divide-y divide-neutral-800/80 text-xs">
          {logs.map((log) => {
            let detailsObj: any = null;
            if (log.details) {
              try {
                detailsObj = JSON.parse(log.details);
              } catch {
                detailsObj = log.details;
              }
            }

            return (
              <div key={log.id} className="p-4 hover:bg-white/[0.02] transition space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Admin identity */}
                    <div className="flex items-center gap-1.5 font-medium text-white">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{log.admin.name || log.admin.email}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {log.adminRole}
                      </span>
                    </div>

                    <span className="text-neutral-600 hidden sm:inline">•</span>

                    {/* Action badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>

                    <span className="text-neutral-400 text-[11px]">
                      เป้าหมาย: <span className="text-neutral-200 font-mono">{log.targetType}</span> ({log.targetId.slice(0, 10)}...)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(log.createdAt).toLocaleString("th-TH")}</span>
                    {log.ipAddress && (
                      <span className="font-mono text-[10px] text-neutral-600">({log.ipAddress})</span>
                    )}
                  </div>
                </div>

                {/* Details snippet */}
                {detailsObj && (
                  <div className="text-[11px] text-neutral-400 bg-black/40 p-2 rounded-xl border border-white/[0.04]">
                    {typeof detailsObj === "object" ? (
                      <pre className="whitespace-pre-wrap font-mono text-[10px] text-neutral-300 overflow-x-auto">
                        {JSON.stringify(detailsObj, null, 2)}
                      </pre>
                    ) : (
                      <p>{detailsObj}</p>
                    )}
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
