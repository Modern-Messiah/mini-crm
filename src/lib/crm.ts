export const ZONE = "Europe/Moscow";
export const PHONE = /^\+[1-9]\d{1,14}$/;
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const STATUSES = ["new", "in_progress", "processed"] as const;
export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const SLA_HOURS: Record<Priority, number> = {
  urgent: 4,
  high: 24,
  normal: 72,
  low: 168,
};

export const DEFAULT_TAGS = ["оплата", "доступ", "доставка", "возврат", "документ"] as const;

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function isPhone(value: string) {
  return PHONE.test(value);
}

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}

export function calendarDayKey(date: Date, timeZone = ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function moscowDayStart(now: Date) {
  return new Date(`${calendarDayKey(now)}T00:00:00+03:00`);
}

export function moscowDayBounds(now: Date) {
  const start = moscowDayStart(now);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function moscowWeekStart(now: Date) {
  const start = moscowDayStart(now);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    weekday: "short",
  }).format(now);
  const index = WEEKDAY_INDEX[weekday];
  if (index === undefined) {
    throw new Error(`Неизвестный день недели: ${weekday}`);
  }
  return new Date(start.getTime() - index * 86_400_000);
}

export function moscowMonthStart(now: Date) {
  return new Date(`${calendarDayKey(now).slice(0, 7)}-01T00:00:00+03:00`);
}

export function dueAtFor(priority: Priority, createdAt: Date) {
  return new Date(createdAt.getTime() + SLA_HOURS[priority] * 3_600_000);
}

export function isOverdue(status: Status, dueAt: Date, now = new Date()) {
  return status !== "processed" && dueAt.getTime() < now.getTime();
}

export function nextStatus(
  current: { status: Status; managerResponseAt: Date | null },
  status: Status,
  now: Date,
) {
  if (current.status === status) {
    return { status, managerResponseAt: current.managerResponseAt, changed: false };
  }
  const managerResponseAt = current.managerResponseAt ?? (status === "processed" ? now : null);
  return { status, managerResponseAt, changed: true };
}

export function normalizeTag(raw: string) {
  const name = raw.trim().toLocaleLowerCase("ru").replace(/\s+/g, "-");
  if (!/^[a-zа-яё0-9][a-zа-яё0-9-]{1,23}$/.test(name)) return null;
  return name;
}

export function sameCustomerDay(createdAt: Date, now: Date) {
  return calendarDayKey(createdAt) === calendarDayKey(now);
}

export function isStaffRole(role: unknown): role is "admin" | "manager" {
  return role === "admin" || role === "manager";
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

const BLOCKED_EXT = new Set([
  "html",
  "htm",
  "svg",
  "xhtml",
  "js",
  "mjs",
  "cjs",
  "exe",
  "bat",
  "cmd",
  "scr",
  "hta",
  "shtml",
  "php",
  "phtml",
]);

export function blockedUpload(fileName: string) {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const parts = base.toLocaleLowerCase("en").split(".");
  if (parts.length < 2) return false;
  return parts.slice(1).some((ext) => BLOCKED_EXT.has(ext));
}

export function safeFileName(fileName: string) {
  const base = (fileName.split(/[/\\]/).pop() ?? "").replace(/[\r\n"]/g, "");
  const cleaned = base.replace(/[^\p{L}\p{N}._ -]+/gu, "").trim().slice(0, 120);
  return cleaned || "файл";
}

export const STATUS_MISS = "Заявка не найдена. Проверьте номер и телефон.";
export const STATUS_WAIT = "Слишком много попыток. Подождите несколько минут.";
export const STATUS_EMPTY = "Ответа пока нет.";

export type StatusTicket = {
  number: number;
  phone: string;
  subject: string;
  status: string;
  reply: string | null;
};

export type PublicStatus = {
  number: number;
  subject: string;
  status: Status;
  reply: string | null;
};

export function parseStatusQuery(
  numberRaw: string,
  phoneRaw: string,
): { ok: true; number: number; phone: string } | { ok: false; message: string } {
  const numberText = numberRaw.trim();
  const phone = phoneRaw.trim();
  if (!/^[1-9]\d{0,5}$/.test(numberText)) {
    return { ok: false, message: "Номер заявки — цифры, например 1042." };
  }
  if (!isPhone(phone)) return { ok: false, message: "Номер в формате +79991234567" };
  return { ok: true, number: Number(numberText), phone };
}

export function revealStatus(ticket: StatusTicket | null, phone: string): PublicStatus | null {
  if (!ticket || ticket.phone !== phone || !isStatus(ticket.status)) return null;
  const reply = ticket.reply?.trim() ? ticket.reply.trim() : null;
  return { number: ticket.number, subject: ticket.subject, status: ticket.status, reply };
}

export function limitDecision(
  hits: number,
  windowStart: number,
  now: number,
  max: number,
  windowMs: number,
) {
  const fresh = hits <= 0 || now - windowStart >= windowMs;
  if (fresh) return { allow: true, hits: 1, windowStart: now };
  if (hits >= max) return { allow: false, hits, windowStart };
  return { allow: true, hits: hits + 1, windowStart };
}
