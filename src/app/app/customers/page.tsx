import Link from "next/link";
import { countWord } from "@/lib/format";
import { listCustomers } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 80);
  const rows = listCustomers(query);
  return (
    <div className="workspace single">
      <div className="page sheet">
        <header className="mast">
          <p className="kicker">Клиенты</p>
          <h1>
            <span className="mono mast-num">{rows.length}</span>
            <span className="mast-word">{countWord(rows.length, "клиент", "клиента", "клиентов")}</span>
          </h1>
        </header>
        <p className="help">Карточка клиента и все его заявки. Телефон и почта уникальны. Виджет их не переписывает.</p>
        <form className="filters" action="/app/customers" method="get">
          <div className="filter-row">
            <label className="f-text">
              Поиск
              <input name="q" defaultValue={query} maxLength={80} placeholder="Имя, компания, телефон" />
            </label>
            <button className="btn press" type="submit">
              Найти
            </button>
          </div>
        </form>
        {rows.length === 0 ? <p className="empty">Таких клиентов нет</p> : null}
        {rows.length > 0 ? (
          <div className="ledger-scroll">
            <table className="ledger">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Компания</th>
                <th>Телефон</th>
                <th className="num">Открытые</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/app/customers/${row.id}`}>{row.name}</Link>
                  </td>
                  <td>{row.company ?? "—"}</td>
                  <td className="mono">{row.phone}</td>
                  <td className="num mono">{row.open}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
