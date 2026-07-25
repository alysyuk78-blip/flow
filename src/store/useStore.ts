import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { addDays, format, parseISO } from "date-fns";
import {
  Area,
  Lead,
  Project,
  ProjectSection,
  Selection,
  Subtask,
  Tag,
  TagKind,
  Task,
  Status,
  TaskFilters,
  SearchFilters,
  TimelineZoom,
  UndoSnapshot,
  DEFAULT_FILTERS,
  DEFAULT_SEARCH_FILTERS,
  CONTEXT_TAG_PRESETS,
  MY_DAY_LIMIT,
} from "../types";
import { parseTaskInput } from "../lib/parseTaskInput";
import { myDayTasks } from "../lib/filters";
import { makeSeed } from "./seed";
import { nextOccurrence } from "../lib/recurrence";
import {
  PROJECT_TEMPLATES,
  buildFromTemplate,
} from "./templates";
import { TASK_TEMPLATES } from "./taskTemplates";
import { todayISO } from "../lib/dates";
import { wouldCreateCycle } from "../lib/dependencies";
import { AVALON_PLAN_TEMPLATE } from "./avalonPlan";

const PERSIST_KEY = "flow-store-v2";
const RECOVERY_NOTICE_KEY = "flow-storage-recovered";

function quarantineCorruptStore(): void {
  if (typeof window === "undefined") return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: unknown };
    if (!parsed || typeof parsed !== "object" || !parsed.state) {
      throw new Error("Invalid persisted state");
    }
    const state = parsed.state as Record<string, unknown>;
    if (
      !Array.isArray(state.projects) ||
      !Array.isArray(state.tasks) ||
      !Array.isArray(state.tags)
    ) {
      throw new Error("Invalid persisted collections");
    }
  } catch {
    if (!raw) return;
    try {
      localStorage.setItem(`${PERSIST_KEY}-corrupt-${Date.now()}`, raw);
    } catch {
      // The original entry still needs to be removed so the app can start.
    }
    try {
      localStorage.removeItem(PERSIST_KEY);
      sessionStorage.setItem(RECOVERY_NOTICE_KEY, "1");
    } catch {
      // Storage may be unavailable in strict privacy modes.
    }
  }
}

quarantineCorruptStore();

function shift(days: number): string {
  return format(addDays(parseISO(todayISO()), days), "yyyy-MM-dd");
}

/** Доповнює старі задачі з localStorage новими полями. */
function normalizeTask(raw: Task & Record<string, unknown>): Task {
  return {
    ...raw,
    kind: (raw.kind as Task["kind"]) ?? "task",
    sectionId: raw.sectionId ?? null,
    recurrence: raw.recurrence ?? "none",
    reminder: raw.reminder ?? false,
    reminderTime: (raw.reminderTime as string | null) ?? null,
    reminderDaysBefore: (raw.reminderDaysBefore as number) ?? 0,
    subtasks: raw.subtasks ?? [],
    dependsOn: raw.dependsOn ?? [],
    tagIds: raw.tagIds ?? [],
    deferUntil: (raw.deferUntil as string | null) ?? null,
    isMyDay: raw.isMyDay ?? false,
    timeEstimateMinutes: (raw.timeEstimateMinutes as number | null) ?? null,
    important: raw.important ?? false,
    urgent: raw.urgent ?? false,
    waitingFor: (raw.waitingFor as string | null) ?? null,
    streakCount: (raw.streakCount as number) ?? 0,
    lastStreakDate: (raw.lastStreakDate as string | null) ?? null,
  };
}

function normalizeTag(raw: Tag & Record<string, unknown>): Tag {
  return {
    ...raw,
    kind: (raw.kind as TagKind) ?? "label",
  };
}

function normalizeProject(raw: Project & Record<string, unknown>): Project {
  return {
    ...raw,
    areaId: (raw.areaId as string | null) ?? null,
  };
}

function normalizeLead(raw: Lead & Record<string, unknown>): Lead {
  const now = new Date().toISOString();
  return {
    id: raw.id ?? nanoid(),
    name: raw.name ?? "",
    company: raw.company ?? "",
    phone: raw.phone ?? "",
    telegram: raw.telegram ?? "",
    email: raw.email ?? "",
    kind: raw.kind ?? "b2c",
    source: raw.source ?? "other",
    partnerCode: raw.partnerCode ?? "",
    status: raw.status ?? "new",
    nextAction: raw.nextAction ?? "",
    nextActionDate: raw.nextActionDate ?? null,
    followUpTaskId: raw.followUpTaskId ?? null,
    estimatedValue: raw.estimatedValue ?? null,
    model: raw.model ?? "",
    quantity: raw.quantity ?? null,
    city: raw.city ?? "",
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
  };
}

