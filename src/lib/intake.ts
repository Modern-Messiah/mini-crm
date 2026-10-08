import { and, eq, gte, lt, sql } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { activities, attachments, customers, tickets } from "./db/schema";
import { db } from "./db";
import { blockedUpload, dueAtFor, isPhone, MAX_FILE_BYTES, MAX_FILES, moscowDayBounds, normalizeEmail, safeFileName } from "./crm";
import { uploadsDir } from "./paths";

const intakeSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя.").max(120),
  phone: z.string().trim().refine(isPhone, "Номер в формате +79991234567"),
  email: z.string().trim().email("Укажите почту.").max(160),
  company: z.string().trim().max(160).optional(),
  subject: z.string().trim().min(1, "Укажите тему.").max(200),
  text: z.string().trim().min(1, "Напишите, что случилось.").max(5000),
});

export type IntakeResult =
  | { ok: true; id: string; number: number }
  | { ok: false; status: number; message: string; field?: string };

const CONFLICT = "Телефон и почта не сходятся с уже сохранённой карточкой.";

export async function createTicket(formData: FormData): Promise<IntakeResult> {
  const trapped = formData.getAll("crm_hp").some((value) => String(value).trim() !== "");
  if (trapped) return { ok: false, status: 422, message: "Проверьте поля." };

  const parsed = intakeSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    company: formData.get("company") || undefined,
    subject: formData.get("subject"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      status: 422,
      message: issue?.message ?? "Проверьте поля.",
      field: issue ? String(issue.path[0] ?? "") : undefined,
    };
  }
  const input = { ...parsed.data, email: normalizeEmail(parsed.data.email) };
  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length > MAX_FILES) {
    return { ok: false, status: 422, message: "Не больше пяти файлов.", field: "files" };
  }
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, status: 422, message: "Каждый файл не больше 10 МБ.", field: "files" };
    }
    if (blockedUpload(file.name)) {
      return { ok: false, status: 422, message: "Этот тип файла нельзя приложить.", field: "files" };
    }
  }

  const now = new Date();
  const bounds = moscowDayBounds(now);
  const created = db.transaction((tx) => {
    const byPhone = tx.select().from(customers).where(eq(customers.phone, input.phone)).get();
    const byEmail = tx.select().from(customers).where(eq(customers.email, input.email)).get();
    if (byPhone && byEmail && byPhone.id !== byEmail.id) {
      return { ok: false as const, status: 422, message: CONFLICT };
    }
    if (byPhone && normalizeEmail(byPhone.email) !== input.email) {
      return { ok: false as const, status: 422, message: CONFLICT };
    }
    if (byEmail && byEmail.phone !== input.phone) {
      return { ok: false as const, status: 422, message: CONFLICT };
    }
    const customerId = byPhone?.id ?? byEmail?.id ?? crypto.randomUUID();
    if (!byPhone && !byEmail) {
      tx.insert(customers)
        .values({
          id: customerId,
          name: input.name,
          phone: input.phone,
          email: input.email,
          company: input.company || null,
          createdAt: now,
        })
        .run();
    }
    const duplicate = tx
      .select({ id: tickets.id })
      .from(tickets)
      .where(
        and(eq(tickets.customerId, customerId), gte(tickets.createdAt, bounds.start), lt(tickets.createdAt, bounds.end)),
      )
      .get();
    if (duplicate) {
      return {
        ok: false as const,
        status: 422,
        message: "С этого телефона или почты заявка сегодня уже есть.",
        field: "phone",
      };
    }
    const number =
      tx.select({ n: sql<number>`coalesce(max(${tickets.number}), 1041)` }).from(tickets).get()?.n ?? 1041;
    const id = crypto.randomUUID();
    tx.insert(tickets)
      .values({
        id,
        number: number + 1,
        customerId,
        subject: input.subject,
        text: input.text,
        status: "new",
        priority: "normal",
        assigneeId: null,
        dueAt: dueAtFor("normal", now),
        managerResponseAt: null,
        reply: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    tx.insert(activities)
      .values({
        id: crypto.randomUUID(),
        ticketId: id,
        actorId: null,
        kind: "created",
        body: "Заявка с виджета",
        createdAt: now,
      })
      .run();
    return { ok: true as const, id, number: number + 1 };
  });

  if (!created.ok) return created;

  const written: string[] = [];
  try {
    const dir = uploadsDir();
    for (const file of files) {
      const storedName = crypto.randomUUID();
      await fs.writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));
      written.push(storedName);
      db.insert(attachments)
        .values({
          id: crypto.randomUUID(),
          ticketId: created.id,
          fileName: safeFileName(file.name),
          storedName,
          size: file.size,
          createdAt: now,
        })
        .run();
    }
  } catch {
    db.delete(tickets).where(eq(tickets.id, created.id)).run();
    await Promise.all(
      written.map((name) => fs.rm(path.join(uploadsDir(), name), { force: true })),
    );
    return { ok: false, status: 500, message: "Не удалось сохранить файлы." };
  }

  return created;
}
