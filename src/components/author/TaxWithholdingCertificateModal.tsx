"use client";

import React, { useRef } from "react";
import { X, Printer, FileText, CheckCircle2, ShieldCheck } from "lucide-react";

interface TaxWithholdingCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutData: {
    id: string;
    authorName: string;
    idCardNumber?: string;
    bankName: string;
    bankAccountNo: string;
    date: string;
    amountThb: number;
    taxThb: number;
    feeThb: number;
    netAmountThb: number;
  };
}

export function TaxWithholdingCertificateModal({
  isOpen,
  onClose,
  payoutData,
}: TaxWithholdingCertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#141418] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-kakao-yellow" />
            <h3 className="text-base font-bold text-white font-prompt">
              หนังสือรับรองการหักภาษี ณ ที่จ่าย (มาตรา 50 ทวิ)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body (Printable Area) */}
        <div ref={printRef} className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300">
          {/* Company / Payer Header */}
          <div className="border-b border-white/10 pb-4 flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-white font-prompt">ผู้จ่ายเงินได้ (Payer)</h4>
              <p className="mt-1 text-neutral-400">บริษัท รี้ดเวิร์ส จำกัด (สำนักงานใหญ่)</p>
              <p className="text-neutral-500">เลขประจำตัวผู้เสียภาษี: 0-1055-68000-12-3</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                ออกโดยระบบอัตโนมัติ
              </span>
              <p className="text-[11px] text-neutral-500 mt-1">เลขที่อ้างอิง: WHT-{payoutData.id.slice(0, 8)}</p>
              <p className="text-[11px] text-neutral-500">วันที่: {payoutData.date}</p>
            </div>
          </div>

          {/* Payee / Author Details */}
          <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl space-y-1.5">
            <h4 className="font-bold text-white text-xs font-prompt mb-2">ผู้มีเงินได้ (Payee)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500 block">ชื่อ-นามสกุล / นามปากกา:</span>
                <span className="text-white font-medium">{payoutData.authorName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">เลขประจำตัวประชาชน:</span>
                <span className="text-white font-mono">{payoutData.idCardNumber || "ยืนยันแล้วในระบบ"}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">ธนาคารปลายทาง:</span>
                <span className="text-white font-medium">{payoutData.bankName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">เลขที่บัญชี:</span>
                <span className="text-white font-mono">{payoutData.bankAccountNo}</span>
              </div>
            </div>
          </div>

          {/* Tax Calculation Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/[0.04] text-neutral-400 border-b border-white/10">
                <tr>
                  <th className="p-3">ประเภทเงินได้พึงประเมิน</th>
                  <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                  <th className="p-3 text-right">อัตราภาษี</th>
                  <th className="p-3 text-right">ภาษีที่หักไว้ (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                <tr>
                  <td className="p-3 font-sans">
                    ค่าลิขสิทธิ์นิยาย/มังงะ (ม.40(3) แห่งประมวลรัษฎากร)
                  </td>
                  <td className="p-3 text-right text-white font-bold">
                    {payoutData.amountThb.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-kakao-yellow font-bold">3%</td>
                  <td className="p-3 text-right text-rose-400 font-bold">
                    -{payoutData.taxThb.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Breakdown Summary */}
          <div className="bg-black/60 p-4 rounded-xl border border-white/10 flex justify-between items-center font-mono">
            <div className="text-neutral-400 text-xs">
              <p>ค่าธรรมเนียมการโอนธนาคาร: {payoutData.feeThb} บาท</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">หักภาษีเพื่อนำส่งกรมสรรพากรตามแบบ ภ.ง.ด.3</p>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 text-xs block">ยอดเงินสุทธิที่โอนเข้าบัญชี (Net Paid)</span>
              <span className="text-xl font-bold text-emerald-400 font-prompt">
                ฿{payoutData.netAmountThb.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 flex justify-end gap-3 bg-black/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition"
          >
            ปิด
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kakao-yellow text-black font-bold text-xs hover:bg-kakao-yellow-hover transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์เอกสาร (Print / PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
