/**
 * Automated Profanity & Spam Filter
 * Detects gambling scams, phishing links, and offensive language in Thai & English.
 */

// Illegal gambling and scam patterns
const SPAM_PATTERNS = [
  /บาคาร่า/i,
  /สล็อต/i,
  /คาสิโน/i,
  /แทงบอล/i,
  /เว็บตรง/i,
  /ฝากถอน(ออโต้|ไม่มีขั้นต่ำ)/i,
  /เครดิตฟรี/i,
  /pg\s*slot/i,
  /joker\s*slot/i,
  /ufabet/i,
  /lin\.ee/i,
  /line\.me\/ti\/p/i,
  /line\s*:\s*@/i,
  /t\.me\//i,
  /bit\.ly\//i,
  /แจกสูตร/i,
  /แตกง่าย/i,
];

// Offensive words to mask with asterisks
const PROFANITY_WORDS = [
  "ควย",
  "เหี้ย",
  "เย็ด",
  "สัส",
  "สถุล",
  "ดอกทอง",
  "ระยำ",
  "เงี่ยน",
  "กระหรี่",
  "หน้าด้าน",
  "fuck",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "pussy",
];

export interface ModerationResult {
  isValid: boolean;
  cleanText: string;
  isSpam: boolean;
  rejectReason?: string;
}

/**
 * Validates and moderates user generated text (comments, reviews, synopses)
 */
export function moderateContent(text: string): ModerationResult {
  if (!text || typeof text !== "string") {
    return { isValid: false, cleanText: "", isSpam: false, rejectReason: "เนื้อหาว่างเปล่า" };
  }

  const trimmed = text.trim();

  // 1. Check for gambling and phishing spam links
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        cleanText: trimmed,
        isSpam: true,
        rejectReason: "ข้อความมีเนื้อหาหรือลิงก์เข้าข่ายสแปม / การพนัน / โฆษณาที่ไม่ได้รับอนุญาต",
      };
    }
  }

  // 2. Mask vulgar / offensive words
  let sanitized = trimmed;
  for (const word of PROFANITY_WORDS) {
    const regex = new RegExp(word, "gi");
    sanitized = sanitized.replace(regex, "*".repeat(word.length));
  }

  return {
    isValid: true,
    cleanText: sanitized,
    isSpam: false,
  };
}
