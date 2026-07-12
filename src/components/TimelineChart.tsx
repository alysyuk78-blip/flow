import { useMemo } from "react";
import {
  eachDayOfInterval,
  parseISO,
  differenceInCalendarDays,
  addDays,
  isToday,
  isWeekend,
  min as minDate,
  max as maxDate,
  format,
} from "date-fns";
import { uk } from "date-fns/locale";
import clsx from "clsx";
import { Task, TimelineZoom, TIMELINE_ZOOM_LABELS } from "../types";
import { computedProgress } from "../lib/filters";
import { criticalPathIds } from "../lib/criticalPath";
import { todayISO } from "../lib/dates";
import { useStore } from "../store/useStore";

const ROW_H = 44;
const LABEL_W = 200;
const ZOOM_DAY_W: Record<TimelineZoom, number> = {
  week: 48,
  month: 34,
  quarter: 18,
};

export function TimelineChart({
  items,
  showZoom = true,
  showCritical = true,
}: {
  items: Task[];
  showZoom?: boolean;
  showCritical?: boolean;
}) {
  const openTask = useStore((s) => s.openTask);
  const zoom = useStore((s) => s.timelineZoom);
  const setTimelineZoom = useStore((s) => s.setTimelineZoom);
  const DAY_W = ZOOM_DAY_W[zoom];

  const critical = useMemo(
    () => (showCritical ? criticalPathIds(items) : new Set<string>()),
    [items, showCritical]
  );

  const { days, dateStart } = useMemo(() => {
    const dated = items.filter((t) => t.startDate || t.dueDate);
    if (!dated.length) {
      const t = parseISO(todayISO());
      return {
        days: eachDayOfInterval({ start: addDays(t, -7), end: addDays(t, 14) }),
        dateStart: addDays(t, -7),
      };
    }
    const bounds: Date[] = [];
    for (const t of dated) {
      if (t.startDate) bounds.push(parseISO(t.startDate));
      if (t.dueDate) bounds.push(parseISO(t.dueDate));
    }
    bounds.push(parseISO(todayISO()));
    const start = addDays(minDate(bounds), -2);
    const end = addDays(maxDate(bounds), 3);
    return { days: eachDayOfInterval({ start, end }), dateStart: start };
  }, [items]);

  function xFor(iso: string): number {
    return differenceInCalendarDays(parseISO(iso), dateStart) * DAY_W;
  }

  function barGeom(task: Task): { x: number; w: number } | null {
    const s = task.startDate ?? task.dueDate;
    const e = task.dueDate ?? task.startDate;
    if (!s || !e) return null;
    const x = xFor(s);
    const span = Math.max(
      1,
      differenceInCalendarDays(parseISO(e), parseISO(s)) + 1
    );
    return { x, w: span * DAY_W };
  }

  const positions = new Map<string, { x: number; w: number; row: number }>();
  items.forEach((task, row) => {
    const g = barGeom(task);
    if (g) positions.set(task.id, { ...g, row });
  });

  const totalW = days.length * DAY_W;

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-max px-6 py-4">
        {showZoom && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Масштаб:</span>
            {(Object.keys(TIMELINE_ZOOM_LABELS) as TimelineZoom[]).map((z) => (
              <button
                key={z}
                onClick={() => setTimelineZoom(z)}
                className={clsx(
                  "rounded-lg px-2.5 py-1 text-xs transition",
                  zoom === z
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                )}
              >
                {TIMELINE_ZOOM_LABELS[z]}
              </button>
            ))}
            {critical.size > 0 && (
              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                Помаранчева смужка — критичний шлях
              </span>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400 dark:border-gray-700">
            Додайте задачі з датами, щоб побачити таймлайн.
          </div>
        ) : (
          <div className="flex">
            <div style={{ width: LABEL_W }} className="shrink-0">
              <div
                style={{ height: 40 }}
                className="border-b border-gray-200 dark:border-gray-700"
              />
              {items.map((task) => (
                <div
                  key={task.id}
                  style={{ height: ROW_H }}
                  onClick={() => openTask(task.id)}
                  className="flex cursor-pointer items-center gap-1 truncate border-b border-gray-100 pr-3 text-sm text-gray-700 hover:text-brand-600 dark:border-gray-800 dark:text-gray-200"
                >
                  {task.kind === "milestone" && (
                    <span className="text-amber-500">◆</span>
                  )}
                  <span className="truncate">{task.title}</span>
                </div>
              ))}
            </div>

            <div className="relative" style={{ width: totalW }}>
              <div className="flex" style={{ height: 40 }}>
                {days.map((d, i) => (
                  <div
                    key={i}
                    style={{ width: DAY_W }}
                    className={clsx(
                      "flex flex-col items-center justify-center border-b border-l border-gray-200 text-[10px] dark:border-gray-700",
                      isWeekend(d) && "bg-gray-50 dark:bg-gray-800/40",
                      isToday(d) && "bg-brand-50 dark:bg-brand-500/10"
                    )}
                  >
                    {zoom !== "quarter" && (
                      <span className="text-gray-400">
                        {format(d, "EEEEEE", { locale: uk })}
                      </span>
                    )}
                    <span
                      className={clsx(
                        "font-medium",
                        isToday(d)
                          ? "text-brand-600"
                          : "text-gray-600 dark:text-gray-300"
                      )}
                    >
                      {format(d, zoom === "quarter" ? "d MMM" : "d", {
                        locale: uk,
                      })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative">
                {items.map((task) => (
                  <div
                    key={task.id}
                    className="flex border-b border-gray-100 dark:border-gray-800"
                    style={{ height: ROW_H }}
                  >
                    {days.map((d, i) => (
                      <div
                        key={i}
                        style={{ width: DAY_W }}
                        className={clsx(
                          "border-l border-gray-100 dark:border-gray-800",
                          isWeekend(d) && "bg-gray-50 dark:bg-gray-800/30",
                          isToday(d) && "bg-brand-50/60 dark:bg-brand-500/5"
                        )}
                      />
                    ))}
                  </div>
                ))}

                {items.map((task) => {
                  const pos = positions.get(task.id);
                  if (!pos) return null;
                  const progress = computedProgress(task);
                  const done = task.status === "done";
                  const isCritical = critical.has(task.id);
                  const isMilestone = task.kind === "milestone";

                  if (isMilestone) {
                    const cx = pos.x + pos.w / 2;
                    const cy = pos.row * ROW_H + ROW_H / 2;
                    return (
                      <div
                        key={task.id}
                        onClick={() => openTask(task.id)}
                        className="absolute cursor-pointer"
                        style={{ left: cx - 8, top: cy - 8 }}
                        title={task.title}
                      >
                        <div
                          className={clsx(
                            "h-4 w-4 rotate-45 border-2",
                            done
                              ? "border-green-500 bg-green-500"
                              : "border-amber-500 bg-amber-400"
                          )}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={task.id}
                      onClick={() => openTask(task.id)}
                      className={clsx(
                        "absolute flex cursor-pointer items-center overflow-hidden rounded-md text-xs text-white shadow-sm ring-2 ring-transparent",
                        done ? "bg-green-500" : "bg-brand-500",
                        isCritical && !done && "ring-amber-400"
                      )}
                      style={{
                        left: pos.x + 3,
                        top: pos.row * ROW_H + 8,
                        width: Math.max(DAY_W - 6, pos.w - 6),
                        height: ROW_H - 16,
                      }}
                      title={task.title}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-black/20"
                        style={{ width: `${progress}%` }}
                      />
                      <span className="relative z-10 truncate px-2">
                        {task.title}
                      </span>
                    </div>
                  );
                })}

                <svg
                  className="pointer-events-none absolute left-0 top-0"
                  width={totalW}
                  height={items.length * ROW_H}
                >
                  {items.flatMap((task) =>
                    task.dependsOn.map((depId) => {
                      const from = positions.get(depId);
                      const to = positions.get(task.id);
                      if (!from || !to) return null;
                      const x1 = from.x + from.w;
                      const y1 = from.row * ROW_H + ROW_H / 2;
                      const x2 = to.x;
                      const y2 = to.row * ROW_H + ROW_H / 2;
                      const stub = 10;
                      let d: string;
                      if (x2 - x1 >= stub * 2) {
                        const midX = x1 + (x2 - x1) / 2;
                        d = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2 - 5}`;
                      } else {
                        const yEdge =
                          to.row * ROW_H + (y2 > y1 ? 0 : ROW_H);
                        d = `M ${x1} ${y1} H ${x1 + stub} V ${yEdge} H ${
                          x2 - stub
                        } V ${y2} H ${x2 - 5}`;
                      }
                      return (
                        <g key={`${depId}-${task.id}`}>
                          <path
                            d={d}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth={1.5}
                          />
                          <path
                            d={`M ${x2} ${y2} l -6 -3.5 v 7 z`}
                            fill="#94a3b8"
                          />
                        </g>
                      );
                    })
                  )}
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
