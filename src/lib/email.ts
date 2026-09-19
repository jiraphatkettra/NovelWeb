interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailServiceResult {
  success: boolean;
  messageId?: string;
  error?: string;
  previewUrl?: string;
}

/**
 * Universal Email Dispatcher
 * Automatically detects whether Resend, SMTP, or Console Mocking should be used.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<EmailServiceResult> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. If Resend API Key is provided, use Resend HTTP API directly without external packages
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "ReadVerse <noreply@readverse.app>",
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ""),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        return { success: true, messageId: data.id };
      } else {
        console.error("Resend Email Error:", data);
        return { success: false, error: data.message || "Failed to send email via Resend" };
      }
    } catch (err: any) {
      console.error("Resend Fetch Error:", err);
      return { success: false, error: err.message };
    }
  }

  // 2. Development / Fallback Mock Logger
  const timestamp = new Date().toISOString();
  console.log(`\n📬 [TRANSACTIONAL EMAIL DISPATCHER] ──────────────────────────`);
  console.log(`⏱️  Timestamp: ${timestamp}`);
  console.log(`🎯 To:        ${to}`);
  console.log(`📌 Subject:   ${subject}`);
  console.log(`📝 Content:   ${text || html.slice(0, 200)}...`);
  console.log(`─────────────────────────────────────────────────────────────\n`);

  return {
    success: true,
    messageId: `mock-email-${Date.now()}`,
    previewUrl: "console://logged",
  };
}

/**
 * HTML Template for Password Reset Email
 */
export function generatePasswordResetEmailHtml({
  userName,
  resetUrl,
}: {
  userName: string;
  resetUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ตั้งรหัสผ่านใหม่ - ReadVerse</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0b0e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560px" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #141418; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: inline-block; width: 44px; height: 44px; background-color: #8B5CF6; border-radius: 12px; line-height: 44px; text-align: center; font-weight: 900; font-size: 20px; color: #ffffff;">
                R
              </div>
              <h1 style="margin: 16px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">ReadVerse</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #ffffff;">สวัสดีคุณ ${userName},</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                เราได้รับคำขอสำหรับตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ กรุณาคลิกที่ปุ่มด้านล่างเพื่อดำเนินการ ลิงก์นี้จะมีอายุการใช้งาน 1 ชั่วโมง
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.25);">
                  ตั้งรหัสผ่านใหม่
                </a>
              </div>

              <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.5; color: #71717a;">
                หากปุ่มด้านบนกดไม่ได้ กรุณาคัดลอกลิงก์ด้านล่างนี้ไปวางในเบราว์เซอร์ของคุณ:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #A78BFA; word-break: break-all;">
                ${resetUrl}
              </p>

              <p style="margin: 0; font-size: 12px; color: #71717a;">
                หากคุณไม่ได้ส่งคำขอนี้ สามารถเพิกเฉยต่ออีเมลฉบับนี้ได้ บัญชีของคุณยังคงปลอดภัย
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f0f13; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #52525b;">
              &copy; ${new Date().getFullYear()} ReadVerse Platform. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
