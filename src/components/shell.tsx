"use client";

import { useEffect, useState } from "react";
import type { PaletteIndex } from "@/lib/view";
import { Palette } from "./palette";
import { Rail } from "./rail";

export function Shell({
  user,
  index,
  children,
}: {
  user: { name: string; email: string; role: string };
  index: PaletteIndex;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [paletteKey, setPaletteKey] = useState(0);

  function openPalette() {
    setPaletteKey((value) => value + 1);
    setOpen(true);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-frame">
      <div className="shell">
        <Rail name={user.name} email={user.email} role={user.role} onSearch={openPalette} />
        {children}
      </div>
      <Palette key={paletteKey} open={open} index={index} onClose={() => setOpen(false)} />
    </div>
  );
}
