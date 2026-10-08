import { Shell } from "@/components/shell";
import { roleLabel } from "@/lib/format";
import { searchIndex } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <Shell
      user={{ name: user.name, email: user.email, role: roleLabel(user.role), admin: user.role === "admin" }}
      index={searchIndex()}
    >
      {children}
    </Shell>
  );
}
