"use client";

import { useActionState } from "react";
import { lookupStatus, type StatusState } from "@/lib/actions";
import { STATUS_EMPTY } from "@/lib/crm";

export function StatusForm({ initialNumber }: { initialNumber: string }) {
  const [state, action, pending] = useActionState(lookupStatus, {} as StatusState);
  return (
    <form className="form" action={action}>
      {state.error ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ticket ? (
        <article className="status-result">
          <p className="kicker">Заявка</p>
          <p className="mono slip-no">{state.ticket.number}</p>
          <h2>{state.ticket.subject}</h2>
          <dl className="kv">
            <dt>Статус</dt>
            <dd>{state.ticket.statusLabel}</dd>
          </dl>
          <p className="block-label">Ответ</p>
          <p className="status-reply">{state.ticket.reply ?? STATUS_EMPTY}</p>
        </article>
      ) : null}
      <label className="field">
        <span className="field-label">Номер заявки</span>
        <input className="mono" name="number" inputMode="numeric" defaultValue={initialNumber} required maxLength={6} />
      </label>
      <label className="field">
        <span className="field-label">Телефон</span>
        <input className="mono" name="phone" autoComplete="tel" inputMode="tel" placeholder="+79991234567" required />
      </label>
      <button className="btn btn-primary press" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Ищем…" : "Показать статус"}
      </button>
    </form>
  );
}
