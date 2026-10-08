"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions";

export function Rail({
  name,
  email,
  role,
  onSearch,
}: {
  name: string;
  email: string;
  role: string;
  onSearch: () => void;
}) {
  const path = usePathname();
  const queue = path === "/app";
  const customers = path.startsWith("/app/customers");
  const summary = path.startsWith("/app/summary");
  return (
    <aside className="rail">
      <div className="brand">
        <span className="stamp" aria-hidden="true" />
        <span className="wordmark">Мини-CRM</span>
      </div>
      <nav className="rail-nav" aria-label="Разделы">
        <Link className="nav-btn press" href="/app" aria-current={queue ? "page" : undefined}>
          <span className="nav-main">
            <span className="mono nav-idx">01</span>
            Очередь
          </span>
        </Link>
        <Link className="nav-btn press" href="/app/customers" aria-current={customers ? "page" : undefined}>
          <span className="nav-main">
            <span className="mono nav-idx">02</span>
            Клиенты
          </span>
        </Link>
        <Link className="nav-btn press" href="/app/summary" aria-current={summary ? "page" : undefined}>
          <span className="nav-main">
            <span className="mono nav-idx">03</span>
            Сводка
          </span>
        </Link>
        <Link className="nav-btn press" href="/widget">
          <span className="nav-main">
            <span className="mono nav-idx">04</span>
            Виджет
          </span>
        </Link>
        <button className="nav-btn press" type="button" onClick={onSearch}>
          Поиск
          <span className="kbd mono">Ctrl+K</span>
        </button>
      </nav>
      <div className="rail-bottom">
        <p className="who-name">{name}</p>
        <p className="who-mail">{role}</p>
        <p className="who-mail">{email}</p>
        <form action={signOut}>
          <button className="nav-btn press" type="submit">
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}
