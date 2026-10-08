"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaff, type ActionResult } from "@/lib/actions";

export function StaffForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createStaff, {} as ActionResult);
  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);
  return (
    <form ref={formRef} className="customer-form" action={action}>
      {state.error ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="notice">Сотрудник добавлен.</p> : null}
      <label className="field">
        <span className="field-label">Имя</span>
        <input name="name" required maxLength={120} />
      </label>
      <label className="field">
        <span className="field-label">Почта</span>
        <input name="email" type="email" autoComplete="off" required maxLength={160} />
      </label>
      <label className="field">
        <span className="field-label">Пароль</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />
      </label>
      <button className="btn btn-primary press" type="submit" disabled={pending}>
        {pending ? "Добавляем…" : "Добавить менеджера"}
      </button>
    </form>
  );
}
