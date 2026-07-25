import { Check, ListChecks, Trash2, X } from "lucide-react";
import { useStore } from "../store/useStore";

/** Панель масових дій для виділених задач. */
export function BulkActionBar() {
  const selectedIds = useStore((s) => s.selectedIds);
  const isSelectionMode = useStore((s) => s.isSelectionMode);
  const setSelectionMode = useStore((s) => s.setSelectionMode);
  const clearSelection = useStore((s) => s.clearSelection);
  const bulkComplete = useStore((s) => s.bulkComplete);
  const bulkDelete = useStore((s) => s.bulkDelete);
  const bulkSetTag = useStore((s) => s.bulkSetTag);
  const bulkMoveProject = useStore((s) => s.bulkMoveProject);
  const tags = useStore((s) => s.tags);
  const projects = useStore((s) => s.projects);

  if (!isSelectionMode) {
    return (
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setSelectionMode(true)}
          className="touch-target inline-flex items-center gap-1.5 rounded-lg px-2 text-ios-footnote text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          title="Вибрати кілька задач"
        >
          <ListChecks className="h-4 w-4" />
          Вибрати
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-2 animate-slide-down xs:gap-2 xs:px-3 dark:border-brand-500/30 dark:bg-brand-500/10">
      <span className="text-ios-body font-medium text-brand-700 dark:text-brand-300">
        {selectedIds.length ? `Обрано: ${selectedIds.length}` : "Виберіть задачі"}
      </span>
      <button
        onClick={bulkComplete}
        disabled={!selectedIds.length}
        className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-ios-footnote hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <Check className="h-3.5 w-3.5" /> Виконати
      </button>
      <select
        disabled={!selectedIds.length}
        onChange={(e) => {
          if (e.target.value) bulkSetTag(e.target.value);
          e.target.value = "";
        }}
        defaultValue=""
        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-ios-footnote disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800"
      >
        <option value="" disabled>
          + Тег
        </option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select
        disabled={!selectedIds.length}
        onChange={(e) => {
          const v = e.target.value;
          bulkMoveProject(v === "inbox" ? null : v);
          e.target.value = "";
        }}
        defaultValue=""
        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-ios-footnote disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800"
      >
        <option value="" disabled>
          Перенести
        </option>
        <option value="inbox">Вхідні</option>
        {projects
          .filter((p) => !p.archived)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </select>
      <button
        onClick={bulkDelete}
        disabled={!selectedIds.length}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-ios-footnote text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-500/10"
      >
        <Trash2 className="h-3.5 w-3.5" /> Видалити
      </button>
      <button
        onClick={clearSelection}
        className="ml-auto rounded p-1 text-gray-400 hover:text-gray-600"
        title="Зняти виділення"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
