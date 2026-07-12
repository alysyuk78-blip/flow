import { X } from "lucide-react";
import { useStore } from "../store/useStore";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  TaskFilters,
} from "../types";

export function FilterBar() {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const clearFilters = useStore((s) => s.clearFilters);
  const tags = useStore((s) => s.tags);

  const active =
    filters.status !== "any" ||
    filters.priority !== "any" ||
    filters.tagId !== "any";

  const sel =
    "rounded-lg border border-gray-200 bg-white px-2 py-1 text-ios-footnote outline-none dark:border-gray-700 dark:bg-gray-800";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <select
        value={filters.status}
        onChange={(e) =>
          setFilters({ status: e.target.value as TaskFilters["status"] })
        }
        className={sel}
      >
        <option value="any">Будь-який статус</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) =>
          setFilters({ priority: e.target.value as TaskFilters["priority"] })
        }
        className={sel}
      >
        <option value="any">Будь-який пріоритет</option>
        {PRIORITY_ORDER.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>

      <select
        value={filters.tagId}
        onChange={(e) => setFilters({ tagId: e.target.value })}
        className={sel}
      >
        <option value="any">Будь-який тег</option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {active && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-ios-footnote text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-3 w-3" /> Скинути
        </button>
      )}
    </div>
  );
}
