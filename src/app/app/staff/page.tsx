import { redirect } from "next/navigation";
import { StaffForm } from "@/components/staff-form";
import { countWord, roleLabel } from "@/lib/format";
import { listPeople } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/app");
  const people = listPeople();
  return (
    <div className="workspace single">
      <div className="page sheet">
        <header className="mast">
          <p className="kicker">Сотрудники</p>
          <h1>
            <span className="mono mast-num">{people.length}</span>
            <span className="mast-word">{countWord(people.length, "сотрудник", "сотрудника", "сотрудников")}</span>
          </h1>
        </header>
        <p className="help">Новый человек входит как менеджер. Роль администратора отсюда не ставится.</p>
        <div className="ledger-scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Почта</th>
                <th>Роль</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td>{person.name}</td>
                  <td>{person.email}</td>
                  <td>{roleLabel(person.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Новый менеджер</h2>
        <StaffForm />
      </div>
    </div>
  );
}
