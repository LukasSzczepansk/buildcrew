import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { pool } from "@/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function randomSixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function getRequestIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "local";
}

export async function requestKey(extra = "") {
  const h = await headers();
  const ip = await getRequestIp();
  const ua = h.get("user-agent") ?? "unknown";
  return sha256(`${ip}|${ua}|${extra.toLowerCase()}`);
}

/**
 * Persistent, PostgreSQL-backed fixed-window rate limiter.
 * This works across multiple Next.js/Vercel instances, unlike an in-memory Map.
 */
export async function checkRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const keyHash = sha256(key);

  const result = await pool.query<{ count: number }>(
    `insert into rate_limit_buckets (scope, key_hash, window_start, count)
     values ($1, $2, $3, 1)
     on conflict (scope, key_hash, window_start)
     do update set count = rate_limit_buckets.count + 1
     returning count`,
    [scope, keyHash, windowStart],
  );

  const count = Number(result.rows[0]?.count ?? 1);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000)),
  };
}

export async function enforceUserRateLimit(
  scope: string,
  userId: string,
  limit: number,
  windowSeconds: number,
) {
  const result = await checkRateLimit(scope, `user:${userId}`, limit, windowSeconds);
  return result.allowed
    ? null
    : `Za dużo prób. Spróbuj ponownie za około ${Math.ceil(result.retryAfterSeconds / 60)} min.`;
}

export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isUuid(value: string | null | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}
