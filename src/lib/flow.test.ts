import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { eq } from "drizzle-orm";

const root = mkdtempSync(path.join(tmpdir(), "mini-crm-"));
process.env.CRM_DB_PATH = path.join(root, "crm.sqlite");

type Flow = {
  createTicket: typeof import("./intake").createTicket;
  findTicketForStatus: typeof import("./queries").findTicketForStatus;
  revealStatus: typeof import("./crm").revealStatus;
  STATUS_MISS: typeof import("./crm").STATUS_MISS;
  parseStaffForm: typeof import("./staff").parseStaffForm;
  createManager: typeof import("./staff").createManager;
  STAFF_TAKEN: typeof import("./staff").STAFF_TAKEN;
  db: typeof import("./db").db;
  sqlite: typeof import("./db").sqlite;
  customers: typeof import("./db/schema").customers;
  tickets: typeof import("./db/schema").tickets;
  notes: typeof import("./db/schema").notes;
  user: typeof import("./db/schema").user;
  account: typeof import("./db/schema").account;
};

let flow: Flow;

function ticketForm(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const baseTicket = {
  name: "Анна",
  phone: "+79995550001",
  email: "Anna@Example.com",
  company: "ООО «Север»",
  subject: "Не приходит код",
  text: "Письма нет.",
};

before(async () => {
  const intake = await import("./intake");
  const queries = await import("./queries");
  const crm = await import("./crm");
  const staff = await import("./staff");
  const database = await import("./db");
  const schema = await import("./db/schema");
  flow = {
    createTicket: intake.createTicket,
    findTicketForStatus: queries.findTicketForStatus,
    revealStatus: crm.revealStatus,
    STATUS_MISS: crm.STATUS_MISS,
    parseStaffForm: staff.parseStaffForm,
    createManager: staff.createManager,
    STAFF_TAKEN: staff.STAFF_TAKEN,
    db: database.db,
    sqlite: database.sqlite,
    customers: schema.customers,
    tickets: schema.tickets,
    notes: schema.notes,
    user: schema.user,
    account: schema.account,
  };
});

after(() => {
  flow.sqlite.close();
  rmSync(root, { recursive: true, force: true });
});

describe("поток", { concurrency: false }, () => {
describe("виджет", { concurrency: false }, () => {
  it("принимает заявку, приводит почту к нижнему регистру и не переписывает карточку", async () => {
    const first = await flow.createTicket(ticketForm(baseTicket));
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.number, 1042);
    const again = await flow.createTicket(
      ticketForm({ ...baseTicket, name: "Хакер", company: "Чужая", subject: "Другая тема" }),
    );
    assert.equal(again.ok, false);
    if (again.ok) return;
    assert.equal(again.message, "С этого телефона или почты заявка сегодня уже есть.");
    const customer = flow.db.select().from(flow.customers).all();
    assert.equal(customer.length, 1);
    assert.equal(customer[0]?.name, "Анна");
    assert.equal(customer[0]?.company, "ООО «Север»");
    assert.equal(customer[0]?.email, "anna@example.com");
  });

  it("даёт одну фразу, если телефон и почта от разных карточек", async () => {
    const other = await flow.createTicket(
      ticketForm({
        ...baseTicket,
        name: "Борис",
        phone: "+79995550002",
        email: "boris@example.com",
        subject: "Вторая",
      }),
    );
    assert.equal(other.ok, true);
    const clash = await flow.createTicket(
      ticketForm({ ...baseTicket, email: "boris@example.com", subject: "Стык" }),
    );
    assert.equal(clash.ok, false);
    if (clash.ok) return;
    assert.equal(clash.message, "Телефон и почта не сходятся с уже сохранённой карточкой.");
    assert.equal(flow.db.select().from(flow.customers).all().length, 2);
  });

  it("не сохраняет ловушку и запрещённый файл", async () => {
    const beforeCount = flow.db.select().from(flow.tickets).all().length;
    const trap = ticketForm(baseTicket);
    trap.set("phone", "+79995550003");
    trap.set("email", "trap@example.com");
    trap.set("crm_hp", "bot");
    const trapped = await flow.createTicket(trap);
    assert.equal(trapped.ok, false);
    if (trapped.ok) return;
    assert.equal(trapped.message, "Проверьте поля.");
    const blocked = ticketForm({ ...baseTicket, phone: "+79995550004", email: "file@example.com" });
    blocked.append("files", new File([new Uint8Array([1])], "note.html", { type: "text/html" }));
    const rejected = await flow.createTicket(blocked);
    assert.equal(rejected.ok, false);
    if (rejected.ok) return;
    assert.equal(rejected.message, "Этот тип файла нельзя приложить.");
    assert.equal(flow.db.select().from(flow.tickets).all().length, beforeCount);
  });
});

describe("статус заявки", { concurrency: false }, () => {
  it("показывает ответ только своей паре и молчит одинаково про промах", () => {
    const row = flow.findTicketForStatus(1042);
    assert.ok(row);
    const stored = flow.db.select().from(flow.tickets).where(eq(flow.tickets.number, 1042)).get();
    assert.ok(stored);
    const author = flow.createManager({ name: "Автор", email: "author@example.com", passwordHash: "hash" });
    assert.equal(author.ok, true);
    if (!author.ok) return;
    flow.db.insert(flow.notes).values({
      id: crypto.randomUUID(),
      ticketId: stored.id,
      authorId: author.id,
      body: "Секретная заметка сотрудника",
      createdAt: new Date(),
    });
    const hidden = flow.revealStatus(row ?? null, "+79995550002");
    const missing = flow.revealStatus(flow.findTicketForStatus(999999) ?? null, "+79995550001");
    assert.equal(hidden, null);
    assert.equal(missing, null);
    assert.equal(flow.STATUS_MISS, "Заявка не найдена. Проверьте номер и телефон.");
    flow.db.update(flow.tickets).set({ reply: "Код отправили ещё раз." }).where(eq(flow.tickets.number, 1042)).run();
    const found = flow.revealStatus(flow.findTicketForStatus(1042) ?? null, "+79995550001");
    assert.deepEqual(Object.keys(found ?? {}).sort(), ["number", "reply", "status", "subject"]);
    assert.equal(found?.reply, "Код отправили ещё раз.");
    assert.equal(JSON.stringify(found).includes("Секретная заметка"), false);
    assert.equal(JSON.stringify(found).includes("anna@example.com"), false);
  });
});

describe("сотрудник", { concurrency: false }, () => {
  it("отклоняет короткое имя и пароль", () => {
    assert.equal(flow.parseStaffForm("  ", "a@b.co", "12345678").ok, false);
    assert.equal(flow.parseStaffForm("Пётр", "нет", "12345678").ok, false);
    const short = flow.parseStaffForm("Пётр", "petr@example.com", "1234567");
    assert.equal(short.ok, false);
    if (short.ok) return;
    assert.equal(short.message, "Пароль короче 8 знаков.");
  });

  it("заводит менеджера и не принимает ту же почту второй раз", () => {
    const parsed = flow.parseStaffForm(" Пётр ", "Petr@Example.com", "parol-123");
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const created = flow.createManager({ name: parsed.name, email: parsed.email, passwordHash: "hash" });
    assert.equal(created.ok, true);
    const person = flow.db.select().from(flow.user).where(eq(flow.user.email, "petr@example.com")).get();
    assert.equal(person?.role, "manager");
    assert.equal(person?.name, "Пётр");
    const login = flow.db.select().from(flow.account).where(eq(flow.account.userId, person!.id)).get();
    assert.equal(login?.providerId, "credential");
    assert.equal(login?.password, "hash");
    const before = flow.db.select().from(flow.user).all().length;
    const duplicate = flow.createManager({ name: "Другой", email: "petr@example.com", passwordHash: "other" });
    assert.deepEqual(duplicate, { ok: false, message: flow.STAFF_TAKEN });
    assert.equal(flow.db.select().from(flow.user).all().length, before);
  });
});
});
