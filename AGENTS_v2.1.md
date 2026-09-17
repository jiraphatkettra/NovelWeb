# AGENTS.md — เว็บไซต์แพลตฟอร์มนิยาย & มังงะออนไลน์

> **สำหรับ AI Agent ผู้พัฒนา (เช่น Gemini ใน Antigravity):** เอกสารนี้คือ Single Source of Truth สำหรับการออกแบบและพัฒนาระบบทั้งหมด ให้ยึดตามสเปกนี้เป็นหลัก หากมีจุดใดคลุมเครือ ให้เลือกแนวทางที่เป็น Best Practice ของอุตสาหกรรมและระบุสมมติฐานที่ใช้ไว้อย่างชัดเจนในโค้ดหรือเอกสารประกอบ (README/ADR)
>
> **ผลลัพธ์ที่ต้องส่งมอบ:** (1) สถาปัตยกรรมระบบและ Database Schema แบบละเอียด (2) ซอร์สโค้ด Backend API ครบทุกโมดูล (3) ซอร์สโค้ด Frontend ครบทุกหน้า ตาม UX/UI ที่ระบุ (4) ระบบเหรียญและการเชื่อมต่อ Payment Gateway (แบบ Sandbox/Mock ได้หากไม่มี API Key จริง) (5) เอกสารประกอบการติดตั้งและใช้งาน (README, .env.example, ER Diagram, ADR)
>
> **สำคัญ:** เอกสารนี้จัดลำดับความสำคัญไว้แล้วในหมวด 2 (Phased Roadmap) ให้พัฒนาตามลำดับเฟส ไม่ต้องพยายามสร้างทุกฟีเจอร์พร้อมกันในครั้งเดียว

---

## 1. ภาพรวมโปรเจกต์ (Project Overview)

พัฒนาเว็บแพลตฟอร์มสำหรับอ่าน-เขียนนิยายออนไลน์และลงผลงานมังงะ/การ์ตูน (Webtoon/Manga) ในที่เดียว รองรับทั้งเนื้อหาแบบตัวอักษร (นิยาย) และเนื้อหาแบบภาพ (มังงะ/การ์ตูนช่อง) โดยมีระบบเศรษฐกิจภายในแพลตฟอร์มผ่าน **"เหรียญ (Coin)"** ที่ผู้ใช้ซื้อด้วยเงินจริงเพื่อใช้ปลดล็อกตอนพรีเมียม และนักเขียนสามารถสร้างรายได้จากผลงานของตนเอง

**เป้าหมายหลักของระบบ**
- เป็นแพลตฟอร์ม Content Marketplace ที่เชื่อมนักเขียน/นักวาดกับผู้อ่านโดยตรง
- สร้างระบบรายได้ที่ยั่งยืนทั้งฝั่งแพลตฟอร์มและฝั่งผู้สร้างสรรค์ผลงาน (Revenue Sharing)
- มอบประสบการณ์การอ่านที่ทันสมัย ลื่นไหล ทั้งบนมือถือและเดสก์ท็อป
- มีระบบหลังบ้านที่ Admin ควบคุมคุณภาพเนื้อหาและธุรกรรมการเงินได้อย่างโปร่งใส

---

## 2. แผนพัฒนาแบบเป็นเฟส (Phased Roadmap / MVP) — *เพิ่มเติม*

> เอกสารนี้ครอบคลุมระบบเต็มรูปแบบ แต่ให้พัฒนาตามลำดับเฟสด้านล่างเพื่อให้ได้ผลลัพธ์ที่ใช้งานได้จริงเร็วที่สุด แทนที่จะสร้างทุกอย่างพร้อมกันแบบตื้นๆ

**Phase 1 — MVP (ระบบแกนหลักที่ต้องมีก่อนเปิดใช้งานจริง)**
- ระบบสมาชิก (Auth พื้นฐาน: Email + Google/Facebook), RBAC พื้นฐาน (Guest/Reader/Author/Admin)
- จัดการเรื่อง/ตอน (นิยาย + มังงะ), หน้าอ่านนิยาย/มังงะพื้นฐาน
- ระบบเหรียญและกระเป๋าเงิน, เชื่อม Payment Gateway อย่างน้อย 1 ช่องทาง (เช่น PromptPay ผ่าน Omise)
- ปลดล็อกตอน, คอมเมนต์, บุ๊คมาร์ค, ห้องสมุดส่วนตัว
- Author Dashboard พื้นฐาน (จัดการผลงาน, ดูรายได้, ขอถอนเงิน)
- Admin Panel พื้นฐาน (จัดการผู้ใช้, อนุมัติเนื้อหา, จัดการธุรกรรม)
- Terms of Service, Privacy Policy, Author Agreement, Content Rating เบื้องต้น

**Phase 2 — เสริมการเติบโตและการมีส่วนร่วม**
- LINE Login / LINE Notify
- Gamification (เช็คอินรายวัน, Achievement, Referral)
- Recommendation Engine แบบ Rule-based
- SEO (Sitemap, Meta Tag, Structured Data)
- Help Center / Support Ticket ฝั่งผู้ใช้
- Analytics พื้นฐาน (GA4/Mixpanel + Event Tracking หลัก)
- Onboarding/First-run Experience สำหรับผู้ใช้และนักเขียนใหม่

**Phase 3 — เสริมความแข็งแกร่งและขยายระบบ**
- Anti-piracy ขั้นสูง (Watermark, Canvas Render, Forensic Watermark)
- Admin Sub-roles แบบละเอียด (Content Moderator/Finance Admin/Super Admin)
- DDoS/WAF Protection, API Versioning เต็มรูปแบบ
- รองรับ In-App Purchase (IAP) หากขยายไปทำแอปมือถือ Native
- Analytics ขั้นสูง (Recommendation ด้วย ML, Dashboard เชิงลึก)
- ขยายภาษา/สกุลเงินหากตลาดต่างประเทศ

---

## 3. กลุ่มผู้ใช้งานและสิทธิ์การเข้าถึง (User Roles)

ระบบต้องรองรับผู้ใช้งาน 4 กลุ่มหลัก ผ่านระบบ Role-Based Access Control (RBAC):

| บทบาท | รายละเอียด | สิทธิ์เด่น |
|---|---|---|
| **Guest** (ผู้เยี่ยมชม) | ผู้ใช้ที่ยังไม่ได้ล็อกอิน | อ่านตอนฟรี, ดูหน้ารายละเอียดเรื่อง, ต้องสมัครสมาชิกเพื่อคอมเมนต์/ซื้อเหรียญ |
| **Reader** (ผู้อ่านทั่วไป) | สมาชิกที่ลงทะเบียนแล้ว | ซื้อ/สะสมเหรียญ, ปลดล็อกตอน, บุ๊คมาร์ค, คอมเมนต์, ให้เรตติ้ง, ติดตามนักเขียน |
| **Author/Artist** (นักเขียน/นักวาด) | ผู้สร้างสรรค์ผลงาน | สร้าง/แก้ไขเรื่อง, อัปโหลดตอน (ข้อความ/ภาพ), ตั้งราคาตอน, ดูรายได้และสถิติ, ขอถอนเงิน |
| **Admin/Staff** (ผู้ดูแลระบบ) | ทีมงานแพลตฟอร์ม | จัดการผู้ใช้, ตรวจสอบ/อนุมัติเนื้อหา, จัดการธุรกรรมการเงิน, อนุมัติการถอนเงิน, ตั้งค่าระบบ, ดูรายงานภาพรวม |

### 3.1 สิทธิ์ย่อยของ Admin (Admin Sub-roles) — *เพิ่มเติม*

Admin ไม่ควรเป็นสิทธิ์ก้อนเดียวที่ทำได้ทุกอย่าง เพราะเพิ่มความเสี่ยงหากบัญชีถูกโจมตีหรือใช้งานผิดพลาด ให้แบ่งสิทธิ์ย่อยดังนี้ (Phase 3):

| Sub-role | ขอบเขตสิทธิ์ |
|---|---|
| **Content Moderator** | ตรวจสอบ/อนุมัติเนื้อหา, จัดการรายงานเนื้อหาไม่เหมาะสม, จัดการคำร้อง DMCA — **ไม่มีสิทธิ์เข้าถึงข้อมูลการเงิน** |
| **Finance Admin** | ดูธุรกรรม, อนุมัติคำขอถอนเงิน, จัดการคำขอคืนเงิน/Chargeback — **ไม่มีสิทธิ์แก้ไข/ลบเนื้อหาหรือระงับบัญชีผู้ใช้** |
| **Super Admin** | เข้าถึงได้ทุกส่วน รวมถึงตั้งค่าระบบและจัดการสิทธิ์ของ Admin คนอื่น ควรมีจำนวนบัญชีน้อยที่สุดเท่าที่จำเป็น และบังคับ 2FA |

---

## 4. ฟีเจอร์หลักของระบบ (Core Features)

### 4.1 ฝั่งผู้อ่าน (Reader-Facing Features)
- ระบบสมาชิก: สมัคร/ล็อกอินด้วยอีเมล, เบอร์โทร, Google, Facebook, Apple ID, **LINE Login** (ดูรายละเอียดในหมวด 9)
- **Onboarding ครั้งแรก (First-run Walkthrough)**: แนะนำวิธีใช้งานหลัก (ค้นหาเรื่อง, ปลดล็อกตอน, ระบบเหรียญ) แบบสั้นกระชับสำหรับผู้ใช้ใหม่ พร้อมมอบเหรียญต้อนรับ
- หน้าแรก (Home): แนะนำเรื่องเด่น, เรื่องใหม่, อันดับยอดนิยม (Ranking), แบ่งตามหมวดหมู่ (นิยาย/มังงะ/แนวเรื่อง), **ส่วนแนะนำเฉพาะบุคคล "แนะนำสำหรับคุณ"** (ดูหมวด 11)
- หน้าค้นหาและกรอง: ค้นหาด้วยชื่อเรื่อง, แนว, สถานะ (จบแล้ว/กำลังลง), เรียงตามความนิยม/วันที่อัปเดต
- หน้ารายละเอียดเรื่อง: ปก, เรื่องย่อ, รายชื่อตอนทั้งหมด, ราคาแต่ละตอน (ฟรี/เหรียญ), เรตติ้ง, จำนวนผู้ติดตาม, **ป้ายเรตอายุ (13+/18+)**
- หน้าอ่านนิยาย (Text Reader): ปรับขนาดตัวอักษร, ธีมสี (กลางวัน/กลางคืน/ถนอมสายตา), เลื่อนหน้าอัตโนมัติ, บุ๊คมาร์คตำแหน่งที่อ่านล่าสุด
- หน้าอ่านมังงะ (Manga/Webtoon Reader): เลื่อนแนวตั้งต่อเนื่อง และแบบหน้าต่อหน้า, ซูมภาพ, Preload ภาพ, **มาตรการป้องกันการคัดลอกภาพ** (ดูหมวด 8)
- ระบบเหรียญและกระเป๋าเงิน: ยอดเหรียญคงเหลือ, ประวัติการซื้อ/ใช้เหรียญ, ซื้อแพ็กเกจเหรียญ
- ปลดล็อกตอน: ใช้เหรียญปลดล็อกทีละตอน หรือปลดล็อกทั้งเล่ม (Bulk Unlock)
- ระบบมีส่วนร่วม: คอมเมนต์ท้ายตอน, ไลก์, ให้ดาวรีวิว, แชร์ไปโซเชียล
- ห้องสมุดส่วนตัว (Library): เรื่องที่บุ๊คมาร์ค, เรื่องที่ซื้อแล้ว, ประวัติการอ่าน (Sync ข้ามอุปกรณ์)
- การแจ้งเตือน: แจ้งเตือนตอนใหม่, โปรโมชั่นเหรียญ ผ่าน In-app / Email / **LINE Notify**
- โปรไฟล์ผู้ใช้: จัดการข้อมูลส่วนตัว, ตั้งค่าการแจ้งเตือน, **ขอ Export/ลบข้อมูลส่วนตัว** (ดูหมวด 18)
- **จัดการอุปกรณ์ที่ล็อกอินอยู่ (Session/Device Management)**: ผู้ใช้เห็นรายการอุปกรณ์/เบราว์เซอร์ที่ล็อกอินอยู่ทั้งหมด พร้อมวันที่-เวลาที่เข้าใช้งานล่าสุด และกด "ออกจากระบบอุปกรณ์อื่นทั้งหมด" (Force Logout) ได้ทันที — สำคัญเพราะบัญชีผูกกับเหรียญ/เงินจริง
- **ระบบ Gamification**: เช็คอินรายวัน, Achievement/Badge, Reading Streak (ดูหมวด 10)
- **ศูนย์ช่วยเหลือผู้ใช้ (Help Center)** (ดูหมวด 17)

### 4.2 ฝั่งนักเขียน/นักวาด (Author Dashboard)
- สมัครเป็นนักเขียน: กรอกข้อมูลผลงาน, ยืนยันตัวตน (KYC) สำหรับการรับเงิน, **ยอมรับสัญญาข้อตกลงนักเขียน** (ดูหมวด 7)
- **Onboarding นักเขียนใหม่**: ขั้นตอนแนะนำวิธีสร้างเรื่องแรก, ตั้งราคาตอน, และเข้าใจระบบรายได้ ก่อนเผยแพร่ผลงานจริง
- จัดการผลงาน: สร้างเรื่องใหม่ (นิยาย/มังงะ), ชื่อเรื่อง, ปก, เรื่องย่อ, แนว/แท็ก, **กำหนดเรตอายุเนื้อหา (13+/18+)**
- จัดการตอน: เพิ่ม/แก้ไข/ลบตอน, Rich Text Editor (นิยาย), อัปโหลดภาพหลายไฟล์พร้อมจัดเรียงลำดับ (มังงะ), เก็บ Revision/ประวัติแก้ไข
- ตั้งราคาตอน: กำหนดตอนฟรี/เสียเหรียญ, ตั้งเวลาปล่อยตอนล่วงหน้า (Scheduled Publish)
- แดชบอร์ดรายได้: ยอดเหรียญที่ได้รับ, กราฟยอดขาย, สัดส่วนรายได้หลังหักส่วนแบ่งแพลตฟอร์ม
- สถิติผลงาน: จำนวนผู้อ่าน, ยอดวิว, เรตติ้งเฉลี่ย, ตอนยอดนิยม
- ระบบถอนเงิน: ยื่นคำขอถอนรายได้, ดูสถานะ, ประวัติการถอน
- จัดการคอมเมนต์: ตอบกลับ/ลบ/ปักหมุดคอมเมนต์ในผลงานของตนเอง
- ประกาศ/อัปเดตถึงผู้ติดตาม (Author Post)

