import { format, parseISO } from "date-fns";
import { Project, Tag, Task } from "../types";

function escapeCsv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Експорт задач у CSV для Excel / Numbers. */
export function tasksToCsv(
  tasks: Task[],
  projects: Project[],
  tags: Tag[]
): string {
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const tagMap = new Map(tags.map((t) => [t.id, t.name]));
  const headers = [
    "Назва",
    "Статус",
    "Пріоритет",
    "Проєкт",
    "Початок",
    "Дедлайн",
    "Відкладено до",
    "Мій день",
    "Час (хв)",
    "Очікування",
    "Серія",
    "Теги",
    "Прогрес",
    "Виконано",
  ];
  const rows = tasks.map((t) => [
    t.title,
    t.status,
    t.priority,
    t.projectId ? projectMap.get(t.projectId) ?? "" : "",
    t.startDate ?? "",
    t.dueDate ?? "",
    t.deferUntil ?? "",
    t.isMyDay ? "так" : "",
    t.timeEstimateMinutes != null ? String(t.timeEstimateMinutes) : "",
    t.waitingFor ?? "",
    t.streakCount > 0 ? String(t.streakCount) : "",
    t.tagIds.map((id) => tagMap.get(id) ?? "").join("; "),
    String(t.progress),
    t.completedAt ?? "",
  ]);
  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function icalDate(iso: string): string {
  return format(parseISO(iso), "yyyyMMdd");
}

/** Експорт дедлайнів у iCal для Google Calendar / Apple Calendar. */
export function tasksToIcal(tasks: Task[], projects: Project[]): string {
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const dated = tasks.filter((t) => t.dueDate);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flow//UK",
    "CALSCALE:GREGORIAN",
  ];
  for (const t of dated) {
    const proj = t.projectId ? projectMap.get(t.projectId) : "";
    const summary = proj ? `[${proj}] ${t.title}` : t.title;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${t.id}@flow`,
      `DTSTART;VALUE=DATE:${icalDate(t.dueDate!)}`,
      `DTEND;VALUE=DATE:${icalDate(t.dueDate!)}`,
      `SUMMARY:${summary.replace(/[,;\\]/g, "")}`,
      `STATUS:${t.status === "done" ? "COMPLETED" : "NEEDS-ACTION"}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadFile(
  content: string,
  filename: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
