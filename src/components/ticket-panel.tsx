"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useOptimistic } from "react";
import {
  addNote,
  assignTicket,
  claimTicket,
  saveReply,
  toggleTag,
  updatePriority,
  updateStatus,
} from "@/lib/actions";
import { PRIORITIES, STATUSES } from "@/lib/crm";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/format";
import type { StaffOption, TicketView } from "@/lib/view";

export function TicketPanel({
  ticket,
  staff,
  me,
  closeHref,
  outside,
}: {
  ticket: TicketView;
  staff: StaffOption[];
  me: string;
  closeHref: string;
  outside: boolean;
}) {
  const [status, setStatus] = useOptimistic(ticket.status);
  const [priority, setPriority] = useOptimistic(ticket.priority);
  const [assignee, setAssignee] = useOptimistic(ticket.assigneeId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <div className="detail-top">
        <span className="mono slip-no">{ticket.number}</span>
        <span className="mono detail-time">{ticket.createdLabel}</span>
        <Link className="close-sheet press" href={closeHref}>
          Закрыть
        </Link>
      </div>
      <div className="detail-body">
        <h2>{ticket.subject}</h2>
        {outside ? <p className="notice">Эта заявка не входит в фильтр.</p> : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <dl className="kv">
          <dt>Клиент</dt>
          <dd>
            <Link href={`/app/customers/${ticket.customerId}`}>{ticket.customerName}</Link>
          </dd>
          {ticket.company ? (
            <>
              <dt>Компания</dt>
              <dd>{ticket.company}</dd>
            </>
          ) : null}
          <dt>Телефон</dt>
          <dd className="mono">{ticket.phone}</dd>
          <dt>Почта</dt>
          <dd>{ticket.email}</dd>
          <dt>Исполнитель</dt>
          <dd>{ticket.assigneeName ?? "Не назначен"}</dd>
          <dt>Срок</dt>
          <dd className={ticket.overdue ? "time-over" : undefined}>
            {ticket.dueLabel}
            {ticket.overdue ? " · Просрочена" : ""}
          </dd>
          {ticket.responseLabel ? (
            <>
              <dt>Обработана</dt>
              <dd>{ticket.responseLabel}</dd>
            </>
          ) : null}
        </dl>
        <p className="body-text">{ticket.text}</p>
        <p className="block-label">Ответ клиенту. На почту не уходит.</p>
        <ReplyForm
          key={ticket.reply ?? ""}
          ticketId={ticket.id}
          reply={ticket.reply ?? ""}
          disabled={pending}
          onError={setError}
        />
        {ticket.files.length > 0 ? (
          <div>
            <p className="block-label">Файлы</p>
            {ticket.files.map((file) => (
              <p className="file-line" key={file.id}>
                <a href={`/api/files/${file.id}`}>{file.fileName}</a>
                <span className="hint"> · {file.sizeLabel}</span>
              </p>
            ))}
          </div>
        ) : null}
        <p className="block-label">Приоритет</p>
        <div className="status-group">
          {PRIORITIES.map((value) => (
            <button
              key={value}
              type="button"
              className="btn press"
              aria-pressed={priority === value}
              disabled={pending}
              onClick={() =>
                run(async () => {
                  setPriority(value);
                  return updatePriority(ticket.id, value);
                })
              }
            >
              {PRIORITY_LABEL[value]}
            </button>
          ))}
        </div>
        <p className="block-label">Статус</p>
        <div className="status-group">
          {STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              className="btn press"
              aria-pressed={status === value}
              disabled={pending}
              onClick={() =>
                run(async () => {
                  setStatus(value);
                  return updateStatus(ticket.id, value);
                })
              }
            >
              {STATUS_LABEL[value]}
            </button>
          ))}
        </div>
        <p className="block-label">Исполнитель</p>
        <div className="status-group">
          <select
            aria-label="Исполнитель"
            value={assignee ?? ""}
            disabled={pending}
            onChange={(event) => {
              const value = event.target.value;
              run(async () => {
                setAssignee(value || null);
                return assignTicket(ticket.id, value || null);
              });
            }}
          >
            <option value="">Не назначен</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          {assignee !== me ? (
            <button
              type="button"
              className="btn press"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  setAssignee(me);
                  setStatus(ticket.status === "new" ? "in_progress" : status);
                  return claimTicket(ticket.id);
                })
              }
            >
              Взять себе
            </button>
          ) : null}
        </div>
        <p className="block-label">Метки</p>
        <div className="tag-group">
          {ticket.tags.map((tag) => (
            <button
              key={tag.name}
              type="button"
              className="btn press"
              aria-pressed={tag.on}
              disabled={pending}
              onClick={() => run(() => toggleTag(ticket.id, tag.name))}
            >
              {tag.name}
            </button>
          ))}
        </div>
        <TagForm ticketId={ticket.id} disabled={pending} onError={setError} />
        <p className="block-label">Заметки. Клиент их не видит.</p>
        {ticket.notes.length === 0 ? <p className="hint">Заметок пока нет.</p> : null}
        {ticket.notes.map((note) => (
          <article className="note" key={note.id}>
            <p className="hint">
              {note.author} · <span className="mono">{note.time}</span>
            </p>
            <p>{note.body}</p>
          </article>
        ))}
        <NoteForm key={ticket.notes.length} ticketId={ticket.id} disabled={pending} onError={setError} />
        <p className="block-label">История</p>
        <ol className="timeline">
          {ticket.timeline.map((item) => (
            <li key={item.id}>
              <span className="mono hint">{item.time}</span>
              <span>{item.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function ReplyForm({
  ticketId,
  reply,
  disabled,
  onError,
}: {
  ticketId: string;
  reply: string;
  disabled: boolean;
  onError: (message: string | null) => void;
}) {
  const [, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        const body = String(formData.get("reply") ?? "");
        onError(null);
        startTransition(async () => {
          const result = await saveReply(ticketId, body);
          if (result.error) onError(result.error);
        });
      }}
    >
      <label className="field">
        <span className="field-label">Текст ответа</span>
        <textarea name="reply" maxLength={5000} defaultValue={reply} />
      </label>
      <button className="btn press" type="submit" disabled={disabled}>
        Сохранить ответ
      </button>
    </form>
  );
}

function NoteForm({
  ticketId,
  disabled,
  onError,
}: {
  ticketId: string;
  disabled: boolean;
  onError: (message: string | null) => void;
}) {
  const [, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        const body = String(formData.get("body") ?? "");
        onError(null);
        startTransition(async () => {
          const result = await addNote(ticketId, body);
          if (result.error) onError(result.error);
        });
      }}
    >
      <label className="field">
        <span className="field-label">Новая заметка</span>
        <textarea name="body" maxLength={2000} />
      </label>
      <button className="btn press" type="submit" disabled={disabled}>
        Записать
      </button>
    </form>
  );
}

function TagForm({
  ticketId,
  disabled,
  onError,
}: {
  ticketId: string;
  disabled: boolean;
  onError: (message: string | null) => void;
}) {
  const [, startTransition] = useTransition();
  return (
    <form
      className="tag-add"
      action={(formData) => {
        const name = String(formData.get("tag") ?? "");
        onError(null);
        startTransition(async () => {
          const result = await toggleTag(ticketId, name);
          if (result.error) onError(result.error);
        });
      }}
    >
      <input name="tag" aria-label="Своя метка" placeholder="Своя метка" maxLength={24} />
      <button className="btn press" type="submit" disabled={disabled}>
        Добавить
      </button>
    </form>
  );
}
