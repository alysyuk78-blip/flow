import { nanoid } from "nanoid";
import { Area, Project, ProjectSection, Tag, Task } from "../types";
import { todayISO } from "../lib/dates";
import { addDays, format, parseISO } from "date-fns";
import { CONTEXT_TAG_PRESETS } from "../types";

function shift(days: number): string {
  return format(addDays(parseISO(todayISO()), days), "yyyy-MM-dd");
}

export function makeSeed(): {
  projects: Project[];
  sections: ProjectSection[];
  tasks: Task[];
  tags: Tag[];
  areas: Area[];
} {
  const now = new Date().toISOString();

  const tags: Tag[] = [
    { id: nanoid(), name: "Терміново", color: "#ef4444", kind: "label" },
    { id: nanoid(), name: "Дім", color: "#22c55e", kind: "label" },
    { id: nanoid(), name: "Робота", color: "#6366f1", kind: "label" },
    { id: nanoid(), name: "Ідея", color: "#eab308", kind: "label" },
    ...CONTEXT_TAG_PRESETS.map((p) => ({
      id: nanoid(),
      name: p.name,
      color: p.color,
      kind: "context" as const,
    })),
  ];

  const areas: Area[] = [
    { id: nanoid(), name: "Робота", color: "#6366f1", order: 0 },
    { id: nanoid(), name: "Дім", color: "#22c55e", order: 1 },
  ];

  const pWork: Project = {
    id: nanoid(),
    name: "Запуск сайту",
    color: "#6366f1",
    notes:
      "<h2>Мета</h2><p>Запустити лендинг продукту до кінця місяця.</p>",
    archived: false,
    order: 0,
    createdAt: now,
    areaId: areas[0].id,
  };

  const pHome: Project = {
    id: nanoid(),
    name: "Дім і побут",
    color: "#22c55e",
    notes: "<p>Домашні справи та покупки.</p>",
    archived: false,
    order: 1,
    createdAt: now,
    areaId: areas[1].id,
  };

  const secDesign: ProjectSection = {
    id: nanoid(),
    projectId: pWork.id,
    title: "Дизайн",
    order: 0,
  };
  const secBuild: ProjectSection = {
    id: nanoid(),
    projectId: pWork.id,
    title: "Розробка",
    order: 1,
  };
  const secLaunch: ProjectSection = {
    id: nanoid(),
    projectId: pWork.id,
    title: "Запуск",
    order: 2,
  };

  const t = (partial: Partial<Task> & { title: string }): Task => ({
    id: nanoid(),
    kind: partial.kind ?? "task",
    title: partial.title,
    notes: partial.notes ?? "",
    projectId: partial.projectId ?? null,
    sectionId: partial.sectionId ?? null,
    status: partial.status ?? "todo",
    priority: partial.priority ?? "none",
    tagIds: partial.tagIds ?? [],
    startDate: partial.startDate ?? null,
    dueDate: partial.dueDate ?? null,
    recurrence: partial.recurrence ?? "none",
    reminder: partial.reminder ?? false,
    reminderTime: partial.reminderTime ?? null,
    reminderDaysBefore: partial.reminderDaysBefore ?? 0,
    subtasks: partial.subtasks ?? [],
    dependsOn: partial.dependsOn ?? [],
    progress: partial.progress ?? 0,
    order: partial.order ?? 0,
    createdAt: now,
    completedAt: partial.completedAt ?? null,
    deferUntil: partial.deferUntil ?? null,
    isMyDay: partial.isMyDay ?? false,
    timeEstimateMinutes: partial.timeEstimateMinutes ?? null,
    important: partial.important ?? false,
    urgent: partial.urgent ?? false,
    waitingFor: partial.waitingFor ?? null,
    streakCount: partial.streakCount ?? 0,
    lastStreakDate: partial.lastStreakDate ?? null,
  });

  const design = t({
    title: "Зробити дизайн головної",
    projectId: pWork.id,
    sectionId: secDesign.id,
    status: "inProgress",
    priority: "high",
    tagIds: [tags[2].id],
    startDate: shift(-2),
    dueDate: shift(2),
    progress: 60,
    order: 0,
    subtasks: [
      { id: nanoid(), title: "Прототип у Figma", done: true },
      { id: nanoid(), title: "Кольори і шрифти", done: true },
      { id: nanoid(), title: "Адаптив під мобільний", done: false },
    ],
  });

  const build = t({
    title: "Зверстати лендинг",
    projectId: pWork.id,
    sectionId: secBuild.id,
    status: "todo",
    priority: "high",
    tagIds: [tags[2].id],
    startDate: shift(3),
    dueDate: shift(8),
    order: 1,
    dependsOn: [design.id],
  });

  const content = t({
    title: "Написати тексти",
    projectId: pWork.id,
    sectionId: secBuild.id,
    status: "todo",
    priority: "medium",
    tagIds: [tags[3].id],
    startDate: shift(3),
    dueDate: shift(6),
    order: 2,
  });

  const milestone = t({
    title: "Запуск",
    kind: "milestone",
    projectId: pWork.id,
    sectionId: secLaunch.id,
    dueDate: shift(11),
    order: 3,
  });

  const launch = t({
    title: "Опублікувати та перевірити",
    projectId: pWork.id,
    sectionId: secLaunch.id,
    status: "todo",
    priority: "high",
    startDate: shift(9),
    dueDate: shift(11),
    order: 4,
    dependsOn: [build.id, content.id],
  });

  const tasks: Task[] = [
    design,
    build,
    content,
    milestone,
    launch,
    t({
      title: "Купити продукти",
      projectId: pHome.id,
      priority: "low",
      tagIds: [tags[1].id],
      dueDate: shift(0),
      recurrence: "weekly",
      order: 0,
      subtasks: [
        { id: nanoid(), title: "Овочі", done: false },
        { id: nanoid(), title: "Хліб", done: false },
      ],
    }),
    t({
      title: "Записатися до лікаря",
      projectId: pHome.id,
      priority: "medium",
      dueDate: shift(1),
      reminder: true,
      order: 1,
    }),
    t({
      title: "Переглянути ідеї для відпустки",
      projectId: null,
      tagIds: [tags[3].id],
      order: 0,
    }),
    t({
      title: "Відповісти на листи",
      projectId: null,
      priority: "medium",
      tagIds: [tags[0].id],
      dueDate: shift(0),
      isMyDay: true,
      timeEstimateMinutes: 30,
      order: 1,
    }),
  ];

  return {
    projects: [pWork, pHome],
    sections: [secDesign, secBuild, secLaunch],
    tasks,
    tags,
    areas,
  };
}
