---
name: mini-crm-desk
description: >
  Visual desk of mini-CRM: warm blotter, paper sheet, ink stamps, IBM Plex. Use when changing CSS or layout of the queue, rail, summary, login, widget, or status page, and when the user says дизайн, стол, бланк, or вёрстка.
---

# Стол мини-CRM

Direction 2 is the approved desk. The record of that choice is `design-demos/direction-approved.md`. An iteration of this desk does not start a new round of three drafts.

Product rules and commands are in the mini-crm skill. Do not restate them here.

## What the screen is

Color tokens live only in `:root` of `src/app/globals.css`. Read them there. Do not paste a second copy into this skill.

The ground is the warm desk. The rail is darker than the desk. Paper is the open ticket, the customer page, and the login, widget, and status sheets. A queue number is a stamp. The queue mast is the live count. Scope links are one segmented control. Summary figures are paper slips on the desk, and the tables under them stay real counts.

Fonts are IBM Plex Sans and IBM Plex Mono, loaded in `src/app/layout.tsx`. Body text stays at least 14px. Interface copy is Russian with «ёлочки».

Do not add emoji icons, a purple gradient, a card with a colored left border, Inter or Geist as the display face, or `backdrop-filter`. Errors and overdue times use the accent. Sheets have a 1px line and no drop shadow. The command palette is the one surface that keeps a shadow.

Press feedback on a button and a summary slip is the `:active` scale of 0.97. A joined scope, a queue row, a rail item, and a palette row highlight on press instead, so one segment does not shrink out of its bar. The command palette and the mobile ticket sheet already use springs. Reduced motion removes the slide and the scale. Keep that.

One inset, 16px, lines up a mast, its help line, the filters, the column text, and the tables. The selection mark sits in that gutter and does not push the columns. The rail uses one index column for the stamp, the numbers, and the blank before «Поиск» and «Выйти», so those labels share an edge. A customer or staff sheet is paper on the desk, at most 760px wide. The queue and the summary stay on the blotter and share the same left edge.

## After CSS

Restart `just dev` before judging the screen. On `/mnt/c` the dev server often serves the CSS from before the edit. Confirm a computed style, not only the file.
