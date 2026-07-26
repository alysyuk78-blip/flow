import { useMemo } from "react";
import clsx from "clsx";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  FolderKanban,
  MapPin,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { activeProjects, isActiveTask } from "../lib/filters";
import { humanDate, isOverdue } from "../lib/dates";

interface ProjectSummary {
  id: string;
  name: string;
  color: string;
  areaName: string | null;
  areaColor: string | null;
  total: number;
  done: number;
  open: number;
  overdue: number;
  nextDue: string | null;
}

export function ProjectsView() {
  const projects = useStore((state) => state.projects);
  const tasks = useStore((state) => state.tasks);
  const areas = useStore((state) => state.areas);
  const select = useStore((state) => state.select);

  const summaries = useMemo<ProjectSummary[]>(() => {
    return activeProjects(projects)
      .map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const active = projectTasks.filter(isActiveTask);
        const dueDates = active
          .map((task) => task.dueDate)
          .filter((dueDate): dueDate is string => Boolean(dueDate))
          .sort();
        const area = areas.find((item) => item.id === project.areaId);

        return {
          id: project.id,
          name: project.name,
          color: project.color,
          areaName: area?.name ?? null,
          areaColor: area?.color ?? null,
          total: projectTasks.length,
          done: projectTasks.filter((task) => task.status === "done").length,
          open: active.length,
          overdue: active.filter((task) => isOverdue(task.dueDate)).length,
          nextDue: dueDates[0] ?? null,
        };
      })
      .sort((a, b) => {
        if (a.overdue !== b.overdue) return b.overdue - a.overdue;
        if (a.nextDue && b.nextDue) return a.nextDue.localeCompare(b.nextDue);
        if (a.nextDue) return -1;
        if (b.nextDue) return 1;
        return a.name.localeCompare(b.name, "uk");
      });
  }, [areas, projects, tasks]);

  const overdueProjects = summaries.filter((project) => project.overdue > 0).length;

  return (
    <div className="page-container-lg">
      <header className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-brand-500" />
            <h1 className="ios-page-title">Проєкти</h1>
          </div>
          <p className="mt-1 ios-page-subtitle">
            Огляд стану проєктів. Завдання не змішуються в одному списку.
          </p>
        </div>
        <div className="flex items-center gap-2 text-ios-footnote text-gray-500 dark:text-gray-400">
          <span>{summaries.length} активних</span>
          {overdueProjects > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              {overdueProjects} потребують уваги
            </span>
          )}
        </div>
      </header>

      {summaries.length === 0 ? (
        <div className="ios-empty border-y border-gray-200 py-8 dark:border-gray-800">
          Тут з'являться активні проєкти. Створіть перший через кнопку «+» у
          блоці «Мої проєкти» в меню.
        </div>
      ) : (
        <div className="border-y border-gray-200 dark:border-gray-800">
          <div className="hidden grid-cols-[minmax(14rem,1fr)_7rem_8rem_8rem_1.25rem] gap-4 border-b border-gray-200 px-3 py-2 text-ios-caption font-medium uppercase tracking-wide text-gray-400 dark:border-gray-800 md:grid">
            <span>Проєкт</span>
            <span>Прогрес</span>
            <span>Найближчий строк</span>
            <span>Стан</span>
            <span aria-hidden="true" />
          </div>

          {summaries.map((project) => {
            const progress = project.total
              ? Math.round((project.done / project.total) * 100)
              : 0;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() =>
                  select({ kind: "project", projectId: project.id })
                }
                className={clsx(
                  "grid w-full gap-x-4 gap-y-2 border-b border-gray-100 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none dark:border-gray-800 dark:hover:bg-gray-900 dark:focus-visible:bg-gray-900 md:grid-cols-[minmax(14rem,1fr)_7rem_8rem_8rem_1.25rem] md:items-center",
                  project.overdue > 0 &&
                    "bg-red-50/50 dark:bg-red-500/[0.06]"
                )}
              >
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate text-ios-body font-medium text-gray-800 dark:text-gray-100">
                      {project.name}
                    </span>
                  </span>
                  {project.areaName && (
                    <span
                      className="mt-1 flex items-center gap-1 text-ios-caption"
                      style={{ color: project.areaColor ?? undefined }}
                    >
                      <MapPin className="h-3 w-3" />
                      {project.areaName}
                    </span>
                  )}
                </span>

                <span className="flex items-center gap-2 text-ios-footnote text-gray-600 dark:text-gray-300">
                  <span className="tabular-nums">{progress}%</span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <span
                      className="block h-full rounded-full bg-brand-500"
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                </span>

                <span className="flex items-center gap-1 text-ios-footnote text-gray-500 dark:text-gray-400">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  {project.nextDue ? humanDate(project.nextDue) : "Без строку"}
                </span>

                <span className="text-ios-footnote">
                  {project.overdue > 0 ? (
                    <span className="flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {project.overdue} простр.
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      {project.open} активних
                    </span>
                  )}
                </span>

                <ChevronRight className="hidden h-4 w-4 text-gray-400 md:block" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
