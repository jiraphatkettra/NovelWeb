"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import {
  Feather,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  User,
  CreditCard,
} from "lucide-react";

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
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Pen Name & Bio
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: KYC & Bank
  const [idCardNumber, setIdCardNumber] = useState("");
  const [bankName, setBankName] = useState(THAI_BANKS[0]);
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  // Step 3: Agreement
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Existing status
  const [existingStatus, setExistingStatus] = useState<{
    hasApplied: boolean;
    kycStatus?: string;
    isAuthor: boolean;
  } | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/v1/author/apply");
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
    if (user) {
      if (!penName && (user.penName || user.name)) {
        setPenName(user.penName || user.name);
      }
      if (!bankAccountName && user.name) {
        setBankAccountName(user.name);
      }
      checkStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!penName.trim()) {
        toast.warning("กรุณาระบุนามปากกา", "นามปากกาเป็นข้อมูลจำเป็นสำหรับแสดงบนผลงาน");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const cleanId = idCardNumber.replace(/\D/g, "");
      if (cleanId.length !== 13) {
        toast.warning("เลขบัตรประชาชนไม่ถูกต้อง", "เลขประจำตัวประชาชนต้องมีความยาว 13 หลัก");
        return;
      }
      if (!bankAccountNo.trim()) {
        toast.warning("กรุณาระบุเลขที่บัญชี", "เลขที่บัญชีจำเป็นสำหรับการโอนเงินส่วนแบ่งรายได้");
        return;
      }
      if (!bankAccountName.trim()) {
        toast.warning("กรุณาระบุชื่อบัญชี", "ชื่อเจ้าของบัญชีต้องตรงกับบัตรประชาชน");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementAccepted) {
      toast.warning("กรุณายอมรับข้อตกลง", "กรุณาอ่านและยอมรับสัญญาข้อตกลงนักเขียนก่อนส่งใบสมัคร");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/author/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penName: penName.trim(),
          bio: bio.trim(),
          idCardNumber: idCardNumber.replace(/\D/g, ""),
          bankName,
          bankAccountNo: bankAccountNo.trim(),
          bankAccountName: bankAccountName.trim(),
          agreementAccepted,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("ยื่นใบสมัครสำเร็จ!", json.data.message || "เปิดใช้งานบัญชีนักเขียนเรียบร้อยแล้ว");
        await refreshUser();
        setExistingStatus({
          hasApplied: true,
          kycStatus: "APPROVED",
          isAuthor: true,
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
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#A78BFA] mb-4">
          <Feather className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-prompt mb-2">
          สมัครเป็นนักเขียน (Creator Studio)
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-6 leading-relaxed">
          กรุณาเข้าสู่ระบบก่อนยื่นใบสมัครเพื่อเปิดใช้งานสตูดิโอนักเขียนและสร้างรายได้ 70%
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuthModal("LOGIN")}
            className="px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition active:scale-[0.98]"
          >
            เข้าสู่ระบบ
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs transition border border-white/10"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center mx-auto text-[#A78BFA]">
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
        <div className="p-6 rounded-2xl bg-[#121215] border border-emerald-500/30 text-center space-y-3 shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h2 className="text-base font-bold text-white font-prompt">คุณเป็นนักเขียนเรียบร้อยแล้ว!</h2>
          <p className="text-xs text-emerald-300/90 leading-relaxed max-w-sm mx-auto">
            บัญชีของคุณได้รับการเปิดสิทธิ์สตูดิโอนักเขียนแล้ว สามารถสร้างผลงานและจัดการตอนได้ทันที
          </p>
          <div className="pt-2">
            <Link
              href="/author"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition"
            >
              <span>ไปที่ Creator Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : existingStatus?.hasApplied && existingStatus?.kycStatus === "PENDING" ? (
        <div className="p-6 rounded-2xl bg-[#121215] border border-[#8B5CF6]/30 text-center space-y-2 shadow-lg">
          <Clock className="w-10 h-10 text-[#A78BFA] mx-auto" />
          <h2 className="text-base font-bold text-white font-prompt">ใบสมัครของคุณอยู่ระหว่างการตรวจสอบ</h2>
          <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
            ทีมงานกำลังตรวจสอบข้อมูลและรายละเอียดบัญชีของคุณ โดยจะแจ้งผลให้ทราบโดยเร็ว
          </p>
        </div>
      ) : (
        /* Multi-Step Wizard */
        <div className="space-y-6">
          {/* Stepper Indicator */}
          <div className="flex items-center justify-between px-2">
            {[
              { step: 1, label: "ข้อมูลนักเขียน", icon: User },
              { step: 2, label: "บัญชีรับเงิน", icon: CreditCard },
              { step: 3, label: "ยืนยันและสัญญา", icon: FileText },
            ].map((s, idx) => {
              const Icon = s.icon;
              const isCurrent = currentStep === s.step;
              const isDone = currentStep > s.step;
              return (
                <div key={s.step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isCurrent
                          ? "bg-[#8B5CF6] text-white font-bold shadow-sm shadow-[#8B5CF6]/30"
                          : isDone
                          ? "bg-emerald-500 text-black font-bold"
                          : "bg-white/[0.08] text-neutral-500"
                      }`}
                    >
                      {isDone ? "✓" : s.step}
                    </div>
                    <span
                      className={`text-xs font-prompt hidden sm:inline ${
                        isCurrent ? "text-white font-bold" : isDone ? "text-neutral-300" : "text-neutral-600"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 transition-colors ${
                        currentStep > s.step ? "bg-emerald-500/50" : "bg-white/[0.08]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Writer Profile */}
            {currentStep === 1 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-[#A78BFA] text-xs font-bold font-prompt">
                  <Feather className="w-4 h-4" />
                  <span>ขั้นตอนที่ 1: ข้อมูลนักเขียนและนามปากกา</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    นามปากกา (Pen Name) <span className="text-[#A78BFA]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={penName}
                    onChange={(e) => setPenName(e.target.value)}
                    placeholder="เช่น หมื่นลี้, ShadowWriter, จอมยุทธ์น้อย"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    ชื่อนี้จะแสดงเป็นชื่อผู้แต่งบนหน้าผลงานของคุณ สามารถปรับเปลี่ยนได้ภายหลัง
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    เกี่ยวกับตัวเอง / สไตล์งานเขียนที่ถนัด (Bio)
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="บอกเล่าประสบการณ์ สไตล์เรื่องที่สนใจเขียน หรือแรงบันดาลใจ เช่น นิยายแฟนตาซีเกิดใหม่, มังงะแอ็กชันไซไฟ..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition"
                  >
                    <span>ถัดไป: บัญชีรับเงิน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: KYC & Payout Details */}
            {currentStep === 2 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-[#A78BFA] text-xs font-bold font-prompt">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ขั้นตอนที่ 2: ข้อมูลยืนยันตัวตนและรับเงินส่วนแบ่ง 70%</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  ข้อมูลนี้จำเป็นสำหรับการยืนยันตัวตนทางกฎหมาย และใช้สำหรับโอนเงินส่วนแบ่งรายได้เข้าบัญชีของคุณ
                </p>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    เลขประจำตัวประชาชน (13 หลัก) <span className="text-[#A78BFA]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234567890123"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white font-mono text-xs placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      ธนาคารที่รับเงิน <span className="text-[#A78BFA]">*</span>
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#8B5CF6]"
                    >
                      {THAI_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      เลขที่บัญชีธนาคาร <span className="text-[#A78BFA]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      placeholder="เช่น 123-4-56789-0"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white font-mono text-xs placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    ชื่อ-นามสกุลเจ้าของบัญชี (ตรงกับบัตรประชาชน) <span className="text-[#A78BFA]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="เช่น นายสมชาย รักการเขียน"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 text-xs font-medium transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>ย้อนกลับ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition"
                  >
                    <span>ถัดไป: สัญญาข้อตกลง</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Author Agreement & Confirmation */}
            {currentStep === 3 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-[#A78BFA] text-xs font-bold font-prompt">
                  <FileText className="w-4 h-4" />
                  <span>ขั้นตอนที่ 3: สรุปข้อมูลและสัญญาข้อตกลงนักเขียน</span>
                </div>

                {/* Summary Card */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">นามปากกา:</span>
                    <span className="font-bold text-white">{penName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">บัญชีรับเงิน:</span>
                    <span className="text-white">{bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">เลขที่บัญชี:</span>
                    <span className="font-mono text-white">{bankAccountNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">ชื่อบัญชี:</span>
                    <span className="text-white">{bankAccountName}</span>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      id="authorAgreement"
                      checked={agreementAccepted}
                      onChange={(e) => setAgreementAccepted(e.target.checked)}
                      className="mt-0.5 rounded accent-[#8B5CF6] w-4 h-4"
                    />
                    <span className="text-neutral-300 text-xs leading-relaxed">
                      ข้าพเจ้าได้อ่าน เข้าใจ และยอมรับ{" "}
                      <button
                        type="button"
                        onClick={() => setShowAgreementModal(true)}
                        className="text-[#A78BFA] hover:text-[#C4B5FD] underline underline-offset-2 font-bold"
                      >
                        สัญญาข้อตกลงนักเขียนและนโยบายส่วนแบ่งรายได้ 70%
                      </button>{" "}
                      ของแพลตฟอร์ม และยืนยันว่าเป็นเจ้าของลิขสิทธิ์ผลงานที่นำมาลงอย่างแท้จริง
                    </span>
                  </label>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 text-xs font-medium transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>ย้อนกลับ</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !agreementAccepted}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-white/5 disabled:text-neutral-500 text-white font-bold text-xs transition active:scale-[0.98]"
                  >
                    <span>{submitting ? "กำลังส่งใบสมัคร..." : "ยืนยันและเปิดบัญชีนักเขียน"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
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
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
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
                className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs"
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
