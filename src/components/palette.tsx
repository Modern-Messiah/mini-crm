"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PaletteIndex } from "@/lib/view";

type Item = { key: string; label: string; hint: string; href: string };

const commands: Item[] = [
  { key: "queue", label: "Очередь", hint: "Раздел", href: "/app" },
  { key: "mine", label: "Мои заявки", hint: "Фильтр", href: "/app?scope=mine" },
  { key: "free", label: "Без исполнителя", hint: "Фильтр", href: "/app?scope=unassigned" },
  { key: "late", label: "Просроченные", hint: "Фильтр", href: "/app?scope=overdue" },
  { key: "customers", label: "Клиенты", hint: "Раздел", href: "/app/customers" },
  { key: "summary", label: "Сводка", hint: "Раздел", href: "/app/summary" },
  { key: "widget", label: "Виджет", hint: "Раздел", href: "/widget" },
];

export function Palette({
  open,
  index,
  onClose,
}: {
  open: boolean;
  index: PaletteIndex;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    const matches = (text: string) => text.toLocaleLowerCase("ru").includes(needle);
    const found: Item[] = commands.filter((item) => !needle || matches(item.label));
    if (needle) {
      for (const ticket of index.tickets) {
        const label = `${ticket.number} ${ticket.subject} ${ticket.customerName}`;
        if (!matches(label)) continue;
        found.push({
          key: ticket.id,
          label: ticket.subject,
          hint: `№ ${ticket.number} · ${ticket.customerName}`,
          href: `/app?id=${ticket.id}`,
        });
      }
      for (const customer of index.customers) {
        const label = `${customer.name} ${customer.company ?? ""}`;
        if (!matches(label)) continue;
        found.push({
          key: customer.id,
          label: customer.name,
          hint: customer.company ?? "Клиент",
          href: `/app/customers/${customer.id}`,
        });
      }
    }
    return found.slice(0, 12);
  }, [index, query]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  const spring = reduce ? { duration: 0.16 } : { type: "spring" as const, bounce: 0, duration: 0.35 };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0.16 } : { duration: 0.2 }}
          />
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Поиск"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={spring}
          >
            <input
              ref={inputRef}
              value={query}
              placeholder="Заявка, клиент или раздел"
              aria-label="Поиск"
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onClose();
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((value) => Math.min(value + 1, Math.max(items.length - 1, 0)));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((value) => Math.max(value - 1, 0));
                } else if (event.key === "Enter" && items[active]) {
                  event.preventDefault();
                  go(items[active].href);
                }
              }}
            />
            <div className="palette-list">
              {items.length === 0 ? <p className="empty">Ничего не нашлось</p> : null}
              {items.map((item, itemIndex) => (
                <button
                  key={item.key}
                  type="button"
                  className="palette-item press"
                  aria-current={itemIndex === active ? "true" : undefined}
                  onMouseEnter={() => setActive(itemIndex)}
                  onClick={() => go(item.href)}
                >
                  <span className="ellipsis">{item.label}</span>
                  <span className="palette-hint">{item.hint}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
