import { asc, desc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  activities,
  attachments,
  customers,
  notes,
  tags,
  ticketTags,
  tickets,
  user,
} from "./db/schema";
import {
  DEFAULT_TAGS,
  isOverdue,
  isPriority,
  isStatus,
  moscowDayBounds,
  moscowMonthStart,
  moscowWeekStart,
  type Priority,
  type Status,
} from "./crm";
import { filterRange, type Filters } from "./filters";
import { formatQueueTime, formatSize, formatStamp } from "./format";
import type { PaletteIndex, QueueRow, StaffOption, Summary, TicketView } from "./view";

type Joined = {
  id: string;
  number: number;
  subject: string;
  text: string;
  reply: string | null;
  status: string;
  priority: string;
  customerId: string;
  customerName: string;
  company: string | null;
  phone: string;
  email: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueAt: Date;
  managerResponseAt: Date | null;
  createdAt: Date;
};

function joinedRows(): Joined[] {
  return db
    .select({
      id: tickets.id,
      number: tickets.number,
      subject: tickets.subject,
      text: tickets.text,
      reply: tickets.reply,
      status: tickets.status,
      priority: tickets.priority,
      customerId: tickets.customerId,
      customerName: customers.name,
      company: customers.company,
      phone: customers.phone,
      email: customers.email,
      assigneeId: tickets.assigneeId,
      assigneeName: user.name,
      dueAt: tickets.dueAt,
      managerResponseAt: tickets.managerResponseAt,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .innerJoin(customers, eq(tickets.customerId, customers.id))
    .leftJoin(user, eq(tickets.assigneeId, user.id))
    .orderBy(desc(tickets.createdAt))
    .all();
}

function asStatus(value: string): Status {
  return isStatus(value) ? value : "new";
}

function asPriority(value: string): Priority {
  return isPriority(value) ? value : "normal";
}

function matches(row: Joined, filters: Filters, userId: string, now: Date) {
  if (filters.status && row.status !== filters.status) return false;
  if (filters.priority && row.priority !== filters.priority) return false;
  if (filters.scope === "mine" && row.assigneeId !== userId) return false;
  if (filters.scope === "unassigned" && (row.assigneeId || row.status === "processed")) return false;
  if (filters.scope === "overdue" && !isOverdue(asStatus(row.status), row.dueAt, now)) return false;
  const range = filterRange(filters);
  if (range.from && row.createdAt.getTime() < range.from.getTime()) return false;
  if (range.end && row.createdAt.getTime() >= range.end.getTime()) return false;
  if (!filters.q) return true;
  const needle = filters.q.toLocaleLowerCase("ru");
  const hay = [row.subject, row.customerName, row.phone, row.email, String(row.number)]
    .join("\n")
    .toLocaleLowerCase("ru");
  return hay.includes(needle);
}

export function listTickets(filters: Filters, userId: string, now = new Date()): QueueRow[] {
  return joinedRows()
    .filter((row) => matches(row, filters, userId, now))
    .slice(0, 300)
    .map((row) => ({
      id: row.id,
      number: row.number,
      subject: row.subject,
      status: asStatus(row.status),
      priority: asPriority(row.priority),
      customerName: row.customerName,
      createdLabel: formatQueueTime(row.createdAt, now),
      overdue: isOverdue(asStatus(row.status), row.dueAt, now),
    }));
}

export function listStaff(): StaffOption[] {
  return db
    .select({ id: user.id, name: user.name, role: user.role })
    .from(user)
    .all()
    .filter((person) => person.role === "admin" || person.role === "manager")
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .map(({ id, name }) => ({ id, name }));
}

export function loadTicket(id: string, now = new Date()): TicketView | null {
  const row = joinedRows().find((item) => item.id === id);
  if (!row) return null;
  const status = asStatus(row.status);
  const priority = asPriority(row.priority);
  const fileRows = db
    .select()
    .from(attachments)
    .where(eq(attachments.ticketId, id))
    .all()
    .sort((a, b) => a.fileName.localeCompare(b.fileName, "ru"));
  const noteRows = db
    .select({
      id: notes.id,
      body: notes.body,
      createdAt: notes.createdAt,
      author: user.name,
    })
    .from(notes)
    .innerJoin(user, eq(notes.authorId, user.id))
    .where(eq(notes.ticketId, id))
    .orderBy(asc(notes.createdAt))
    .all();
  const timeline = db
    .select()
    .from(activities)
    .where(eq(activities.ticketId, id))
    .orderBy(asc(activities.createdAt))
    .all();
  const used = new Set(
    db
      .select({ name: tags.name })
      .from(ticketTags)
      .innerJoin(tags, eq(ticketTags.tagId, tags.id))
      .where(eq(ticketTags.ticketId, id))
      .all()
      .map((item) => item.name),
  );
  const names = [...new Set([...DEFAULT_TAGS, ...db.select({ name: tags.name }).from(tags).all().map((item) => item.name)])].sort(
    (a, b) => a.localeCompare(b, "ru"),
  );
  return {
    id: row.id,
    number: row.number,
    subject: row.subject,
    text: row.text,
    reply: row.reply,
    status,
    priority,
    customerId: row.customerId,
    customerName: row.customerName,
    company: row.company,
    phone: row.phone,
    email: row.email,
    assigneeId: row.assigneeId,
    assigneeName: row.assigneeName,
    createdLabel: formatStamp(row.createdAt),
    dueLabel: formatStamp(row.dueAt),
    responseLabel: row.managerResponseAt ? formatStamp(row.managerResponseAt) : null,
    overdue: isOverdue(status, row.dueAt, now),
    files: fileRows.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      sizeLabel: formatSize(file.size),
    })),
    tags: names.map((name) => ({ name, on: used.has(name) })),
    notes: noteRows.map((note) => ({
      id: note.id,
      author: note.author,
      body: note.body,
      time: formatStamp(note.createdAt),
    })),
    timeline: timeline.map((item) => ({
      id: item.id,
      body: item.body,
      time: formatStamp(item.createdAt),
    })),
  };
}

