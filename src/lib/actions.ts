"use server";

import { APIError } from "better-auth/api";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "./auth";
import {
  DEFAULT_TAGS,
  dueAtFor,
  isPhone,
  isPriority,
  isStaffRole,
  isStatus,
  nextStatus,
  normalizeEmail,
  normalizeTag,
  parseStatusQuery,
  revealStatus,
  STATUS_MISS,
  STATUS_WAIT,
  type Priority,
  type PublicStatus,
  type Status,
} from "./crm";
import { db } from "./db";
import { activities, customers, notes, tags, ticketTags, tickets, user } from "./db/schema";
import { PRIORITY_LABEL, STATUS_LABEL } from "./format";
import {
  clearLimit,
  clientAddress,
  consumeLimit,
  limitOpen,
  LOGIN_EMAIL_MAX,
  LOGIN_IP_MAX,
  LOGIN_WINDOW_MS,
  STATUS_IP_MAX,
  STATUS_NUMBER_MAX,
  STATUS_WINDOW_MS,
} from "./limits";
import { findTicketForStatus } from "./queries";

export type ActionResult = { error?: string; saved?: boolean };

async function actor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isStaffRole(session.user.role)) redirect("/login");
  return session.user;
}

function refresh(customerId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/summary");
  revalidatePath("/app/customers");
  if (customerId) revalidatePath(`/app/customers/${customerId}`);
}

function activity(ticketId: string, actorId: string, kind: string, body: string, at = new Date()) {
  db.insert(activities)
    .values({
      id: crypto.randomUUID(),
      ticketId,
      actorId,
      kind,
      body,
      createdAt: at,
    })
    .run();
}

function load(ticketId: string) {
  return db
    .select({
      id: tickets.id,
      customerId: tickets.customerId,
      status: tickets.status,
      priority: tickets.priority,
      assigneeId: tickets.assigneeId,
      managerResponseAt: tickets.managerResponseAt,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .get();
}

export async function signIn(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = normalizeEmail(String(formData.get("email") ?? "")).slice(0, 160);
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Введите почту и пароль." };
  const headerList = await headers();
  const emailKey = `login:email:${email}`;
  const ipKey = `login:ip:${clientAddress(headerList)}`;
  if (!limitOpen(emailKey, LOGIN_EMAIL_MAX, LOGIN_WINDOW_MS) || !limitOpen(ipKey, LOGIN_IP_MAX, LOGIN_WINDOW_MS)) {
    return { error: "Слишком много попыток. Подождите несколько минут." };
  }
  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: headerList,
    });
  } catch (error) {
    if (error instanceof APIError && (error.statusCode === 429 || error.status === 429)) {
      return { error: "Слишком много попыток. Подождите несколько минут." };
    }
    consumeLimit(emailKey, LOGIN_EMAIL_MAX, LOGIN_WINDOW_MS);
    consumeLimit(ipKey, LOGIN_IP_MAX, LOGIN_WINDOW_MS);
    return { error: "Неверная почта или пароль." };
  }
  clearLimit(emailKey);
  redirect("/app");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function updateStatus(ticketId: string, status: Status): Promise<ActionResult> {
  const me = await actor();
  if (!isStatus(status)) return { error: "Неизвестный статус." };
  const row = load(ticketId);
  if (!row || !isStatus(row.status)) return { error: "Такой заявки нет." };
  const next = nextStatus(
    { status: row.status, managerResponseAt: row.managerResponseAt },
    status,
    new Date(),
  );
  if (!next.changed) return {};
  const now = new Date();
  db.update(tickets)
    .set({ status: next.status, managerResponseAt: next.managerResponseAt, updatedAt: now })
    .where(eq(tickets.id, ticketId))
    .run();
  activity(ticketId, me.id, "status", `Статус: ${STATUS_LABEL[row.status]} → ${STATUS_LABEL[status]}`, now);
  refresh(row.customerId);
  return {};
}

