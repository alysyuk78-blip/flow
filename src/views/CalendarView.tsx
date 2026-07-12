import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { uk } from "date-fns/locale";
import clsx from "clsx";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore } from "../store/useStore";
import { Task } from "../types";
import { DayAddModal } from "../components/DayAddModal";

export function CalendarView({ projectId }: { projectId?: string }) {
  const tasks = useStore((s) => s.tasks);
  const openTask = useStore((s) => s.openTask);
  const [month, setMonth] = useState(new Date());
  const [addDate, setAddDate] = useState<string | null>(null);

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

  return (
    <div className="page-container-xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
          }
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-ios-title3 font-semibold capitalize text-gray-800 dark:text-gray-100">
          {format(month, "LLLL yyyy", { locale: uk })}
        </h2>
        <button
          onClick={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
          }
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              onClick={() => setAddDate(iso)}
              className={clsx(
                "group min-h-[4rem] cursor-pointer bg-white p-1 transition hover:bg-brand-50 xs:min-h-[5.5rem] xs:p-1.5 dark:bg-gray-950 dark:hover:bg-brand-500/5",
                !isSameMonth(day, month) && "opacity-40"
              )}
            >
              <div className="flex items-center justify-between">
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
                <Plus className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100" />
              </div>
              <div className="mt-1 space-y-0.5" onClick={(e) => e.stopPropagation()}>
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