### 4.3 ฝั่งผู้ดูแลระบบ (Admin Panel)
- จัดการผู้ใช้งานทั้งหมด: ระงับ/ปลดระงับบัญชี, จัดการ Role/Sub-role (ดูหมวด 3.1), ดูประวัติกิจกรรม
- ตรวจสอบและอนุมัติเนื้อหาก่อนเผยแพร่ (Content Moderation), ระบบรายงานเนื้อหาไม่เหมาะสม (Report/Flag)
- **จัดการเรตอายุเนื้อหาและคำร้องขอ Age Verification**
- **จัดการคำร้องแจ้งลบเนื้อหาละเมิดลิขสิทธิ์ (DMCA/Takedown)** พร้อมนโยบายคืนเหรียญ (ดูหมวด 7)
- จัดการหมวดหมู่/แท็ก และคอนเทนต์แนะนำหน้าแรก (Featured/Banner Management)
- จัดการระบบเหรียญ: แพ็กเกจเหรียญและราคา, โปรโมชั่น/ส่วนลด, **นโยบายวันหมดอายุเหรียญ**
- จัดการการเงิน: ธุรกรรมซื้อเหรียญทั้งหมด, อนุมัติ/ปฏิเสธคำขอถอนเงิน, ตั้งค่าสัดส่วนแบ่งรายได้, **จัดการคำขอคืนเงิน/ข้อพิพาท Chargeback**
- รายงานและวิเคราะห์: รายได้รวม, ผู้ใช้งานใหม่/Active Users, เรื่องยอดนิยม, กราฟแนวโน้ม, **Dashboard เชื่อม Analytics** (ดูหมวด 18)
- ระบบสนับสนุน: จัดการ Ticket/คำร้องเรียนจากผู้ใช้และนักเขียน
- Log และ Audit Trail: บันทึกการกระทำสำคัญของ Admin ทุกคน (แยกตาม Sub-role เพื่อตรวจสอบย้อนกลับได้ชัดเจนว่าใครทำอะไร)

---

## 5. ระบบเหรียญและการชำระเงิน (Coin & Payment System)

### 5.1 กลไกเหรียญ (Coin Economy)
- เหรียญ (Coin) คือสกุลเงินเสมือน ใช้แลกซื้อสิทธิ์อ่านตอนพรีเมียมเท่านั้น ไม่สามารถแลกคืนเป็นเงินสดโดยผู้อ่านได้
- ผู้ใช้ซื้อเหรียญผ่านแพ็กเกจที่ Admin กำหนด เช่น 100 / 300 / 500 / 1,000 / 3,000 เหรียญ พร้อมโบนัสเมื่อซื้อแพ็กเกจใหญ่
- แยก Ledger ระหว่าง "เหรียญฟรี" (จากกิจกรรม/เช็คอิน) กับ "เหรียญที่ซื้อด้วยเงินจริง" เพื่อความถูกต้องทางบัญชี
- ระบบ Wallet ต้องมี Transaction Ledger ที่ตรวจสอบย้อนกลับได้ (Immutable log)

### 5.2 ช่องทางการชำระเงิน (Payment Methods)
- พร้อมเพย์ / QR Code (PromptPay)
- บัตรเครดิต/เดบิต (Visa, Mastercard, JCB)
- Mobile Banking Redirect
- TrueMoney Wallet / Rabbit LINE Pay
- Payment Gateway ที่แนะนำ: Omise (Opn Payments), 2C2P, GB Prime Pay — รองรับ Stripe เผื่อขยายตลาดต่างประเทศ
- ต้องรองรับ Webhook จาก Payment Gateway อัปเดตสถานะแบบเรียลไทม์ และมีระบบ Retry/Reconcile กรณี Webhook ล้มเหลว

### 5.3 ระบบแบ่งรายได้และถอนเงิน (Revenue Share & Payout)
- กำหนดสัดส่วนแบ่งรายได้ระหว่างแพลตฟอร์มและนักเขียน (เช่น แพลตฟอร์ม 30% : นักเขียน 70%) ปรับค่าได้จาก Admin
- นักเขียนยื่นคำขอถอนเงินเมื่อยอดสะสมถึงขั้นต่ำ ระบบตรวจสอบ KYC ก่อนอนุมัติ
- Admin อนุมัติคำขอถอนเงินและบันทึกการโอนเงินจริง พร้อมออกรายงานเพื่อหักภาษี ณ ที่จ่าย ตามกฎหมายไทย
- เก็บ Audit Log ของทุกธุรกรรมการเงินเพื่อรองรับการตรวจสอบบัญชี

### 5.4 ความปลอดภัยด้านการเงิน
- ห้ามเก็บข้อมูลบัตรเครดิตเต็มรูปแบบในระบบตนเอง (ใช้ Tokenization ผ่าน Payment Gateway ตามมาตรฐาน PCI-DSS)
- เข้ารหัสข้อมูลอ่อนไหวทั้งระหว่างส่ง (TLS/HTTPS) และขณะจัดเก็บ (Encryption at Rest)
- ระบบตรวจจับธุรกรรมผิดปกติ (Fraud Detection) เบื้องต้น เช่น จำกัดจำนวนครั้งการเติมเงินต่อวัน

### 5.5 นโยบายเหรียญ การคืนเงิน และข้อพิพาท (Coin Policy, Refunds & Chargebacks)
- กำหนดนโยบายวันหมดอายุของเหรียญให้ชัดเจน (เช่น เหรียญที่ซื้อไม่หมดอายุ / เหรียญฟรีจากกิจกรรมหมดอายุใน 30-90 วัน) และแสดงวันหมดอายุใน UI กระเป๋าเงิน
- กำหนดเงื่อนไขการคืนเงิน (Refund Policy) เช่น คืนเงินได้ภายใน 7 วันหากยังไม่ได้ใช้เหรียญ, ไม่คืนเงินหากใช้ปลดล็อกตอนไปแล้ว
- ออกแบบ Flow รองรับ Chargeback จากบัตรเครดิต: ระงับยอดเหรียญที่เกี่ยวข้องชั่วคราว, แจ้งเตือน Admin, บันทึกหลักฐานธุรกรรมเพื่อโต้แย้งกับผู้ให้บริการบัตร
- ออกใบเสร็จ/ใบกำกับภาษีอย่างง่าย (e-Receipt) ทุกครั้งที่มีการซื้อเหรียญสำเร็จ เพื่อรองรับข้อกำหนดทางบัญชีของไทย

### 5.6 การรองรับ In-App Purchase (IAP) สำหรับแอปมือถือ Native — *เพิ่มเติม (Phase 3)*
- หากในอนาคตพัฒนาแอปมือถือแบบ Native (iOS/Android) นอกเหนือจาก PWA ต้อง **ทราบล่วงหน้าว่า Apple App Store และ Google Play บังคับให้ขายสินค้าดิจิทัล (เหรียญ) ผ่านระบบ In-App Purchase ของตนเองเท่านั้น** และจะหักค่าธรรมเนียม 15–30% ซึ่งไม่สามารถใช้ Payment Gateway ภายนอก (Omise/2C2P) ตรงในแอป Native ได้
- ให้ออกแบบ **Payment Provider เป็น Interface/Abstraction Layer** ตั้งแต่เริ่มต้น (เช่น `PaymentProvider` interface ที่มี implementation แยกสำหรับ `WebPaymentGateway` และ `AppleIAPProvider`/`GooglePlayBillingProvider`) เพื่อให้สลับหรือเพิ่มผู้ให้บริการชำระเงินได้โดยไม่ต้องรื้อระบบเหรียญทั้งหมด
- ราคาแพ็กเกจเหรียญบนแอป Native อาจต้องปรับสูงกว่าเว็บเพื่อชดเชยค่าธรรมเนียม IAP หรือเพียงล็อกฟีเจอร์ซื้อเหรียญให้ทำผ่านเว็บเบราว์เซอร์แทน (Reader-only app) ตามนโยบายที่ Admin จะกำหนดภายหลัง

---

## 6. กฎหมายและนโยบายเนื้อหา (Legal & Content Policy)

- **ข้อตกลงการใช้งาน (Terms of Service)** และ **นโยบายความเป็นส่วนตัว (Privacy Policy)** ที่ผู้ใช้ทุกคนต้องยอมรับตอนสมัครสมาชิก
- **สัญญาข้อตกลงนักเขียน (Author Agreement)**: ระบุความเป็นเจ้าของลิขสิทธิ์ผลงาน (นักเขียนเป็นเจ้าของ, แพลตฟอร์มได้สิทธิ์เผยแพร่แบบไม่ผูกขาดหรือผูกขาดตามที่ตกลง), สัดส่วนรายได้, เงื่อนไขการยกเลิกสัญญา/ถอดผลงาน
- **ระบบจัดเรตเนื้อหา (Content Rating)**: แบ่งเนื้อหาเป็น All Ages / 13+ / 18+ (สำหรับมังงะแนวผู้ใหญ่ที่พบได้ทั่วไป) พร้อม **Age Verification Gate** ก่อนเข้าถึงเนื้อหา 18+ — วิธีการยืนยัน (ระบุชัดเจนเพื่อไม่ให้ AI ผู้พัฒนาต้องเดา): **(1)** ผู้ใช้กรอกวันเกิดจริงตอนสมัครสมาชิก ระบบคำนวณอายุอัตโนมัติและซ่อน/บล็อกเนื้อหา 18+ หากอายุยังไม่ถึง 20 ปีบริบูรณ์ (เกณฑ์ผู้บรรลุนิติภาวะตามกฎหมายไทย) **(2)** เมื่อผู้ใช้พยายามเปิดเนื้อหา 18+ ครั้งแรก ให้มี Modal ยืนยันอายุซ้ำอีกครั้งแบบ Self-declare **(3)** เก็บช่องทางอัปโหลดบัตรประชาชนไว้เป็นตัวเลือกเสริมสำหรับ Phase ถัดไป หากต้องการความเข้มงวดสูงขึ้น
- **ขั้นตอนแจ้งลบเนื้อหาละเมิดลิขสิทธิ์ (Copyright Takedown / DMCA-like Flow)**: ฟอร์มให้เจ้าของลิขสิทธิ์แจ้งเรื่อง, กระบวนการตรวจสอบของ Admin, การแจ้งเตือนนักเขียนที่ถูกร้องเรียน และมาตรการหากละเมิดซ้ำ (ระงับบัญชี)
- **นโยบายคืนเหรียญเมื่อเนื้อหาถูกถอด (Content Takedown Refund Policy)**: หากตอนที่ผู้อ่านปลดล็อกด้วยเหรียญไปแล้วถูกถอดออกภายหลังจากการแจ้งละเมิดลิขสิทธิ์ที่พิสูจน์แล้วว่าเป็นจริง ให้คืนเหรียญเต็มจำนวนให้ผู้อ่านที่ซื้อไปโดยอัตโนมัติ และบันทึกเป็นรายการพิเศษแยกจาก Refund ปกติ เพื่อไม่ให้กระทบยอดรายได้ที่นักเขียนเจ้าของเนื้อหาที่แท้จริงควรได้รับ
- Community Guidelines สำหรับคอมเมนต์และการมีส่วนร่วม (ห้ามเนื้อหาที่ผิดกฎหมาย ล่วงละเมิด หรือสแปม)

### 6.1 การกรองเนื้อหาเบื้องต้นด้วย AI (AI-assisted Pre-moderation) — *เพิ่มเติม (Phase 3)*

เมื่อปริมาณเนื้อหาเยอะขึ้น การให้ Content Moderator (หมวด 3.1) ตรวจทุกอย่างด้วยคนจะช้าและไม่ยั่งยืน ให้เพิ่มชั้นกรองอัตโนมัติก่อนถึงคิวตรวจของคน:

- **กรองภาพ**: ใช้ Image Moderation API (เช่น Google Cloud Vision SafeSearch หรือ AWS Rekognition Content Moderation) สแกนภาพมังงะทุกหน้าที่อัปโหลดใหม่โดยอัตโนมัติ เพื่อตรวจจับเนื้อหาที่อาจผิดเรตหรือผิดกฎหมาย
- **กรองข้อความ**: ใช้ Text Moderation API (เช่น OpenAI Moderation API หรือ Perspective API) ตรวจคำหยาบ/สแปม/เนื้อหาไม่เหมาะสมในคอมเมนต์แบบเรียลไทม์ ก่อนแสดงผลต่อสาธารณะ
- **Threshold การตัดสินใจ**: หากคะแนนความมั่นใจของ AI สูงเกินเกณฑ์ที่กำหนด ให้ระงับการเผยแพร่อัตโนมัติและส่งเข้าคิวตรวจสอบของ Content Moderator ก่อน หากต่ำกว่าเกณฑ์ให้เผยแพร่ได้ทันทีโดยไม่ต้องรอคน
- ระบบนี้เป็น**ตัวช่วยกรองเบื้องต้นเท่านั้น** การตัดสินใจสุดท้ายเมื่อถูกตีธงยังคงอยู่ที่ Content Moderator เสมอ ไม่ใช้ AI ตัดสินแทนคนทั้งหมด

---

## 7. ระบบป้องกันการละเมิดลิขสิทธิ์ภาพมังงะ (Anti-Piracy & Content Protection)

> หมายเหตุ: ไม่มีมาตรการใดป้องกันการขโมยเนื้อหาได้ 100% เป้าหมายคือเพิ่มความยากในการคัดลอกเพื่อลดการรั่วไหลจำนวนมาก ไม่ใช่ปิดกั้นสมบูรณ์

