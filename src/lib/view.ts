import type { Priority, Status } from "./crm";

export type QueueRow = {
  id: string;
  number: number;
  subject: string;
  status: Status;
  priority: Priority;
  customerName: string;
  createdLabel: string;
  overdue: boolean;
};

export type TicketView = {
  id: string;
  number: number;
  subject: string;
  text: string;
  reply: string | null;
  status: Status;
  priority: Priority;
  customerId: string;
  customerName: string;
  company: string | null;
  phone: string;
  email: string;
  assigneeId: string | null;
  assigneeName: string | null;
  createdLabel: string;
  dueLabel: string;
  responseLabel: string | null;
  overdue: boolean;
  files: { id: string; fileName: string; sizeLabel: string }[];
  tags: { name: string; on: boolean }[];
  notes: { id: string; author: string; body: string; time: string }[];
  timeline: { id: string; body: string; time: string }[];
};

export type StaffOption = { id: string; name: string };

export type PaletteIndex = {
  tickets: { id: string; number: number; subject: string; customerName: string }[];
  customers: { id: string; name: string; company: string | null }[];
};

export type Summary = {
  today: number;
  week: number;
  month: number;
  total: number;
  byStatus: Record<Status, number>;
  byPriorityOpen: Record<Priority, number>;
  unassigned: number;
  overdue: number;
  team: { id: string; name: string; open: number }[];
};
