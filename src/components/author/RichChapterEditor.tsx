"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface RichChapterEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichChapterEditor({
  value,
  onChange,
  placeholder = "เริ่มต้นบรรยายฉากของคุณที่นี่...",
}: RichChapterEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  // Helper to format text with document.execCommand
  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    isUpdatingRef.current = true;
    const html = editorRef.current.innerHTML;
    onChange(html);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  };

  // Convert plain text or markdown to initial HTML if needed
  const formatInitialContent = (raw: string) => {
    if (!raw) return "";
    // If it already looks like HTML (contains tags), keep it
    if (/<[a-z][\s\S]*>/i.test(raw)) {
      return raw;
    }
    // Simple markdown-to-html conversion for backward compatibility
    return raw
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>");
  };

  // Synchronize incoming value when not currently typing
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const formatted = formatInitialContent(value);
      if (currentHtml !== formatted) {
        editorRef.current.innerHTML = formatted;
      }
    }
  }, [value]);

  return (
    <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl transition-all focus-within:border-amber-500/60">
      {/* Visual Rich Formatting Toolbar */}
      <div className="px-3 sm:px-4 py-2 bg-zinc-800/90 border-b border-zinc-700/80 flex flex-wrap items-center gap-1 sm:gap-1.5 select-none">
        {/* Headings */}
        <button
          type="button"
          onClick={() => execCmd("formatBlock", "<h2>")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="หัวข้อย่อย H2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("formatBlock", "<h3>")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="หัวข้อย่อย H3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-zinc-700 mx-1" />

        {/* Text Styles */}
        <button
          type="button"
          onClick={() => execCmd("bold")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition font-bold"
          title="ตัวหนา (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("italic")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition italic"
          title="ตัวเอียง (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("underline")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="ขีดเส้นใต้ (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("strikeThrough")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="ขีดฆ่า"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-zinc-700 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCmd("justifyLeft")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="ชิดซ้าย"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("justifyCenter")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="จัดกึ่งกลาง"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("justifyRight")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="ชิดขวา"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-zinc-700 mx-1" />

        {/* Quotes & Breaks */}
        <button
          type="button"
          onClick={() => execCmd("formatBlock", "<blockquote>")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="กล่องคำคม / ข้อความเน้น"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("insertHorizontalRule")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="เส้นคั่นฉาก (Scene Break)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-zinc-700 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCmd("insertUnorderedList")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="รายการแบบจุด"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("insertOrderedList")}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          title="รายการแบบตัวเลข"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() => execCmd("removeFormat")}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition ml-auto"
          title="ล้างการจัดรูปแบบ"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Visual ContentEditable Area */}
      <div className="p-6 min-h-[420px] bg-zinc-950/60">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          data-placeholder={placeholder}
          className="w-full min-h-[380px] bg-transparent text-zinc-100 font-sarabun text-base leading-relaxed focus:outline-none prose prose-invert max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600 empty:before:pointer-events-none"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        />
      </div>
    </div>
  );
}
