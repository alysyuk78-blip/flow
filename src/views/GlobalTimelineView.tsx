import { useMemo } from "react";
import { GanttChartSquare } from "lucide-react";
import { useStore } from "../store/useStore";
import { datedTasks, byDueThenPriority } from "../lib/filters";
import { TimelineChart } from "../components/TimelineChart";

export function GlobalTimelineView() {
  const tasks = useStore((s) => s.tasks);
  const items = useMemo(
    () => datedTasks(tasks).sort(byDueThenPriority),
    [tasks]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 py-4 xs:px-6 xs:py-5 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <GanttChartSquare className="h-6 w-6 text-brand-500" />
          <div>
            <h1 className="ios-page-title">
              Таймлайн
            </h1>
            <p className="ios-page-subtitle">
              Усі проєкти на одній діаграмі Ганта
            </p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <TimelineChart items={items} />
      </div>
    </div>
  );
}
