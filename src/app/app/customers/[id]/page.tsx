import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { STATUS_CLASS, STATUS_LABEL } from "@/lib/format";
import { loadCustomer } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const customer = loadCustomer(id);
  if (!customer) notFound();
  return (
    <div className="workspace single">
      <div className="page sheet">
        <header className="mast">
          <p className="kicker">Клиент</p>
          <h1>{customer.name}</h1>
        </header>
        <CustomerForm customer={customer} />
        <h2>Заявки</h2>
        {customer.history.length === 0 ? <p className="empty">Заявок нет</p> : null}
        {customer.history.length > 0 ? (
          <div className="ledger-scroll">
            <table className="ledger">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Тема</th>
                  <th>Когда</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {customer.history.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="mono">{ticket.number}</td>
                    <td>
                      <Link href={`/app?id=${ticket.id}`}>{ticket.subject}</Link>
                    </td>
                    <td className="mono">{ticket.createdLabel}</td>
                    <td className={STATUS_CLASS[ticket.status]}>{STATUS_LABEL[ticket.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
