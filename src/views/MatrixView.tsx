import { LayoutGrid } from "lucide-react";
import { useStore } from "../store/useStore";
import { isActiveTask } from "../lib/filters";
import {
  QUADRANT_LABELS,
  Quadrant,
  taskQuadrant,
} from "../lib/eisenhower";
import { TaskRow } from "../components/TaskRow";

const QUADRANTS: Quadrant[] = ["do", "schedule", "delegate", "eliminate"];

export function MatrixView() {
  const tasks = useStore((s) => s.tasks);
  const updateTask = useStore((s) => s.updateTask);

  const active = tasks.filter((t) => isActiveTask(t) && !t.waitingFor);

  const grouped = QUADRANTS.reduce(
    (acc, q) => {
      acc[q] = active.filter((t) => taskQuadrant(t) === q);
      return acc;
    },
    {} as Record<Quadrant, typeof active>
  );

  return (
    <div className="page-container-lg">
      <div className="mb-6 flex items-center gap-3">
        <LayoutGrid className="h-7 w-7 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Матриця Ейзенхауера
          </h1>
          <p className="text-sm text-gray-500">
            Важливо vs терміново — позначте в деталях задачі або покладайтесь на
            дедлайн і пріоритет
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {QUADRANTS.map((q) => {
          const meta = QUADRANT_LABELS[q];
          const items = grouped[q];
          return (
            <div
              key={q}
              className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              style={{ borderTopColor: meta.color, borderTopWidth: 3 }}
            >
              <div className="mb-3">
                <h2
                  className="text-sm font-bold"
                  style={{ color: meta.color }}
                >
                  {meta.title}
                </h2>
                <p className="text-xs text-gray-400">{meta.hint}</p>
                <span className="text-xs text-gray-400">{items.length} задач</span>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="py-4 text-center text-xs text-gray-400">
                    Порожньо
                  </p>
                ) : (
                  items.slice(0, 12).map((task) => (
                    <div key={task.id} className="group relative">
                      <TaskRow task={task} showProject />
                      <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTask(task.id, { important: !task.important });
                          }}
                          className="rounded bg-white/90 px-1 text-[10px] shadow dark:bg-gray-800"
                          title="Важливо"
                        >
                          {task.important ? "★" : "☆"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTask(task.id, { urgent: !task.urgent });
                          }}
                          className="rounded bg-white/90 px-1 text-[10px] shadow dark:bg-gray-800"
                          title="Терміново"
                        >
                          {task.urgent ? "!" : "·"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
