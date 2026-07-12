import { subDays, format } from "date-fns";
import { uk } from "date-fns/locale";
import { BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "../store/useStore";

/** Статистика виконаних задач за останні 7 днів. */
export function StatsView() {
  const tasks = useStore((s) => s.tasks);

  const stats = useMemo(() => {
    const days: { label: string; iso: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const iso = format(d, "yyyy-MM-dd");
      days.push({
        label: format(d, "EEE", { locale: uk }),
        iso,
        count: 0,
      });
    }
    for (const t of tasks) {
      if (t.status !== "done" || !t.completedAt) continue;
      const iso = t.completedAt.slice(0, 10);
      const day = days.find((d) => d.iso === iso);
      if (day) day.count++;
    }
    const total = days.reduce((s, d) => s + d.count, 0);
    const active = tasks.filter((t) => t.status !== "done").length;
    const max = Math.max(...days.map((d) => d.count), 1);
    return { days, total, active, max };
  }, [tasks]);

  return (
    <div className="page-container">
      <div className="mb-5 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Статистика
          </h1>
          <p className="text-sm text-gray-500">Останні 7 днів</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-3xl font-bold text-brand-500">{stats.total}</div>
          <div className="text-sm text-gray-500">Виконано за тиждень</div>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {stats.active}
          </div>
          <div className="text-sm text-gray-500">Активних задач</div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
          Виконано по днях
        </h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {stats.days.map((d) => (
            <div key={d.iso} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {d.count || ""}
              </span>
              <div
                className="w-full max-w-[2.5rem] rounded-t-md bg-brand-400 transition-all duration-500 ease-smooth dark:bg-brand-500"
                style={{
                  height: `${Math.max((d.count / stats.max) * 120, d.count ? 8 : 2)}px`,
                }}
              />
              <span className="text-[10px] capitalize text-gray-400">
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
