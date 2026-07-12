import { nanoid } from "nanoid";
import { Task } from "../types";

/** Простий імпорт подій з .ics у задачі Flow. */
export function parseIcalToTasks(content: string): Partial<Task>[] {
  const events: Partial<Task>[] = [];
  const blocks = content.split("BEGIN:VEVENT");
  for (const block of blocks.slice(1)) {
    const summary = block.match(/SUMMARY:(.+)/)?.[1]?.trim();
    if (!summary) continue;
    const dtStart = block.match(/DTSTART[^:]*:(\d{8})/)?.[1];
    let dueDate: string | null = null;
    if (dtStart) {
      dueDate = `${dtStart.slice(0, 4)}-${dtStart.slice(4, 6)}-${dtStart.slice(6, 8)}`;
    }
    events.push({
      id: nanoid(),
      title: summary.replace(/\\n/g, " ").replace(/\\,/g, ","),
      dueDate,
      status: "todo",
      projectId: null,
    });
  }
  return events;
}