export function searchIndex(): PaletteIndex {
  const ticketRows = joinedRows().slice(0, 400);
  const customerRows = db.select().from(customers).orderBy(asc(customers.name)).all();
  return {
    tickets: ticketRows.map((row) => ({
      id: row.id,
      number: row.number,
      subject: row.subject,
      customerName: row.customerName,
    })),
    customers: customerRows.map((row) => ({
      id: row.id,
      name: row.name,
      company: row.company,
    })),
  };
}

export function listCustomers(query: string) {
  const needle = query.trim().toLocaleLowerCase("ru");
  const openCounts = new Map<string, number>();
  for (const row of db
    .select({ customerId: tickets.customerId, status: tickets.status })
    .from(tickets)
    .all()) {
    if (row.status === "processed") continue;
    openCounts.set(row.customerId, (openCounts.get(row.customerId) ?? 0) + 1);
  }
  return db
    .select()
    .from(customers)
    .orderBy(asc(customers.name))
    .all()
    .filter((row) => {
      if (!needle) return true;
      return [row.name, row.company ?? "", row.phone, row.email].join("\n").toLocaleLowerCase("ru").includes(needle);
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      company: row.company,
      phone: row.phone,
      email: row.email,
      open: openCounts.get(row.id) ?? 0,
    }));
}

export function loadCustomer(id: string) {
  const customer = db.select().from(customers).where(eq(customers.id, id)).get();
  if (!customer) return null;
  const history = joinedRows()
    .filter((row) => row.customerId === id)
    .map((row) => ({
      id: row.id,
      number: row.number,
      subject: row.subject,
      status: asStatus(row.status),
      createdLabel: formatStamp(row.createdAt),
    }));
  return { ...customer, history };
}

export function summary(now = new Date()): Summary {
  const rows = db
    .select({
      status: tickets.status,
      priority: tickets.priority,
      createdAt: tickets.createdAt,
      dueAt: tickets.dueAt,
      assigneeId: tickets.assigneeId,
    })
    .from(tickets)
    .all();
  const staff = db.select({ id: user.id, name: user.name }).from(user).all();
  const day = moscowDayBounds(now).start.getTime();
  const dayEnd = moscowDayBounds(now).end.getTime();
  const week = moscowWeekStart(now).getTime();
  const month = moscowMonthStart(now).getTime();
  const byStatus: Record<Status, number> = { new: 0, in_progress: 0, processed: 0 };
  const byPriorityOpen: Record<Priority, number> = { low: 0, normal: 0, high: 0, urgent: 0 };
  const openByAssignee = new Map<string, number>();
  let unassigned = 0;
  let overdue = 0;
  let today = 0;
  let weekCount = 0;
  let monthCount = 0;
  for (const row of rows) {
    const status = asStatus(row.status);
    const priority = asPriority(row.priority);
    byStatus[status] += 1;
    const created = row.createdAt.getTime();
    if (created >= day && created < dayEnd) today += 1;
    if (created >= week) weekCount += 1;
    if (created >= month) monthCount += 1;
    if (status === "processed") continue;
    byPriorityOpen[priority] += 1;
    if (!row.assigneeId) unassigned += 1;
    else openByAssignee.set(row.assigneeId, (openByAssignee.get(row.assigneeId) ?? 0) + 1);
    if (isOverdue(status, row.dueAt, now)) overdue += 1;
  }
  return {
    today,
    week: weekCount,
    month: monthCount,
    total: rows.length,
    byStatus,
    byPriorityOpen,
    unassigned,
    overdue,
    team: staff
      .map((person) => ({
        id: person.id,
        name: person.name,
        open: openByAssignee.get(person.id) ?? 0,
      }))
      .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name, "ru")),
  };
}

export function findTicketForStatus(number: number) {
  return db
    .select({
      number: tickets.number,
      phone: customers.phone,
      subject: tickets.subject,
      status: tickets.status,
      reply: tickets.reply,
    })
    .from(tickets)
    .innerJoin(customers, eq(customers.id, tickets.customerId))
    .where(eq(tickets.number, number))
    .get();
}
