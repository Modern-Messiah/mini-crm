import Link from "next/link";
import { DetailSheet } from "@/components/detail-sheet";
import { TicketPanel } from "@/components/ticket-panel";
import { STATUSES, PRIORITIES } from "@/lib/crm";
import { parseFilters, queueHref } from "@/lib/filters";
import { PRIORITY_LABEL, STATUS_CLASS, STATUS_LABEL, formatToday, ticketsWord } from "@/lib/format";
import { listStaff, listTickets, loadTicket } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams);
  const rows = listTickets(filters, user.id);
  const ticket = filters.id ? loadTicket(filters.id) : null;
  const staff = listStaff();
  const outside = Boolean(ticket && !rows.some((row) => row.id === ticket.id));

  return (
    <div className="workspace">
      <section className="list" aria-labelledby="queue-title">
        <header className="mast">
          <p className="kicker">Очередь · {formatToday()}</p>
          <h1 id="queue-title">
            <span className="mono mast-num">{rows.length}</span>
            <span className="mast-word">{ticketsWord(rows.length)}</span>
          </h1>
        </header>
        <form className="filters" action="/app" method="get">
          {filters.scope !== "all" ? <input type="hidden" name="scope" value={filters.scope} /> : null}
          {filters.id ? <input type="hidden" name="id" value={filters.id} /> : null}
          <div className="scopes">
            <div className="scope-bar">
              {(
                [
                  ["all", "Все"],
                  ["mine", "Мои"],
                  ["unassigned", "Свободные"],
                  ["overdue", "Просрочка"],
                ] as const
              ).map(([scope, label]) => (
                <Link
                  key={scope}
                  className="scope press"
                  href={queueHref(filters, { scope, id: filters.id })}
                  aria-current={filters.scope === scope ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </div>
            {filters.q || filters.status || filters.priority || filters.from || filters.to || filters.scope !== "all" ? (
              <Link
                className="clear-filters press"
                href={queueHref(filters, { q: "", status: "", priority: "", from: "", to: "", scope: "all" })}
              >
                Сбросить
              </Link>
            ) : null}
          </div>
          <div className="filter-row">
            <label className="f-text">
              Поиск
              <input name="q" defaultValue={filters.q} maxLength={80} placeholder="Тема, клиент, телефон" />
            </label>
            <label className="f-status">
              Статус
              <select name="status" defaultValue={filters.status}>
                <option value="">Все</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="f-status">
              Приоритет
              <select name="priority" defaultValue={filters.priority}>
                <option value="">Все</option>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABEL[priority]}
                  </option>
                ))}
              </select>
            </label>
            <label className="f-date">
              С даты
              <input name="from" type="date" defaultValue={filters.from} />
            </label>
            <label className="f-date">
              По дату
              <input name="to" type="date" defaultValue={filters.to} />
            </label>
            <button className="btn press" type="submit">
              Найти
            </button>
          </div>
        </form>
        <div className="cols" aria-hidden="true">
          <span />
          <span>Время</span>
          <span>№</span>
          <span>Клиент</span>
          <span className="col-subject">Тема</span>
          <span>Статус</span>
        </div>
        <div className="rows">
          {rows.length === 0 ? <p className="empty">Таких заявок нет</p> : null}
          {rows.map((row) => (
            <Link
              key={row.id}
              href={queueHref(filters, { id: row.id })}
              className={row.id === filters.id ? "row press is-selected" : "row press"}
              scroll={false}
            >
              <span className="mark" />
              <span className={row.overdue ? "mono time-over" : "mono"}>{row.createdLabel}</span>
              <span className="mono slip">{row.number}</span>
              <span className="ellipsis">{row.customerName}</span>
              <span className="ellipsis subject-cell">{row.subject}</span>
              <span className={`status-cell ${STATUS_CLASS[row.status]}`}>
                {row.priority !== "normal" ? (
                  <span className={row.priority === "high" || row.priority === "urgent" ? "prio-prefix time-over" : "prio-prefix"}>
                    {PRIORITY_LABEL[row.priority]} ·{" "}
                  </span>
                ) : null}
                {STATUS_LABEL[row.status]}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <DetailSheet open={Boolean(ticket)}>
        {ticket ? (
          <TicketPanel
            ticket={ticket}
            staff={staff}
            me={user.id}
            closeHref={queueHref(filters, { id: "" })}
            outside={outside}
          />
        ) : (
          <p className="empty detail-empty">Выберите заявку в списке.</p>
        )}
      </DetailSheet>
    </div>
  );
}
