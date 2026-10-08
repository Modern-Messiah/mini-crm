---
name: mini-crm
description: >
  Change the mini-CRM product: the public widget, the ticket status page, the staff queue, customers, auth, and the security rules.
  Use when editing this repo, tickets, the widget, /status, customers, or seed data, and when the user says мини-CRM, очередь, виджет, or статус заявки.
---

# Мини-CRM

README.md is the human overview and the run steps. This skill is the procedure for changing the product. Before a visual change, read the mini-crm-desk skill. Do not copy its color tokens into this file.

## Run

Work from the repo root. The auth origin is http://localhost:3000, so `just dev` stays on that port. `just test` runs the unit tests. `just check` runs the typecheck, the tests, and lint.

Do not run a fresh `npm install` while `node_modules` is already present. On the WSL mount of this disk the install drops the executable bit and `better-sqlite3` fails to build. The README has the workaround.

Do not reseed unless the user asks. `just seed` rebuilds `data/crm.sqlite` and deletes local tickets.

Restart `just dev` after a CSS or schema edit. The watcher on `/mnt/c` often keeps serving the previous file.

## Where a change goes

- Intake: `src/lib/intake.ts` and `src/app/api/tickets/route.ts`
- Status lookup: `parseStatusQuery` and `revealStatus` in `src/lib/crm.ts`, `lookupStatus` in `src/lib/actions.ts`, page in `src/app/status`
- Staff mutations: `src/lib/actions.ts`. Screens are under `src/app/app`
- Tables: `src/lib/db/schema.ts` and the SQL in `src/lib/db/ensure.ts`. Importing `src/lib/db/index.ts` runs `ensureSchema` on the open database
- Rules and their tests: `src/lib/crm.ts` and `src/lib/crm.test.ts`. Intake, status lookup, and creating a manager: `src/lib/flow.test.ts`

## Keep these rules

Change one only when the user asks for that change.

- A phone and an email each belong to one customer. The widget does not rewrite a saved name or company. A mismatch of phone and email returns the single conflict message from intake, with no hint which field is already stored.
- One ticket per Moscow calendar day for a phone or an email.
- The reply is the text the customer can see. Saving it does not send mail, does not set `managerResponseAt`, and does not change status. An empty save clears it. The first transition to processed sets `managerResponseAt` once.
- The status page returns a ticket only when the number and the phone match. A missing number and a wrong phone both use `STATUS_MISS`. The page shows the number, subject, status, and reply. It does not show notes, the assignee, tags, files, or priority.
- File download and statistics require an admin or manager. A stored file path must stay inside `data/uploads`.
- `assignTicket` assigns only an admin or manager.
- Public signup stays off. Only an admin adds a manager, from `/app/staff`. That form has no role field, and the new account is always a manager. The auth hook still forces manager on any other create and strips `role` on update.
- Rate limits stay: login is 8 failures per email and 30 per address per 15 minutes, and a success clears the email key; intake is 10 per address and 40 global per hour; status lookup is 30 per address and 20 per ticket number per 15 minutes.
- Blocked upload types and the 55 MB content-length reject stay.

## Check

`src/lib/flow.test.ts` sets `CRM_DB_PATH` to a temporary file before it opens the database. Do not point those tests at `data/crm.sqlite`.

For a rule change, run `just test`. For a screen, use it: open `/status`, submit a wrong phone and an unknown number, and confirm both responses are `STATUS_MISS`. Then submit a real pair from the seed and confirm the reply text matches the ticket and that a note body is absent. Headless Chromium shows date fields as mm/dd/yyyy. That is the browser locale, not a defect. Demo logins are in the README.
