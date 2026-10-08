import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizeEmail } from "./crm";
import { db } from "./db";
import { account, user } from "./db/schema";

export const STAFF_DENIED = "Добавлять сотрудников может администратор.";
export const STAFF_TAKEN = "Эта почта уже занята.";

export function parseStaffForm(nameRaw: string, emailRaw: string, passwordRaw: string) {
  const name = nameRaw.trim();
  if (!name) return { ok: false as const, message: "Укажите имя." };
  if (name.length > 120) return { ok: false as const, message: "Имя длиннее 120 знаков." };
  const email = normalizeEmail(emailRaw);
  if (!z.string().email().max(160).safeParse(email).success) {
    return { ok: false as const, message: "Укажите почту." };
  }
  if (passwordRaw.length < 8) return { ok: false as const, message: "Пароль короче 8 знаков." };
  if (passwordRaw.length > 128) return { ok: false as const, message: "Пароль длиннее 128 знаков." };
  return { ok: true as const, name, email, password: passwordRaw };
}

export function createManager(input: { name: string; email: string; passwordHash: string }) {
  const email = normalizeEmail(input.email);
  const now = new Date();
  const id = crypto.randomUUID();
  try {
    const saved = db.transaction((tx) => {
      const existing = tx.select({ id: user.id }).from(user).where(eq(user.email, email)).get();
      if (existing) return false;
      tx.insert(user)
        .values({
          id,
          name: input.name.trim(),
          email,
          emailVerified: true,
          role: "manager",
          createdAt: now,
          updatedAt: now,
        })
        .run();
      tx.insert(account)
        .values({
          id: crypto.randomUUID(),
          accountId: id,
          providerId: "credential",
          userId: id,
          password: input.passwordHash,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      return true;
    });
    if (!saved) return { ok: false as const, message: STAFF_TAKEN };
  } catch {
    return { ok: false as const, message: STAFF_TAKEN };
  }
  return { ok: true as const, id };
}
