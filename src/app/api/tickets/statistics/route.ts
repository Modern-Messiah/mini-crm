import { isStaffRole } from "@/lib/crm";
import { summary } from "@/lib/queries";
import { currentSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await currentSession();
  if (!session || !isStaffRole(session.user.role)) {
    return Response.json({ message: "Нужен вход." }, { status: 401 });
  }
  const counts = summary();
  return Response.json({
    day: counts.today,
    week: counts.week,
    month: counts.month,
    total: counts.total,
    byStatus: counts.byStatus,
    unassigned: counts.unassigned,
    overdue: counts.overdue,
  });
}
