import type Database from "better-sqlite3";

const SQL = `
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified integer NOT NULL DEFAULT 0,
  image text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  role text NOT NULL DEFAULT 'manager'
);

CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY NOT NULL,
  expires_at integer NOT NULL,
  token text NOT NULL UNIQUE,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  ip_address text,
  user_agent text,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY NOT NULL,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at integer,
  refresh_token_expires_at integer,
  scope text,
  password text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY NOT NULL,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at integer NOT NULL,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS customer (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  company text,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket (
  id text PRIMARY KEY NOT NULL,
  number integer NOT NULL UNIQUE,
  customer_id text NOT NULL REFERENCES customer(id),
  subject text NOT NULL,
  text text NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  assignee_id text REFERENCES "user"(id) ON DELETE SET NULL,
  due_at integer NOT NULL,
  manager_response_at integer,
  reply text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS tag (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ticket_tag (
  ticket_id text NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
  tag_id text NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, tag_id)
);

CREATE TABLE IF NOT EXISTS note (
  id text PRIMARY KEY NOT NULL,
  ticket_id text NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES "user"(id),
  body text NOT NULL,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id text PRIMARY KEY NOT NULL,
  ticket_id text NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
  actor_id text REFERENCES "user"(id) ON DELETE SET NULL,
  kind text NOT NULL,
  body text NOT NULL,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS attachment (
  id text PRIMARY KEY NOT NULL,
  ticket_id text NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  stored_name text NOT NULL,
  size integer NOT NULL,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limit (
  key text PRIMARY KEY NOT NULL,
  hits integer NOT NULL,
  window_start integer NOT NULL
);

CREATE INDEX IF NOT EXISTS ticket_customer_created ON ticket (customer_id, created_at);
CREATE INDEX IF NOT EXISTS session_user ON session (user_id);
CREATE INDEX IF NOT EXISTS account_user ON account (user_id);
CREATE INDEX IF NOT EXISTS verification_identifier ON verification (identifier);
`;

export function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(SQL);
  const columns = sqlite.prepare("PRAGMA table_info(ticket)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "reply")) {
    sqlite.exec("ALTER TABLE ticket ADD COLUMN reply text");
  }
}
