import { X } from "lucide-react";
import { useStore } from "../store/useStore";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  SearchFilters,
} from "../types";

/** Фільтри для розширеного пошуку. */
export function SearchFilterBar() {
  const filters = useStore((s) => s.searchFilters);
  const setSearchFilters = useStore((s) => s.setSearchFilters);
  const clearSearchFilters = useStore((s) => s.clearSearchFilters);
  const tags = useStore((s) => s.tags);
  const projects = useStore((s) => s.projects);

  const active =
    filters.status !== "any" ||
    filters.priority !== "any" ||
    filters.tagId !== "any" ||
    filters.projectId !== "any";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <FilterSelect
        label="Статус"
        value={filters.status}
        options={[
          { value: "any", label: "Будь-який" },
          ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
        ]}
        onChange={(v) =>
          setSearchFilters({ status: v as SearchFilters["status"] })
        }
      />
      <FilterSelect
        label="Пріоритет"
        value={filters.priority}
        options={[
          { value: "any", label: "Будь-який" },
          ...PRIORITY_ORDER.map((p) => ({
            value: p,
            label: PRIORITY_LABELS[p],
          })),
        ]}
        onChange={(v) =>
          setSearchFilters({ priority: v as SearchFilters["priority"] })
        }
      />
      <FilterSelect
        label="Тег"
        value={filters.tagId}
        options={[
          { value: "any", label: "Будь-який" },
          ...tags.map((t) => ({ value: t.id, label: t.name })),
        ]}
        onChange={(v) => setSearchFilters({ tagId: v })}
      />
      <FilterSelect
        label="Проєкт"
        value={filters.projectId}
        options={[
          { value: "any", label: "Будь-який" },
          { value: "inbox", label: "Вхідні" },
          ...projects.map((p) => ({ value: p.id, label: p.name })),
        ]}
        onChange={(v) => setSearchFilters({ projectId: v })}
      />
      {active && (
        <button
          onClick={clearSearchFilters}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-3 w-3" /> Скинути
        </button>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={label}
      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {label}: {o.label}
        </option>
      ))}
    </select>
  );
}
