import { Task } from "../types";
import { daysFromToday, isOverdue } from "./dates";

export type Quadrant = "do" | "schedule" | "delegate" | "eliminate";

export const QUADRANT_LABELS: Record<
  Quadrant,
  { title: string; hint: string; color: string }
> = {
  do: {
    title: "Зробити зараз",
    hint: "Важливо + терміново",
    color: "#ef4444",
  },
  schedule: {
    title: "Запланувати",
    hint: "Важливо, не терміново",
    color: "#6366f1",
  },
  delegate: {
    title: "Делегувати",
    hint: "Терміново, не важливо",
    color: "#f97316",
  },
  eliminate: {
    title: "Відкласти / прибрати",
    hint: "Не важливо + не терміново",
    color: "#9ca3af",
  },
};

/** Чи задача термінова (явно або за дедлайном/пріоритетом). */
export function isTaskUrgent(task: Task): boolean {
  if (task.urgent) return true;
  if (task.priority === "high") return true;
  if (isOverdue(task.dueDate)) return true;
  if (task.dueDate) {
    const d = daysFromToday(task.dueDate);
    if (d >= 0 && d <= 2) return true;
  }
  return false;
}

/** Чи задача важлива (явно або за пріоритетом / «Мій день»). */
export function isTaskImportant(task: Task): boolean {
  if (task.important) return true;
  if (task.isMyDay) return true;
  if (task.priority === "high" || task.priority === "medium") return true;
  return false;
}

export function taskQuadrant(task: Task): Quadrant {
  const urgent = isTaskUrgent(task);
  const important = isTaskImportant(task);
  if (urgent && important) return "do";
  if (!urgent && important) return "schedule";
  if (urgent && !important) return "delegate";
  return "eliminate";
}
