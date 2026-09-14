# 🔍 Gap Analysis & Production Readiness — ReadVerse Platform

## สรุปสถานะการพัฒนาล่าสุด (Production-Ready State)

| ระบบ | มีแล้ว | Backend API | ใช้งานได้จริง | สถานะการพัฒนา & การปิด Gap |
|------|:---:|:---:|:---:|---------------------------|
| **Auth (Login/Register)** | ✅ | ✅ | ✅ | มี In-memory Rate Limiting ป้องกัน Brute force |
| **Forgot/Reset Password** | ✅ | ✅ | ✅ | มี Transactional Email Dispatcher (Resend/SMTP/Mock) + Token ปลอดภัย |
| **Security Middleware** | ✅ | ✅ | ✅ | Next.js Edge Middleware คัดกรองสิทธิ์ RBAC (`/admin`, `/author`, `/profile`) |
| **Rate Limiting** | ✅ | ✅ | ✅ | Sliding-window limiter ใน Auth & Payment endpoints |
| **File Upload (Drag-drop)** | ✅ | ✅ | ✅ | `ImageUploadDropzone` รองรับทั้ง Cover, Avatar และ Manga multi-upload |
| **Rich Chapter Editor (Novel)**| ✅ | ✅ | ✅ | `RichChapterEditor` รองรับ Formatting, Headings, Quotes, Center, Preview |
| **Manga Page Uploader** | ✅ | ✅ | ✅ | Drag-drop multi-file upload, Reorder grid, Delete, Preview |
| **Chapter Unlock & Coin** | ✅ | ✅ | ✅ | Atomic DB Transaction + Wait-Until-Free (WUF) + Gift Box Tickets |
| **Novel & Manga Reader** | ✅ | ✅ | ✅ | มี Anti-Piracy Content Protection (กันคลิกขวา, กันลากรูป, Digital Watermark) |
| **Author Studio & Public** | ✅ | ✅ | ✅ | หน้า `/author/[id]` สาธารณะ + Dashboard จัดการเรื่องและตอน |
| **SEO & Social Sharing** | ✅ | ✅ | ✅ | Server-side `generateMetadata` รองรับ OpenGraph & Twitter Cards พรีวิวรูปปกใน LINE/FB |
| **Scheduled Publishing** | ✅ | ✅ | ✅ | มี `/api/v1/cron/publish` พร้อม `CRON_SECRET` ป้องกันการแอบสั่งรัน |
| **Gamification & Social** | ✅ | ✅ | ✅ | Daily Check-in Streak, ระบบดาวรีวิว, คอมเมนต์, ติดตามนักเขียน |
| **Admin & Moderation** | ✅ | ✅ | ✅ | แผงควบคุมระบบ, ตรวจสอบคำร้อง Report, ตรวจสอบคำขอ Payout |

---

## 🛡️ มาตรการความปลอดภัยและระดับมืออาชีพ (Security & Architecture Highlights)

### 1. Edge Route Guard (`src/middleware.ts`)
- สกัดกั้นผู้ใช้ที่ไม่ได้รับอนุญาตที่ระดับ Edge ก่อนเข้าถึงหน้า Controller หรือ Page
- แยกสิทธิ์ชัดเจน:
  - `/admin/*` → อนุญาตเฉพาะ `SUPER_ADMIN`, `MODERATOR`, `FINANCE_ADMIN`
  - `/author/*` (สตูดิโอจัดการ) → อนุญาตเฉพาะ `AUTHOR`, `SUPER_ADMIN`
  - `/profile/*`, `/wallet/*` → บังคับต้องเข้าสู่ระบบ

### 2. Rate Limiting Protection (`src/lib/rate-limit.ts`)
- ใช้อัลกอริทึม Sliding-Window ในหน่วยความจำพร้อม Auto-cleanup
- ปกป้อง Endpoint สำคัญ:
  - `/api/v1/auth/login`: สูงสุด 10 ครั้ง/นาที
  - `/api/v1/auth/register`: สูงสุด 5 ครั้ง/5 นาที
  - `/api/v1/auth/forgot-password`: สูงสุด 3 ครั้ง/15 นาที

### 3. Transactional Email System (`src/lib/email.ts`)
- เชื่อมต่อกับ Resend API หรือ SMTP ผ่าน Environment variables
- มีโหมด Fallback Logger สวยงามสำหรับทดสอบในเครื่องโดยไม่ต้องเซ็ต SMTP จริง
- อีเมลรีเซ็ตรหัสผ่านใช้ Dark-mode HTML Template ระดับมืออาชีพ

### 4. Content DRM & Anti-Scraping (`src/components/reader/ContentProtection.tsx`)
- ปิด `contextmenu` (ห้ามคลิกขวา Save Image As หรือ Inspect)
- ปิด `dragstart` ป้องกันการลากรูปมังงะออกจากเบราว์เซอร์
- สกัดกั้นคีย์ลัด Ctrl+S, Ctrl+U, Ctrl+P
- แสดง **Forensic Dynamic Watermark** ระบุชื่อ User ID และ ReadVerse ซ้อนจางๆ บนตอน เพื่อป้องปรามการแคปจอไปแจกจ่าย

### 5. OpenGraph Dynamic Social Meta
- หน้ารายละเอียดเรื่อง `/stories/[slug]` ดึงรูปภาพปก, ชื่อเรื่อง, และเรื่องย่อมาสร้าง OpenGraph Tag แบบ Server-rendered
- ทำให้การแชร์ลิงก์ลง LINE, Facebook, Discord, X แสดงการ์ดพรีวิวรูปปกและเรื่องย่ออย่างสวยงาม

---

## 🚀 แผนต่อยอดสำหรับการนำขึ้น Production เต็มรูปแบบ (Final Deployment Steps)

เมื่อต้องการนำขึ้น Production Server (เช่น Vercel + Supabase):
1. **ย้าย Database:** สลับ Connection URL ใน `.env` จาก `file:./dev.db` ไปยัง PostgreSQL (Supabase / Neon)
2. **ย้าย File Storage:** สลับ Endpoint Upload ไปยัง Cloudflare R2 หรือ AWS S3 Bucket
3. **เชื่อมต่อ Payment Gateway จริง:** เสียบ Omise / GB Prime Pay Webhook รับเงินบาทจริง
