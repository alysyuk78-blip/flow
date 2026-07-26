// Спільна модель даних для всіх видів (Список / Дошка / Таймлайн / Нотатки).

export type Status = "todo" | "inProgress" | "done";
export type Priority = "none" | "low" | "medium" | "high";
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type TaskKind = "task" | "milestone";
export type TimelineZoom = "week" | "month" | "quarter";
export type TagKind = "label" | "context";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";
export type LeadSource =
  | "facebook"
  | "instagram"
  | "olx"
  | "google"
  | "osbb"
  | "installer"
  | "developer"
  | "architect"
  | "print"
  | "referral"
  | "other";
export type LeadKind =
  | "b2c"
  | "osbb"
  | "installer"
  | "developer"
  | "architect"
  | "dropshipper"
  | "business";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  kind: TagKind;
}

/** PARA: довгострокові сфери (Робота, Здоров'я, Сім'я…). */
export interface Area {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface ProjectSection {
  id: string;
  projectId: string;
  title: string;
  order: number;
}

export interface Task {
  id: string;
  kind: TaskKind;
  title: string;
  notes: string;
  projectId: string | null;
  sectionId: string | null;
  status: Status;
  priority: Priority;
  tagIds: string[];
  startDate: string | null;
  dueDate: string | null;
  /** Показувати задачу лише з цієї дати (відкладення). */
  deferUntil: string | null;
  /** Головні задачі дня (макс. MY_DAY_LIMIT). */
  isMyDay: boolean;
  /** Оцінка часу в хвилинах. */
  timeEstimateMinutes: number | null;
  /** Матриця Ейзенхауера — важливість. */
  important: boolean;
  /** Матриця Ейзенхауера — терміновість. */
  urgent: boolean;
  /** Очікування відповіді / дії від когось. */
  waitingFor: string | null;
  /** Серія виконань для повторюваних задач. */
  streakCount: number;
  lastStreakDate: string | null;
  recurrence: Recurrence;
  reminder: boolean;
  reminderTime: string | null;
  reminderDaysBefore: number;
  subtasks: Subtask[];
  dependsOn: string[];
  progress: number;
  order: number;
  createdAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  notes: string;
  archived: boolean;
  order: number;
  createdAt: string;
  areaId: string | null;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  telegram: string;
  email: string;
  kind: LeadKind;
  source: LeadSource;
  partnerCode: string;
  status: LeadStatus;
  nextAction: string;
  nextActionDate: string | null;
  followUpTaskId: string | null;
  estimatedValue: number | null;
  model: string;
  quantity: number | null;
  city: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectViewKind = "list" | "board" | "timeline" | "notes" | "calendar";

export type SmartList =
  | "inbox"
  | "myDay"
  | "today"
  | "overdue"
  | "upcoming"
  | "all"
  | "someday"
  | "waiting"
  | "logbook"
  | "timeline"
  | "calendar"
  | "stats"
  | "weeklyReview"
  | "matrix"
  | "leads";

export type Selection =
  | { kind: "smart"; list: SmartList }
  | { kind: "project"; projectId: string };

export interface TaskFilters {
  status: Status | "any";
  priority: Priority | "any";
  tagId: string | "any";
}

export interface SearchFilters {
  status: Status | "any";
  priority: Priority | "any";
  tagId: string | "any";
  projectId: string | "any";
}

export interface UndoSnapshot {
  tasks: Task[];
  projects?: Project[];
  sections?: ProjectSection[];
  areas?: Area[];
}

export const MY_DAY_LIMIT = 5;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новий",
  contacted: "Контакт встановлено",
  qualified: "Кваліфікований",
  proposal: "Пропозиція надіслана",
  negotiation: "Переговори",
  won: "Замовлення",
  lost: "Втрачений",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  olx: "OLX",
  google: "Google",
  osbb: "ОСББ / керуюча компанія",
  installer: "Монтажник",
  developer: "Забудовник",
  architect: "Архітектор / дизайнер",
  print: "Друковане оголошення",
  referral: "Рекомендація",
  other: "Інше",
};

export const LEAD_KIND_LABELS: Record<LeadKind, string> = {
  b2c: "Приватний клієнт",
  osbb: "ОСББ / керуюча компанія",
  installer: "Монтажник",
  developer: "Забудовник",
  architect: "Архітектор / дизайнер",
  dropshipper: "Дропшипер",
  business: "Інший бізнес",
};

export const CONTEXT_TAG_PRESETS: { name: string; color: string }[] = [
  { name: "@дім", color: "#22c55e" },
  { name: "@офіс", color: "#6366f1" },
  { name: "@телефон", color: "#f97316" },
  { name: "@комп'ютер", color: "#06b6d4" },
  { name: "@дорога", color: "#a855f7" },
];

export const STATUS_LABELS: Record<Status, string> = {
  todo: "До виконання",
  inProgress: "В роботі",
  done: "Готово",
};

export const STATUS_ORDER: Status[] = ["todo", "inProgress", "done"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  none: "Без пріоритету",
  low: "Низький",
  medium: "Середній",
  high: "Високий",
};

export const PRIORITY_ORDER: Priority[] = ["high", "medium", "low", "none"];

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "Без повтору",
  daily: "Щодня",
  weekly: "Щотижня",
  monthly: "Щомісяця",
  yearly: "Щороку",
};

export const TIMELINE_ZOOM_LABELS: Record<TimelineZoom, string> = {
  week: "Тиждень",
  month: "Місяць",
  quarter: "Квартал",
};

export const DEFAULT_FILTERS: TaskFilters = {
  status: "any",
  priority: "any",
  tagId: "any",
};

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  status: "any",
  priority: "any",
  tagId: "any",
  projectId: "any",
};