- **Watermark อัตโนมัติ**: ใส่ลายน้ำ (โปร่งแสง) บนภาพมังงะทุกหน้า อาจฝัง User ID แบบไม่เห็นด้วยตา (Invisible/Forensic Watermark) เพื่อสืบย้อนกลับได้หากภาพหลุด
- **ป้องกันการดาวน์โหลดเบื้องต้น**: ปิดการคลิกขวา/ลาก, render ภาพผ่าน Canvas หรือแบ่งภาพเป็น Tile เล็กๆ แทนการฝังไฟล์ภาพตรงๆ ใน `<img>`
- **Hotlink Protection**: ตั้งค่า CDN/Storage ให้ปฏิเสธการเรียกใช้ภาพจากโดเมนอื่น
- **จำกัดอัตราการเข้าถึงเนื้อหา (Rate Limiting)** ต่อบัญชี เพื่อสกัดบอทที่พยายามโหลดทุกหน้าอย่างรวดเร็ว
- **ระบบแจ้งเตือน Admin** เมื่อพบพฤติกรรมการเข้าถึงเนื้อหาผิดปกติ (เช่น บัญชีเดียวเปิดหลายร้อยหน้าในเวลาสั้นๆ)

---

## 8. การเข้าสู่ระบบและการแจ้งเตือนสำหรับตลาดไทย (LINE Login / LINE Notify)

- เพิ่ม **LINE Login** เป็นหนึ่งใน OAuth Provider หลัก (คู่กับ Google/Facebook/Apple ID) เนื่องจาก LINE เป็นแพลตฟอร์มที่มีผู้ใช้งานสูงที่สุดในไทย การมีตัวเลือกนี้ช่วยลด Friction ในการสมัครสมาชิกอย่างมาก
- ใช้ **LINE Messaging API / LINE Notify** เป็นช่องทางแจ้งเตือนเสริมนอกเหนือจาก In-app Notification และ Email เช่น แจ้งตอนใหม่ แจ้งโปรโมชั่นเหรียญ แจ้งสถานะการถอนเงินของนักเขียน
- ผู้ใช้ตั้งค่าเปิด/ปิดการเชื่อมต่อ LINE และเลือกประเภทการแจ้งเตือนที่ต้องการรับได้เอง

---

## 9. ระบบ Gamification และ Retention

- **เช็คอินรายวัน (Daily Check-in)**: รับเหรียญฟรีเมื่อเข้าเว็บ/แอปทุกวัน โบนัสเพิ่มขึ้นตามจำนวนวันติดต่อกัน
- **Reading Streak**: นับจำนวนวันที่อ่านต่อเนื่อง แสดงผลเป็น Badge หรือของรางวัลพิเศษเมื่อครบเป้าหมาย
- **Achievement/Badge System**: ปลดล็อกความสำเร็จ เช่น อ่านครบ 10 เรื่อง, คอมเมนต์ครบ 50 ครั้ง, ติดตามนักเขียน 20 คน
- **ระบบเชิญเพื่อน (Referral)**: ทั้งผู้เชิญและผู้ถูกเชิญได้รับเหรียญฟรีเมื่อสมัครสมาชิกสำเร็จ
- **ภารกิจรายสัปดาห์ (Weekly Missions)**: ภารกิจเล็กๆ ที่ให้รางวัลเหรียญ เพื่อกระตุ้นการกลับมาใช้งานสม่ำเสมอ

---

## 10. ระบบแนะนำเนื้อหาส่วนบุคคล (Recommendation Engine)

- เริ่มต้นด้วย **Rule-based Recommendation**: แนะนำเรื่องจากแนว/แท็กที่ผู้ใช้เคยอ่านหรือบุ๊คมาร์ค, เรื่องที่ผู้ใช้ที่มีพฤติกรรมคล้ายกันอ่าน (Simple Collaborative Filtering)
- แสดงผลเป็นบล็อก **"แนะนำสำหรับคุณ"** และ **"เพราะคุณเคยอ่าน [ชื่อเรื่อง]"** บนหน้าแรกและหน้ารายละเอียดเรื่อง
- เก็บ Event การอ่าน/ปลดล็อก/บุ๊คมาร์คไว้เป็นข้อมูลตั้งต้น เพื่อพัฒนาเป็นระบบ ML-based Recommendation ในเฟสถัดไปได้โดยไม่ต้องออกแบบ Data Pipeline ใหม่

---

## 11. สถาปัตยกรรมระบบและเทคโนโลยีที่แนะนำ (Architecture & Tech Stack)

อนุญาตให้ AI ผู้พัฒนาปรับเปลี่ยนเทคโนโลยีได้ตามความเหมาะสม แต่ให้ยึดแนวทางต่อไปนี้เป็นค่าเริ่มต้น:

