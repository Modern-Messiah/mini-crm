import { redirect } from "next/navigation";
import { currentSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await currentSession();
  if (session) redirect("/app");
  return (
    <main className="login-view">
      <div className="login-panel">
        <div className="brand">
          <span className="stamp" aria-hidden="true" />
          <span className="wordmark">Мини-CRM</span>
        </div>
        <h1>Вход</h1>
        <p className="help">
          Администратор — admin@example.com. Менеджер — manager@example.com. Пароль у обоих — password.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
