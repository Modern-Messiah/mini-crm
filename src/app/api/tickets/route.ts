import { createTicket } from "@/lib/intake";
import { clientAddress, consumeLimit, INTAKE_GLOBAL_MAX, INTAKE_IP_MAX, INTAKE_WINDOW_MS } from "@/lib/limits";

export const runtime = "nodejs";

const MAX_BODY = 55 * 1024 * 1024;

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(length) && length > MAX_BODY) {
    return Response.json({ message: "Слишком большой запрос." }, { status: 413 });
  }
  const ip = clientAddress(request.headers);
  const ipOpen = consumeLimit(`intake:ip:${ip}`, INTAKE_IP_MAX, INTAKE_WINDOW_MS);
  const globalOpen = ipOpen && consumeLimit("intake:global", INTAKE_GLOBAL_MAX, INTAKE_WINDOW_MS);
  if (!ipOpen || !globalOpen) {
    return Response.json({ message: "Слишком много заявок. Подождите немного." }, { status: 429 });
  }
  const formData = await request.formData();
  const result = await createTicket(formData);
  if (!result.ok) {
    return Response.json({ message: result.message, field: result.field }, { status: result.status });
  }
  return Response.json(
    {
      id: result.id,
      number: result.number,
      message: "Заявка принята. Ответим в эту же очередь.",
    },
    { status: 201 },
  );
}
