export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  subtasks: string[];
  priority: "none" | "low" | "medium" | "high";
  notes: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "meeting",
    name: "Зустріч",
    description: "Порядок денний і нотатки",
    title: "Зустріч",
    subtasks: ["Порядок денний", "Підготувати матеріали", "Надіслати підсумок"],
    priority: "medium",
    notes: "<p>Учасники:</p><p>Місце / посилання:</p>",
  },
  {
    id: "weekly",
    name: "Щотижневий звіт",
    description: "Огляд тижня",
    title: "Щотижневий звіт",
    subtasks: ["Що зроблено", "Плани на наступний тиждень", "Блокери"],
    priority: "low",
    notes: "",
  },
  {
    id: "bugfix",
    name: "Виправлення",
    description: "Кроки для багфіксу",
    title: "Виправити: ",
    subtasks: ["Відтворити", "Знайти причину", "Виправити", "Перевірити"],
    priority: "high",
    notes: "",
  },
];
