import Link from "next/link";
import { WidgetForm } from "./widget-form";

export default function WidgetPage() {
  return (
    <main className="widget-page">
      <div className="widget-sheet">
        <h1>Заявка</h1>
        <p className="help">
          Одна заявка в календарные сутки на телефон или почту. Файлы — до пяти, каждый не больше 10 МБ. Срок ответа
          считается от обычного приоритета: трое суток. Уже есть номер —{" "}
          <Link href="/status">статус и ответ</Link>.
        </p>
        <WidgetForm />
      </div>
    </main>
  );
}
