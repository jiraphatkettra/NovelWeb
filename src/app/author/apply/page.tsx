"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Feather,
  ShieldCheck,
  Building,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
} from "lucide-react";

const THAI_BANKS = [
  "ธนาคารกสิกรไทย (KBANK)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน (GSB)",
];

export default function ApplyAuthorPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [bankName, setBankName] = useState(THAI_BANKS[0]);
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [existingStatus, setExistingStatus] = useState<{
    hasApplied: boolean;
    kycStatus?: string;
    isAuthor?: boolean;
    createdAt?: string;
  } | null>(null);

  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/v1/author/apply");
        const json = await res.json();
        if (json.success) {
          setExistingStatus(json.data);
          if (json.data.penName) setPenName(json.data.penName);
          if (json.data.bankName) setBankName(json.data.bankName);
          if (json.data.bankAccountNo) setBankAccountNo(json.data.bankAccountNo);
          if (json.data.bankAccountName) setBankAccountName(json.data.bankAccountName);
          if (json.data.bio) setBio(json.data.bio);
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
      alert("กรุณาอ่านและยอมรับสัญญาข้อตกลงนักเขียนก่อนส่งใบสมัคร");
      return;
    }

    if (idCardNumber.replace(/\D/g, "").length !== 13) {
      alert("เลขประจำตัวประชาชนต้องมีความยาว 13 หลัก");
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
        alert(json.data.message);
        refreshUser();
        setExistingStatus({
          hasApplied: true,
          kycStatus: "PENDING",
        });
      } else {
        alert(json.error?.message || "ยื่นใบสมัครไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <Feather className="w-16 h-16 text-neutral-600 mb-4" />
        <h1 className="text-2xl font-bold text-white font-prompt mb-2">สมัครเป็นนักเขียน ReadVerse</h1>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">กรุณาเข้าสู่ระบบก่อนยื่นใบสมัครเป็นนักเขียน</p>
        <Link href="/auth/login" className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 pb-6 border-b border-white/[0.08]">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-white">
          <Feather className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-prompt tracking-tight">
          สมัครเป็นนักเขียน (Author Application)
        </h1>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto">
          ร่วมเป็นผู้สร้างสรรค์นิยายและมังงะบนแพลตฟอร์ม ReadVerse พร้อมรับส่วนแบ่งรายได้ 70% เมื่อผู้อ่านปลดล็อกตอน
        </p>
      </div>

      {/* Existing Status Banner */}
      {existingStatus?.isAuthor ? (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-bold text-white font-prompt">คุณเป็นนักเขียนเรียบร้อยแล้ว!</h2>
          <p className="text-xs text-emerald-300">
            คุณสามารถเข้าสู่ Author Studio เพื่อสร้างเรื่องใหม่และเขียนตอนได้ทันที
          </p>
          <div className="pt-2">
            <Link
              href="/author"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition"
            >
              <span>ไปที่ Author Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : existingStatus?.hasApplied && existingStatus?.kycStatus === "PENDING" ? (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
          <Clock className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white font-prompt">ใบสมัครของคุณอยู่ระหว่างการตรวจสอบ</h2>
          <p className="text-xs text-amber-300 max-w-md mx-auto">
            ทีมงานกำลังตรวจสอบข้อมูล KYC และรายละเอียดบัญชีธนาคารของคุณ จะแจ้งผลอนุมัติให้ทราบโดยเร็ว (หรือให้สลับเป็นบทบาท Super Admin เพื่อกดอนุมัติในหน้า Admin Panel ได้ทันที)
          </p>
        </div>
      ) : (
        /* Application Form */
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Writer Profile */}
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-bold text-white font-prompt flex items-center gap-2">
              <Feather className="w-4 h-4 text-white" />
              <span>1. ข้อมูลนักเขียนและงานสร้างสรรค์</span>
            </h2>

            <div>
              <label className="block text-neutral-400 mb-1.5">นามปากกา (Pen Name) *</label>
              <input
                type="text"
                required
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="เช่น จอมยุทธนิรนาม"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1.5">เกี่ยวกับตัวเอง / สไตล์งานเขียนที่ถนัด</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="บอกเล่าประสบการณ์ ความถนัด หรือแนวเรื่องที่ตั้งใจจะเขียน เช่น แฟนตาซี, กำลังภายใน, โรแมนติก..."
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40 resize-none"
              />
            </div>
          </div>

          {/* Section 2: KYC & Payout Details */}
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-bold text-white font-prompt flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>2. ข้อมูลยืนยันตัวตนและรับเงินส่วนแบ่ง (KYC & Payout)</span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              ข้อมูลนี้จำเป็นสำหรับการยืนยันตัวตนตามกฎหมายและใช้โอนเงินส่วนแบ่งรายได้ 70% เข้าบัญชีของคุณ
            </p>

            <div>
              <label className="block text-neutral-400 mb-1.5">เลขประจำตัวประชาชน (13 หลัก) *</label>
              <input
                type="text"
                required
                maxLength={13}
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="1234567890123"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-400 mb-1.5">ธนาคารที่รับเงิน *</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
                >
                  {THAI_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1.5">เลขที่บัญชีธนาคาร *</label>
                <input
                  type="text"
                  required
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="เช่น 123-4-56789-0"
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1.5">ชื่อ-นามสกุลเจ้าของบัญชี (ตรงกับบัตรประชาชน) *</label>
              <input
                type="text"
                required
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="เช่น นายสมศักดิ์ รักการเขียน"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          {/* Section 3: Author Agreement */}
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-bold text-white font-prompt flex items-center gap-2">
              <FileText className="w-4 h-4 text-white" />
              <span>3. สัญญาข้อตกลงนักเขียน (Author Agreement)</span>
            </h2>

            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="authorAgreement"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-0.5 rounded bg-neutral-950 border-neutral-800 text-amber-500"
              />
              <label htmlFor="authorAgreement" className="text-neutral-300 leading-relaxed cursor-pointer">
                ข้าพเจ้าได้อ่าน เข้าใจ และยอมรับ{" "}
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(true)}
                  className="text-white underline underline-offset-2 font-bold"
                >
                  สัญญาข้อตกลงนักเขียนและนโยบายส่วนแบ่งรายได้ 70%
                </button>{" "}
                ของแพลตฟอร์ม ReadVerse และขอยืนยันว่าผลงานทั้งหมดที่จะเผยแพร่เป็นผลงานที่สร้างสรรค์ขึ้นด้วยตนเอง ไม่ละเมิดลิขสิทธิ์ของผู้อื่น
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !agreementAccepted}
            className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-200 transition disabled:opacity-50 shadow-md shadow-white/10"
          >
            {submitting ? "กำลังส่งใบสมัคร..." : "ส่งใบสมัครเป็นนักเขียน"}
          </button>
        </form>
      )}

      {/* Modal: Author Agreement Viewer */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h2 className="text-lg font-bold text-white font-prompt">
              สัญญาข้อตกลงนักเขียน ReadVerse (Author Agreement)
            </h2>
            <div className="flex-1 overflow-y-auto text-xs text-neutral-300 space-y-3 pr-2 leading-relaxed">
              <p className="font-bold text-white">ข้อ 1. ลิขสิทธิ์ในผลงาน</p>
              <p>นักเขียนยังคงเป็นเจ้าของลิขสิทธิ์ในผลงานนิยายและมังงะของตนเองอย่างสมบูรณ์ 100% ทางแพลตฟอร์ม ReadVerse ได้รับสิทธิ์ในการเผยแพร่ จัดแสดง และจำหน่ายเหรียญเพื่อปลดล็อกอ่านบนระบบเท่านั้น</p>

              <p className="font-bold text-white">ข้อ 2. ส่วนแบ่งรายได้ (Revenue Share 70/30)</p>
              <p>นักเขียนจะได้รับส่วนแบ่งรายได้ 70% จากมูลค่าเหรียญที่ผู้อ่านใช้ปลดล็อกอ่านผลงาน โดยแพลตฟอร์มจะหักค่าบริการระบบ 30% นักเขียนสามารถส่งคำขอถอนเงินได้เมื่อมียอดสะสมขั้นต่ำ 300 บาท</p>

              <p className="font-bold text-white">ข้อ 3. การรับรองความเป็นเจ้าของผลงาน</p>
              <p>นักเขียนรับรองว่าผลงาน ภาพประกอบ และเนื้อหาทั้งหมดที่อัปโหลด ไม่ได้คัดลอก ดัดแปลง หรือละเมิดลิขสิทธิ์ของบุคคลภายนอก หากเกิดการฟ้องร้อง นักเขียนจะต้องเป็นผู้รับผิดชอบตามกฎหมาย</p>

              <p className="font-bold text-white">ข้อ 4. การปฏิบัติตามกฎหมายและเนื้อหา 18+</p>
              <p>ผลงานที่มีเนื้อหาสำหรับผู้ใหญ่ (Mature 18+) จะต้องกำหนดเรตติ้งให้ถูกต้อง เพื่อให้ระบบเปิดใช้งานระบบยืนยันอายุ (Age Gate) ตามมาตราฐาน</p>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAgreementAccepted(true);
                  setShowAgreementModal(false);
                }}
                className="px-6 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200"
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
