"use client";

import { useActionState } from "react";
import { updateCustomer, type ActionResult } from "@/lib/actions";

export function CustomerForm({
  customer,
}: {
  customer: { id: string; name: string; company: string | null; phone: string; email: string };
}) {
  const [state, action, pending] = useActionState(updateCustomer.bind(null, customer.id), {} as ActionResult);
  return (
    <form className="customer-form" action={action}>
      {state.error ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="notice">Карточка сохранена.</p> : null}
      <label className="field">
        <span className="field-label">Имя</span>
        <input name="name" defaultValue={customer.name} required maxLength={120} />
      </label>
      <label className="field">
        <span className="field-label">Компания</span>
        <input name="company" defaultValue={customer.company ?? ""} maxLength={160} />
      </label>
      <label className="field">
        <span className="field-label">Телефон</span>
        <input className="mono" name="phone" defaultValue={customer.phone} required />
      </label>
      <label className="field">
        <span className="field-label">Почта</span>
        <input name="email" type="email" defaultValue={customer.email} required maxLength={160} />
      </label>
      <button className="btn press" type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить карточку"}
      </button>
    </form>
  );
}
