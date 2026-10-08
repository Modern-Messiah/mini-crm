import Link from "next/link";
import { redirect } from "next/navigation";
import { currentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await currentSession();
  if (session) redirect("/app");
  return (
    <main className="cover">
      <div className="cover-panel">
        <div className="brand">
          <span className="stamp" aria-hidden="true" />
          <span className="wordmark">Мини-CRM</span>
        </div>
        <h1>Очередь заявок</h1>
        <p className="help">
          Клиент пишет в виджет. Сотрудник видит ту же заявку в очереди: кто написал, какой срок и кто взял её в работу.
        </p>
        <div className="cover-actions">
          <Link className="btn btn-primary press" href="/widget">
            Виджет для клиента
          </Link>
          <Link className="btn press" href="/status">
            Статус заявки
          </Link>
          <Link className="btn press" href="/login">
            Вход
          </Link>
        </div>
      </div>
    </main>
  );
}
