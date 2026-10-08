"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { blockedUpload, isPhone, MAX_FILE_BYTES, MAX_FILES } from "@/lib/crm";

export function WidgetForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [done, setDone] = useState<{ number: number; message: string } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const phone = String(data.get("phone") ?? "").trim();
    if (!isPhone(phone)) {
      setError("Номер в формате +79991234567");
      return;
    }
    const files = data.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length > MAX_FILES) {
      setError("Не больше пяти файлов.");
      return;
    }
    if (files.some((file) => file.size > MAX_FILE_BYTES)) {
      setError("Каждый файл не больше 10 МБ.");
      return;
    }
    if (files.some((file) => blockedUpload(file.name))) {
      setError("Этот тип файла нельзя приложить.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/tickets", { method: "POST", body: data });
      const payload = (await response.json()) as { message?: string; number?: number };
      if (!response.ok || !payload.number) {
        setError(payload.message ?? "Не удалось отправить.");
        return;
      }
      setDone({ number: payload.number, message: payload.message ?? "Заявка принята. Ответим в эту же очередь." });
    } catch {
      setError("Не удалось отправить. Повторите.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="form">
        <p className="notice">{done.message}</p>
        <p className="mono">№ {done.number}</p>
        <p className="hint">Статус и ответ откроются по этому номеру и вашему телефону.</p>
        <div className="cover-actions">
          <Link className="btn press" href={`/status?n=${done.number}`}>
            Статус заявки
          </Link>
          <button className="btn press" type="button" onClick={() => setDone(null)}>
            Новая заявка
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <label className="field">
        <span className="field-label">Имя</span>
        <input name="name" autoComplete="name" required maxLength={120} />
      </label>
      <label className="field">
        <span className="field-label">Телефон</span>
        <input className="mono" name="phone" autoComplete="tel" inputMode="tel" placeholder="+79991234567" required />
      </label>
      <label className="field">
        <span className="field-label">Почта</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span className="field-label">Компания, если есть</span>
        <input name="company" autoComplete="organization" maxLength={160} />
      </label>
      <label className="field">
        <span className="field-label">Тема</span>
        <input name="subject" required maxLength={200} />
      </label>
      <label className="field">
        <span className="field-label">Что случилось</span>
        <textarea name="text" required maxLength={5000} />
      </label>
      <div className="field">
        <span className="field-label">Файлы</span>
        <input
          className="file-input"
          id="files"
          name="files"
          type="file"
          multiple
          onChange={(event) => {
            const list = event.target.files ? [...event.target.files] : [];
            setNames(list.map((file) => file.name));
          }}
        />
        <label className="btn press" htmlFor="files">
          Выбрать файлы
        </label>
        {names.length > 0 ? (
          <ul className="file-names">
            {names.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : (
          <p className="hint">До пяти файлов, каждый не больше 10 МБ.</p>
        )}
      </div>
      <div className="hp" aria-hidden="true">
        <label>
          Не заполняйте
          <input name="crm_hp" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <button className="btn btn-primary press" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Отправляем…" : "Отправить"}
      </button>
    </form>
  );
}
