import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// Global in-memory storage for rate limits
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      // Retain only entries within the last 15 minutes
      const validTimestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
      if (validTimestamps.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, { timestamps: validTimestamps });
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max number of requests within the window
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // in seconds
}

/**
 * Check rate limit for a specific identifier (e.g. IP + endpoint)
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  const record = rateLimitMap.get(key) || { timestamps: [] };

  // Filter timestamps within the current sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= options.max) {
    const oldestTimestamp = activeTimestamps[0];
    const resetTime = Math.ceil((oldestTimestamp + options.windowMs - now) / 1000);

    return {
      success: false,
      limit: options.max,
      remaining: 0,
      reset: Math.max(1, resetTime),
    };
  }

  // Record this request
  activeTimestamps.push(now);
  rateLimitMap.set(key, { timestamps: activeTimestamps });

  return {
    success: true,
    limit: options.max,
    remaining: options.max - activeTimestamps.length,
    reset: Math.ceil(options.windowMs / 1000),
  };
}

/**
 * Helper to extract client IP from NextRequest
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}
