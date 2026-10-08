import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { isStaffRole } from "./crm";

export async function currentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await currentSession();
  if (!session) redirect("/login");
  if (!isStaffRole(session.user.role)) redirect("/login");
  return session.user;
}
