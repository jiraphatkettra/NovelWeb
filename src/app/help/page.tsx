"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function HelpCenterPage() {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketCategory, setTicketCategory] = useState("COIN");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const faqs = [
    {
      q: "เหรียญฟรีกับเหรียญซื้อต่างกันอย่างไร?",
      a: "เหรียญซื้อ (Paid Coins) ซื้อด้วยเงินจริงผ่านร้านค้าเหรียญ ไม่มีวันหมดอายุ ส่วนเหรียญฟรี (Free Coins) ได้รับจากกิจกรรม การเช็คอิน หรือรางวัลต้อนรับ มีอายุการใช้งาน 30-60 วัน โดยระบบจะเลือกตัดเหรียญฟรีที่ใกล้หมดอายุก่อนเสมอเมื่อปลดล็อกตอน",
    },
    {
      q: "หลังจากปลดล็อกตอนพรีเมียมแล้ว สามารถอ่านซ้ำได้หรือไม่?",
      a: "ได้แน่นอนครับ เมื่อใช้เหรียญปลดล็อกตอนพรีเมียมแล้ว คุณสามารถกลับมาอ่านซ้ำได้ตลอดเวลาโดยไม่มีค่าใช้จ่ายเพิ่มเติม",
    },
    {
      q: "ต้องการสมัครเป็นนักเขียนเพื่อสร้างรายได้ ต้องทำอย่างไร?",
      a: "คุณสามารถสมัครเป็นนักเขียนได้ที่หน้าสตูดิโอนักเขียน โดยกรอกข้อมูลและยืนยันตัวตน (KYC) เมื่อได้รับการอนุมัติ คุณสามารถเผยแพร่ผลงาน กำหนดราคาตอน และรับส่วนแบ่งรายได้ตามข้อตกลง",
    },
    {
      q: "พบเนื้อหาไม่เหมาะสมหรือละเมิดลิขสิทธิ์ แจ้งอย่างไร?",
      a: "คุณสามารถแจ้งปัญหาผ่านแบบฟอร์มด้านล่าง หรือใช้ปุ่ม 'รายงาน' ที่อยู่บนหน้าเรื่อง ทีมงานตรวจสอบเนื้อหา (Moderator) จะดำเนินการตรวจสอบและพิจารณาภายใน 24 ชั่วโมง",
    },
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
      toast.success("ส่งคำร้องเรียบร้อย", "ทีมงานจะตรวจสอบและติดต่อกลับภายใน 24 ชม.");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-prompt">
          ศูนย์ช่วยเหลือ & ติดต่อทีมงาน
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
          คำถามที่พบบ่อยเกี่ยวกับการใช้งานแพลตฟอร์ม ระบบเหรียญ และการแจ้งปัญหา
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white font-prompt mb-3">คำถามที่พบบ่อย (FAQ)</h2>
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div
              key={idx}
              className="rounded-xl bg-[#121215] border border-white/[0.08] overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#FFE600]" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-neutral-400 border-t border-white/[0.06] leading-relaxed font-sarabun">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Ticket Submission Form */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-5">
        <div>
          <h2 className="text-base font-bold text-white font-prompt">ส่งคำร้องแจ้งปัญหา (Support Ticket)</h2>
          <p className="text-xs text-neutral-400 mt-1">ทีมงานจะตอบกลับผ่านการแจ้งเตือนหรืออีเมลของคุณภายใน 24 ชม.</p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white font-prompt">ส่งคำร้องเรียบร้อยแล้ว!</h3>
            <p className="text-xs text-neutral-300">รหัสคำร้อง: #TICKET-{Date.now().toString(36).toUpperCase()}</p>
            <button
              onClick={() => {
                setSubmitted(false);
                setTicketTitle("");
                setTicketDescription("");
              }}
              className="mt-3 px-4 py-2 rounded-lg bg-white/10 text-neutral-300 text-xs font-semibold hover:bg-white/15 transition"
            >
              ส่งคำร้องอื่นเพิ่มเติม
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
            <div>
              <label className="text-neutral-300 font-medium block mb-1.5">หมวดหมู่ปัญหา</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white focus:outline-none focus:border-[#FFE600]"
              >
                <option value="COIN">ปัญหาการซื้อเหรียญ / ยอดเหรียญไม่เข้า</option>
                <option value="ACCOUNT">ปัญหาการเข้าสู่ระบบและบัญชีผู้ใช้</option>
                <option value="CONTENT">แจ้งปัญหาเนื้อหา / ลิขสิทธิ์ (DMCA)</option>
                <option value="AUTHOR">สำหรับนักเขียน / การถอนเงิน</option>
                <option value="OTHER">ข้อเสนอแนะและปัญหาอื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-300 font-medium block mb-1.5">หัวข้อปัญหา</label>
              <input
                type="text"
                required
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="ระบุหัวข้อปัญหาอย่างสั้นกระชับ..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600]"
              />
            </div>

            <div>
              <label className="text-neutral-300 font-medium block mb-1.5">รายละเอียดปัญหา</label>
              <textarea
                required
                rows={4}
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="อธิบายรายละเอียด วันที่ เวลา หรือเลขที่คำสั่งซื้อที่เกี่ยวข้อง..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? "กำลังส่งคำร้อง..." : "ส่งคำร้องแจ้งปัญหา"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
