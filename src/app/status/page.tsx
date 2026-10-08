import Link from "next/link";
import { StatusForm } from "./status-form";

export const dynamic = "force-dynamic";

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = typeof params.n === "string" ? params.n : "";
  const initialNumber = /^[1-9]\d{0,5}$/.test(raw) ? raw : "";
  return (
    <main className="login-view">
      <div className="login-panel">
        <div className="brand">
          <span className="stamp" aria-hidden="true" />
          <span className="wordmark">Мини-CRM</span>
        </div>
        <h1>Статус заявки</h1>
        <p className="help">
          Номер из ответа виджета и телефон, с которым оставляли заявку. Заметки сотрудника сюда не попадают.{" "}
          <Link href="/widget">Оставить заявку</Link>
        </p>
        <StatusForm initialNumber={initialNumber} />
      </div>
    </main>
  );
}
