import { isPriority, isStatus, moscowDayStart, type Priority, type Status } from "./crm";

export type Scope = "all" | "mine" | "unassigned" | "overdue";

export type Filters = {
  q: string;
  status: Status | "";
  priority: Priority | "";
  scope: Scope;
  from: string;
  to: string;
  id: string;
};

function one(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function dayInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

const TICKET_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const status = one(sp.status);
  const priority = one(sp.priority);
  const scope = one(sp.scope);
  return {
    q: one(sp.q).trim().slice(0, 80),
    status: isStatus(status) ? status : "",
    priority: isPriority(priority) ? priority : "",
    scope: scope === "mine" || scope === "unassigned" || scope === "overdue" ? scope : "all",
    from: dayInput(one(sp.from)),
    to: dayInput(one(sp.to)),
    id: TICKET_ID.test(one(sp.id)) ? one(sp.id) : "",
  };
}

export function queueHref(filters: Filters, patch: Partial<Filters> = {}) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.priority) params.set("priority", next.priority);
  if (next.scope !== "all") params.set("scope", next.scope);
  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.id) params.set("id", next.id);
  const query = params.toString();
  return query ? `/app?${query}` : "/app";
}

export function filterRange(filters: Filters) {
  let from = filters.from ? moscowDayStart(new Date(`${filters.from}T12:00:00+03:00`)) : null;
  let to = filters.to ? moscowDayStart(new Date(`${filters.to}T12:00:00+03:00`)) : null;
  if (from && Number.isNaN(from.getTime())) from = null;
  if (to && Number.isNaN(to.getTime())) to = null;
  if (from && to && from.getTime() > to.getTime()) {
    const swap = from;
    from = to;
    to = swap;
  }
  const end = to ? new Date(to.getTime() + 86_400_000) : null;
  return { from, end };
}