export async function updatePriority(ticketId: string, priority: Priority): Promise<ActionResult> {
  const me = await actor();
  if (!isPriority(priority)) return { error: "Неизвестный приоритет." };
  const row = load(ticketId);
  if (!row || !isPriority(row.priority)) return { error: "Такой заявки нет." };
  if (row.priority === priority) return {};
  const now = new Date();
  db.update(tickets)
    .set({ priority, dueAt: dueAtFor(priority, row.createdAt), updatedAt: now })
    .where(eq(tickets.id, ticketId))
    .run();
  activity(
    ticketId,
    me.id,
    "priority",
    `Приоритет: ${PRIORITY_LABEL[row.priority]} → ${PRIORITY_LABEL[priority]}`,
    now,
  );
  refresh(row.customerId);
  return {};
}

export async function assignTicket(ticketId: string, assigneeId: string | null): Promise<ActionResult> {
  const me = await actor();
  const row = load(ticketId);
  if (!row) return { error: "Такой заявки нет." };
  if (assigneeId) {
    const person = db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(user)
      .where(eq(user.id, assigneeId))
      .get();
    if (!person || !isStaffRole(person.role)) return { error: "Такого сотрудника нет." };
    if (row.assigneeId === person.id) return {};
    const now = new Date();
    db.update(tickets).set({ assigneeId: person.id, updatedAt: now }).where(eq(tickets.id, ticketId)).run();
    activity(ticketId, me.id, "assign", `Исполнитель: ${person.name}`, now);
    refresh(row.customerId);
    return {};
  }
  if (!row.assigneeId) return {};
  const now = new Date();
  db.update(tickets).set({ assigneeId: null, updatedAt: now }).where(eq(tickets.id, ticketId)).run();
  activity(ticketId, me.id, "assign", "Исполнитель снят", now);
  refresh(row.customerId);
  return {};
}

export async function claimTicket(ticketId: string): Promise<ActionResult> {
  const me = await actor();
  const row = load(ticketId);
  if (!row || !isStatus(row.status)) return { error: "Такой заявки нет." };
  const now = new Date();
  if (row.assigneeId !== me.id) {
    db.update(tickets).set({ assigneeId: me.id, updatedAt: now }).where(eq(tickets.id, ticketId)).run();
    activity(ticketId, me.id, "assign", `Исполнитель: ${me.name}`, now);
  }
  if (row.status === "new") {
    const later = new Date(now.getTime() + 1);
    db.update(tickets).set({ status: "in_progress", updatedAt: later }).where(eq(tickets.id, ticketId)).run();
    activity(ticketId, me.id, "status", `Статус: ${STATUS_LABEL.new} → ${STATUS_LABEL.in_progress}`, later);
  }
  refresh(row.customerId);
  return {};
}

export async function addNote(ticketId: string, body: string): Promise<ActionResult> {
  const me = await actor();
  const text = body.trim();
  if (!text) return { error: "Напишите заметку." };
  if (text.length > 2000) return { error: "Заметка длиннее 2000 знаков." };
  const row = load(ticketId);
  if (!row) return { error: "Такой заявки нет." };
  const now = new Date();
  db.insert(notes)
    .values({
      id: crypto.randomUUID(),
      ticketId,
      authorId: me.id,
      body: text,
      createdAt: now,
    })
    .run();
  db.update(tickets).set({ updatedAt: now }).where(eq(tickets.id, ticketId)).run();
  activity(ticketId, me.id, "note", "Заметка", now);
  refresh(row.customerId);
  return {};
}

export async function toggleTag(ticketId: string, rawName: string): Promise<ActionResult> {
  const me = await actor();
  const name = normalizeTag(rawName);
  if (!name) return { error: "Метка: 2–24 знака, буквы и цифры." };
  const row = load(ticketId);
  if (!row) return { error: "Такой заявки нет." };
  const now = new Date();
  const known = DEFAULT_TAGS.includes(name as (typeof DEFAULT_TAGS)[number]);
  let tag = db.select().from(tags).where(eq(tags.name, name)).get();
  if (!tag) {
    if (!known && name.length < 2) return { error: "Метка: 2–24 знака, буквы и цифры." };
    const id = crypto.randomUUID();
    db.insert(tags).values({ id, name }).run();
    tag = { id, name };
  }
  const link = db
    .select()
    .from(ticketTags)
    .where(and(eq(ticketTags.ticketId, ticketId), eq(ticketTags.tagId, tag.id)))
    .get();
  if (link) {
    db.delete(ticketTags)
      .where(and(eq(ticketTags.ticketId, ticketId), eq(ticketTags.tagId, tag.id)))
      .run();
    activity(ticketId, me.id, "tag", `Метка снята: ${name}`, now);
  } else {
    db.insert(ticketTags).values({ ticketId, tagId: tag.id }).run();
    activity(ticketId, me.id, "tag", `Метка: ${name}`, now);
  }
  db.update(tickets).set({ updatedAt: now }).where(eq(tickets.id, ticketId)).run();
  refresh(row.customerId);
  return {};
}