| ส่วนของระบบ | เทคโนโลยีที่แนะนำ | เหตุผล |
|---|---|---|
| Frontend | Next.js (React) + TypeScript + Tailwind CSS | SEO ดี (SSR/ISR), Performance สูง |
| State Management | React Query / Zustand | จัดการ Cache และ Global State ได้มีประสิทธิภาพ |
| Backend API | Node.js (NestJS) หรือ Go (Fiber/Gin) | โครงสร้างชัดเจน รองรับ Modular/Microservice ในอนาคต |
| ฐานข้อมูลหลัก | PostgreSQL | รองรับ Transaction (ACID) สำหรับระบบการเงิน/เหรียญ |
| แคช/Session | Redis | เพิ่มความเร็วอ่านข้อมูลยอดนิยม, จัดการ Session/Queue |
| จัดเก็บไฟล์ภาพ | S3-compatible Storage (AWS S3 / Cloudflare R2) + CDN | รองรับภาพมังงะจำนวนมาก โหลดเร็วทั่วโลก |
| ระบบค้นหา | Elasticsearch หรือ Algolia/Meilisearch | ค้นหาเรื่อง/แท็ก/นักเขียนได้รวดเร็วแม่นยำ |
| Authentication | JWT + Refresh Token, OAuth2 (Google/Facebook/Apple/**LINE**) | ปลอดภัยและรองรับ Social Login ที่ตลาดไทยใช้จริง |
| Payment | Omise (Opn Payments) / 2C2P ผ่าน **Payment Provider Abstraction Layer** | รองรับช่องทางไทย และสลับ/เพิ่ม IAP Provider ได้ในอนาคต (ดูหมวด 5.6) |
| แจ้งเตือน Real-time | WebSocket (Socket.io) + Firebase Cloud Messaging + LINE Notify | แจ้งเตือนทันทีทั้งเว็บ มือถือ และ LINE |
| Deployment/Infra | Docker + CI/CD (GitHub Actions) บน AWS/GCP | ปรับขนาดระบบและ Deploy อัตโนมัติได้ |
| **Edge Security** | **Cloudflare (WAF + DDoS Protection)** | ป้องกันการโจมตีก่อนถึง Backend จริง, กรอง Bot/Traffic ผิดปกติ |
| **AI Content Moderation** | Google Cloud Vision SafeSearch (ภาพ) + OpenAI Moderation API (ข้อความ) | กรองเนื้อหาเบื้องต้นอัตโนมัติก่อนถึงคิวตรวจของ Content Moderator (ดูหมวด 6.1) |
| Monitoring | Grafana + Prometheus / Sentry | ติดตามสถานะระบบและ Error แบบเรียลไทม์ |
| Product Analytics | Google Analytics 4 / Mixpanel | วัดพฤติกรรมผู้ใช้จริงหลัง Launch (ดูหมวด 18) |

**แนวทางสถาปัตยกรรม**
- ออกแบบ Backend เป็น Modular Monolith ในระยะแรก แบ่งโมดูลชัดเจน (Auth, Content, Coin/Wallet, Payment, Notification, Admin) เพื่อแยกเป็น Microservice ได้ง่ายในอนาคต
- ใช้ Message Queue (BullMQ บน Redis หรือ RabbitMQ) สำหรับงานเบื้องหลัง เช่น ประมวลผลภาพมังงะ, ส่งอีเมล/แจ้งเตือน, Reconcile ธุรกรรมการเงิน
- แยก Database Read Replica สำหรับงานอ่านหนัก (หน้าแรก/อันดับความนิยม) เพื่อไม่กระทบ Performance ของธุรกรรมการเงิน
- **API Versioning**: กำหนด Prefix เวอร์ชันตั้งแต่ต้น เช่น `/api/v1/...` ทุก Endpoint เพื่อให้อัปเดต/เปลี่ยนแปลง API ในอนาคต (เช่น `/api/v2/`) ได้โดยไม่กระทบแอปเวอร์ชันเก่าที่ยังใช้งานอยู่ (สำคัญมากเมื่อมีแอปมือถือ Native ที่อัปเดตช้ากว่าเว็บ)

---

## 12. โครงสร้างฐานข้อมูลเบื้องต้น (Database Schema Outline)

| ตาราง | คำอธิบาย |
|---|---|
| users | ข้อมูลผู้ใช้ทั้งหมด, role, สถานะบัญชี, ข้อมูลยืนยันตัวตน, วันเกิด (สำหรับ Age Verification) |
| user_sessions | อุปกรณ์/เบราว์เซอร์ที่ล็อกอินอยู่ของแต่ละผู้ใช้ พร้อมเวลาที่เข้าใช้งานล่าสุด สำหรับ Session Management |
| admin_roles | สิทธิ์ย่อยของ Admin (Content Moderator/Finance Admin/Super Admin) และสิทธิ์ที่ผูกกับแต่ละ Sub-role |
| author_profiles | ข้อมูล KYC, บัญชีธนาคารสำหรับรับเงิน |
| stories | ชื่อ, ปก, เรื่องย่อ, ประเภท (นิยาย/มังงะ), สถานะ, author_id, **content_rating** |
| chapters | ลำดับตอน, ชื่อตอน, ราคาเหรียญ, สถานะเผยแพร่, วันที่ปล่อย |
| chapter_contents | เนื้อหาจริง: ข้อความ (นิยาย) หรือรายการไฟล์ภาพเรียงลำดับ (มังงะ) |
| tags / categories | หมวดหมู่และแท็กแนวเรื่อง พร้อมตารางเชื่อม story_tags |
| coin_wallets | กระเป๋าเหรียญของผู้ใช้แต่ละคน แยกยอดเหรียญซื้อ/เหรียญฟรี พร้อม **expiry_date** |
| coin_transactions | ประวัติการเพิ่ม/หักเหรียญทุกรายการ (Ledger) |
| coin_packages | แพ็กเกจเหรียญที่ Admin กำหนดราคาและโบนัส |
| payment_orders | คำสั่งซื้อเหรียญที่เชื่อมกับ Payment Gateway/IAP Provider, สถานะการชำระเงิน, **payment_provider_type** (web/apple_iap/google_billing) |
| refund_requests | คำขอคืนเงิน/ข้อพิพาท Chargeback/**คืนเหรียญจาก Content Takedown** และสถานะการดำเนินการ |
| chapter_purchases | บันทึกว่าผู้ใช้คนใดปลดล็อกตอนใดไปแล้วบ้าง |
| comments | คอมเมนต์ท้ายตอน/เรื่อง พร้อมโครงสร้างตอบกลับ (nested) |
| ratings | คะแนนรีวิวของแต่ละเรื่องจากผู้ใช้ |
| bookmarks / library | รายการเรื่องที่บันทึกไว้ และประวัติการอ่านล่าสุด |
| follows | ความสัมพันธ์การติดตามนักเขียนของผู้อ่าน |
| notifications | รายการแจ้งเตือนของผู้ใช้แต่ละคน |
| payout_requests | คำขอถอนรายได้ของนักเขียนและสถานะการอนุมัติ |
| reports / moderation_logs | รายงานเนื้อหาไม่เหมาะสมและบันทึกการตรวจสอบของ Admin |
| copyright_claims | คำร้องแจ้งลบเนื้อหาละเมิดลิขสิทธิ์และสถานะดำเนินการ |
| user_achievements | Badge/Achievement ที่ผู้ใช้ปลดล็อกแล้ว |
| daily_checkins | ประวัติการเช็คอินรายวันและ Streak ปัจจุบัน |
| support_tickets | คำร้อง/ปัญหาที่ผู้ใช้ทั่วไปแจ้งเข้ามา |
| audit_logs | บันทึกการกระทำสำคัญของผู้ดูแลระบบทั้งหมด แยกตาม admin_role |

---

## 13. รายการ API หลักที่ต้องมี (Key API Endpoints)

> ทุก Endpoint ให้ขึ้นต้นด้วย Version Prefix เช่น `/api/v1/...` ตามที่ระบุในหมวด 11

**Auth & Users**
- `POST /api/v1/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/oauth/{provider}` (รวม `line`)
- `GET/PUT /api/v1/users/me`, `GET /users/:id/profile`
- `POST /api/v1/users/me/data-export`, `DELETE /users/me` (สิทธิ์ตาม PDPA — ดูหมวด 18)
- `GET /api/v1/users/me/sessions`, `DELETE /users/me/sessions/:id`, `POST /users/me/sessions/revoke-all` (จัดการอุปกรณ์ที่ล็อกอิน)

**Content (Stories & Chapters)**
- `GET /api/v1/stories`, `GET /stories/:id`, `POST /stories` (Author), `PUT/DELETE /stories/:id`
- `POST /api/v1/stories/:id/chapters`, `PUT/DELETE /chapters/:id`, `POST /chapters/:id/images`
- `GET /api/v1/chapters/:id/content` (ตรวจสิทธิ์การเข้าถึงก่อนส่งเนื้อหา)

**Coin & Payment**
- `GET /api/v1/coin/packages`, `POST /coin/purchase`, `POST /payment/webhook/:provider`
- `GET /api/v1/wallet/balance`, `GET /wallet/transactions`, `POST /chapters/:id/unlock`
- `POST /api/v1/coin/refund-requests` (คำขอคืนเงิน)

**Author**
- `GET /api/v1/author/dashboard/stats`, `GET /author/earnings`, `POST /author/payout-requests`

**Admin** (ต้องตรวจสอบ Sub-role ตามหมวด 3.1 ก่อนอนุญาต)
- `GET /api/v1/admin/users`, `PATCH /admin/users/:id/status`
- `GET /api/v1/admin/content/pending`, `PATCH /admin/content/:id/approve`
- `GET /api/v1/admin/finance/transactions`, `PATCH /admin/payout-requests/:id`, `GET /admin/reports/overview`
- `POST /api/v1/admin/copyright-claims`, `PATCH /admin/copyright-claims/:id`

**Engagement & Gamification**
- `POST /api/v1/stories/:id/comments`, `POST /stories/:id/rating`, `POST /stories/:id/bookmark`, `POST /authors/:id/follow`
- `POST /api/v1/gamification/checkin`, `GET /gamification/achievements`
- `GET /api/v1/recommendations/for-me`, `GET /recommendations/similar/:storyId`

**Support**
- `POST /api/v1/support/tickets`, `GET /support/tickets/:id`

---

## 14. แนวทางการออกแบบ UX/UI: ธีมดาร์ก มินิมอล (Apple.com x Kakao Webtoon)

แพลตฟอร์มใช้สุนทรียะการออกแบบ **Dark Minimal** โดยผสานจุดเด่น 2 ด้านเข้าด้วยกัน:
1. **ความประณีต มินิมอล และฟังก์ชันพรีเมียมจาก Apple.com**: การจัดระเบียบ Typography, เส้น Hairline ที่คมชัด, พื้นผิวกระจกฝ้ากึ่งโปร่งแสง (Translucent Frosted Glass), ความเรียบง่ายที่สงบนิ่ง ไร้สิ่งรบกวนสายตา
2. **การจัดวาง Section ให้อ่านง่าย สบายตา ชูเนื้อหาเป็นพระเอก จาก Kakao Webtoon (webtoon.kakao.com)**: ลื่นไหล ไม่ซับซ้อน ปราศจากกล่องซ้อนกล่อง (No nested card clutter) นำสายตาด้วยงานภาพปกแบบเต็มตา และการจัดหมวดหมู่ที่เข้าถึงง่ายทันที

---

### 14.1 สุนทรียะ Dark Minimal สไตล์ Apple.com (Apple Dark Minimal Aesthetic)

- **พื้นหลัง OLED Dark**: ใช้สีดำสนิท Pure Black (`#000000`) หรือ Deep Obsidian Charcoal (`#0A0A0C`, `#121214`) เป็นแกนหลัก เพื่อให้ภาพหน้าปกนิยายและมังงะเปล่งประกายโดดเด่นที่สุด
- **เส้นขอบ Hairline ละเอียด**: หลีกเลี่ยงเงากล่องหนาเตอะ (Heavy box-shadow) ให้ใช้เส้นขอบบางเฉียบแบบ Hairline border (`border: 1px solid rgba(255, 255, 255, 0.08)`) สวยงาม คมชัด ไม่แย่งสายตา
- **วัสดุกระจกฝ้า (Translucent Frosted Glass)**: Navigation Bar ด้านบนและแถบเมนูลอยตัว ใช้ `backdrop-filter: blur(20px)` ร่วมกับพื้นหลังกึ่งโปร่งแสง `rgba(0, 0, 0, 0.75)` ให้ความรู้สึกล้ำสมัยและกลมกลืนกับเนื้อหา
- **Apple Typography Hierarchy**:
  - ฟอนต์ภาษาอังกฤษ: SF Pro Display / SF Pro Text / Inter
  - ฟอนต์ภาษาไทย: IBM Plex Sans Thai หรือ Noto Sans Thai
  - อัตราส่วนคอนทราสต์ที่สบายตา: Headline สีขาวสว่าง 100% (`#FFFFFF`), Subheadline/Body สีเทาสว่าง 70% (`#A1A1A6`), Metadata/Label สีเทา 45-50% (`#6E6E73`)
  - Tracking/Letter Spacing กระชับ (`tracking-tight`) และ Line Height ที่สมดุล

| ระดับ Typography | ขนาด (Desktop) | น้ำหนักตัวอักษร | ความสว่าง/สี |
|---|---|---|---|
| Display (Hero Headline) | 64–84px | Bold | `#FFFFFF` |
| Heading 1 (Section Title) | 32–40px | Semibold | `#FFFFFF` |
| Heading 2 (Card/Subheading) | 20–24px | Medium–Semibold | `#FFFFFF` |
| Body Text | 16–17px | Regular | `#A1A1A6` |
| Caption / Label / Tag | 12–13px | Regular–Medium | `#6E6E73` |

---

### 14.2 ระบบปุ่มและ Interactive Elements: "สีซอฟต์ ไม่ต้องทำอะไรมาก" (Soft Minimal Action System)

ปุ่มที่ต้องการให้โดดเด่น (Primary CTA เช่น "อ่านเลย", "ปลดล็อกตอน", "เติมเหรียญ", "สมัครสมาชิก / ยืนยัน"):
- **โทนสีซอฟต์นวลตา (Soft / Muted Tone)**:
  - **Soft Porcelain / Warm Off-White** (`#F5F5F7` หรือ `#ECECED` ตัวหนังสือสีดำสนิท `#0A0A0C`): โดดเด่น ชัดเจน สง่างาม สบายตา สไตล์ Apple Keynote
  - หรือ **Soft Muted Slate / Lavender** (`#818CF8` หรือ `#93C5FD` ความอิ่มตัวต่ำ นุ่มนวล): สบายตา ไม่กระแทกสายตา
  - หรือ **Soft Warm Champagne / Sand** (`#E5DFD7` ตัวหนังสือสีดำสนิท)
- **กฎ "ไม่ต้องทำอะไรมาก"**:
  - **ห้ามใส่แสงนีออนจัดจ้าน (Strictly NO harsh neon glow / colored drop shadows)**
  - **ห้ามใส่กราเดียนต์สีสดฉูดฉาด (NO high-saturation multi-color gradients)**
  - รูปทรง: มนแคปซูล (Pill-shaped `rounded-full`) หรือขอบมนนุ่มนวล (`rounded-xl`)
  - Micro-interaction: แตะ/Hover นุ่มนวล เพียงแค่หรี่ความสว่างเล็กน้อย (`hover:opacity-90`) หรือขยายขนาดเพียงเล็กน้อย (`hover:scale-[1.01]`) ร่วมกับ `transition: all 0.2s ease`
- **ปุ่มรอง (Secondary / Ghost Action)**:
  - กระจกมืดโปร่งแสง `bg-white/[0.06] hover:bg-white/[0.1] text-white/85 border border-white/[0.08]` มนแคปซูล เข้าคู่กันอย่างลงตัว

---

### 14.3 สถาปัตยกรรมจัดหน้า Section สไตล์ Kakao Webtoon (webtoon.kakao.com Section Architecture)

ปรัชญาคือ **"อ่านง่าย สบายตา ไม่ซับซ้อน (Effortless & Uncomplicated)"** ตัดลูกเล่น Bento Grid ที่รกสายตาในหน้าคอนเทนต์ออกทั้งหมด จัดวางตาม Flow ของเว็บอ่านการ์ตูนชั้นนำระดับสากล:

1. **Top Minimal Navigation Bar**:
   - เรียบหรู บางเบา ติดด้านบนแบบ Sticky พร้อมเบลอกระจกฝ้า (`backdrop-filter: blur(20px)`)
   - โลโก้แบรนด์ + เมนูสลับประเภทหลัก [นิยาย] [มังงะ/เว็บตูน] + ช่องค้นหามินิมอล + กระเป๋าเหรียญ & โปรไฟล์
2. **Hero Billboard Spotlight (แบนเนอร์กว้างระดับภาพยนตร์)**:
   - แบนเนอร์แสดงผลงานเด่นแบบ Edge-to-Edge หรือ Wide Banner นำเสนอลายเส้นเต็มตา
   - ไล่เฉดเงาดำ (Vignette Scrim) จากขอบล่างอย่างนุ่มนวล เพื่อให้ชื่อเรื่อง คำโปรยสั้นๆ และปุ่ม CTA "อ่านเลย" (สีซอฟต์) อ่านง่าย ชัดเจน
   - มีปุ่มเปลี่ยนสไลด์เรียบหรู หรือแถบจุดอินดิเคเตอร์มินิมอล
3. **Daily Schedule Bar (ตารางอัปเดตประจำวัน)**:
   - แถบแท็บแนวนอนมินิมอลเลือกวัน: `[จันทร์] [อังคาร] [พุธ] [พฤหัส] [ศุกร์] [เสาร์] [อาทิตย์] [จบแล้ว] [ยอดนิยม]`
   - แตะวันแล้วสลับแสดงผลงานที่อัปเดตในวันนั้นทันที ผู้ใช้เข้าถึงง่ายในคลิกเดียวโดยไม่ต้องโหลดเปลี่ยนหน้า
4. **Horizontal Curated Shelves (แถวผลงานแบบเลื่อนแนวนอน)**:
   - จัดหมวดหมู่ชัดเจน เช่น "ผลงานมาแรงวันนี้ (Trending)", "มังงะ Original แนะนำ", "นิยายยอดนิยมประจำสัปดาห์"
   - การ์ดผลงานแนวตั้ง อัตราส่วน 3:4 (Poster Aspect Ratio)
   - **ปราศจากกรอบการ์ดหนาๆ**: ใช้ภาพปกเป็นตัวเล่าเรื่อง มีเพียงชื่อเรื่อง, ป้ายกำกับเล็กๆ (เช่น `UP`, `NEW`, `18+` สีซอฟต์), ชื่อผู้แต่ง และยอดอ่าน/คะแนน อย่างเรียบง่ายด้านล่าง
5. **Top 10 Masterpiece Ranking (อันดับผลงานยอดนิยม)**:
   - ลิสต์อันดับ 1–5 หรือ 1–10 ดีไซน์คลีน ตัวเลขอันดับ `01`, `02`, `03` ฟอนต์สไตล์ Apple สะอาดตา
   - แสดงภาพปกขนาดกะทัดรัด, ชื่อเรื่อง, สถิติยอดอ่าน, และปุ่มเปิดอ่านทันที
6. **Quick Genre Filter (ค้นหาด่วนตามแนว)**:
   - แท็บเม็ดแคปซูลมินิมอล: แฟนตาซี, โรแมนติก, กำลังภายใน, ไซไฟ, แอ็กชัน, ดราม่า
7. **Continue Reading Shelf (อ่านต่อจากตอนล่าสุด)**:
   - สำหรับสมาชิกที่ล็อกอิน แสดงแถบประวัติอ่านต่อแบบกะทัดรัด แตะอ่านต่อได้ทันที


---

## 15. กลยุทธ์ SEO (Search Engine Optimization)

- สร้าง **Sitemap.xml** อัตโนมัติ อัปเดตทุกครั้งที่มีเรื่อง/ตอนใหม่เผยแพร่
- กำหนด **Meta Title/Description** แบบ Dynamic ต่อหน้าเรื่องและหน้าตอน (ดึงจากชื่อเรื่อง/เรื่องย่อ)
- ใช้ **Structured Data (Schema.org)** ประเภท Book/CreativeWork เพื่อให้ Google แสดงผลแบบ Rich Snippet
- ใช้ Next.js SSR/ISR (Server-Side Rendering/Incremental Static Regeneration) สำหรับหน้ารายละเอียดเรื่องและหน้าตอนแรกที่เปิดให้อ่านฟรี เพื่อให้ Search Engine Index เนื้อหาได้
- ออกแบบ URL Slug ที่อ่านง่ายและมีคำสำคัญ เช่น `/story/ชื่อเรื่อง-slug/chapter-1`
- เพิ่ม Open Graph Tags สำหรับการแชร์ไปโซเชียลมีเดียให้แสดงปกเรื่อง/เรื่องย่อสวยงาม

---

## 16. ระบบสนับสนุนลูกค้าฝั่งผู้ใช้ (Customer Support / Help Center)

- หน้า **Help Center/FAQ** แยกหมวดหมู่ (บัญชีผู้ใช้, การซื้อเหรียญ, ปัญหาการชำระเงิน, สำหรับนักเขียน)
- ฟอร์ม/ช่องทางแจ้งปัญหา (Support Ticket) ที่ผู้อ่านทั่วไปใช้ได้โดยตรง ไม่ต้องผ่าน Admin Panel
- ระบบติดตามสถานะ Ticket ของตนเอง (เปิด/กำลังดำเนินการ/ปิดแล้ว)
- พิจารณาเพิ่ม Live Chat หรือ Chatbot เบื้องต้นตอบคำถามที่พบบ่อยในเฟสถัดไป

---

## 17. Analytics และ Event Tracking

- เชื่อมต่อ **Google Analytics 4** และ/หรือ **Mixpanel** สำหรับ Product Analytics แยกจากรายงานธุรกิจฝั่ง Admin
- กำหนดชุด Event มาตรฐานที่ต้อง Track ตั้งแต่เริ่ม เช่น: `user_signup`, `story_viewed`, `chapter_unlocked`, `coin_purchased`, `checkin_completed`, `story_bookmarked`, `payout_requested`
- ใช้ข้อมูลนี้วัด Conversion Funnel หลัก: เข้าเว็บ → อ่านฟรี → สมัครสมาชิก → ซื้อเหรียญ → ปลดล็อกตอนซ้ำ (Retention)
- ตั้งค่า Dashboard สรุปผล KPI สำคัญให้ทีมธุรกิจดูได้โดยไม่ต้อง Query ฐานข้อมูลเอง

---

## 18. ข้อกำหนดที่ไม่ใช่ฟังก์ชัน (Non-Functional Requirements)

- **ความปลอดภัย**: ป้องกันตาม OWASP Top 10, Rate Limiting, เข้ารหัสรหัสผ่าน (bcrypt/argon2), CSRF/XSS Protection, **WAF/DDoS Protection ที่ Edge (Cloudflare)** ก่อนถึง Backend จริง
- **ความเป็นส่วนตัวของข้อมูล**: ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) ของไทย รวมถึง **สิทธิ์ของเจ้าของข้อมูล (Data Subject Rights)** — ผู้ใช้ต้องสามารถ **ขอดู/ขอส่งออก (Export)/ขอลบข้อมูลส่วนตัว (Right to be Forgotten)** ได้ด้วยตนเองผ่านหน้าโปรไฟล์ พร้อมกระบวนการยืนยันตัวตนก่อนดำเนินการลบถาวร
- **นโยบายระยะเวลาการเก็บข้อมูล (Data Retention Policy)**: กำหนดระยะเวลาเก็บข้อมูลแต่ละประเภทให้ชัดเจนแทนการเก็บไว้ตลอดไป เช่น Audit Log เก็บ 1–2 ปีแล้วเก็บถาวรแบบ Archive, ข้อมูลธุรกรรมการเงินเก็บตามที่กฎหมายบัญชี/ภาษีไทยกำหนด (โดยทั่วไปอย่างน้อย 5 ปี), ข้อมูลส่วนตัวของผู้ใช้ที่ขอลบบัญชีให้ลบออกจากระบบ Production ภายใน 30 วัน (ยกเว้นข้อมูลที่กฎหมายบังคับให้เก็บ เช่น ประวัติธุรกรรม)
- **ประสิทธิภาพ**: ใช้ CDN และ Image Optimization สำหรับภาพมังงะจำนวนมาก, Caching หลายชั้น
- **ความสามารถขยายระบบ**: ออกแบบให้รองรับผู้ใช้งานพร้อมกันจำนวนมากในอนาคต (Horizontal Scaling)
- **การรองรับ API รุ่นเก่า**: เมื่อมี API Versioning (หมวด 11) ต้องคง Backward Compatibility ของเวอร์ชันเก่าไว้ระยะหนึ่งหลังปล่อยเวอร์ชันใหม่ เพื่อไม่ให้แอปมือถือเวอร์ชันเก่าที่ผู้ใช้ยังไม่อัปเดตพังกะทันหัน
- **รองรับหลายภาษา**: เริ่มต้นด้วยภาษาไทยและอังกฤษ (i18n)
- **การสำรองข้อมูล**: มีระบบ Backup ฐานข้อมูลอัตโนมัติและแผน Disaster Recovery พร้อมกำหนดเป้าหมาย RTO/RPO ที่ชัดเจน

---

## 19. โครงสร้างโปรเจกต์และมาตรฐานทางวิศวกรรม (Project Structure & Engineering Standards)

เพื่อให้ระบบเป็นระเบียบ ดูแลรักษาง่าย และส่งต่อให้ทีม/AI อื่นทำงานต่อได้ในอนาคตโดยไม่ต้องรื้อโครงสร้างใหม่:

| หมวดหมู่ | เครื่องมือ/แนวทางที่แนะนำ | วัตถุประสงค์ |
|---|---|---|
| จัดการ Repository | Turborepo หรือ Nx (Monorepo) | รวม Frontend/Backend/Shared Code ไว้ที่เดียว Build แบบ Incremental |
| Database ORM | Prisma | Type-safe Query + ระบบ Migration ในตัว |
| เอกสาร API | Swagger/OpenAPI (`@nestjs/swagger`) | Generate API Doc อัตโนมัติจากโค้ด |
| เอกสาร Component | Storybook | แสดงและทดสอบ UI Component แยกจากตัวแอปจริง |
| คุณภาพโค้ด | ESLint + Prettier + Husky + lint-staged | บังคับมาตรฐานโค้ดเดียวกันทั้งทีมอัตโนมัติก่อน Commit |
| การทดสอบ | Jest (Unit/Integration), Playwright (E2E) | ป้องกัน Bug โดยเฉพาะ Flow การเงิน/เหรียญ |
| CI/CD | GitHub Actions | รัน Lint/Test/Build อัตโนมัติ และ Deploy ขึ้น Staging/Production |
| ติดตาม Error | Sentry | รับรู้และแก้ปัญหา Error บน Production แบบเรียลไทม์ |

**19.1 โครงสร้าง Repository (Monorepo)**
- แบ่งเป็น `apps/web` (Frontend), `apps/api` (Backend), `packages/ui` (Shared Component Library), `packages/types` (Shared TypeScript Types/DTO), `packages/config` (ESLint/TSConfig กลาง)
- ประโยชน์: แชร์ Type ข้อมูลระหว่าง Frontend-Backend ได้โดยตรง ลดความคลาดเคลื่อนของข้อมูล และ Build/Test เฉพาะส่วนที่มีการแก้ไข

**19.2 Backend: รูปแบบสถาปัตยกรรม**
- แบ่งทุกฟีเจอร์เป็น Module อิสระ (auth, stories, coin, payment, admin ฯลฯ) แยกชั้นชัดเจนแบบ Layered Architecture: Controller → Service → Repository/Prisma
- ใช้ DTO ร่วมกับ `class-validator` ตรวจสอบข้อมูล Input ทุก Endpoint
- แยก Business Logic ออกจาก Controller อย่างเคร่งครัด เพื่อทดสอบ (Unit Test) และแก้ไขต่อยอดได้ง่าย
- ใช้ Guard/Middleware ตรวจสอบ Admin Sub-role (หมวด 3.1) ก่อนอนุญาตเข้าถึง Endpoint ฝั่ง Admin ทุกตัว

**19.3 Frontend: โครงสร้างและ Design System**
- จัดโฟลเดอร์แบบ Feature-based (`features/reader`, `features/coin-wallet`, `features/author-dashboard`)
- แยก Component Library กลาง (`packages/ui` หรือ `@/components/ui`) ตาม Atomic Design บันทึกไว้ใน Storybook
- รวม Design Token ไว้ในไฟล์กลางเดียว (`globals.css` และ `tailwind.config.ts`) ยึดตามหมวด 14:
  - **Color Tokens**: `--background: #000000`, `--surface-elevated: #0d0d0f`, `--surface-card: #161617`, `--border-hairline: rgba(255,255,255,0.08)`
  - **Soft Button Tokens**: `--btn-primary-bg: #f5f5f7`, `--btn-primary-text: #0a0a0c`, `--btn-secondary-bg: rgba(255,255,255,0.06)`, `--btn-secondary-border: rgba(255,255,255,0.08)` (ห้ามใช้สีนีออนจัดจ้าน)
  - **Section Architecture**: จัดวางหน้าแบบ Kakao Webtoon (webtoon.kakao.com) — ชูงานภาพปก 3:4, แถบตารางประจำวัน จ.-อา., แถวเลื่อนแนวนอน, ปราศจาก Bento Box ที่รกสายตา


**19.4 มาตรฐานคุณภาพโค้ดและระบบอัตโนมัติ**
- ESLint + Prettier บังคับรูปแบบโค้ดเดียวกันทั้งโปรเจกต์
- Husky + lint-staged ตรวจสอบโค้ดอัตโนมัติก่อน Commit
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`) เพื่อประวัติ Git อ่านง่ายและ Generate Changelog อัตโนมัติ
- CI/CD ด้วย GitHub Actions: Lint → Test → Build ทุกครั้งที่ Push/PR และ Deploy อัตโนมัติขึ้น Staging เมื่อ Merge เข้า Branch หลัก

**19.5 กลยุทธ์การทดสอบ**
- Unit Test ด้วย Jest ครอบคลุม Business Logic สำคัญ โดยเฉพาะระบบเหรียญ/การเงินต้อง Coverage สูง
- Integration Test ครอบคลุม API Endpoint หลักทุกตัว
- End-to-End Test ด้วย Playwright จำลอง Flow: สมัครสมาชิก → ซื้อเหรียญ → ปลดล็อกตอน → อ่านเนื้อหา

**19.6 เอกสารประกอบเพื่อให้ทำงานต่อได้ง่าย**
- README.md แยกในแต่ละ App/Package อธิบายหน้าที่, วิธีติดตั้ง, วิธีรันแยกเฉพาะส่วน
- Architecture Decision Record (ADR) เป็นไฟล์ Markdown สั้นๆ ทุกครั้งที่ตัดสินใจทางเทคนิคสำคัญ
- Swagger UI และ Postman Collection ให้เรียกทดสอบ API ได้ทันที

---

## 20. ผลลัพธ์ที่ต้องส่งมอบจาก AI ผู้พัฒนา (Deliverables)

- [ ] เอกสารสถาปัตยกรรมระบบและ ER Diagram ของฐานข้อมูล
- [ ] ซอร์สโค้ด Backend ครบทุกโมดูลตามหมวด 13 พร้อม Migration Script
- [ ] ซอร์สโค้ด Frontend ครบทุกหน้าตามหมวด 4 ตาม Design Guideline หมวด 14
- [ ] การเชื่อมต่อระบบชำระเงินแบบ Sandbox/Mock พร้อม Payment Provider Abstraction Layer ตามหมวด 5.6
- [ ] ระบบ Anti-piracy (Watermark, Canvas Render) ตามหมวด 7
- [ ] ระบบ Gamification (เช็คอิน, Achievement) ตามหมวด 9
- [ ] ระบบแนะนำเนื้อหาเบื้องต้น (Rule-based) ตามหมวด 10
- [ ] หน้า Help Center และ Support Ticket ตามหมวด 16
- [ ] การเชื่อมต่อ Analytics (GA4/Mixpanel) พร้อม Event ตามหมวด 17
- [ ] Admin Sub-roles และ Guard ตรวจสอบสิทธิ์ตามหมวด 3.1
- [ ] Onboarding/First-run Experience ตามหมวด 4.1/4.2/14
- [ ] API พร้อม Version Prefix (`/api/v1/`) ตามหมวด 11/13
- [ ] ระบบ AI-assisted Pre-moderation (ภาพ + ข้อความ) ตามหมวด 6.1
- [ ] Age Verification Flow ตามวิธีที่ระบุในหมวด 6
- [ ] ระบบจัดการ Session/Device และ Force Logout ตามหมวด 4.1/13
- [ ] นโยบายและ Job อัตโนมัติสำหรับ Data Retention ตามหมวด 18
- [ ] ไฟล์ `.env.example` ระบุตัวแปรทั้งหมดที่ต้องตั้งค่า
- [ ] README อธิบายวิธีติดตั้ง รัน และ Deploy ระบบ (รวม Docker Compose หากเป็นไปได้)
- [ ] ชุดทดสอบเบื้องต้น (Unit/Integration Test) สำหรับ Flow สำคัญ โดยเฉพาะระบบเหรียญและการชำระเงิน

> **หมายเหตุ**: หากมีข้อจำกัดทางเทคนิคที่ทำให้ไม่สามารถทำตามสเปกข้อใดได้ครบถ้วน ให้ AI ผู้พัฒนาระบุเหตุผลและแนวทางแก้ไข/ทางเลือกไว้อย่างชัดเจนในเอกสารส่งมอบ (README/ADR) และให้ยึดลำดับความสำคัญตาม Phased Roadmap ในหมวด 2 เป็นหลัก


---

# 20.1 Business Rules & Edge Cases

> หมวดนี้เป็นกฎเชิงธุรกิจที่ AI ผู้พัฒนาต้องยึดถือเพื่อป้องกันการตีความต่างกันระหว่าง Frontend, Backend และ Database หากกฎใดขัดกับหมวดอื่น ให้ยึดกฎด้านความปลอดภัยและความถูกต้องทางการเงินก่อน และบันทึกการตัดสินใจไว้ใน ADR

## 20.1.1 กฎบัญชีและเหรียญ

- การคำนวณยอดเหรียญที่ใช้ตัดสินสิทธิ์ต้องทำที่ Backend เท่านั้น ห้ามเชื่อยอดจาก Frontend
- การปลดล็อกตอนต้องทำภายใต้ Database Transaction เดียวกันกับการหักเหรียญและการสร้าง `chapter_purchases`
- Request ที่ทำรายการเดียวกันซ้ำต้องไม่ทำให้ผู้ใช้ถูกหักเหรียญซ้ำ
- เมื่อผู้ใช้มีเหรียญหลายประเภท ให้ใช้เหรียญที่ใกล้หมดอายุก่อนสำหรับเหรียญที่มีวันหมดอายุ
- เหรียญที่ซื้อด้วยเงินจริงและเหรียญฟรีต้องแยก Ledger และสามารถตรวจสอบย้อนกลับได้
- การแก้ไขยอดเหรียญด้วยมือของ Admin ต้องสร้าง Adjustment/Reversal Transaction และต้องมีเหตุผลกับ Audit Log
- ห้าม `UPDATE` หรือ `DELETE` Financial Ledger เดิมเพื่อแก้ยอด
- หากปลดล็อกตอนสำเร็จแล้ว การอ่านซ้ำไม่ต้องหักเหรียญอีก
- หากตอนเปลี่ยนจาก Premium เป็น Free ผู้ที่ปลดล็อกไปแล้วต้องยังคงมีประวัติการซื้อ
- หากตอนถูกถอดเนื่องจาก Copyright Takedown ให้ใช้ Flow `CONTENT_TAKEDOWN_REFUND` ตามนโยบายที่กำหนด ไม่ใช้ Refund ปกติปะปนกัน
- การซื้อแพ็กเกจเหรียญสำเร็จต้องเกิดจากสถานะ Payment ที่ Backend ยืนยันแล้วเท่านั้น

## 20.1.2 กฎเนื้อหา

- Story/Chapter ที่ยังไม่ผ่านการตรวจสอบห้ามเผยแพร่สู่สาธารณะ
- Author แก้ไขเนื้อหาที่เผยแพร่แล้วได้ แต่ Revision ใหม่ต้องผ่านสถานะตาม Moderation Policy ที่กำหนด
- การลบเนื้อหาที่มีธุรกรรมเกี่ยวข้องต้องไม่ลบ Financial Record
- Story ที่ถูก Suspend ต้องไม่สามารถซื้อหรือปลดล็อกตอนใหม่ได้
- การแก้ไขราคาไม่มีผลย้อนหลังต่อ Chapter Purchase ที่เกิดขึ้นแล้ว
- หาก Scheduled Publish ล้มเหลว ต้องบันทึก Error และแจ้ง Admin/Author โดยไม่สร้างรายการเผยแพร่ซ้ำ

## 20.1.3 กฎบัญชีผู้ใช้

- Email/Provider Identity ที่ผูกบัญชีแล้วต้องไม่สามารถสร้างบัญชีซ้ำโดยไม่ผ่าน Account Linking Flow
- บัญชีที่ถูกระงับไม่สามารถซื้อเหรียญ สร้างเนื้อหา หรือใช้ฟีเจอร์ที่ต้อง Authentication ได้ตามระดับการระงับ
- Force Logout ต้องทำให้ Refresh Token/Session ที่ถูกเพิกถอนใช้งานต่อไม่ได้
- การลบบัญชีต้องใช้ Soft Delete/Anonymization ตาม Data Retention Policy และต้องไม่ทำลายข้อมูลทางการเงินที่กฎหมายกำหนดให้เก็บ

---

# 20.2 State Machines

ทุก Entity ที่มี `status` ต้องมีสถานะที่กำหนดไว้ล่วงหน้าและห้ามให้ Frontend เปลี่ยนสถานะโดยตรงโดยไม่ผ่าน Business Logic

## 20.2.1 User Account

```text
ACTIVE
  ├──> SUSPENDED
  ├──> DEACTIVATED
  └──> DELETED

SUSPENDED
  ├──> ACTIVE
  └──> DEACTIVATED
```

## 20.2.2 Story

```text
DRAFT
  └──> PENDING_REVIEW

PENDING_REVIEW
  ├──> APPROVED
  └──> REJECTED

REJECTED
  └──> DRAFT

APPROVED
  ├──> SCHEDULED
  └──> PUBLISHED

SCHEDULED
  └──> PUBLISHED

PUBLISHED
  ├──> SUSPENDED
  └──> ARCHIVED

SUSPENDED
  ├──> PUBLISHED
  └──> ARCHIVED
```

## 20.2.3 Chapter

```text
DRAFT
  └──> PENDING_REVIEW

PENDING_REVIEW
  ├──> APPROVED
  └──> REJECTED

APPROVED
  ├──> SCHEDULED
  └──> PUBLISHED

SCHEDULED
  └──> PUBLISHED

PUBLISHED
  ├──> SUSPENDED
  └──> ARCHIVED
```

## 20.2.4 Payment Order

```text
CREATED
  └──> PENDING

PENDING
  ├──> PAID
  ├──> FAILED
  ├──> EXPIRED
  └──> CANCELLED

PAID
  └──> REFUNDED
```

`PAID` ต้องเกิดจาก Backend ที่ตรวจสอบ Payment Gateway/Webhook สำเร็จเท่านั้น

## 20.2.5 Refund Request

```text
REQUESTED
  ├──> UNDER_REVIEW
  └──> REJECTED

UNDER_REVIEW
  ├──> APPROVED
  └──> REJECTED

APPROVED
  └──> COMPLETED
```

## 20.2.6 Payout Request

```text
REQUESTED
  └──> UNDER_REVIEW

UNDER_REVIEW
  ├──> APPROVED
  └──> REJECTED

APPROVED
  └──> PROCESSING

PROCESSING
  ├──> COMPLETED
  └──> FAILED
```

## 20.2.7 Support Ticket

```text
OPEN
  └──> IN_PROGRESS

IN_PROGRESS
  ├──> WAITING_FOR_USER
  └──> RESOLVED

WAITING_FOR_USER
  └──> IN_PROGRESS

RESOLVED
  └──> CLOSED
```

---

# 20.3 Database Standards & Integrity Rules

## 20.3.1 มาตรฐานข้อมูลกลาง

- Primary Key ใช้ UUID หรือ CUID ตาม ORM configuration เดียวกันทั้งระบบ
- เวลาใน Database เก็บเป็น UTC เสมอ
- Application แปลงเป็น Asia/Bangkok (`UTC+7`) เฉพาะชั้น Presentation
- ตารางหลักควรมี `id`, `created_at`, `updated_at`
- ตารางที่รองรับ Soft Delete ใช้ `deleted_at`
- ห้ามเก็บ Password แบบ Plain Text
- ข้อมูล KYC และข้อมูลการเงินต้องมีการควบคุมสิทธิ์แยกจากข้อมูลทั่วไป
- Foreign Key ต้องกำหนด Referential Action อย่างชัดเจน
- หลีกเลี่ยง Cascade Delete กับ Financial Record

## 20.3.2 Index ที่ควรมี

อย่างน้อยต้องพิจารณา Index สำหรับ:

```text
users.email
users.status
stories.author_id
stories.status
stories.slug
chapters.story_id + chapters.chapter_number
chapter_purchases.user_id + chapter_purchases.chapter_id
coin_transactions.wallet_id + created_at
payment_orders.provider + provider_transaction_id
notifications.user_id + is_read
comments.chapter_id + created_at
reports.status + created_at
audit_logs.admin_id + created_at
```

AI ต้องสร้าง Index เพิ่มเมื่อ Query Pattern จริงแสดงว่าจำเป็น และบันทึกเหตุผลใน ADR/Performance Note

## 20.3.3 Constraint สำคัญ

- `users.email` ต้อง Unique ตามกฎ Account Identity
- `stories.slug` ต้อง Unique
- Chapter Number ต้องไม่ซ้ำภายใน Story
- ผู้ใช้หนึ่งคนปลดล็อก Chapter เดียวกันได้เพียงหนึ่ง Active Purchase Record
- Payment Provider Transaction ID ต้องป้องกัน Duplicate
- Idempotency Key ต้อง Unique ตามขอบเขตของ Operation
- จำนวนเหรียญต้องไม่ติดลบ
- ราคาตอนต้องไม่ติดลบ
- Payout ที่เสร็จสมบูรณ์ต้องมีข้อมูลอ้างอิงการโอนเงินจริง

---

# 20.4 Financial Transaction & Idempotency Rules

ทุก Operation ที่เกี่ยวข้องกับเงินจริงหรือเหรียญต้องออกแบบให้ปลอดภัยต่อการ Request ซ้ำ

## 20.4.1 Idempotency

Operation ที่ต้องรองรับ Idempotency อย่างน้อย:

```text
POST /coin/purchase
POST /chapters/:id/unlock
POST /coin/refund-requests
POST /author/payout-requests
```

Client ส่ง `Idempotency-Key` เมื่อเหมาะสม และ Backend ต้องตรวจสอบก่อนประมวลผลซ้ำ

## 20.4.2 Chapter Unlock Transaction

Flow มาตรฐาน:

```text
Request
  ↓
Authenticate
  ↓
Authorize
  ↓
Validate Chapter
  ↓
Check Content Status / Age
  ↓
Check Existing Purchase
  ↓
Begin DB Transaction
  ↓
Lock/Verify Wallet Balance
  ↓
Debit Coin Ledger
  ↓
Create Chapter Purchase
  ↓
Commit
  ↓
Return Success
```

หากขั้นตอนใดล้มเหลว ต้อง Rollback Transaction ที่เกี่ยวข้อง

## 20.4.3 Payment Webhook

```text
Receive Webhook
  ↓
Verify Signature
  ↓
Validate Payload
  ↓
Check Provider Event ID
  ↓
Check Order
  ↓
Begin DB Transaction
  ├── Update Payment Order
  └── Credit Coin Ledger
  ↓
Commit
  ↓
Return 2xx
```

Webhook ซ้ำต้องไม่สร้าง Coin Credit ซ้ำ

---

# 20.5 API Contract & Error Handling Standard

ทุก API ต้องใช้รูปแบบ Response ที่สม่ำเสมอ

## 20.5.1 Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

สำหรับรายการแบบ Pagination:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 20.5.2 Error Response

```json
{
  "success": false,
  "error": {
    "code": "COIN_INSUFFICIENT_BALANCE",
    "message": "จำนวนเหรียญไม่เพียงพอ",
    "details": {}
  }
}
```

ไม่ส่ง Stack Trace หรือข้อมูลภายในระบบให้ Client ใน Production

## 20.5.3 Error Code กลาง

อย่างน้อยต้องรองรับ:

```text
AUTH_INVALID_CREDENTIALS
AUTH_INVALID_TOKEN
AUTH_SESSION_EXPIRED
AUTH_ACCOUNT_SUSPENDED

FORBIDDEN
VALIDATION_ERROR
RESOURCE_NOT_FOUND
CONFLICT
RATE_LIMITED

CONTENT_NOT_FOUND
CONTENT_NOT_PUBLISHED
CONTENT_AGE_RESTRICTED
CONTENT_PURCHASE_REQUIRED

COIN_INSUFFICIENT_BALANCE
COIN_TRANSACTION_DUPLICATE
COIN_OPERATION_FAILED

PAYMENT_FAILED
PAYMENT_PENDING
PAYMENT_EXPIRED
PAYMENT_WEBHOOK_INVALID
PAYMENT_ALREADY_PROCESSED

REFUND_NOT_ELIGIBLE
PAYOUT_NOT_ELIGIBLE

INTERNAL_SERVER_ERROR
```

---

# 20.6 Permission Matrix

สิทธิ์ต้องตรวจสอบที่ Backend ทุกครั้ง ไม่ใช่ซ่อนปุ่มใน Frontend อย่างเดียว

| Resource / Action | Guest | Reader | Author | Moderator | Finance Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| อ่านเนื้อหาฟรี | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ซื้อเหรียญ | - | ✓ | ✓ | - | - | ✓ |
| ปลดล็อกตอน | - | ✓ | ✓ | - | - | ✓ |
| คอมเมนต์ | - | ✓ | ✓ | ✓ | - | ✓ |
| สร้าง Story | - | - | ✓ | - | - | ✓ |
| แก้ไข Story ของตนเอง | - | - | ✓ | - | - | ✓ |
| Submit Content Review | - | - | ✓ | - | - | ✓ |
| Approve Content | - | - | - | ✓ | - | ✓ |
| Moderate Report | - | - | - | ✓ | - | ✓ |
| ดูธุรกรรมการเงิน | - | ของตนเอง | ของตนเอง | - | ✓ | ✓ |
| อนุมัติ Payout | - | - | - | - | ✓ | ✓ |
| จัดการ Coin Package | - | - | - | - | - | ✓ |
| Suspend User | - | - | - | ตาม Policy | - | ✓ |
| จัดการ Admin Role | - | - | - | - | - | ✓ |
| ดู Audit Log | - | - | - | ตาม Policy | ตาม Policy | ✓ |

> AI ต้องใช้ Least Privilege และห้ามให้ Frontend เป็นผู้ตัดสินสิทธิ์จริง

---

# 20.7 Media Upload & Manga Processing Pipeline

ระบบมังงะต้องไม่ประมวลผลไฟล์หนักทั้งหมดใน HTTP Request เดียว

## 20.7.1 Upload Flow

```text
Author
  ↓
Request Presigned Upload URL
  ↓
Backend Validate Metadata
  ↓
Upload Direct to Object Storage
  ↓
Create Processing Job
  ↓
Queue
  ↓
Virus / File Validation
  ↓
Image Dimension Validation
  ↓
Resize / Optimize
  ↓
Generate WebP / AVIF
  ↓
Apply Watermark
  ↓
Generate CDN Version
  ↓
Mark Image READY
```

## 20.7.2 File Rules

ค่าต่อไปนี้ต้องเป็น Environment/Configuration ที่ปรับได้ ไม่ Hardcode:

```text
MAX_IMAGE_SIZE_MB
MAX_IMAGES_PER_CHAPTER
MAX_UPLOAD_BATCH
ALLOWED_IMAGE_TYPES
MAX_IMAGE_WIDTH
MAX_IMAGE_HEIGHT
```

อย่างน้อยต้องตรวจสอบ:

- MIME Type
- File Extension
- Actual File Signature/Magic Bytes
- File Size
- Image Dimensions
- Corrupted File
- Malicious Payload

## 20.7.3 Upload Failure

หาก Processing ล้มเหลว:

```text
PROCESSING
   ↓
FAILED
   ↓
Retry N times
   ↓
Dead Letter / Manual Review
```

ต้องไม่ทำให้ Chapter ถูก Publish ทั้งที่ภาพยัง Processing/Failed

---

# 20.8 Content Delivery & Reader Performance

สำหรับ Manga/Webtoon ต้องให้ความสำคัญกับ Performance เป็นพิเศษ

- ใช้ CDN สำหรับภาพ
- ใช้ Responsive Image / appropriate resolution
- Lazy Load ภาพที่ยังไม่อยู่ใน Viewport
- Preload เฉพาะภาพถัดไปที่เหมาะสม
- หลีกเลี่ยงการโหลดภาพทั้งตอนพร้อมกัน
- Reader ต้องมี Loading State
- Reader ต้องมี Error/Retry State
- บันทึก Reading Progress แบบ Debounce เพื่อลด Request
- การโหลดเนื้อหาต้องตรวจ Authorization/Age/Chapter Purchase ก่อนส่ง Protected Content
- Protected Media URL ควรเป็น Signed URL หรือกลไกที่มีอายุจำกัดตามระดับความเสี่ยง

---

# 20.9 Security Hardening

นอกเหนือจาก OWASP Top 10 ในหมวด 18 ต้องมี:

## Authentication

- Access Token อายุสั้น
- Refresh Token Rotation
- Refresh Token Revocation
- Secure Cookie เมื่อใช้ Cookie-based Session
- HttpOnly
- Secure
- SameSite ตาม Architecture
- Password Hashing ด้วย Argon2id หรือ bcrypt ที่ Configuration ปลอดภัย
- Optional/Required 2FA ตาม Role โดยเฉพาะ Super Admin

## Authorization

- ตรวจ Permission ที่ Backend
- ป้องกัน IDOR/BOLA
- Resource Ownership Check
- Admin Sub-role Guard
- ห้ามเชื่อ `role` ที่ส่งมาจาก Client

## API

- Rate Limit แยกตาม Endpoint
- Login Brute-force Protection
- Request Body Size Limit
- File Upload Limit
- CORS Allowlist
- Security Headers
- CSRF Protection เมื่อ Architecture มีความเสี่ยง
- Input Validation ทุก Endpoint

## Secrets

- ห้าม Commit `.env`
- ใช้ `.env.example`
- Production Secret ต้องมาจาก Secret Manager/Deployment Secret
- API Key/Payment Secret ห้ามส่งไป Frontend

---

# 20.10 Observability & Auditability

ทุกระบบสำคัญต้องสามารถตอบได้ว่า:

```text
เกิดอะไรขึ้น?
เกิดเมื่อไร?
เกิดกับใคร?
Request ไหนเป็นคนทำ?
ผลลัพธ์คืออะไร?
```

ต้องมี:

- Structured Logging
- Request ID / Correlation ID
- Error Tracking
- Performance Metrics
- Database Metrics
- Queue Metrics
- Payment Metrics
- Security Event Logging
- Admin Audit Log

ห้ามบันทึกข้อมูลลับลง Log เช่น:

```text
Password
Access Token
Refresh Token
Payment Card Number
Secret Key
KYC Document Content
```

---

# 20.11 Backup, Disaster Recovery & Data Recovery Test

ต้องกำหนด:

```text
RPO = ยอมเสียข้อมูลได้มากที่สุดกี่นาที
RTO = ต้องกู้ระบบกลับมาได้ภายในกี่นาที/ชั่วโมง
```

ต้องมี:

- Automated Database Backup
- Backup Retention
- Backup Encryption
- Off-site/Separate Storage
- Restore Test เป็นระยะ
- Disaster Recovery Runbook

> Backup ที่ไม่เคยทดสอบ Restore ถือว่ายังไม่ใช่ Backup ที่เชื่อถือได้

---

# 20.12 Definition of Done

Feature ใดถือว่า "เสร็จ" ต่อเมื่อผ่าน Checklist นี้:

```text
[ ] Requirement ตรงตาม AGENTS.md
[ ] Business Rules ครบ
[ ] Permission ถูกต้อง
[ ] Backend API ทำงาน
[ ] Frontend เชื่อม API จริง
[ ] Validation ครบ
[ ] Error Handling ครบ
[ ] Loading State
[ ] Empty State
[ ] Error State
[ ] Responsive Mobile
[ ] Responsive Desktop
[ ] Accessibility เบื้องต้น
[ ] Security Review
[ ] Database Migration
[ ] Unit Test
[ ] Integration Test
[ ] E2E Test หากเป็น User Flow สำคัญ
[ ] Documentation Update
[ ] Environment Variables ถูกเพิ่มใน .env.example
[ ] ไม่มี Secret/Hardcoded Credential
[ ] Lint ผ่าน
[ ] Type Check ผ่าน
[ ] Build ผ่าน
```

สำหรับ Feature ทางการเงินต้องเพิ่ม:

```text
[ ] Idempotency Test
[ ] Concurrent Request Test
[ ] Rollback Test
[ ] Duplicate Webhook Test
[ ] Ledger Integrity Test
[ ] Refund/Chargeback Test
```

---

# 20.13 AI Development Workflow

AI Developer ต้องทำงานเป็น Incremental Development ไม่สร้างระบบทั้งหมดในครั้งเดียว

## ก่อนเริ่มแต่ละ Task

AI ต้องตรวจ:

1. Requirement ที่เกี่ยวข้องใน `AGENTS.md`
2. Existing Code
3. Existing Database Schema
4. Existing API
5. Existing Tests
6. Dependency/Version ที่ใช้งานจริง
7. Security Impact

ก่อนแก้ไขระบบขนาดใหญ่ ให้สรุป:

```text
Task
Files to Create
Files to Modify
Database Impact
API Impact
Security Impact
Test Plan
```

## ระหว่างพัฒนา

- ทำงานทีละ Feature/Module
- ไม่แก้ไฟล์ที่ไม่เกี่ยวข้องโดยไม่มีเหตุผล
- ไม่ลบ Existing Feature เพื่อแก้ Bug หากไม่จำเป็น
- ใช้ Migration สำหรับ Database Change
- เพิ่ม Test พร้อม Feature
- หลีกเลี่ยงการสร้าง Duplicate Utility/Component
- Reuse Shared Component/Service เมื่อเหมาะสม

## หลังพัฒนา

AI ต้องตรวจ:

```text
[ ] TypeScript Type Check
[ ] ESLint
[ ] Unit Test
[ ] Integration Test
[ ] E2E Test ที่เกี่ยวข้อง
[ ] Build
[ ] Database Migration
[ ] API Documentation
[ ] README/ADR หากมีการตัดสินใจสำคัญ
```

หาก Test ใด Fail ห้ามสรุปว่า Feature เสร็จจนกว่าจะ:

1. แก้ไข
2. หรือระบุ Failure อย่างชัดเจนในรายงานส่งมอบ

---

# 20.14 AI Coding Rules

AI ผู้พัฒนาต้องปฏิบัติตามกฎต่อไปนี้:

- ห้าม Hardcode Secret
- ห้ามข้าม Authentication/Authorization
- ห้าม Trust Input จาก Client
- ห้ามแก้ Financial Ledger โดยตรง
- ห้ามสร้างยอดเหรียญจาก Frontend
- ห้ามเพิ่มเหรียญจากหน้า Success ของ Payment โดยไม่ตรวจ Payment Backend
- ห้ามใช้ `any` โดยไม่จำเป็น
- ห้ามปิด TypeScript/ESLint Rule เพียงเพื่อให้ Build ผ่านโดยไม่มีเหตุผล
- ห้ามใช้ `console.log` สำหรับ Production Financial/Security Logging
- ห้ามเพิ่ม Dependency ใหม่หาก Existing Dependency สามารถทำงานได้อยู่แล้ว
- ก่อนเพิ่ม Library ใหม่ต้องตรวจ Compatibility กับ Version ที่ติดตั้งจริง
- หาก API/Framework มี Breaking Change ให้ตรวจ Documentation/Installed Package ก่อนเขียน Code
- ทุก Database Change ต้องมี Migration
- ทุก Security-sensitive Change ต้องมี Test
- ทุก Financial Change ต้องมี Idempotency/Concurrency Consideration

---

# 20.15 Out of Scope

หากไม่ได้รับคำสั่งให้เปลี่ยนแปลง ให้ถือว่าสิ่งต่อไปนี้อยู่นอก Scope ของ Phase 1:

- Native iOS/Android Application
- ML-based Recommendation Engine
- ระบบ Multi-currency เต็มรูปแบบ
- International Tax Engine
- Advanced Forensic Watermark
- Full Microservice Migration
- Live Chat เต็มรูปแบบ
- Creator Marketplace นอกเหนือจากนิยาย/มังงะ
- ระบบโฆษณาขนาดใหญ่
- Cryptocurrency/Web3
- ระบบ Social Network เต็มรูปแบบ

AI ห้ามสร้าง Feature เหล่านี้โดยอัตโนมัติเพียงเพราะพบว่าอยู่ในเอกสารส่วนอื่น หากยังไม่ถึง Phase ที่กำหนด

---

# 20.16 Change Management

เมื่อ Requirement เปลี่ยน:

```text
Requirement Change
       ↓
Impact Analysis
       ↓
Database Impact?
API Impact?
Frontend Impact?
Security Impact?
Payment Impact?
       ↓
Update Specification
       ↓
ADR (ถ้าสำคัญ)
       ↓
Migration / Implementation
       ↓
Tests
```

AI ต้องไม่เปลี่ยน Business Rule สำคัญเองโดยไม่บันทึกเหตุผล

---

# 20.17 Release Checklist

ก่อน Production Release:

```text
[ ] Environment Variables ครบ
[ ] Production Secret ถูกตั้งค่าอย่างปลอดภัย
[ ] Database Migration ผ่าน
[ ] Database Backup พร้อม
[ ] Payment Gateway Production Configuration ตรวจสอบแล้ว
[ ] Webhook Signature Verification เปิดใช้งาน
[ ] HTTPS เปิดใช้งาน
[ ] CORS ตรวจสอบแล้ว
[ ] Rate Limit เปิดใช้งาน
[ ] Cloudflare/WAF พร้อม
[ ] Error Monitoring พร้อม
[ ] Logging พร้อม
[ ] Analytics พร้อม
[ ] Sitemap/SEO พร้อม
[ ] Legal Pages พร้อม
[ ] Content Moderation พร้อม
[ ] Support System พร้อม
[ ] Payment Test ผ่าน
[ ] Coin Ledger Test ผ่าน
[ ] Chapter Unlock Test ผ่าน
[ ] Refund Test ผ่าน
[ ] Payout Test ผ่าน
[ ] E2E Critical Flow ผ่าน
[ ] Rollback Plan พร้อม
[ ] Backup Restore ได้จริง
```

---

# 20.18 Critical User Flows ที่ต้องผ่านก่อนถือว่า MVP Complete

## Reader

```text
Guest
→ Browse Story
→ Read Free Chapter
→ Register
→ Login
→ Receive Welcome Reward
→ Buy Coin
→ Payment Success
→ Coin Credited
→ Unlock Premium Chapter
→ Read
→ Bookmark
→ Comment
→ Logout
→ Login Again
→ Reading Progress Restored
```

## Author

```text
Register
→ Apply Author
→ Accept Agreement
→ Complete Required Verification
→ Create Story
→ Upload Chapter
→ Submit Review
→ Moderator Approve
→ Publish
→ Reader Purchases
→ Revenue Recorded
→ Request Payout
→ Finance Review
→ Payout Completed
```

## Admin

```text
Login
→ 2FA (ตาม Policy)
→ Review Content
→ Approve/Reject
→ Review Report
→ Review Payment
→ Review Payout
→ Handle Refund
→ Review Audit Log
```

## Payment Failure

```text
Create Order
→ Payment Pending
→ Payment Failed/Expired
→ No Coin Credit
→ User Can Retry
```

## Duplicate Webhook

```text
Webhook #1
→ Verify
→ Credit Coin
→ Mark Event Processed

Webhook #2 (same Event ID)
→ Verify
→ Detect Duplicate
→ Do NOT Credit Coin Again
→ Return 2xx
```

---

# 20.19 Required Documentation

นอกจากเอกสารในหมวด 20 ให้ส่งมอบ:

```text
/docs
├── architecture.md
├── database.md
├── api.md
├── business-rules.md
├── state-machines.md
├── security.md
├── payment-flow.md
├── media-pipeline.md
├── deployment.md
├── disaster-recovery.md
├── testing.md
└── adr/
    ├── ADR-001-...
    ├── ADR-002-...
    └── ...
```

เอกสารต้องอัปเดตเมื่อ Architecture หรือ Business Rule สำคัญเปลี่ยน

---

# 20.20 Priority Rules สำหรับ AI Developer

เมื่อเกิดความขัดแย้งระหว่าง Requirement ให้ใช้ลำดับความสำคัญ:

```text
P0 — Security / Financial Integrity / Data Integrity
P1 — Core User Experience / Authentication / Content Access
P2 — Business Features
P3 — Performance / Optimization
P4 — Visual Polish / Nice-to-have
```

กฎเพิ่มเติม:

1. ห้ามลด Security เพื่อให้ Feature ทำงานเร็วขึ้น
2. ห้ามลด Financial Integrity เพื่อให้ UX ง่ายขึ้น
3. ห้ามลบ Test เพื่อให้ Build ผ่าน
4. ห้ามเปลี่ยน Schema โดยไม่ Migration
5. หาก Requirement คลุมเครือ ให้เลือก Best Practice ที่ปลอดภัยที่สุด
6. บันทึก Assumption ที่สำคัญไว้ใน README/ADR
7. ถ้าทำตาม Requirement ไม่ได้ ให้รายงานข้อจำกัดและเสนอทางเลือกแทนการทำระบบแบบเงียบ ๆ

---

# 20.21 Version 2.0 Deliverables

เพิ่ม Checklist จากหมวด 20 เดิม:

- [ ] Business Rules & Edge Cases ถูก implement และทดสอบ
- [ ] State Machine ถูกกำหนดสำหรับ Entity ที่มีสถานะ
- [ ] Database Constraints และ Index ถูกสร้าง
- [ ] API Response/Error Contract ถูกใช้สม่ำเสมอ
- [ ] Permission Matrix ถูก enforce ที่ Backend
- [ ] Payment Idempotency ถูก implement
- [ ] Duplicate Webhook ถูกป้องกัน
- [ ] Manga Upload Processing Pipeline ถูก implement
- [ ] Media Validation/Virus Scan/Optimization ถูกเตรียมตาม Phase
- [ ] Structured Logging + Request ID พร้อม
- [ ] Backup/Restore Procedure มีเอกสาร
- [ ] Definition of Done ถูกใช้กับทุก Feature
- [ ] AI Development Workflow ถูกปฏิบัติตาม
- [ ] Critical User Flows ผ่าน E2E Test
- [ ] Release Checklist ผ่านก่อน Production
- [ ] Documentation ใน `/docs` ถูกสร้างและอัปเดต


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# 20.22 DESIGN CONSTITUTION — VISUAL IDENTITY & UI GOVERNANCE

This section is a HARD RULE for all AI developers.

The AI developer MUST treat this product as a completely new product.
Previous projects, previous websites, previous UI implementations, and
previous visual patterns MUST NOT be reused unless the user explicitly
provides them as a reference.

## 20.22.1 Product Design Direction

The platform should feel:

- **Apple Dark Minimal**: Pure OLED black (`#000000`), quiet elegance, hairline borders (`border-white/[0.08]`), subtle frosted glass (`backdrop-filter: blur(20px)`), and crisp typography hierarchy.
- **Kakao Webtoon Uncomplicated Flow**: Effortless browsing like [webtoon.kakao.com](https://webtoon.kakao.com/) — cover artwork takes center stage, seamless horizontal shelves, intuitive daily schedule tabs, zero clutter.
- **Soft Accent Restraint ("สีซอฟต์ ไม่ต้องทำอะไรมาก")**: Standout buttons use gentle, soft colors (Soft Porcelain White, Soft Muted Slate) without harsh neon glows or aggressive gradients.
- Premium, Editorial, Cinematic, Immersive, Content-first, Brand-driven.

The platform must NOT feel like:

- A generic SaaS product or technical demo
- A complex, cluttered Bento Box dashboard
- A generic CRUD application
- A university/student project
- A Bootstrap template
- A generic blog
- A generic e-commerce website
- A copied Tailwind UI template

"Modern", "minimal", "premium", or "clean" MUST NOT be interpreted
as permission to use generic SaaS/dashboard patterns.

## 20.22.2 PROJECT ISOLATION RULE

The AI developer MUST NOT assume that any previous project should influence
this project's visual design.

Do NOT automatically reuse:

- Previous color palettes
- Previous typography
- Previous CSS
- Previous component structures
- Previous navigation patterns
- Previous hero sections
- Previous card layouts
- Previous animations
- Previous spacing systems
- Previous UX patterns
- Previous page compositions

If previous project context is available, it MUST be ignored for visual
design decisions unless the user explicitly says to use it as a reference.

## 20.22.3 ANTI-DESIGN PATTERNS

The following patterns are PROHIBITED by default:

1. Over-complicated Bento Boxes on content/reading pages that make the platform look like a tech demo rather than a webtoon/novel portal
2. Harsh neon effects and colored glowing drop shadows
3. Aggressive multi-colored gradients
4. Excessive nested card containers (cards inside cards inside cards)
5. Generic Navbar → Hero → Cards → Footer landing-page structure
6. Excessive shadows and heavy borders
7. Cluttered dashboard panels on public reader-facing pages
8. Bootstrap-like layouts
9. Default Tailwind UI appearance
10. Repeating the same section composition throughout the website
11. Decorative elements with no UX or brand purpose
12. Copying a layout merely because it is common in AI-generated websites
13. Making every page visually identical
14. Adding visual effects simply to make the interface look "AI-generated"

These patterns MAY be used only when there is a clear UX reason and the
design decision is intentional.

## 20.22.4 DESIGN-FIRST DEVELOPMENT GATE

For every major new page, the AI developer MUST NOT immediately write JSX/UI code.

Before implementation, determine:

1. Page purpose
2. Primary user goal
3. Primary action
4. Content hierarchy
5. Visual hierarchy
6. Layout concept
7. Typography strategy
8. Image/media strategy
9. Interaction model
10. Responsive behavior
11. Motion behavior
12. Accessibility considerations

The AI must then select a layout that best serves the page.

The AI SHOULD internally evaluate at least 3 genuinely different layout
directions before implementation. The differences must be structural,
not merely different colors or spacing.

## 20.22.5 LAYOUT DIVERSITY RULE

Component reuse is encouraged for engineering consistency.

However, component reuse MUST NOT result in identical page compositions or cluttered generic dashboards.

Different page types should have different visual rhythms, anchored by the **Kakao Webtoon (webtoon.kakao.com) & Apple Dark Minimal** philosophy:

- **Homepage (หน้าแรก)**: สไตล์ **Kakao Webtoon Uncomplicated Flow** — ชูผลงานให้อ่านง่าย สบายตา
  1. *Top Minimal Bar*: โปร่งแสงเบลอ โลโก้ + สลับประเภท [นิยาย] [มังงะ] + ค้นหามินิมอล + โปรไฟล์
  2. *Hero Spotlight Carousel*: แบนเนอร์ภาพกว้างระดับภาพยนตร์ (Cinematic Wide Banner) พร้อมปุ่ม CTA "อ่านเลย" สีซอฟต์
  3. *Daily Schedule Bar*: แถบแท็บแนวนอน จันทร์–อาทิตย์ + จบแล้ว + ยอดนิยม สลับเรื่องอัปเดตทันที
  4. *Horizontal Curated Shelves*: แถวการ์ดภาพ 3:4 เลื่อนแนวนอน ปราศจากกรอบการ์ดหนาๆ
  5. *Top 10 Masterpiece Ranking*: อันดับตัวเลข `01`, `02`, `03` ฟอนต์ Apple สะอาดตา
  6. *Quick Genre Filter*: แท็บแคปซูลมินิมอล
  7. *NO CLUTTER*: ห้ามใส่ Bento Grid ซับซ้อนบนหน้าแรกคอนเทนต์
- **Search & Explore**: มินิมอล ค้นหาและกรองแนวเรื่องแบบ Instant, แสดงผลการ์ดภาพ 3:4 สบายตา
- **Story Detail**: Cinematic backdrop เบลอละมุน, ข้อมูลเรื่องย่อจัดระเบียบแบบ Apple, รายชื่อตอนเรียงอ่านง่าย
- **Novel Reader**: Minimal, Typography-first, distraction-free, โหมดถนอมสายตา/OLED
- **Manga/Webtoon Reader**: 60FPS vertical canvas, เมนูลอยตัวโปร่งแสงซ่อนอัตโนมัติ
- **Coin Wallet**: Clean, trustworthy, financial information clarity with soft buttons
- **Author Dashboard**: Functional, analytical, clean charts without clutter
- **Admin**: Operational, structured, data-oriented
- **Help Center**: Calm, readable, easy to navigate

These are design directions, NOT mandatory templates.
The AI must still make page-specific design decisions.

## 20.22.6 VISUAL HIERARCHY RULE

Every page MUST have a clear hierarchy.

The AI developer must be able to identify:

- What the user sees first
- What the user understands second
- What action the user should take
- What information is secondary
- What information can be visually minimized

Do not give every element the same visual weight.

## 20.22.7 CONTENT-FIRST RULE

This is a content platform.

Content must remain the visual hero.

For reader-facing pages, prioritize:

1. Story / manga artwork
2. Title and identity
3. Reading/discovery action
4. Important metadata
5. Supporting information
6. Secondary actions

UI decoration MUST NOT compete with the content.

## 20.22.8 TYPOGRAPHY RULE

Typography is a primary design element.

The AI must define:

- Display typography
- Heading hierarchy
- Body typography
- Metadata typography
- Button/action typography
- Reading typography

Do not use typography merely as default browser/Tailwind styling.

Typography must support the mood and content type of the page.

## 20.22.9 COLOR RULE & SOFT BUTTON STANDARD

Color must be intentional, quiet, and sophisticated.

The AI MUST NOT introduce random multi-colored gradients, harsh neon effects, or colored glowing drop shadows.

### Dark Minimal Palette
- Base Background: `#000000` (Pure OLED Black)
- Elevated Surface: `#0D0D0F` (Deep Charcoal)
- Card / Floating Surface: `#161617` (Subtle Dark Slate)
- Hairline Border: `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.12)`
- Text Hierarchy: Primary `#FFFFFF` (100%), Secondary `#A1A1A6` (70%), Tertiary `#6E6E73` (45%)

### Soft Button Standard ("ปุ่มไหนที่ควรจะเด่น ก็อยากได้สีซอฟต์ ไม่ต้องทำอะไรมาก")
For prominent action buttons (Primary CTAs: "อ่านเลย", "ปลดล็อกตอน", "เติมเหรียญ", "สมัครสมาชิก / ยืนยัน"):
- **Use Soft / Muted Tones**:
  - **Soft Porcelain / Warm Off-White** (`#F5F5F7` with dark text `#0A0A0C`): High contrast, dignified, effortless Apple elegance
  - **Soft Muted Slate / Lavender** (`#818CF8` or `#93C5FD` muted saturation): Gentle and calm on dark backgrounds
  - **Soft Warm Sand / Champagne** (`#E5DFD7` with dark text `#1A1612`)
- **Strict Prohibition ("ไม่ต้องทำอะไรมาก")**:
  - STRICTLY NO harsh neon glowing shadows (`box-shadow: 0 0 25px cyan/purple` is forbidden)
  - STRICTLY NO rainbow or loud multi-color gradients
  - Shape: Clean Pill-shaped (`rounded-full`) or soft curved (`rounded-xl`)
  - Interaction: Gentle hover transition (`hover:opacity-90` or `hover:scale-[1.01]`, `transition: all 0.2s ease`)
- **Secondary Actions (ปุ่มรอง)**:
  - Translucent dark glass: `bg-white/[0.06] hover:bg-white/[0.1] text-white/85 border border-white/[0.08]`

The final color system MUST be centralized in the Design System.

## 20.22.10 MOTION RULE

Motion should improve comprehension and atmosphere.

Use:

- Subtle transitions
- Meaningful hover/focus states
- Progressive reveal
- Controlled scroll interaction
- Lightweight micro-interactions

Avoid:

- Constant animation
- Excessive parallax
- Distracting motion
- Animation that delays core actions
- Effects added only for visual novelty

Reader pages MUST prioritize reading performance over animation.

## 20.22.11 RESPONSIVE DESIGN RULE

Responsive behavior MUST be designed, not merely scaled down.

For each major page define:

- Desktop composition
- Tablet composition
- Mobile composition
- Navigation behavior
- Content priority
- Image cropping
- Typography scaling
- Touch targets
- Sticky/floating behavior

A mobile layout MAY use a different composition when that provides a
better reading or discovery experience.

## 20.22.12 DESIGN SYSTEM RULE

Before creating many reusable UI components, establish a coherent system:

- Color tokens
- Typography tokens
- Spacing scale
- Border radius rules
- Shadows/elevation
- Iconography
- Button hierarchy
- Form controls
- Cards
- Navigation
- Modal/dialog
- Toast/notification
- Loading states
- Empty states
- Error states
- Reader controls

Do not create dozens of visually unrelated components.

## 20.22.13 DESIGN REFERENCE RULE

The platform explicitly adopts two foundational design inspirations:

### 1. Apple.com (Dark Minimal & Material Precision)
- **What to take from Apple.com**:
  - Pure OLED dark depth (`#000000`) and refined typography scale
  - Hairline borders (`border-white/[0.08]`) instead of muddy drop-shadows
  - Frosted glass navigation (`backdrop-filter: blur(20px)`)
  - Pill-shaped buttons with soft, restrained colors ("สีซอฟต์ ไม่ต้องทำอะไรมาก")
  - Generous whitespace, calm pacing, and micro-interactions that feel organic
- **What NOT to do**:
  - Do NOT copy generic hardware presentation widgets or product feature bento boxes into a webtoon reading platform.

### 2. Kakao Webtoon (webtoon.kakao.com — Section Layout & Content Immersion)
- **What to take from Kakao Webtoon**:
  - **Uncomplicated & Effortless Flow**: Content and cover art are the sole visual heroes.
  - **Billboard Hero Carousel**: Cinematic wide cover presentation with subtle bottom scrim and clean soft CTA.
  - **Daily Schedule Bar**: Intuitive horizontal tab row (จันทร์–อาทิตย์ + จบแล้ว + ยอดนิยม) with instant category switching.
  - **Horizontal Curated Shelves**: Clean 3:4 poster aspect ratio cards, clean titles underneath, no heavy card container frames.
  - **Top 10 Masterpiece Ranking**: Clean numbered list (01, 02, 03) with clear typographic hierarchy.
- **What NOT to do**:
  - Do NOT create cluttered multi-layered panels or technical dashboard widgets on content browsing pages. Keep it simple, readable, and focused on fiction and manga.

When a reference is provided, the AI MUST distinguish between:

- What should be learned from the reference
- What must NOT be copied
- What should become part of this project's own identity


## 20.22.14 UI REVIEW GATE

Before considering a major UI task complete, the AI MUST review:

### Identity
- Does this look like a unique product?
- Does it accidentally resemble the user's previous projects?
- Does it look like a generic AI-generated template?

### UX
- Is the primary action obvious?
- Is the content hierarchy clear?
- Is the interface appropriate for the page type?

### Visual
- Is spacing intentional?
- Is typography intentional and using Apple-style scale?
- Is color controlled? Are standout buttons using soft, tasteful colors rather than aggressive neon/gradients? ("สีซอฟต์ ไม่ต้องทำอะไรมาก")
- Are sections easy to read and uncomplicated without unnecessary Bento Grid clutter (inspired by Kakao Webtoon)?
- Are images treated as first-class hero content?
- Are decorative effects justified?

### Responsive
- Does mobile have an intentional composition?
- Are touch targets usable?
- Does content remain the priority?

### Performance
- Are images optimized?
- Is animation lightweight?
- Is unnecessary JavaScript avoided?

If the answer to the identity question is "this looks like a generic
template", the UI MUST be redesigned before completion.

## 20.22.15 AI DESIGN SELF-CHECK

Before submitting a major UI implementation, the AI should ask itself:

"Would this design still make sense if all framework names, libraries,
and implementation details were removed?"

"Does this look intentionally designed for a fiction/manga platform?"

"Am I reusing a pattern because it is appropriate, or because it is
the easiest pattern I know?"

"Could this page be mistaken for one of my previous projects?"

If the answer indicates generic or recycled design, revise the composition.

# 20.23 AI DESIGN WORKFLOW

For major UI work, follow this sequence:

1. Read AGENTS.md
2. Read the applicable Design System documentation
3. Read the page-specific specification
4. Identify the user goal
5. Identify the content hierarchy
6. Explore multiple layout directions
7. Select the strongest direction
8. Implement
9. Test responsive behavior
10. Test accessibility
11. Test performance
12. Perform the UI Review Gate
13. Refactor generic/repetitive visual patterns
14. Document significant design decisions

The AI developer MUST NOT skip directly from "build this page" to
"copy an existing page structure" unless the user explicitly requests it.

# 20.24 REQUIRED DESIGN DOCUMENTATION

The project SHOULD maintain:

docs/
├── DESIGN_SYSTEM.md
├── DESIGN_PRINCIPLES.md
├── UI_PATTERNS.md
├── UX_FLOWS.md
└── PAGE_SPECIFICATIONS/
    ├── HOME.md
    ├── SEARCH.md
    ├── STORY.md
    ├── READER.md
    ├── AUTHOR.md
    └── ADMIN.md

Before implementing a major page, the AI MUST read the relevant
documentation if it exists.

If the documentation does not exist, the AI should create the minimum
necessary specification before building a complex page.

# 20.25 DESIGN DECISION RECORD

For significant visual decisions, document:

- Problem
- Context
- Options considered
- Selected direction
- Reason
- Trade-offs

This prevents future AI agents from repeatedly redesigning the project
based on arbitrary assumptions.

# 20.26 DESIGN COMPLETION CRITERIA

A major UI feature is NOT complete merely because:

- It compiles
- It renders
- It is responsive
- It passes TypeScript
- It passes tests

It is complete only when:

- UX intent is satisfied
- Visual hierarchy is clear
- The page has a coherent visual identity
- The page does not unintentionally resemble previous projects
- The design system is respected
- Responsive behavior is intentional
- Accessibility requirements are met
- Performance is acceptable
- Major anti-design patterns are avoided
- Significant design decisions are documented

