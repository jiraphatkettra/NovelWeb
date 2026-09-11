"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  MessageSquare,
  BookOpen,
  Coins,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function HelpCenterPage() {
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
      a: "ได้แน่นอนครับ! เมื่อใช้เหรียญปลดล็อกตอนพรีเมียมแล้ว คุณสามารถกลับมาอ่านซ้ำได้ตลอดเวลาโดยไม่มีค่าใช้จ่ายเพิ่มเติม",
    },
    {
      q: "ต้องการสมัครเป็นนักเขียนเพื่อสร้างรายได้ ต้องทำอย่างไร?",
      a: "คุณสามารถสลับหรือสมัครเป็นนักเขียนได้ที่หน้าโปรไฟล์ หรือใช้แถบสลับบทบาท (Demo Mode) ด้านบนสุด จากนั้นเข้าไปที่ 'สตูดิโอนักเขียน' เพื่อเริ่มสร้างเรื่อง กำหนดราคาตอน และรับส่วนแบ่งรายได้ 70%",
    },
    {
      q: "พบเนื้อหาไม่เหมาะสมหรือละเมิดลิขสิทธิ์ แจ้งอย่างไร?",
      a: "คุณสามารถแจ้งปัญหาผ่านแบบฟอร์มด้านล่าง หรือส่งหลักฐานแจ้งลบเนื้อหาละเมิดลิขสิทธิ์ (DMCA/Takedown) ทีมงานตรวจสอบเนื้อหา (Moderator) จะดำเนินการตรวจสอบและพิจารณาภายใน 24 ชั่วโมง",
    },
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-white font-prompt">
          ศูนย์ช่วยเหลือ & ติดต่อทีมงาน (Help Center)
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          คำถามที่พบบ่อยเกี่ยวกับการใช้งานแพลตฟอร์ม ระบบเหรียญ และการแจ้งปัญหาการใช้งาน
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white font-prompt mb-4">คำถามที่พบบ่อย (FAQ)</h2>
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-zinc-200 hover:text-white"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 border-t border-zinc-800/60 leading-relaxed font-sarabun">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Ticket Submission Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white font-prompt">ส่งคำร้องแจ้งปัญหา (Support Ticket)</h2>
          <p className="text-xs text-zinc-400 mt-1">ทีมงานจะตอบกลับผ่านการแจ้งเตือนหรืออีเมลของคุณภายใน 24 ชม.</p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white font-prompt">ส่งคำร้องเรียบร้อยแล้ว!</h3>
            <p className="text-xs text-zinc-300">รหัสคำร้อง: #TICKET-{Date.now().toString(36).toUpperCase()}</p>
            <button
              onClick={() => {
                setSubmitted(false);
                setTicketTitle("");
                setTicketDescription("");
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition"
            >
              ส่งคำร้องอื่นเพิ่มเติม
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">หมวดหมู่ปัญหา</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="COIN">ปัญหาการซื้อเหรียญ / ยอดเหรียญไม่เข้า</option>
                <option value="ACCOUNT">ปัญหาการเข้าสู่ระบบและบัญชีผู้ใช้</option>
                <option value="CONTENT">แจ้งปัญหาเนื้อหา / ลิขสิทธิ์ (DMCA)</option>
                <option value="AUTHOR">สำหรับนักเขียน / การถอนเงิน</option>
                <option value="OTHER">ข้อเสนอแนะและปัญหาอื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">หัวข้อปัญหา</label>
              <input
                type="text"
                required
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="ระบุหัวข้อปัญหาอย่างสั้นกระชับ..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">รายละเอียดปัญหา</label>
              <textarea
                required
                rows={4}
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="อธิบายรายละเอียด วันที่ เวลา หรือเลขที่คำสั่งซื้อที่เกี่ยวข้อง..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
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
