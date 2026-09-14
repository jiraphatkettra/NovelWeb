"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Feather, ShieldCheck, FileText, CheckCircle2, Clock, ArrowRight, X } from "lucide-react";

const THAI_BANKS = [
  "ธนาคารกสิกรไทย (KBANK)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน (GSB)",
  "พร้อมเพย์ (PromptPay)",
];

export default function AuthorApplyPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [bankName, setBankName] = useState(THAI_BANKS[0]);
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user already applied
  const [existingStatus, setExistingStatus] = useState<{
    hasApplied: boolean;
    kycStatus?: string;
    isAuthor: boolean;
  } | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/v1/author/apply/status");
        const json = await res.json();
        if (json.success) {
          setExistingStatus(json.data);
          if (json.data.penName) setPenName(json.data.penName);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) checkStatus();
    else setLoading(false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementAccepted) {
      toast.warning("กรุณายอมรับข้อตกลง", "กรุณาอ่านและยอมรับสัญญาข้อตกลงนักเขียนก่อนส่งใบสมัคร");
      return;
    }

    if (idCardNumber.replace(/\D/g, "").length !== 13) {
      toast.warning("เลขบัตรประชาชนไม่ถูกต้อง", "เลขประจำตัวประชาชนต้องมีความยาว 13 หลัก");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/author/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penName,
          bio,
          idCardNumber,
          bankName,
          bankAccountNo,
          bankAccountName,
          agreementAccepted,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("ยื่นใบสมัครสำเร็จ!", json.data.message);
        refreshUser();
        setExistingStatus({
          hasApplied: true,
          kycStatus: "PENDING",
          isAuthor: false,
        });
      } else {
        toast.error("ยื่นใบสมัครไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <Feather className="w-12 h-12 text-neutral-600 mb-4" />
        <h1 className="text-xl font-bold text-white font-prompt mb-2">สมัครเป็นนักเขียน</h1>
        <p className="text-xs text-neutral-400 max-w-sm mb-6">กรุณาเข้าสู่ระบบก่อนยื่นใบสมัครเป็นนักเขียน</p>
        <Link href="/auth/login" className="px-5 py-2.5 rounded-xl bg-[#FFE600] text-black font-bold text-xs hover:bg-[#F5DC00] transition">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="w-12 h-12 rounded-xl bg-[#FFE600]/10 flex items-center justify-center mx-auto text-[#FFE600]">
          <Feather className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white font-prompt tracking-tight">
          สมัครเป็นนักเขียน (Author Application)
        </h1>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          ร่วมเป็นผู้สร้างสรรค์นิยายและมังงะ พร้อมรับส่วนแบ่งรายได้ 70% เมื่อผู้อ่านปลดล็อกตอน
        </p>
      </div>

      {/* Existing Status Banner */}
      {existingStatus?.isAuthor ? (
        <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h2 className="text-base font-bold text-white font-prompt">คุณเป็นนักเขียนเรียบร้อยแล้ว!</h2>
          <p className="text-xs text-emerald-300">
            คุณสามารถเข้าสู่ Author Studio เพื่อสร้างเรื่องใหม่และเขียนตอนได้ทันที
          </p>
          <div className="pt-2">
            <Link
              href="/author"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition"
            >
              <span>ไปที่ Author Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : existingStatus?.hasApplied && existingStatus?.kycStatus === "PENDING" ? (
        <div className="p-5 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20 text-center space-y-2">
          <Clock className="w-8 h-8 text-[#FFE600] mx-auto" />
          <h2 className="text-base font-bold text-white font-prompt">ใบสมัครของคุณอยู่ระหว่างการตรวจสอบ</h2>
          <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
            ทีมงานกำลังตรวจสอบข้อมูลและรายละเอียดบัญชีของคุณ โดยจะแจ้งผลให้ทราบโดยเร็ว
          </p>
        </div>
      ) : (
        /* Application Form */
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Writer Profile */}
          <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-3.5">
            <h2 className="text-xs font-bold text-white font-prompt flex items-center gap-2">
              <Feather className="w-4 h-4 text-[#FFE600]" />
              <span>1. ข้อมูลนักเขียนและงานสร้างสรรค์</span>
            </h2>

            <div>
              <label className="block text-neutral-400 mb-1">นามปากกา (Pen Name) *</label>
              <input
                type="text"
                required
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="เช่น จอมยุทธนิรนาม"
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">เกี่ยวกับตัวเอง / สไตล์งานเขียนที่ถนัด</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="บอกเล่าประสบการณ์ หรือแนวเรื่องที่ตั้งใจจะเขียน เช่น แฟนตาซี, เกิดใหม่, โรแมนติก..."
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600] resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: KYC & Payout Details */}
          <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-3.5">
            <h2 className="text-xs font-bold text-white font-prompt flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFE600]" />
              <span>2. ข้อมูลยืนยันตัวตนและรับเงินส่วนแบ่ง (KYC & Payout)</span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              ข้อมูลนี้จำเป็นสำหรับการยืนยันตัวตนและใช้โอนเงินส่วนแบ่งรายได้ 70% เข้าบัญชีของคุณ
            </p>

            <div>
              <label className="block text-neutral-400 mb-1">เลขประจำตัวประชาชน (13 หลัก) *</label>
              <input
                type="text"
                required
                maxLength={13}
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="1234567890123"
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600] font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">ธนาคารที่รับเงิน *</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
                >
                  {THAI_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">เลขที่บัญชีธนาคาร *</label>
                <input
                  type="text"
                  required
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="เช่น 123-4-56789-0"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600] font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">ชื่อ-นามสกุลเจ้าของบัญชี (ตรงกับบัตรประชาชน) *</label>
              <input
                type="text"
                required
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="เช่น นายสมศักดิ์ รักการเขียน"
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
              />
            </div>
          </div>

          {/* Section 3: Author Agreement */}
          <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-3">
            <h2 className="text-xs font-bold text-white font-prompt flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FFE600]" />
              <span>3. สัญญาข้อตกลงนักเขียน (Author Agreement)</span>
            </h2>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="authorAgreement"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-0.5 rounded accent-[#FFE600]"
              />
              <label htmlFor="authorAgreement" className="text-neutral-300 text-[11px] leading-relaxed cursor-pointer">
                ข้าพเจ้าได้อ่าน เข้าใจ และยอมรับ{" "}
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(true)}
                  className="text-[#FFE600] underline underline-offset-2 font-bold"
                >
                  สัญญาข้อตกลงนักเขียนและนโยบายส่วนแบ่งรายได้ 70%
                </button>{" "}
                ของแพลตฟอร์ม และยืนยันว่าเป็นเจ้าของลิขสิทธิ์ผลงาน ไม่ละเมิดลิขสิทธิ์ของผู้อื่น
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !agreementAccepted}
            className="w-full py-3 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition disabled:opacity-50 active:scale-[0.99]"
          >
            {submitting ? "กำลังส่งใบสมัคร..." : "ส่งใบสมัครเป็นนักเขียน"}
          </button>
        </form>
      )}

      {/* Modal: Author Agreement Viewer */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white font-prompt">
                สัญญาข้อตกลงนักเขียน (Author Agreement)
              </h2>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto text-xs text-neutral-300 space-y-3 pr-2 leading-relaxed">
              <p className="font-bold text-white">ข้อ 1. ลิขสิทธิ์ในผลงาน</p>
              <p>นักเขียนยังคงเป็นเจ้าของลิขสิทธิ์ในผลงานนิยายและมังงะของตนเองอย่างสมบูรณ์ 100% แพลตฟอร์มได้รับสิทธิ์ในการเผยแพร่และจัดจำหน่ายเหรียญเพื่อปลดล็อกอ่านบนระบบเท่านั้น</p>

              <p className="font-bold text-white">ข้อ 2. ส่วนแบ่งรายได้ (Revenue Share 70/30)</p>
              <p>นักเขียนจะได้รับส่วนแบ่งรายได้ 70% จากมูลค่าเหรียญที่ผู้อ่านใช้ปลดล็อกอ่านผลงาน โดยแพลตฟอร์มจะหักค่าบริการระบบ 30% นักเขียนสามารถส่งคำขอถอนเงินได้เมื่อมียอดสะสมขั้นต่ำ 300 บาท</p>

              <p className="font-bold text-white">ข้อ 3. การรับรองความเป็นเจ้าของผลงาน</p>
              <p>นักเขียนรับรองว่าผลงาน ภาพประกอบ และเนื้อหาทั้งหมดที่อัปโหลด ไม่ได้คัดลอก ดัดแปลง หรือละเมิดลิขสิทธิ์ของบุคคลภายนอก หากเกิดการฟ้องร้อง นักเขียนจะต้องเป็นผู้รับผิดชอบตามกฎหมาย</p>

              <p className="font-bold text-white">ข้อ 4. การปฏิบัติตามกฎหมายและเนื้อหา 18+</p>
              <p>ผลงานที่มีเนื้อหาสำหรับผู้ใหญ่ (Mature 18+) จะต้องกำหนดเรตติ้งให้ถูกต้อง เพื่อให้ระบบเปิดใช้งานระบบยืนยันอายุ (Age Gate) ตามมาตรฐาน</p>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAgreementAccepted(true);
                  setShowAgreementModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs"
              >
                รับทราบและยอมรับข้อตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
