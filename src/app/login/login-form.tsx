"use client";

import { useActionState } from "react";
import { signIn, type ActionResult } from "@/lib/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {} as ActionResult);
  return (
    <form className="form" action={action}>
      {state.error ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="field">
        <span className="field-label">Почта</span>
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        <span className="field-label">Пароль</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="btn btn-primary press" type="submit" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