function plainTextToHtml(value: string): string {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

type AvalonPlanImportResult = {
  imported: boolean;
  projectId: string;
  taskCount: number;
};

function updateStreakOnComplete(task: Task): Partial<Task> {
  if (task.recurrence === "none") return {};
  const today = todayISO();
  if (task.lastStreakDate === today) return {};
  return {
    streakCount: task.streakCount + 1,
    lastStreakDate: today,
  };
}

interface State {
  projects: Project[];
  sections: ProjectSection[];
  tasks: Task[];
  tags: Tag[];
  areas: Area[];
  leads: Lead[];

  selection: Selection;
  selectedTaskId: string | null;
  theme: "light" | "dark" | "system";
  searchQuery: string;
  searchFilters: SearchFilters;
  helpOpen: boolean;
  filters: TaskFilters;
  timelineZoom: TimelineZoom;
  quickAddOpen: boolean;

  sidebarOpen: boolean;
  showArchivedProjects: boolean;
  isSelectionMode: boolean;
  selectedIds: string[];
  undo: UndoSnapshot | null;
  focusTaskId: string | null;
  activeContextTagId: string | null;

  select: (selection: Selection) => void;
  openTask: (id: string | null) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setSearchQuery: (q: string) => void;
  setSearchFilters: (f: Partial<SearchFilters>) => void;
  clearSearchFilters: () => void;
  setHelpOpen: (open: boolean) => void;
  setFilters: (f: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setTimelineZoom: (z: TimelineZoom) => void;
  setQuickAddOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setShowArchivedProjects: (show: boolean) => void;
  setSelectionMode: (enabled: boolean) => void;
  setFocusTaskId: (id: string | null) => void;
  setActiveContextTagId: (id: string | null) => void;

  toggleTaskSelected: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  bulkComplete: () => void;
  bulkDelete: () => void;
  bulkSetTag: (tagId: string) => void;
  bulkMoveProject: (projectId: string | null) => void;

  restoreUndo: () => void;
  dismissUndo: () => void;

  addTask: (partial: Partial<Task> & { title: string }) => string;
  addTaskFromText: (
    text: string,
    partial?: Partial<Task>
  ) => string;
  addTaskFromTemplate: (
    templateId: string,
    partial?: Partial<Task>
  ) => string;
  updateTask: (id: string, patch: Partial<Task>) => boolean;
  deleteTask: (id: string) => void;
  toggleDone: (id: string) => void;
  setStatus: (id: string, status: Status) => void;
  reorderTasks: (ids: string[]) => void;
  toggleMyDay: (id: string) => boolean;
  deferTask: (id: string, days: number) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  updateSubtask: (taskId: string, subId: string, title: string) => void;
  deleteSubtask: (taskId: string, subId: string) => void;

  addProject: (name: string, areaId?: string | null) => string;
  addProjectFromTemplate: (templateId: string) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  unarchiveProject: (id: string) => void;

  addArea: (name: string) => string;
  updateArea: (id: string, patch: Partial<Area>) => void;
  deleteArea: (id: string) => void;

  addSection: (projectId: string, title: string) => string;
  updateSection: (id: string, title: string) => void;
  deleteSection: (id: string) => void;
  reorderSections: (projectId: string, ids: string[]) => void;
  addMilestone: (projectId: string, title: string, dueDate: string) => string;

  addTag: (name: string, color: string, kind?: TagKind) => string;
  ensureContextTags: () => void;
  deleteTag: (id: string) => void;

  addLead: (partial: Partial<Lead> & { name: string }) => string;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  createLeadFollowUpTask: (id: string) => string | null;
  importAvalonPlan: () => AvalonPlanImportResult;

  resetAll: () => void;
  importData: (data: {
    projects: Project[];
    sections?: ProjectSection[];
    tasks: Task[];
    tags: Tag[];
    areas?: Area[];
    leads?: Lead[];
  }) => void;
  importIcalTasks: (tasks: Partial<Task>[]) => void;
}

const seed = makeSeed();

function nextOrder(tasks: Task[], projectId: string | null): number {
  const scoped = tasks.filter((t) => t.projectId === projectId);
  return scoped.length ? Math.max(...scoped.map((t) => t.order)) + 1 : 0;
}

function handleRecurrence(tasks: Task[], id: string): Task[] {
  const src = tasks.find((t) => t.id === id);
  if (!src || src.recurrence === "none" || src.status !== "done") return tasks;

  const base = src.dueDate ?? src.startDate ?? todayISO();
  const nextDue = nextOccurrence(base, src.recurrence);
  if (!nextDue) return tasks;

  const now = new Date().toISOString();
  const clone: Task = {
    ...src,
    id: nanoid(),
    status: "todo",
    progress: 0,
    completedAt: null,
    dueDate: nextDue,
    startDate: src.startDate ? nextOccurrence(src.startDate, src.recurrence) : null,
    subtasks: src.subtasks.map((s) => ({ ...s, id: nanoid(), done: false })),
    createdAt: now,
    order: nextOrder(tasks, src.projectId),
  };
  return [...tasks, clone];
}

function removeTasksFromState(
  tasks: Task[],
  ids: Set<string>
): Task[] {
  return tasks
    .filter((t) => !ids.has(t.id))
    .map((t) =>
      t.dependsOn.some((d) => ids.has(d))
        ? { ...t, dependsOn: t.dependsOn.filter((d) => !ids.has(d)) }
        : t
    );
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      projects: seed.projects,
      sections: seed.sections,
      tasks: seed.tasks,
      tags: seed.tags,
      areas: seed.areas ?? [],
      leads: [],

      selection: { kind: "smart", list: "today" },
      selectedTaskId: null,
      theme: "system",
      searchQuery: "",
      searchFilters: { ...DEFAULT_SEARCH_FILTERS },
      helpOpen: false,
      filters: { ...DEFAULT_FILTERS },
      timelineZoom: "month",
      quickAddOpen: false,

      sidebarOpen: false,
      showArchivedProjects: false,
      isSelectionMode: false,
      selectedIds: [],
      undo: null,
      focusTaskId: null,
      activeContextTagId: null,

      select: (selection) =>
        set({
          selection,
          selectedTaskId: null,
          searchQuery: "",
          selectedIds: [],
          isSelectionMode: false,
          sidebarOpen: false,
        }),
      openTask: (id) => set({ selectedTaskId: id }),
      setTheme: (theme) => set({ theme }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSearchFilters: (f) =>
        set((s) => ({ searchFilters: { ...s.searchFilters, ...f } })),
      clearSearchFilters: () =>
        set({ searchFilters: { ...DEFAULT_SEARCH_FILTERS } }),
      setHelpOpen: (open) => set({ helpOpen: open }),
      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      clearFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
      setTimelineZoom: (z) => set({ timelineZoom: z }),
      setQuickAddOpen: (open) => set({ quickAddOpen: open }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setShowArchivedProjects: (show) => set({ showArchivedProjects: show }),
      setSelectionMode: (enabled) =>
        set({ isSelectionMode: enabled, selectedIds: enabled ? get().selectedIds : [] }),
      setFocusTaskId: (id) => set({ focusTaskId: id }),
      setActiveContextTagId: (id) => set({ activeContextTagId: id }),

      toggleTaskSelected: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        })),
      setSelectedIds: (ids) => set({ selectedIds: ids }),
      clearSelection: () => set({ selectedIds: [], isSelectionMode: false }),

      bulkComplete: () =>
        set((s) => {
          const ids = new Set(s.selectedIds);
          let tasks = s.tasks.map((t) => {
            if (!ids.has(t.id)) return t;
            return {
              ...t,
              status: "done" as Status,
              progress: 100,
              completedAt: new Date().toISOString(),
            };
          });
          for (const id of s.selectedIds) {
            tasks = handleRecurrence(tasks, id);
          }
          return { tasks, selectedIds: [], isSelectionMode: false };
        }),

      bulkDelete: () => {
        const { selectedIds, tasks } = get();
        if (!selectedIds.length) return;
        const removed = tasks.filter((t) => selectedIds.includes(t.id));
        const idSet = new Set(selectedIds);
        set({
          undo: { tasks: removed },
          tasks: removeTasksFromState(tasks, idSet),
          selectedIds: [],
          isSelectionMode: false,
          selectedTaskId: selectedIds.includes(get().selectedTaskId ?? "")
            ? null
            : get().selectedTaskId,
        });
      },

      bulkSetTag: (tagId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            s.selectedIds.includes(t.id) && !t.tagIds.includes(tagId)
              ? { ...t, tagIds: [...t.tagIds, tagId] }
              : t
          ),
        })),

      bulkMoveProject: (projectId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            s.selectedIds.includes(t.id)
              ? { ...t, projectId, sectionId: null }
              : t
          ),
        })),

      restoreUndo: () =>
        set((s) => {
          if (!s.undo) return s;
          const restoredTaskMap = new Map(s.undo.tasks.map((t) => [t.id, t]));
          const mergedTasks = s.tasks.map((t) => {
            const snap = restoredTaskMap.get(t.id);
            return snap
              ? {
                  ...t,
                  projectId: snap.projectId,
                  sectionId: snap.sectionId,
                }
              : t;
          });
          const existingIds = new Set(s.tasks.map((t) => t.id));
          const addedTasks = s.undo.tasks.filter((t) => !existingIds.has(t.id));
          const restoredProjects = s.undo.projects
            ? [...s.projects, ...s.undo.projects]
            : s.projects;
          const restoredSections = s.undo.sections
            ? [...s.sections, ...s.undo.sections]
            : s.sections;
          const restoredAreas = s.undo.areas
            ? [...s.areas, ...s.undo.areas]
            : s.areas;
          return {
            tasks: [...mergedTasks, ...addedTasks],
            projects: restoredProjects,
            sections: restoredSections,
            areas: restoredAreas,
            undo: null,
          };
        }),

      dismissUndo: () => set({ undo: null }),

      addTask: (partial) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const projectId = partial.projectId ?? null;
        const status = partial.status ?? "todo";
        const task: Task = {
          id,
          kind: partial.kind ?? "task",
          title: partial.title,
          notes: partial.notes ?? "",
          projectId,
          sectionId: partial.sectionId ?? null,
          status,
          priority: partial.priority ?? "none",
          tagIds: partial.tagIds ?? [],
          startDate: partial.startDate ?? null,
          dueDate: partial.dueDate ?? null,
          deferUntil: partial.deferUntil ?? null,
          isMyDay: partial.isMyDay ?? false,
          timeEstimateMinutes: partial.timeEstimateMinutes ?? null,
          important: partial.important ?? false,
          urgent: partial.urgent ?? false,
          waitingFor: partial.waitingFor ?? null,
          streakCount: partial.streakCount ?? 0,
          lastStreakDate: partial.lastStreakDate ?? null,
          recurrence: partial.recurrence ?? "none",
          reminder: partial.reminder ?? false,
          reminderTime: partial.reminderTime ?? null,
          reminderDaysBefore: partial.reminderDaysBefore ?? 0,
          subtasks: partial.subtasks ?? [],
          dependsOn: partial.dependsOn ?? [],
          progress: status === "done" ? 100 : partial.progress ?? 0,
          order: nextOrder(get().tasks, projectId),
          createdAt: now,
          completedAt: status === "done" ? now : null,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return id;
      },

      addTaskFromText: (text, partial) => {
        const parsed = parseTaskInput(text);
        if (!parsed.title) return get().addTask({ title: text, ...partial });

        const state = get();
        const tagIds: string[] = [];

        function resolveTag(name: string, kind: TagKind, color?: string): string {
          const lower = name.toLowerCase();
          const existing = state.tags.find(
            (t) => t.name.toLowerCase() === lower
          );
          if (existing) return existing.id;
          const preset = CONTEXT_TAG_PRESETS.find(
            (p) => p.name.toLowerCase() === lower
          );
          return get().addTag(
            name.startsWith("@") ? name : kind === "context" ? `@${name}` : name,
            color ?? preset?.color ?? "#6366f1",
            kind
          );
        }

        for (const n of parsed.tagNames) {
          tagIds.push(resolveTag(n, "label"));
        }
        for (const n of parsed.contextNames) {
          tagIds.push(resolveTag(n, "context"));
        }

        if (parsed.isMyDay && myDayTasks(state.tasks).length >= MY_DAY_LIMIT) {
          parsed.isMyDay = false;
        }

        return get().addTask({
          title: parsed.title,
          dueDate: parsed.dueDate,
          deferUntil: parsed.deferUntil,
          priority: parsed.priority,
          tagIds,
          timeEstimateMinutes: parsed.timeEstimateMinutes,
          important: parsed.important,
          urgent: parsed.urgent,
          waitingFor: parsed.waitingFor,
          isMyDay: parsed.isMyDay,
          ...partial,
        });
      },

      addTaskFromTemplate: (templateId, partial) => {
        const tpl = TASK_TEMPLATES.find((t) => t.id === templateId);
        if (!tpl) return get().addTask({ title: "Нова задача", ...partial });
        return get().addTask({
          title: tpl.title,
          notes: tpl.notes,
          priority: tpl.priority,
          subtasks: tpl.subtasks.map((title) => ({
            id: nanoid(),
            title,
            done: false,
          })),
          ...partial,
        });
      },

      updateTask: (id, patch) => {
        const tasks = get().tasks;
        if (patch.dependsOn) {
          for (const depId of patch.dependsOn) {
            if (wouldCreateCycle(tasks, id, depId)) return false;
          }
        }
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
        return true;
      },

      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const idSet = new Set([id]);
        set((s) => ({
          undo: { tasks: [task] },
          tasks: removeTasksFromState(s.tasks, idSet),
          selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
          selectedIds: s.selectedIds.filter((x) => x !== id),
        }));
      },

      toggleDone: (id) =>
        set((s) => {
          let tasks = s.tasks.map((t) => {
            if (t.id !== id) return t;
            const done = t.status !== "done";
            const streak = done ? updateStreakOnComplete(t) : {};
            return {
              ...t,
              status: done ? ("done" as Status) : ("todo" as Status),
              progress: done ? 100 : 0,
              completedAt: done ? new Date().toISOString() : null,
              isMyDay: done ? false : t.isMyDay,
              ...streak,
            };
          });
          tasks = handleRecurrence(tasks, id);
          return { tasks };
        }),

      setStatus: (id, status) =>
        set((s) => {
          let tasks = s.tasks.map((t) => {
            if (t.id !== id) return t;
            const leavingDone = t.status === "done" && status !== "done";
            const becomingDone = status === "done";
            const streak = becomingDone ? updateStreakOnComplete(t) : {};
            return {
              ...t,
              status,
              progress: status === "done" ? 100 : leavingDone ? 0 : t.progress,
              completedAt: status === "done" ? new Date().toISOString() : null,
              isMyDay: becomingDone ? false : t.isMyDay,
              ...streak,
            };
          });
          if (status === "done") tasks = handleRecurrence(tasks, id);
          return { tasks };
        }),

      reorderTasks: (ids) =>
        set((s) => {
          if (!ids.length) return s;
          const idSet = new Set(ids);
          const base = Math.min(
            ...s.tasks.filter((t) => idSet.has(t.id)).map((t) => t.order)
          );
          return {
            tasks: s.tasks.map((t) => {
              const idx = ids.indexOf(t.id);
              return idx === -1 ? t : { ...t, order: base + idx };
            }),
          };
        }),

      toggleMyDay: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return false;
        if (!task.isMyDay && myDayTasks(get().tasks).length >= MY_DAY_LIMIT) {
          return false;
        }
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, isMyDay: !t.isMyDay } : t
          ),
        }));
        return true;
      },

      deferTask: (id, days) => {
        const until = format(
          addDays(parseISO(todayISO()), days),
          "yyyy-MM-dd"
        );
        get().updateTask(id, { deferUntil: until });
      },

      addSubtask: (taskId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [
                    ...t.subtasks,
                    { id: nanoid(), title, done: false } as Subtask,
                  ],
                }
              : t
          ),
        })),

      toggleSubtask: (taskId, subId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((sub) =>
                    sub.id === subId ? { ...sub, done: !sub.done } : sub
                  ),
                }
              : t
          ),
        })),

      updateSubtask: (taskId, subId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((sub) =>
                    sub.id === subId ? { ...sub, title } : sub
                  ),
                }
              : t
          ),
        })),

      deleteSubtask: (taskId, subId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter((sub) => sub.id !== subId) }
              : t
          ),
        })),

      addProject: (name, areaId = null) => {
        const id = nanoid();
        const project: Project = {
          id,
          name,
          color: "#6366f1",
          notes: "",
          archived: false,
          order: get().projects.length,
          createdAt: new Date().toISOString(),
          areaId,
        };
        set((s) => ({
          projects: [...s.projects, project],
          selection: { kind: "project", projectId: id },
        }));
        return id;
      },

      addProjectFromTemplate: (templateId) => {
        const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return get().addProject("Новий проєкт");
        const built = buildFromTemplate(template, shift);
        const projectId = nanoid();
        const now = new Date().toISOString();
        const project: Project = {
          id: projectId,
          name: built.project.name,
          color: built.project.color,
          notes: built.project.notes,
          archived: false,
          order: get().projects.length,
          createdAt: now,
          areaId: null,
        };
        const sections = built.sections.map((s) => ({
          ...s,
          projectId,
        }));
        const sectionIdMap = new Map(
          built.sections.map((s, i) => [s.id, sections[i].id])
        );
        const tasks: Task[] = built.tasks.map((t, i) => ({
          ...normalizeTask(t as Task & Record<string, unknown>),
          id: nanoid(),
          projectId,
          sectionId: t.sectionId ? sectionIdMap.get(t.sectionId) ?? null : null,
          order: i,
          createdAt: now,
        }));
        set((s) => ({
          projects: [...s.projects, project],
          sections: [...s.sections, ...sections],
          tasks: [...s.tasks, ...tasks],
          selection: { kind: "project", projectId },
        }));
        return projectId;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),

      deleteProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        const projectSections = get().sections.filter((s) => s.projectId === id);
        const affectedTasks = get().tasks.filter((t) => t.projectId === id);
        if (!project) return;
        set((s) => ({
          undo: {
            tasks: affectedTasks,
            projects: [project],
            sections: projectSections,
          },
          projects: s.projects.filter((p) => p.id !== id),
          sections: s.sections.filter((sec) => sec.projectId !== id),
          tasks: s.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: null, sectionId: null } : t
          ),
          selection:
            s.selection.kind === "project" && s.selection.projectId === id
              ? { kind: "smart", list: "today" }
              : s.selection,
        }));
      },

      archiveProject: (id) => get().updateProject(id, { archived: true }),
      unarchiveProject: (id) => get().updateProject(id, { archived: false }),

      addArea: (name) => {
        const id = nanoid();
        const area: Area = {
          id,
          name,
          color: "#6366f1",
          order: get().areas.length,
        };
        set((s) => ({ areas: [...s.areas, area] }));
        return id;
      },

      updateArea: (id, patch) =>
        set((s) => ({
          areas: s.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      deleteArea: (id) =>
        set((s) => ({
          areas: s.areas.filter((a) => a.id !== id),
          projects: s.projects.map((p) =>
            p.areaId === id ? { ...p, areaId: null } : p
          ),
        })),

      addSection: (projectId, title) => {
        const id = nanoid();
        const section: ProjectSection = {
          id,
          projectId,
          title,
          order: get().sections.filter((s) => s.projectId === projectId).length,
        };
        set((s) => ({ sections: [...s.sections, section] }));
        return id;
      },

      updateSection: (id, title) =>
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === id ? { ...sec, title } : sec
          ),
        })),

      deleteSection: (id) =>
        set((s) => ({
          sections: s.sections.filter((sec) => sec.id !== id),
          tasks: s.tasks.map((t) =>
            t.sectionId === id ? { ...t, sectionId: null } : t
          ),
        })),

      reorderSections: (projectId, ids) =>
        set((s) => ({
          sections: s.sections.map((sec) => {
            if (sec.projectId !== projectId) return sec;
            const idx = ids.indexOf(sec.id);
            return idx === -1 ? sec : { ...sec, order: idx };
          }),
        })),

      addMilestone: (projectId, title, dueDate) => {
        return get().addTask({
          kind: "milestone",
          title,
          projectId,
          dueDate,
          startDate: dueDate,
          status: "todo",
        });
      },

      addTag: (name, color, kind = "label") => {
        const id = nanoid();
        set((s) => ({
          tags: [...s.tags, { id, name, color, kind }],
        }));
        return id;
      },

      ensureContextTags: () => {
        const existing = new Set(
          get().tags.map((t) => t.name.toLowerCase())
        );
        const toAdd = CONTEXT_TAG_PRESETS.filter(
          (p) => !existing.has(p.name.toLowerCase())
        );
        if (!toAdd.length) return;
        set((s) => ({
          tags: [
            ...s.tags,
            ...toAdd.map((p) => ({
              id: nanoid(),
              name: p.name,
              color: p.color,
              kind: "context" as TagKind,
            })),
          ],
        }));
      },

      deleteTag: (id) =>
        set((s) => ({
          tags: s.tags.filter((tag) => tag.id !== id),
          tasks: s.tasks.map((t) => ({
            ...t,
            tagIds: t.tagIds.filter((tid) => tid !== id),
          })),
        })),

      addLead: (partial) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const lead: Lead = {
          id,
          name: partial.name,
          company: partial.company ?? "",
          phone: partial.phone ?? "",
          telegram: partial.telegram ?? "",
          email: partial.email ?? "",
          kind: partial.kind ?? "b2c",
          source: partial.source ?? "other",
          partnerCode: partial.partnerCode ?? "",
          status: partial.status ?? "new",
          nextAction: partial.nextAction ?? "",
          nextActionDate: partial.nextActionDate ?? null,
          followUpTaskId: partial.followUpTaskId ?? null,
          estimatedValue: partial.estimatedValue ?? null,
          model: partial.model ?? "",
          quantity: partial.quantity ?? null,
          city: partial.city ?? "",
          notes: partial.notes ?? "",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ leads: [lead, ...s.leads] }));
        return id;
      },

      updateLead: (id, patch) =>
        set((s) => {
          const current = s.leads.find((lead) => lead.id === id);
          const leadName = patch.name ?? current?.name ?? "";
          const nextAction = patch.nextAction ?? current?.nextAction ?? "";
          const nextActionDate = patch.nextActionDate ?? current?.nextActionDate ?? null;
          const shouldSyncTask = Boolean(
            current?.followUpTaskId && nextAction.trim()
          );

          return {
            leads: s.leads.map((lead) =>
              lead.id === id
                ? {
                    ...lead,
                    ...patch,
                    id: lead.id,
                    updatedAt: new Date().toISOString(),
                  }
                : lead
            ),
            tasks: shouldSyncTask
              ? s.tasks.map((task) =>
                  task.id === current!.followUpTaskId && task.status !== "done"
                    ? {
                        ...task,
                        title: `Лід: ${leadName} — ${nextAction.trim()}`,
                        dueDate: nextActionDate,
                        reminder: Boolean(nextActionDate),
                      }
                    : task
                )
              : s.tasks,
          };
        }),

      deleteLead: (id) =>
        set((s) => ({ leads: s.leads.filter((lead) => lead.id !== id) })),

      createLeadFollowUpTask: (id) => {
        const lead = get().leads.find((item) => item.id === id);
        if (!lead || !lead.nextAction.trim()) return null;

        const activeTask = lead.followUpTaskId
          ? get().tasks.find(
              (task) => task.id === lead.followUpTaskId && task.status !== "done"
            )
          : undefined;
        if (activeTask) return activeTask.id;

        const contact = [lead.company, lead.phone || lead.telegram, lead.email]
          .filter(Boolean)
          .join(" · ");
        const taskId = get().addTask({
          title: `Лід: ${lead.name} — ${lead.nextAction.trim()}`,
          notes: [contact, lead.notes].filter(Boolean).join("\n\n"),
          dueDate: lead.nextActionDate,
          reminder: Boolean(lead.nextActionDate),
        });
        get().updateLead(id, { followUpTaskId: taskId });
        return taskId;
      },

      importAvalonPlan: () => {
        const existing = get().projects.find(
          (project) => project.name === AVALON_PLAN_TEMPLATE.name
        );
        if (existing) {
          set({
            selection: { kind: "project", projectId: existing.id },
            sidebarOpen: false,
          });
          return {
            imported: false,
            projectId: existing.id,
            taskCount: get().tasks.filter(
              (task) => task.projectId === existing.id
            ).length,
          };
        }

        const state = get();
        const now = new Date().toISOString();
        const area =
          state.areas.find(
            (item) =>
              item.name.toLocaleLowerCase("uk") ===
              AVALON_PLAN_TEMPLATE.area.toLocaleLowerCase("uk")
          ) ?? {
            id: nanoid(),
            name: AVALON_PLAN_TEMPLATE.area,
            color: AVALON_PLAN_TEMPLATE.color,
            order: state.areas.length,
          };
        const areas = state.areas.some((item) => item.id === area.id)
          ? state.areas
          : [...state.areas, area];

        const tagColors: Record<string, string> = {
          AI: "#0ea5e9",
          "Власноруч": "#f59e0b",
          "Робота": "#16a34a",
          "Важливе": "#ef4444",
          "забудовники": "#8b5cf6",
        };
        const tags = [...state.tags];
        const tagIdsByName = new Map(
          tags.map((tag) => [tag.name.toLocaleLowerCase("uk"), tag.id])
        );
        for (const item of AVALON_PLAN_TEMPLATE.items) {
          if (item.kind !== "task") continue;
          for (const name of item.tags) {
            const key = name.toLocaleLowerCase("uk");
            if (tagIdsByName.has(key)) continue;
            const id = nanoid();
            tags.push({
              id,
              name,
              color: tagColors[name] ?? "#64748b",
              kind: "label",
            });
            tagIdsByName.set(key, id);
          }
        }

        const projectId = nanoid();
        const project: Project = {
          id: projectId,
          name: AVALON_PLAN_TEMPLATE.name,
          color: AVALON_PLAN_TEMPLATE.color,
          notes: plainTextToHtml(AVALON_PLAN_TEMPLATE.notes),
          archived: false,
          order: state.projects.length,
          createdAt: now,
          areaId: area.id,
        };
        const sections: ProjectSection[] = [];
        const tasks: Task[] = [];
        let sectionId: string | null = null;

        for (const item of AVALON_PLAN_TEMPLATE.items) {
          if (item.kind === "section") {
            const nextSectionId = nanoid();
            sectionId = nextSectionId;
            sections.push({
              id: nextSectionId,
              projectId,
              title: item.title,
              order: sections.length,
            });
            continue;
          }

          const important = item.tags.includes("Важливе");
          tasks.push({
            id: nanoid(),
            kind: "task",
            title: item.title,
            notes: plainTextToHtml(item.notes),
            projectId,
            sectionId,
            status: "todo",
            priority: important ? "high" : "none",
            tagIds: item.tags
              .map((name) =>
                tagIdsByName.get(name.toLocaleLowerCase("uk"))
              )
              .filter((id): id is string => Boolean(id)),
            startDate: item.startDate,
            dueDate: item.dueDate,
            deferUntil: null,
            isMyDay: false,
            timeEstimateMinutes: null,
            important,
            urgent: false,
            waitingFor: null,
            streakCount: 0,
            lastStreakDate: null,
            recurrence: "none",
            reminder: false,
            reminderTime: null,
            reminderDaysBefore: 0,
            subtasks: item.checklist.map((title) => ({
              id: nanoid(),
              title,
              done: false,
            })),
            dependsOn: [],
            progress: 0,
            order: tasks.length,
            createdAt: now,
            completedAt: null,
          });
        }

        set({
          projects: [...state.projects, project],
          sections: [...state.sections, ...sections],
          tasks: [...state.tasks, ...tasks],
          tags,
          areas,
          selection: { kind: "project", projectId },
          selectedTaskId: null,
          searchQuery: "",
          sidebarOpen: false,
        });
        return { imported: true, projectId, taskCount: tasks.length };
      },

      resetAll: () => {
        const fresh = makeSeed();
        set({
          projects: fresh.projects,
          sections: fresh.sections,
          tasks: fresh.tasks,
          tags: fresh.tags,
          areas: fresh.areas ?? [],
          leads: [],
          selection: { kind: "smart", list: "today" },
          selectedTaskId: null,
          filters: { ...DEFAULT_FILTERS },
          selectedIds: [],
          undo: null,
        });
      },

      importData: (data) => {
        const projectIds = new Set(data.projects.map((p) => p.id));
        const taskIds = new Set(data.tasks.map((t) => t.id));
        const tagIds = new Set(data.tags.map((t) => t.id));
        const tasks = data.tasks.map((t) =>
          normalizeTask({
            ...t,
            projectId:
              t.projectId && projectIds.has(t.projectId) ? t.projectId : null,
            tagIds: (t.tagIds ?? []).filter((id) => tagIds.has(id)),
            dependsOn: (t.dependsOn ?? []).filter((id) => taskIds.has(id)),
          } as Task & Record<string, unknown>)
        );
        set({
          projects: data.projects.map((p) =>
            normalizeProject(p as Project & Record<string, unknown>)
          ),
          sections: data.sections ?? [],
          tasks,
          tags: data.tags.map((t) =>
            normalizeTag(t as Tag & Record<string, unknown>)
          ),
          areas: data.areas ?? [],
          leads: (data.leads ?? []).map((lead) =>
            normalizeLead(lead as Lead & Record<string, unknown>)
          ),
          selection: { kind: "smart", list: "today" },
          selectedTaskId: null,
          searchQuery: "",
          undo: null,
        });
        get().ensureContextTags();
      },

      importIcalTasks: (partials) => {
        for (const p of partials) {
          if (p.title) get().addTask({ title: p.title, dueDate: p.dueDate ?? null });
        }
      },
    }),
    {
      name: PERSIST_KEY,
      version: 5,
      migrate: (persisted: unknown) => {
        const s = persisted as State;
        if (!s) return persisted;
        const tags = (s.tags ?? []).map((t) =>
          normalizeTag(t as Tag & Record<string, unknown>)
        );
        const contextNames = new Set(
          CONTEXT_TAG_PRESETS.map((p) => p.name.toLowerCase())
        );
        const hasContexts = tags.some((t) => t.kind === "context");
        const mergedTags = hasContexts
          ? tags
          : [
              ...tags,
              ...CONTEXT_TAG_PRESETS.filter(
                (p) =>
                  !tags.some(
                    (t) => t.name.toLowerCase() === p.name.toLowerCase()
                  )
              ).map((p) => ({
                id: nanoid(),
                name: p.name,
                color: p.color,
                kind: "context" as TagKind,
              })),
            ];
        return {
          ...s,
          areas: s.areas ?? [],
          leads: (s.leads ?? []).map((lead) =>
            normalizeLead(lead as Lead & Record<string, unknown>)
          ),
          sections: s.sections ?? [],
          filters: s.filters ?? { ...DEFAULT_FILTERS },
          timelineZoom: s.timelineZoom ?? "month",
          projects: (s.projects ?? []).map((p) =>
            normalizeProject(p as Project & Record<string, unknown>)
          ),
          tags: mergedTags.map((t) =>
            contextNames.has(t.name.toLowerCase()) && t.kind === "label"
              ? { ...t, kind: "context" as TagKind }
              : t
          ),
          tasks: (s.tasks ?? []).map((t) =>
            normalizeTask(t as Task & Record<string, unknown>)
          ),
        };
      },
      partialize: (s) => ({
        projects: s.projects,
        sections: s.sections,
        tasks: s.tasks,
        tags: s.tags,
        areas: s.areas,
        leads: s.leads,
        theme: s.theme,
        timelineZoom: s.timelineZoom,
      }),
    }
  )
);