export async function saveReply(ticketId: string, body: string): Promise<ActionResult> {
  const me = await actor();
  const text = body.trim();
  if (text.length > 5000) return { error: "Ответ длиннее 5000 знаков." };
  const row = db
    .select({ id: tickets.id, customerId: tickets.customerId, reply: tickets.reply })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .get();
  if (!row) return { error: "Такой заявки нет." };
  const next = text || null;
  if ((row.reply ?? null) === next) return {};
  const now = new Date();
  db.update(tickets).set({ reply: next, updatedAt: now }).where(eq(tickets.id, ticketId)).run();
  activity(ticketId, me.id, "reply", next ? "Ответ клиенту" : "Ответ клиенту снят", now);
  refresh(row.customerId);
  return {};
}

export async function updateCustomer(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await actor();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Укажите имя." };
  if (name.length > 120) return { error: "Имя длиннее 120 знаков." };
  const phone = String(formData.get("phone") ?? "").trim();
  if (!isPhone(phone)) return { error: "Номер в формате +79991234567" };
  const emailParsed = z.string().trim().email().max(160).safeParse(String(formData.get("email") ?? ""));
  if (!emailParsed.success) return { error: "Укажите почту." };
  const email = normalizeEmail(emailParsed.data);
  const companyRaw = String(formData.get("company") ?? "").trim();
  if (companyRaw.length > 160) return { error: "Название компании длиннее 160 знаков." };
  try {
    const saved = db.transaction((tx) => {
      const current = tx.select({ id: customers.id }).from(customers).where(eq(customers.id, id)).get();
      if (!current) return { error: "Такого клиента нет." };
      const byPhone = tx.select({ id: customers.id }).from(customers).where(eq(customers.phone, phone)).get();
      if (byPhone && byPhone.id !== id) return { error: "Этот телефон уже у другого клиента." };
      const byEmail = tx.select({ id: customers.id }).from(customers).where(eq(customers.email, email)).get();
      if (byEmail && byEmail.id !== id) return { error: "Эта почта уже у другого клиента." };
      tx.update(customers)
        .set({ name, phone, email, company: companyRaw || null })
        .where(eq(customers.id, id))
        .run();
      return { saved: true };
    });
    if (saved.error) return saved;
    refresh(id);
    return saved;
  } catch {
    return { error: "Телефон или почта уже заняты." };
  }
}

export type StatusState = {
  error?: string;
  ticket?: PublicStatus & { statusLabel: string };
};

export async function lookupStatus(_prev: StatusState, formData: FormData): Promise<StatusState> {
  const parsed = parseStatusQuery(String(formData.get("number") ?? ""), String(formData.get("phone") ?? ""));
  if (!parsed.ok) return { error: parsed.message };
  const ip = clientAddress(await headers());
  const ipOk = consumeLimit(`status:ip:${ip}`, STATUS_IP_MAX, STATUS_WINDOW_MS);
  const numberOk = ipOk && consumeLimit(`status:number:${parsed.number}`, STATUS_NUMBER_MAX, STATUS_WINDOW_MS);
  if (!ipOk || !numberOk) return { error: STATUS_WAIT };
  const row = findTicketForStatus(parsed.number);
  const ticket = revealStatus(row ?? null, parsed.phone);
  if (!ticket) return { error: STATUS_MISS };
  return { ticket: { ...ticket, statusLabel: STATUS_LABEL[ticket.status] } };
}
