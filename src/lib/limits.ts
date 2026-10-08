import { limitDecision } from "./crm";
import { sqlite } from "./db";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_EMAIL_MAX = 8;
export const LOGIN_IP_MAX = 30;
export const INTAKE_WINDOW_MS = 60 * 60 * 1000;
export const INTAKE_IP_MAX = 10;
export const INTAKE_GLOBAL_MAX = 40;
export const STATUS_WINDOW_MS = 15 * 60 * 1000;
export const STATUS_IP_MAX = 30;
export const STATUS_NUMBER_MAX = 20;

type RateRow = { hits: number; window_start: number };

function prune(now: number) {
  sqlite.prepare("DELETE FROM rate_limit WHERE window_start < ?").run(now - 86_400_000);
  const count = sqlite.prepare("SELECT count(*) AS n FROM rate_limit").get() as { n: number };
  if (count.n > 400) {
    sqlite
      .prepare(
        "DELETE FROM rate_limit WHERE key NOT IN (SELECT key FROM rate_limit ORDER BY window_start DESC LIMIT 200)",
      )
      .run();
  }
}

export function consumeLimit(key: string, max: number, windowMs: number, now = Date.now()) {
  const run = sqlite.transaction(() => {
    prune(now);
    const row = sqlite.prepare("SELECT hits, window_start FROM rate_limit WHERE key = ?").get(key) as
      | RateRow
      | undefined;
    const next = limitDecision(row?.hits ?? 0, row?.window_start ?? 0, now, max, windowMs);
    if (!next.allow) return false;
    sqlite
      .prepare(
        `INSERT INTO rate_limit (key, hits, window_start) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET hits = excluded.hits, window_start = excluded.window_start`,
      )
      .run(key, next.hits, next.windowStart);
    return true;
  });
  return run();
}

export function limitOpen(key: string, max: number, windowMs: number, now = Date.now()) {
  const row = sqlite.prepare("SELECT hits, window_start FROM rate_limit WHERE key = ?").get(key) as
    | RateRow
    | undefined;
  if (!row) return true;
  if (now - row.window_start >= windowMs) return true;
  return row.hits < max;
}

export function clearLimit(key: string) {
  sqlite.prepare("DELETE FROM rate_limit WHERE key = ?").run(key);
}

export function clientAddress(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const hop = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1);
    if (hop) return hop.slice(0, 80);
  }
  const real = headerList.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 80);
  return "local";
}
