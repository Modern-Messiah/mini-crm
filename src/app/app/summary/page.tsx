import Link from "next/link";
import { PRIORITIES, STATUSES, calendarDayKey } from "@/lib/crm";
import { PRIORITY_LABEL, STATUS_LABEL, ticketsWord } from "@/lib/format";
import { summary } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  await requireUser();
  const counts = summary();
  const today = calendarDayKey(new Date());
  return (
    <div className="workspace single">
      <div className="page board">
        <header className="mast">
          <p className="kicker">Сводка</p>
          <h1>
            <span className="mono mast-num">{counts.total}</span>
            <span className="mast-word">{ticketsWord(counts.total)}</span>
          </h1>
        </header>
        <p className="help">Цифры из базы. Проценты роста не считаются.</p>
        <div className="slips">
          <Link className="stat press" href={`/app?from=${today}&to=${today}`}>
            <span className="kicker">Сегодня</span>
            <span className="mono stat-num">{counts.today}</span>
          </Link>
          <Link className="stat press" href="/app?scope=unassigned">
            <span className="kicker">Свободные</span>
            <span className="mono stat-num">{counts.unassigned}</span>
          </Link>
          <Link className="stat press" href="/app?scope=overdue">
            <span className="kicker">Просрочено</span>
            <span className={counts.overdue > 0 ? "mono stat-num time-over" : "mono stat-num"}>{counts.overdue}</span>
          </Link>
          <Link className="stat press" href="/app?status=in_progress">
            <span className="kicker">В работе</span>
            <span className="mono stat-num">{counts.byStatus.in_progress}</span>
          </Link>
        </div>
        <h2>Сколько завели</h2>
        <table className="ledger">
          <tbody>
            <tr>
              <th>Сегодня</th>
              <td className="num mono">{counts.today}</td>
            </tr>
            <tr>
              <th>Неделя, с понедельника</th>
              <td className="num mono">{counts.week}</td>
            </tr>
            <tr>
              <th>Месяц</th>
              <td className="num mono">{counts.month}</td>
            </tr>
            <tr>
              <th>Всего</th>
              <td className="num mono">{counts.total}</td>
            </tr>
          </tbody>
        </table>
        <h2>По статусу</h2>
        <table className="ledger">
          <tbody>
            {STATUSES.map((status) => (
              <tr key={status}>
                <th>
                  <Link href={`/app?status=${status}`}>{STATUS_LABEL[status]}</Link>
                </th>
                <td className="num mono">{counts.byStatus[status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Очередь</h2>
        <table className="ledger">
          <tbody>
            <tr>
              <th>
                <Link href="/app?scope=unassigned">Без исполнителя</Link>
              </th>
              <td className="num mono">{counts.unassigned}</td>
            </tr>
            <tr>
              <th>
                <Link href="/app?scope=overdue">Просрочено</Link>
              </th>
              <td className="num mono">{counts.overdue}</td>
            </tr>
          </tbody>
        </table>
        <h2>Открытые по приоритету</h2>
        <table className="ledger">
          <tbody>
            {PRIORITIES.map((priority) => (
              <tr key={priority}>
                <th>{PRIORITY_LABEL[priority]}</th>
                <td className="num mono">{counts.byPriorityOpen[priority]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Нагрузка</h2>
        <table className="ledger">
          <tbody>
            {counts.team.map((person) => (
              <tr key={person.id}>
                <th>{person.name}</th>
                <td className="num mono">{person.open}</td>
              </tr>
            ))}
            <tr>
              <th>Свободные</th>
              <td className="num mono">{counts.unassigned}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
