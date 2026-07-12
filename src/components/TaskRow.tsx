import clsx from "clsx";
import {
  Check,
  CalendarDays,
  ListTree,
  Folder,
  Repeat,
  Diamond,
  Focus,
  Sun,
  Hourglass,
  Flame,
  Clock,
} from "lucide-react";
import { Task } from "../types";
import { useStore } from "../store/useStore";
import { humanDate, isOverdue } from "../lib/dates";
import { computedProgress } from "../lib/filters";
import { PriorityFlag, TagChip } from "./badges";

export function TaskRow({
  task,
  showProject,
  selectable,
}: {
  task: Task;
  showProject?: boolean;
  selectable?: boolean;
}) {
  const toggleDone = useStore((s) => s.toggleDone);
  const openTask = useStore((s) => s.openTask);
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const selectedIds = useStore((s) => s.selectedIds);
  const toggleTaskSelected = useStore((s) => s.toggleTaskSelected);
  const setFocusTaskId = useStore((s) => s.setFocusTaskId);
  const toggleMyDay = useStore((s) => s.toggleMyDay);
  const tags = useStore((s) => s.tags);
  const projects = useStore((s) => s.projects);

  const done = task.status === "done";
  const project = projects.find((p) => p.id === task.projectId);
  const taskTags = task.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean);
  const subDone = task.subtasks.filter((s) => s.done).length;
  const progress = computedProgress(task);
  const bulkSelected = selectedIds.includes(task.id);

  return (
    <div
      onClick={() => openTask(task.id)}
      className={clsx(
        "group flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-3 transition-all duration-200 ease-smooth xs:gap-3 xs:px-3 xs:py-2.5",
        selectedTaskId === task.id || bulkSelected
          ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
          : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/60"
      )}
    >
      {selectable && (
        <label className="touch-target -m-1 flex shrink-0 items-center justify-center p-2">
          <input
            type="checkbox"
            checked={bulkSelected}
            onChange={() => toggleTaskSelected(task.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 accent-brand-500"
          />
        </label>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleDone(task.id);
        }}
        className={clsx(
          "-m-1 flex shrink-0 touch-target items-center justify-center rounded-full p-2 transition-all duration-200 ease-smooth",
          done
            ? "text-brand-500"
            : "text-gray-300 hover:text-brand-400 dark:text-gray-600"
        )}
      >
        <span
          className={clsx(
            "flex h-5 w-5 items-center justify-center rounded-full border-2",
            done
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-current"
          )}
        >
          {done && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      </button>

      <div className="min-w-0 flex-1 overflow-hidden">
        <p
          className={clsx(
            "truncate text-ios-body leading-snug",
            done
              ? "text-gray-400 line-through"
              : "text-gray-800 dark:text-gray-100"
          )}
        >
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <PriorityFlag priority={task.priority} />
          {task.kind === "milestone" && (
            <Diamond className="h-3 w-3 shrink-0 text-amber-500" strokeWidth={1.5} />
          )}
          {task.recurrence !== "none" && (
            <Repeat className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={1.5} />
          )}
          {task.isMyDay && !done && (
            <Sun className="h-3 w-3 shrink-0 text-amber-500" strokeWidth={1.5} />
          )}
          {task.waitingFor && (
            <Hourglass className="h-3 w-3 shrink-0 text-orange-400" strokeWidth={1.5} />
          )}
          {task.streakCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-ios-caption text-orange-500">
              <Flame className="h-3 w-3" />
              {task.streakCount}
            </span>
          )}
          {!done && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!toggleMyDay(task.id)) {
                  alert("У «Мій день» можна додати лише 5 задач.");
                }
              }}
              title="Мій день"
              className={clsx(
                "shrink-0 rounded p-1",
                task.isMyDay
                  ? "text-amber-500"
                  : "text-gray-300 hover:text-amber-500 md:opacity-0 md:group-hover:opacity-100"
              )}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
          )}
          {!done && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFocusTaskId(task.id);
              }}
              title="Режим фокусу — таймер 25 хв"
              className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-ios-caption font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            >
              <Focus className="h-3.5 w-3.5" />
              <span className="hidden min-[400px]:inline">Фокус</span>
            </button>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ios-footnote text-gray-500">
          {showProject && project && (
            <span className="inline-flex max-w-full items-center gap-1 truncate">
              <Folder className="h-3 w-3 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{project.name}</span>
            </span>
          )}
          {task.dueDate && (
            <span
              className={clsx(
                "inline-flex items-center gap-1",
                isOverdue(task.dueDate) && !done && "text-red-500"
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {humanDate(task.dueDate)}
            </span>
          )}
          {task.timeEstimateMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.timeEstimateMinutes >= 60
                ? `${Math.round(task.timeEstimateMinutes / 60)} год`
                : `${task.timeEstimateMinutes} хв`}
            </span>
          )}
          {task.waitingFor && (
            <span className="max-w-full truncate text-orange-500">
              → {task.waitingFor}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListTree className="h-3 w-3" />
              {subDone}/{task.subtasks.length}
            </span>
          )}
          {taskTags.map((t) => (
            <TagChip key={t!.id} tag={t!} />
          ))}
        </div>

        {progress > 0 && progress < 100 && (
          <div className="mt-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-brand-400 transition-all duration-300 ease-smooth"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
