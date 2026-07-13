import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { uk } from "date-fns/locale";
import clsx from "clsx";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore } from "../store/useStore";
import { Task } from "../types";
import { DayAddModal } from "../components/DayAddModal";
import { todayISO } from "../lib/dates";

export function CalendarView({ projectId }: { projectId?: string }) {
  const tasks = useStore((s) => s.tasks);
  const openTask = useStore((s) => s.openTask);
  const [month, setMonth] = useState(new Date());
  const [addDate, setAddDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const scoped = useMemo(() => {
    const list = projectId
      ? tasks.filter((t) => t.projectId === projectId)
      : tasks.filter((t) => t.status !== "done");
    return list;
  }, [tasks, projectId]);

  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });

  const padStart = (start.getDay() + 6) % 7;
  const cells: (Date | null)[] = [...Array(padStart).fill(null), ...days];

  function tasksOn(day: Date): Task[] {
    const iso = format(day, "yyyy-MM-dd");
    return scoped.filter(
      (t) => t.dueDate === iso || t.startDate === iso
    );
  }

  const selectedTasks = scoped.filter(
    (task) => task.dueDate === selectedDate || task.startDate === selectedDate
  );

  function moveMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(format(next, "yyyy-MM-dd"));
  }

  return (
    <div className="page-container-xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => moveMonth(-1)}
          aria-label="Попередній місяць"
          title="Попередній місяць"
          className="touch-target flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-ios-title3 font-semibold capitalize text-gray-800 dark:text-gray-100">
          {format(month, "LLLL yyyy", { locale: uk })}
        </h2>
        <button
          onClick={() => moveMonth(1)}
          aria-label="Наступний місяць"
          title="Наступний місяць"
          className="touch-target flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
          <div
            key={d}
            className="bg-gray-50 px-2 py-2 text-center text-ios-footnote font-medium text-gray-500 dark:bg-gray-900"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`pad-${i}`}
                className="min-h-[4rem] bg-white xs:min-h-[5.5rem] dark:bg-gray-950"
              />
            );
          }
          const dayTasks = tasksOn(day);
          const today = isToday(day);
          const iso = format(day, "yyyy-MM-dd");
          return (
            <div
              key={day.toISOString()}
              className={clsx(
                "group relative min-h-[3.25rem] bg-white p-0.5 transition sm:min-h-[5.5rem] sm:p-1.5 dark:bg-gray-950",
                selectedDate === iso && "ring-2 ring-inset ring-brand-400 sm:ring-0",
                !isSameMonth(day, month) && "opacity-40"
              )}
            >
              <button
                onClick={() => setSelectedDate(iso)}
                aria-label={`${format(day, "d MMMM", { locale: uk })}, задач: ${dayTasks.length}`}
                className="flex min-h-11 w-full items-center justify-center rounded-lg hover:bg-brand-50 sm:min-h-0 sm:justify-between dark:hover:bg-brand-500/5"
              >
                <span
                  className={clsx(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-ios-footnote",
                    today
                      ? "bg-brand-500 font-bold text-white"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  {dayTasks.length > 0 && (
                    <span className="text-ios-caption text-brand-500">
                      {dayTasks.length}
                    </span>
                  )}
                </span>
              </button>
              {dayTasks.length > 0 && (
                <span
                  className="pointer-events-none absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand-500 sm:hidden"
                  aria-hidden="true"
                />
              )}
              <button
                onClick={() => setAddDate(iso)}
                aria-label={`Додати задачу на ${format(day, "d MMMM", { locale: uk })}`}
                title="Додати задачу"
                className="absolute right-1 top-1 hidden h-7 w-7 items-center justify-center rounded-lg text-gray-300 opacity-0 hover:bg-brand-50 hover:text-brand-500 group-hover:opacity-100 sm:flex dark:hover:bg-brand-500/10"
              >
                <Plus className="h-4 w-4" />
              </button>
              <div className="mt-1 hidden space-y-0.5 sm:block">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    className={clsx(
                      "block w-full truncate rounded px-1 py-0.5 text-left text-ios-caption",
                      t.kind === "milestone"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                        : "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200"
                    )}
                  >
                    {t.kind === "milestone" ? "◆ " : ""}
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-ios-caption text-gray-400">
                    +{dayTasks.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-4 sm:hidden" aria-labelledby="mobile-day-heading">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3
            id="mobile-day-heading"
            className="text-ios-body font-semibold capitalize text-gray-800 dark:text-gray-100"
          >
            {format(parseISO(selectedDate), "d MMMM", { locale: uk })}
          </h3>
          <button
            onClick={() => setAddDate(selectedDate)}
            className="touch-target flex items-center gap-1 rounded-lg px-2 text-ios-footnote font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            <Plus className="h-4 w-4" />
            Додати
          </button>
        </div>
        {selectedTasks.length ? (
          <div className="space-y-1">
            {selectedTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => openTask(task.id)}
                className="touch-target flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left text-ios-body hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:hover:bg-brand-500/10"
              >
                <span
                  className={clsx(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    task.kind === "milestone" ? "bg-amber-500" : "bg-brand-500"
                  )}
                />
                <span className="min-w-0 flex-1 break-words">{task.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 px-3 py-5 text-center ios-empty dark:border-gray-700">
            На цей день задач немає.
          </div>
        )}
      </section>

      {addDate && (
        <DayAddModal
          dateIso={addDate}
          projectId={projectId}
          onClose={() => setAddDate(null)}
        />
      )}
    </div>
  );
}
