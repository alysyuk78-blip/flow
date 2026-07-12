import { nanoid } from "nanoid";
import { ProjectSection, Task } from "../types";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  notes: string;
  sections: string[];
  tasks: {
    title: string;
    section?: string;
    priority?: Task["priority"];
    kind?: Task["kind"];
    offsetStart?: number;
    offsetDue?: number;
  }[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "website",
    name: "Запуск сайту",
    description: "Дизайн → верстка → контент → публікація",
    color: "#6366f1",
    notes: "<h2>Мета</h2><p>Запустити лендинг.</p>",
    sections: ["Дизайн", "Розробка", "Запуск"],
    tasks: [
      { title: "Прототип у Figma", section: "Дизайн", priority: "high", offsetStart: 0, offsetDue: 3 },
      { title: "Зверстати сторінки", section: "Розробка", priority: "high", offsetStart: 4, offsetDue: 10 },
      { title: "Написати тексти", section: "Розробка", priority: "medium", offsetStart: 4, offsetDue: 8 },
      { title: "Запуск", section: "Запуск", kind: "milestone", offsetDue: 12 },
      { title: "Опублікувати та перевірити", section: "Запуск", priority: "high", offsetStart: 11, offsetDue: 12 },
    ],
  },
  {
    id: "home",
    name: "Дім і побут",
    description: "Покупки, справи, записи",
    color: "#22c55e",
    notes: "<p>Домашні справи.</p>",
    sections: ["Покупки", "Здоров'я"],
    tasks: [
      { title: "Купити продукти", section: "Покупки", priority: "low", offsetDue: 0 },
      { title: "Записатися до лікаря", section: "Здоров'я", priority: "medium", offsetDue: 3 },
    ],
  },
  {
    id: "empty",
    name: "Порожній проєкт",
    description: "Без готових задач",
    color: "#6366f1",
    notes: "",
    sections: [],
    tasks: [],
  },
];

export function buildFromTemplate(
  template: ProjectTemplate,
  shift: (days: number) => string
): { project: { name: string; color: string; notes: string }; sections: ProjectSection[]; tasks: Omit<Task, "id" | "createdAt" | "order">[] } {
  const projectId = nanoid();
  const sectionMap = new Map<string, string>();
  const sections: ProjectSection[] = template.sections.map((title, i) => {
    const id = nanoid();
    sectionMap.set(title, id);
    return { id, projectId, title, order: i };
  });

  const tasks = template.tasks.map((item) => ({
    kind: item.kind ?? "task",
    title: item.title,
    notes: "",
    projectId,
    sectionId: item.section ? sectionMap.get(item.section) ?? null : null,
    status: "todo" as const,
    priority: item.priority ?? "none",
    tagIds: [] as string[],
    startDate: item.offsetStart != null ? shift(item.offsetStart) : null,
    dueDate: item.offsetDue != null ? shift(item.offsetDue) : null,
    recurrence: "none" as const,
    reminder: false,
    reminderTime: null,
    reminderDaysBefore: 0,
    subtasks: [],
    dependsOn: [],
    progress: 0,
    completedAt: null,
    deferUntil: null,
    isMyDay: false,
    timeEstimateMinutes: null,
    important: false,
    urgent: false,
    waitingFor: null,
    streakCount: 0,
    lastStreakDate: null,
  }));

  return {
    project: { name: template.name, color: template.color, notes: template.notes },
    sections,
    tasks,
  };
}
