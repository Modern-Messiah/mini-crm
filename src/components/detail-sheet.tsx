"use client";

import { animate } from "motion";
import { useLayoutEffect, useRef } from "react";

export function DetailSheet({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const seen = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const narrowQuery = window.matchMedia("(max-width: 840px)");
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stop = () => {};

    const place = (shouldAnimate: boolean) => {
      stop();
      if (!narrowQuery.matches) {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.visibility = "";
        return;
      }
      const show = open;
      if (!shouldAnimate || reduceQuery.matches) {
        el.style.transform = reduceQuery.matches ? "none" : show ? "translate3d(0,0,0)" : "translate3d(100%,0,0)";
        el.style.opacity = reduceQuery.matches ? (show ? "1" : "0") : "";
        el.style.visibility = show ? "visible" : "hidden";
        return;
      }
      el.style.visibility = "visible";
      const controls = animate(el, { x: show ? "0%" : "100%" }, { type: "spring", bounce: 0.2, duration: 0.35 });
      let dropped = false;
      stop = () => {
        dropped = true;
        controls.stop();
      };
      void controls.finished.then(() => {
        if (!dropped && !show) el.style.visibility = "hidden";
      });
    };

    place(seen.current);
    seen.current = true;
    const onChange = () => place(false);
    narrowQuery.addEventListener("change", onChange);
    return () => {
      stop();
      narrowQuery.removeEventListener("change", onChange);
    };
  }, [open]);

  return (
    <section ref={ref} className={open ? "detail is-open" : "detail"} aria-label="Заявка">
      {children}
    </section>
  );
}
