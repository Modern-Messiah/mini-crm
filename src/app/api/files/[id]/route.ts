import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { isStaffRole, safeFileName } from "@/lib/crm";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { STORED_FILE, uploadsDir } from "@/lib/paths";
import { currentSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session || !isStaffRole(session.user.role)) {
    return new Response("Нужен вход.", { status: 401 });
  }
  const { id } = await context.params;
  const row = db.select().from(attachments).where(eq(attachments.id, id)).get();
  if (!row || !STORED_FILE.test(row.storedName)) {
    return new Response("Файл не найден.", { status: 404 });
  }
  const root = path.resolve(uploadsDir());
  const full = path.resolve(root, row.storedName);
  const relative = path.relative(root, full);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return new Response("Файл не найден.", { status: 404 });
  }
  try {
    const bytes = await fs.readFile(full);
    const encoded = encodeURIComponent(safeFileName(row.fileName));
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="file"; filename*=UTF-8''${encoded}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Файл не найден.", { status: 404 });
  }
}
