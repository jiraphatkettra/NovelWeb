/**
 * Sanitization utility for HTML and user-submitted text.
 * Protects against XSS (Cross-Site Scripting) without external binary dependencies.
 */

/**
 * Strips dangerous HTML tags, attributes, and URI schemes from rich text.
 * Safe for rendering in rich text previews or author content.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== "string") return "";

  let clean = dirtyHtml;

  // 1. Remove dangerous script and executable tags completely (including content within)
  const dangerousTags = [
    "script",
    "iframe",
    "object",
    "embed",
    "applet",
    "frameset",
    "frame",
    "style",
    "link",
    "meta",
    "base",
    "form",
  ];

  for (const tag of dangerousTags) {
    const reg = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    clean = clean.replace(reg, "");
    // Also remove self-closing or unclosed variants
    const selfClosing = new RegExp(`<${tag}[^>]*\\/?>`, "gi");
    clean = clean.replace(selfClosing, "");
  }

  // 2. Remove inline event handlers (e.g., onload=, onerror=, onclick=, onmouseover=)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(['\"]).*?\1/gi, "");
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*[^"'\s>]+/gi, "");

  // 3. Remove dangerous protocols from href and src (javascript:, vbscript:, data:text/html)
  clean = clean.replace(
    /\s+(href|src)\s*=\s*(['\"])\s*(javascript|vbscript|data:(?:text\/html|application\/javascript))[^'\"]*\2/gi,
    ' $1="#"'
  );
  clean = clean.replace(
    /\s+(href|src)\s*=\s*(javascript|vbscript|data:(?:text\/html|application\/javascript))[^\s>]+/gi,
    ' $1="#"'
  );

  return clean;
}

/**
 * Strips all HTML tags and converts special characters to safe plain text.
 * Ideal for comments, usernames, titles, and bio descriptions.
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}
