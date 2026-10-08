import fs from "node:fs/promises";
import path from "node:path";
import { dueAtFor, moscowDayStart, type Priority, type Status } from "../lib/crm";
import { activities, attachments, customers, notes, tags, ticketTags, tickets, user, account } from "../lib/db/schema";

async function main() {
const dataDir = path.join(process.cwd(), "data");
await fs.rm(path.join(dataDir, "uploads"), { recursive: true, force: true });
for (const name of ["crm.sqlite", "crm.sqlite-wal", "crm.sqlite-shm"]) {
  await fs.rm(path.join(dataDir, name), { force: true });
}

const { db } = await import("../lib/db");
const { auth } = await import("../lib/auth");

const ctx = await auth.$context;
const password = await ctx.password.hash("password");
const now = new Date();

function at(daysAgo: number, hour: number, minute: number) {
  const start = moscowDayStart(now);
  return new Date(start.getTime() - daysAgo * 86_400_000 + hour * 3_600_000 + minute * 60_000);
}

const adminId = crypto.randomUUID();
const managerId = crypto.randomUUID();

db.insert(user)
  .values([
    {
      id: adminId,
      name: "Анна Соколова",
      email: "admin@example.com",
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: managerId,
      name: "Илья Морозов",
      email: "manager@example.com",
      emailVerified: true,
      role: "manager",
      createdAt: now,
      updatedAt: now,
    },
  ])
  .run();

for (const personId of [adminId, managerId]) {
  db.insert(account)
    .values({
      id: crypto.randomUUID(),
      accountId: personId,
      providerId: "credential",
      userId: personId,
      password,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

const people = {
  admin: adminId,
  manager: managerId,
} as const;

const customerRows = [
  ["c1", "Клиент 1", "+79990000001", "client1@example.com", null],
  ["c2", "Клиент 2", "+79990000002", "client2@example.com", null],
  ["c3", "Клиент 3", "+79990000003", "client3@example.com", null],
  ["c4", "Клиент 4", "+79990000004", "client4@example.com", null],
  ["c5", "Клиент 5", "+79990000005", "client5@example.com", null],
  ["marina", "Марина Ковалёва", "+79991110001", "marina@sever.example", "ООО «Север»"],
  ["pavel", "Павел Лебедев", "+79991110002", "pavel@lebedev.example", "ИП Лебедев"],
  ["olga", "Ольга Шестакова", "+79991110003", "olga@north.example", "Северная верфь"],
  ["artem", "Артём Белов", "+79991110004", "artem@belov.example", null],
  ["kira", "Кира Новикова", "+79991110005", "kira@novik.example", "Студия «Новик»"],
] as const;

const customerIds: Record<string, string> = {};
for (const [key, name, phone, email, company] of customerRows) {
  const id = crypto.randomUUID();
  customerIds[key] = id;
  db.insert(customers)
    .values({ id, name, phone, email, company, createdAt: at(40, 10, 0) })
    .run();
}

const tagNames = ["оплата", "доступ", "доставка", "возврат", "документ"];
const tagIds: Record<string, string> = {};
for (const name of tagNames) {
  const id = crypto.randomUUID();
  tagIds[name] = id;
  db.insert(tags).values({ id, name }).run();
}

type SeedTicket = {
  key: string;
  daysAgo: number;
  hour: number;
  minute: number;
  subject: string;
  text: string;
  status: Status;
  priority: Priority;
  assignee: keyof typeof people | null;
  tag?: string;
  note?: { author: keyof typeof people; body: string };
  file?: boolean;
};

const plan: SeedTicket[] = [
  {
    key: "c1",
    daysAgo: 0,
    hour: 9,
    minute: 14,
    subject: "Не приходит код подтверждения",
    text: "С утра три раза запрашивал код на +79990000001. Письмо во входящих есть, кода нет.",
    status: "new",
    priority: "urgent",
    assignee: null,
    tag: "доступ",
  },
  {
    key: "c2",
    daysAgo: 0,
    hour: 9,
    minute: 41,
    subject: "Счёт за сентябрь не открывается",
    text: "В кабинете счёт есть, файл обрывается на второй странице.",
    status: "in_progress",
    priority: "high",
    assignee: "manager",
    tag: "оплата",
    note: { author: "manager", body: "Запросил повторную выгрузку у бухгалтерии." },
  },
  {
    key: "c3",
    daysAgo: 0,
    hour: 10,
    minute: 6,
    subject: "Где заказ 4412",
    text: "Обещали доставку вчера до 18:00. Курьер не звонил.",
    status: "new",
    priority: "normal",
    assignee: null,
    tag: "доставка",
    file: true,
  },
  {
    key: "marina",
    daysAgo: 0,
    hour: 11,
    minute: 22,
    subject: "Доступ в кабинет для бухгалтера",
    text: "Нужен второй вход для Ольги из бухгалтерии ООО «Север», без права менять тариф.",
    status: "new",
    priority: "high",
    assignee: null,
    tag: "доступ",
  },
  {
    key: "c5",
    daysAgo: 0,
    hour: 12,
    minute: 3,
    subject: "Не выгружается отчёт за неделю",
    text: "Кнопка «Скачать» крутится и ничего не отдаёт. Браузер Chrome.",
    status: "in_progress",
    priority: "normal",
    assignee: "manager",
    tag: "документ",
  },
  {
    key: "c4",
    daysAgo: 1,
    hour: 15,
    minute: 10,
    subject: "Акт сверки за август",
    text: "Просим акт с печатью на client4@example.com.",
    status: "processed",
    priority: "normal",
    assignee: "admin",
    tag: "документ",
    note: { author: "admin", body: "Акт отправила в 16:40, клиент подтвердил получение." },
  },
  {
    key: "pavel",
    daysAgo: 1,
    hour: 8,
    minute: 5,
    subject: "Касса не бьёт чек",
    text: "Смена открыта, чек зависает на «отправка в ОФД».",
    status: "in_progress",
    priority: "urgent",
    assignee: "manager",
    tag: "оплата",
    note: { author: "manager", body: "ОФД отвечает с задержкой, жду повтор после 12:00." },
  },
  {
    key: "olga",
    daysAgo: 2,
    hour: 13,
    minute: 20,
    subject: "Поменять телефон в профиле",
    text: "Старый номер потерян. Новый пришлю после подтверждения паспорта.",
    status: "processed",
    priority: "low",
    assignee: "admin",
  },
  {
    key: "artem",
    daysAgo: 2,
    hour: 11,
    minute: 2,
    subject: "Вопрос по тарифу",
    text: "Хочу понять, чем «Цех» отличается от «Склада», если заказов меньше ста.",
    status: "new",
    priority: "low",
    assignee: null,
  },
  {
    key: "c4",
    daysAgo: 3,
    hour: 10,
    minute: 30,
    subject: "Уточнить график выгрузки",
    text: "Можно ли получать остатки в 7:00, а не в 9:00?",
    status: "new",
    priority: "normal",
    assignee: null,
  },
  {
    key: "kira",
    daysAgo: 5,
    hour: 16,
    minute: 45,
    subject: "Вернуть оплату за баннер",
    text: "Баннер сняли на второй день, просим вернуть 18 000 ₽.",
    status: "processed",
    priority: "high",
    assignee: "admin",
    tag: "возврат",
    note: { author: "admin", body: "Возврат проведён тем же платежом." },
  },
  {
    key: "c1",
    daysAgo: 6,
    hour: 9,
    minute: 5,
    subject: "Старый код так и не пришёл",
    text: "Это было на прошлой неделе, код в итоге прислали вручную.",
    status: "processed",
    priority: "normal",
    assignee: "manager",
    tag: "доступ",
  },
  {
    key: "marina",
    daysAgo: 6,
    hour: 14,
    minute: 12,
    subject: "Счёт с неправильным ИНН",
    text: "В счёте ИНН поставщика, а не ООО «Север». Просим исправить и прислать заново.",
    status: "in_progress",
    priority: "high",
    assignee: null,
    tag: "оплата",
  },
  {
    key: "pavel",
    daysAgo: 4,
    hour: 17,
    minute: 40,
    subject: "Закрывающие документы за квартал",
    text: "Нужны УПД в ЭДО до пятницы.",
    status: "processed",
    priority: "low",
    assignee: "admin",
    tag: "документ",
  },
  {
    key: "olga",
    daysAgo: 12,
    hour: 12,
    minute: 15,
    subject: "Нужна копия договора",
    text: "Договор от марта, скан потеряли при переезде офиса.",
    status: "new",
    priority: "normal",
    assignee: null,
    tag: "документ",
  },
  {
    key: "c2",
    daysAgo: 14,
    hour: 10,
    minute: 48,
    subject: "Двойное списание",
    text: "4 сентября списалось дважды по 6 400 ₽.",
    status: "processed",
    priority: "high",
    assignee: "admin",
    tag: "возврат",
    note: { author: "admin", body: "Второе списание вернулось 6 сентября." },
  },
  {
    key: "artem",
    daysAgo: 16,
    hour: 15,
    minute: 5,
    subject: "Подключить второго пользователя",
    text: "Коллега будет только смотреть остатки.",
    status: "processed",
    priority: "normal",
    assignee: "manager",
    tag: "доступ",
  },
  {
    key: "c3",
    daysAgo: 18,
    hour: 9,
    minute: 27,
    subject: "Адрес доставки",
    text: "Склад переехал на Набережную, 14. Старый адрес в заказе 4401.",
    status: "processed",
    priority: "normal",
    assignee: "admin",
    tag: "доставка",
  },
  {
    key: "kira",
    daysAgo: 20,
    hour: 11,
    minute: 11,
    subject: "Вопрос по доставке образцов",
    text: "Образцы лежат на складе третью неделю. Нужен трек.",
    status: "in_progress",
    priority: "low",
    assignee: "admin",
    tag: "доставка",
  },
  {
    key: "c5",
    daysAgo: 22,
    hour: 8,
    minute: 40,
    subject: "Сайт лежал утром",
    text: "С 8:10 до 8:28 витрина открывалась с ошибкой 502.",
    status: "processed",
    priority: "urgent",
    assignee: "manager",
    tag: "доступ",
  },
  {
    key: "c4",
    daysAgo: 35,
    hour: 13,
    minute: 13,
    subject: "Каталог на почту",
    text: "Пришлите PDF каталога, на сайте он не скачивается.",
    status: "processed",
    priority: "low",
    assignee: "manager",
    tag: "документ",
  },
];

let number = 1042;
const uploads = path.join(dataDir, "uploads");
await fs.mkdir(uploads, { recursive: true });

for (const item of plan) {
  const createdAt = at(item.daysAgo, item.hour, item.minute);
  const id = crypto.randomUUID();
  const assigneeId = item.assignee ? people[item.assignee] : null;
  const responseAt = item.status === "processed" ? new Date(createdAt.getTime() + 90 * 60_000) : null;
  db.insert(tickets)
    .values({
      id,
      number,
      customerId: customerIds[item.key]!,
      subject: item.subject,
      text: item.text,
      status: item.status,
      priority: item.priority,
      assigneeId,
      dueAt: dueAtFor(item.priority, createdAt),
      managerResponseAt: responseAt,
      createdAt,
      updatedAt: responseAt ?? createdAt,
    })
    .run();
  db.insert(activities)
    .values({
      id: crypto.randomUUID(),
      ticketId: id,
      actorId: null,
      kind: "created",
      body: "Заявка с виджета",
      createdAt,
    })
    .run();
  if (assigneeId) {
    const assigneeName = item.assignee === "admin" ? "Анна Соколова" : "Илья Морозов";
    db.insert(activities)
      .values({
        id: crypto.randomUUID(),
        ticketId: id,
        actorId: assigneeId,
        kind: "assign",
        body: `Исполнитель: ${assigneeName}`,
        createdAt: new Date(createdAt.getTime() + 5 * 60_000),
      })
      .run();
  }
  if (item.status !== "new") {
    db.insert(activities)
      .values({
        id: crypto.randomUUID(),
        ticketId: id,
        actorId: assigneeId,
        kind: "status",
        body: `Статус: Новый → ${item.status === "processed" ? "Обработан" : "В работе"}`,
        createdAt: new Date(createdAt.getTime() + 20 * 60_000),
      })
      .run();
  }
  if (item.tag) {
    db.insert(ticketTags).values({ ticketId: id, tagId: tagIds[item.tag]! }).run();
    db.insert(activities)
      .values({
        id: crypto.randomUUID(),
        ticketId: id,
        actorId: assigneeId,
        kind: "tag",
        body: `Метка: ${item.tag}`,
        createdAt: new Date(createdAt.getTime() + 25 * 60_000),
      })
      .run();
  }
  if (item.note) {
    const authorId = people[item.note.author];
    const notedAt = new Date(createdAt.getTime() + 50 * 60_000);
    db.insert(notes)
      .values({
        id: crypto.randomUUID(),
        ticketId: id,
        authorId,
        body: item.note.body,
        createdAt: notedAt,
      })
      .run();
    db.insert(activities)
      .values({
        id: crypto.randomUUID(),
        ticketId: id,
        actorId: authorId,
        kind: "note",
        body: "Заметка",
        createdAt: notedAt,
      })
      .run();
  }
  if (item.file) {
    const storedName = crypto.randomUUID();
    const fileName = "схема.txt";
    const body = "Схема проезда к складу, д. 14. Демо-файл мини-CRM, не документ клиента.\n";
    await fs.writeFile(path.join(uploads, storedName), body);
    db.insert(attachments)
      .values({
        id: crypto.randomUUID(),
        ticketId: id,
        fileName,
        storedName,
        size: Buffer.byteLength(body),
        createdAt,
      })
      .run();
  }
  number += 1;
}

const { summary } = await import("../lib/queries");
const counts = summary();
console.log(
  `Сиды готовы: ${counts.total} заявок, сегодня ${counts.today}, неделя ${counts.week}, месяц ${counts.month}, просрочено ${counts.overdue}.`,
);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});