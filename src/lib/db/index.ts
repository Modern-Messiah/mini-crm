import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { ensureSchema } from "./ensure";

const globalForDb = globalThis as unknown as { crmSqlite?: Database.Database };

function open() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new Database(path.join(dir, "crm.sqlite"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  ensureSchema(sqlite);
  return sqlite;
}

export const sqlite = globalForDb.crmSqlite ?? open();
ensureSchema(sqlite);

if (process.env.NODE_ENV !== "production") {
  globalForDb.crmSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
