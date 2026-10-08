import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import * as schema from "./db/schema";

const DEV_SECRET = "mini-crm-dev-secret-0123456789abcdef";
const configuredSecret = process.env.BETTER_AUTH_SECRET?.trim() ?? "";

if (configuredSecret.length < 32 && process.env.NODE_ENV === "production") {
  throw new Error("Задайте BETTER_AUTH_SECRET длиной от 32 символов.");
}

export const authSecret = configuredSecret.length >= 32 ? configuredSecret : DEV_SECRET;
export const authUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

function withoutRole<T extends Record<string, unknown>>(data: T) {
  if (!("role" in data)) return data;
  const rest = { ...data };
  delete rest.role;
  return rest;
}

export const auth = betterAuth({
  secret: authSecret,
  baseURL: authUrl,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "manager",
        input: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...withoutRole(user), role: "manager" } }),
      },
      update: {
        before: async (user) => ({ data: withoutRole(user) }),
      },
    },
  },
  plugins: [nextCookies()],
});
