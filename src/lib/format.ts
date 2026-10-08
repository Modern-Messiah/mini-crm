import { calendarDayKey, type Priority, type Status, ZONE } from "./crm";

export const STATUS_LABEL: Record<Status, string> = {
  new: "Новый",
  in_progress: "В работе",
  processed: "Обработан",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
  urgent: "Срочный",
};

export const STATUS_CLASS: Record<Status, string> = {
  new: "status-new",
  in_progress: "status-work",
  processed: "status-done",
};

export function roleLabel(role: string) {
  if (role === "admin") return "Администратор";
  if (role === "manager") return "Менеджер";
  return "Сотрудник";
}

export function countWord(count: number, one: string, few: string, many: string) {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export function ticketsWord(count: number) {
  return countWord(count, "заявка", "заявки", "заявок");
}

export function formatClock(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDay(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: ZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatStamp(date: Date) {
  return `${formatDay(date)} ${formatClock(date)}`;
}

export function formatQueueTime(date: Date, now = new Date()) {
  return calendarDayKey(date) === calendarDayKey(now) ? formatClock(date) : formatDay(date);
}

export function formatToday(now = new Date()) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: ZONE,
    day: "numeric",
    month: "long",
  }).format(now);
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
