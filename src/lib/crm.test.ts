import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  blockedUpload,
  calendarDayKey,
  dueAtFor,
  isOverdue,
  isPhone,
  limitDecision,
  parseStatusQuery,
  revealStatus,
  STATUS_MISS,
  moscowMonthStart,
  moscowWeekStart,
  nextStatus,
  normalizeTag,
  safeFileName,
} from "./crm";

describe("телефон", () => {
  it("принимает E.164", () => {
    assert.equal(isPhone("+79991234567"), true);
    assert.equal(isPhone("+12"), true);
  });

  it("отклоняет местный номер и пробелы", () => {
    assert.equal(isPhone("89991234567"), false);
    assert.equal(isPhone("+7 999 123 45 67"), false);
    assert.equal(isPhone("+0123"), false);
  });
});

describe("календарь Москвы", () => {
  it("переводит поздний UTC на следующие сутки", () => {
    assert.equal(calendarDayKey(new Date("2026-10-08T21:30:00Z")), "2026-10-09");
    assert.equal(calendarDayKey(new Date("2026-10-08T20:30:00Z")), "2026-10-08");
  });

  it("считает неделю с понедельника", () => {
    const thursday = new Date("2026-10-08T12:00:00+03:00");
    assert.equal(moscowWeekStart(thursday).toISOString(), new Date("2026-10-05T00:00:00+03:00").toISOString());
  });

  it("считает месяц с первого числа", () => {
    const thursday = new Date("2026-10-08T12:00:00+03:00");
    assert.equal(moscowMonthStart(thursday).toISOString(), new Date("2026-10-01T00:00:00+03:00").toISOString());
  });
});

describe("срок и статус", () => {
  it("ставит срок от приоритета", () => {
    const created = new Date("2026-10-08T09:00:00+03:00");
    assert.equal(dueAtFor("urgent", created).getTime() - created.getTime(), 4 * 3_600_000);
    assert.equal(dueAtFor("high", created).getTime() - created.getTime(), 24 * 3_600_000);
    assert.equal(dueAtFor("normal", created).getTime() - created.getTime(), 72 * 3_600_000);
    assert.equal(dueAtFor("low", created).getTime() - created.getTime(), 168 * 3_600_000);
  });

  it("не считает обработанную заявку просроченной", () => {
    const due = new Date("2026-10-01T00:00:00Z");
    const now = new Date("2026-10-08T00:00:00Z");
    assert.equal(isOverdue("processed", due, now), false);
    assert.equal(isOverdue("new", due, now), true);
  });

  it("фиксирует время первого ответа и не переписывает его", () => {
    const first = new Date("2026-10-08T10:00:00Z");
    const later = new Date("2026-10-08T12:00:00Z");
    const opened = nextStatus({ status: "new", managerResponseAt: null }, "processed", first);
    assert.equal(opened.managerResponseAt?.toISOString(), first.toISOString());
    const again = nextStatus(
      { status: "in_progress", managerResponseAt: opened.managerResponseAt },
      "processed",
      later,
    );
    assert.equal(again.managerResponseAt?.toISOString(), first.toISOString());
    const same = nextStatus(
      { status: "processed", managerResponseAt: opened.managerResponseAt },
      "processed",
      later,
    );
    assert.equal(same.changed, false);
  });
});

describe("файлы и лимит", () => {
  it("прячет опасное расширение, в том числе двойное", () => {
    assert.equal(blockedUpload("схема.txt"), false);
    assert.equal(blockedUpload("note.html"), true);
    assert.equal(blockedUpload("note.HTML.txt"), true);
    assert.equal(blockedUpload("photo.SVG"), true);
    assert.equal(blockedUpload("archive.tar.gz"), false);
  });

  it("оставляет читаемое имя без пути и кавычек", () => {
    assert.equal(safeFileName("../../схема.txt"), "схема.txt");
    assert.equal(safeFileName('отчёт\r\n".pdf'), "отчёт.pdf");
    assert.equal(safeFileName("   "), "файл");
    assert.equal(safeFileName("a".repeat(200) + ".txt").length <= 120, true);
  });

  it("пускает попытку, пока окно не заполнено, и открывает новое", () => {
    const now = 1_000_000;
    const windowMs = 60_000;
    const first = limitDecision(0, 0, now, 3, windowMs);
    assert.equal(first.allow, true);
    assert.equal(first.hits, 1);
    assert.equal(first.windowStart, now);
    const full = limitDecision(3, now, now + 1000, 3, windowMs);
    assert.equal(full.allow, false);
    assert.equal(full.hits, 3);
    const later = limitDecision(3, now, now + windowMs, 3, windowMs);
    assert.equal(later.allow, true);
    assert.equal(later.hits, 1);
    assert.equal(later.windowStart, now + windowMs);
  });
});

describe("статус для клиента", () => {
  const ticket = {
    number: 1042,
    phone: "+79990000001",
    subject: "Не приходит код",
    status: "new",
    reply: "  Код отправили ещё раз.  ",
  };

  it("принимает номер и телефон", () => {
    assert.deepEqual(parseStatusQuery(" 1042 ", " +79990000001 "), {
      ok: true,
      number: 1042,
      phone: "+79990000001",
    });
  });

  it("отклоняет нулевой номер и местный телефон", () => {
    assert.equal(parseStatusQuery("0", "+79990000001").ok, false);
    assert.equal(parseStatusQuery("1042", "89990000001").ok, false);
  });

  it("показывает ответ только при совпадении телефона и прячет чужие поля", () => {
    const found = revealStatus(ticket, "+79990000001");
    assert.equal(found?.reply, "Код отправили ещё раз.");
    assert.equal(found?.status, "new");
    assert.equal("phone" in (found ?? {}), false);
    assert.equal(revealStatus(ticket, "+79990000002"), null);
    assert.equal(revealStatus(null, "+79990000001"), null);
    assert.equal(revealStatus({ ...ticket, status: "lost" }, "+79990000001"), null);
    assert.equal(revealStatus({ ...ticket, reply: "  " }, "+79990000001")?.reply, null);
    assert.equal(STATUS_MISS.includes("номер и телефон"), true);
  });
});

describe("метки", () => {
  it("приводит имя к нижнему регистру", () => {
    assert.equal(normalizeTag(" Оплата "), "оплата");
    assert.equal(normalizeTag("!!!"), null);
  });
});
