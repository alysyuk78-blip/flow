import { PRIORITY_ORDER, Project, Task, TaskFilters } from "../types";
import { daysFromToday, isDueToday, isOverdue, todayISO } from "./dates";

/** Чи задача відкладена (ще не час показувати). */
export function isDeferred(task: Task): boolean {
  if (!task.deferUntil) return false;
  return task.deferUntil > todayISO();
}

/** Активна задача: не виконана і не відкладена. */
export function isActiveTask(task: Task): boolean {
  return task.status !== "done" && !isDeferred(task);
}

/** Застосувати фільтри до списку задач. */
export function applyFilters(tasks: Task[], f: TaskFilters): Task[] {
  return tasks.filter((t) => {
    if (f.status !== "any" && t.status !== f.status) return false;
    if (f.priority !== "any" && t.priority !== f.priority) return false;
    if (f.tagId !== "any" && !t.tagIds.includes(f.tagId)) return false;
    return true;
  });
}

/** Журнал: виконані задачі, новіші зверху. */
export function logbookTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === "done" && t.completedAt)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1));
}

/** Задачі з датами для таймлайну/календаря. */
export function datedTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.startDate || t.dueDate);
}

/** Задачі для «Вхідні»: без проєкту, активні. */
export function inboxTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => t.projectId === null && isActiveTask(t) && !t.waitingFor
  );
}

/** «Мій день»: до 5 головних задач. */
export function myDayTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.isMyDay && isActiveTask(t)).sort(byOrder);
}

/** «Очікування»: чекаємо на когось. */
export function waitingTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !!t.waitingFor && isActiveTask(t));
}

/** «Колись»: у проєкті, без дат, активні. */
export function somedayTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) =>
      isActiveTask(t) &&
      t.projectId !== null &&
      !t.dueDate &&
      !t.startDate &&
      !t.waitingFor
  );
}

/** Активні (не архівні) проєкти. */
export function activeProjects(projects: Project[]): Project[] {
  return projects.filter((p) => !p.archived);
}

/** «Сьогодні»: дедлайн сьогодні/прострочено або старт сьогодні. */
export function todayTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) =>
      isActiveTask(t) &&
      !t.waitingFor &&
      (isDueToday(t.dueDate) ||
        isOverdue(t.dueDate) ||
        isDueToday(t.startDate))
  );
}

/** «Найближчі»: майбутні дедлайни на 14 днів. */
export function upcomingTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => {
      if (!isActiveTask(t) || !t.dueDate || t.waitingFor) return false;
      const d = daysFromToday(t.dueDate);
      return d >= 0 && d <= 14;
    })
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
}

/** Задачі конкретного проєкту. */
export function projectTasks(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId);
}

/** Задачі з контекстним тегом. */
export function contextTasks(tasks: Task[], tagId: string): Task[] {
  return tasks.filter(
    (t) => isActiveTask(t) && t.tagIds.includes(tagId)
  );
}

/** Сортування за порядком. */
export function byOrder(a: Task, b: Task): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.createdAt < b.createdAt ? -1 : 1;
}

export function byDueThenPriority(a: Task, b: Task): number {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate)
    return a.dueDate < b.dueDate ? -1 : 1;
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  const pa = PRIORITY_ORDER.indexOf(a.priority);
  const pb = PRIORITY_ORDER.indexOf(b.priority);
  if (pa !== pb) return pa - pb;
  return a.createdAt < b.createdAt ? -1 : 1;
}

export function computedProgress(task: Task): number {
  if (task.status === "done") return 100;
  if (task.subtasks.length > 0) {
    const done = task.subtasks.filter((s) => s.done).length;
    return Math.round((done / task.subtasks.length) * 100);
  }
  return task.progress;
}

/** Дані для щотижневого огляду. */
export function weeklyReviewStats(tasks: Task[], projects: Project[]) {
  const active = activeProjects(projects);
  const inbox = inboxTasks(tasks);
  const overdue = tasks.filter(
    (t) => isActiveTask(t) && isOverdue(t.dueDate)
  );
  const noDate = tasks.filter(
    (t) =>
      isActiveTask(t) &&
      t.projectId &&
      !t.dueDate &&
      !t.startDate
  );
  const staleProjects = active.filter((p) => {
    const pts = tasks.filter(
      (t) => t.projectId === p.id && isActiveTask(t)
    );
    if (!pts.length) return true;
    const recent = pts.some(
      (t) =>
        t.dueDate &&
        daysFromToday(t.dueDate) >= -7 &&
        daysFromToday(t.dueDate) <= 14
    );
    return !recent;
  });
  return {
    inboxCount: inbox.length,
    overdueCount: overdue.length,
    waitingCount: waitingTasks(tasks).length,
    somedayCount: noDate.length,
    staleProjectCount: staleProjects.length,
    completedThisWeek: tasks.filter((t) => {
      if (!t.completedAt) return false;
      const d = daysFromToday(t.completedAt.slice(0, 10));
      return d >= -7 && d <= 0;
    }).length,
  };
}
