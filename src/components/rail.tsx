"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions";

export function Rail({
  name,
  email,
  role,
  admin,
  onSearch,
}: {
  name: string;
  email: string;
  role: string;
  admin: boolean;
  onSearch: () => void;
}) {
  const path = usePathname();
  const queue = path === "/app";
  const customers = path.startsWith("/app/customers");
  const summary = path.startsWith("/app/summary");
  const staff = path.startsWith("/app/staff");
  const currentRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const item = currentRef.current;
    const nav = item?.parentElement;
    if (!item || !nav || nav.scrollWidth <= nav.clientWidth) return;
    item.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [path]);

  return (
    <aside className="rail">
      <div className="brand">
        <span className="stamp" aria-hidden="true" />
        <span className="wordmark">Мини-CRM</span>
      </div>
      <nav className="rail-nav" aria-label="Разделы">
        <Link ref={queue ? currentRef : undefined} className="nav-btn press" href="/app" aria-current={queue ? "page" : undefined}>
          <span className="nav-main">
            <span className="mono nav-idx">01</span>
            Очередь
          </span>
        </Link>
        <Link ref={customers ? currentRef : undefined} className="nav-btn press" href="/app/customers" aria-current={customers ? "page" : undefined}>
          <span className="nav-main">
            <span className="mono nav-idx">02</span>
            Клиенты
          </span>
        </Link>
        <Link ref={summary ? currentRef : undefined} className="nav-btn press" href="/app/summary" aria-current={summary ? "page" : undefined}>
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
        {admin ? (
          <Link ref={staff ? currentRef : undefined} className="nav-btn press" href="/app/staff" aria-current={staff ? "page" : undefined}>
            <span className="nav-main">
              <span className="mono nav-idx">05</span>
              Сотрудники
            </span>
          </Link>
        ) : null}
        <button className="nav-btn press" type="button" onClick={onSearch}>
          <span className="nav-main">
            <span className="mono nav-idx" aria-hidden="true" />
            Поиск
          </span>
          <span className="kbd mono">Ctrl+K</span>
        </button>
      </nav>
      <div className="rail-bottom">
        <p className="who-name">{name}</p>
        <p className="who-mail">{role}</p>
        <p className="who-mail">{email}</p>
        <form action={signOut}>
          <button className="nav-btn press" type="submit">
            <span className="nav-main">
              <span className="mono nav-idx" aria-hidden="true" />
              Выйти
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}
