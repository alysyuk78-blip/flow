import { Archive } from "lucide-react";
import { useStore } from "../store/useStore";
import { logbookTasks } from "../lib/filters";
import { TaskRow } from "../components/TaskRow";
import { fullDate } from "../lib/dates";

export function LogbookView() {
  const tasks = useStore((s) => s.tasks);
  const items = logbookTasks(tasks);

  const grouped = new Map<string, typeof items>();
  for (const t of items) {
    const key = t.completedAt
      ? fullDate(t.completedAt.slice(0, 10))
      : "Без дати";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }

  return (
    <div className="page-container">
      <div className="mb-5 flex items-center gap-3">
        <Archive className="h-6 w-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Журнал
          </h1>
          <p className="text-sm text-gray-500">
            Виконані задачі · {items.length}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400 dark:border-gray-700">
          Поки нічого не виконано.
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([label, group]) => (
            <div key={label}>
              <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {label}
              </div>
              <div className="space-y-0.5">
                {group.map((task) => (
                  <TaskRow key={task.id} task={task} showProject />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
