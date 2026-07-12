import { Search, SearchX } from "lucide-react";
import { useStore } from "../store/useStore";
import { SortableTaskList } from "../components/SortableTaskList";
import { SearchFilterBar } from "../components/SearchFilterBar";
import { byOrder } from "../lib/filters";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

export function SearchView() {
  const tasks = useStore((s) => s.tasks);
  const query = useStore((s) => s.searchQuery);
  const filters = useStore((s) => s.searchFilters);

  const q = query.trim().toLowerCase();
  const results = tasks
    .filter((t) => {
      if (q) {
        const matchText =
          t.title.toLowerCase().includes(q) ||
          stripHtml(t.notes).toLowerCase().includes(q) ||
          t.subtasks.some((sub) => sub.title.toLowerCase().includes(q));
        if (!matchText) return false;
      }
      if (filters.status !== "any" && t.status !== filters.status) return false;
      if (filters.priority !== "any" && t.priority !== filters.priority)
        return false;
      if (filters.tagId !== "any" && !t.tagIds.includes(filters.tagId))
        return false;
      if (filters.projectId !== "any") {
        if (filters.projectId === "inbox" && t.projectId !== null) return false;
        if (
          filters.projectId !== "inbox" &&
          t.projectId !== filters.projectId
        )
          return false;
      }
      return true;
    })
    .sort(byOrder);

  return (
    <div className="page-container">
      <div className="mb-5 flex items-center gap-3">
        <Search className="h-6 w-6 text-brand-500" />
        <div>
          <h1 className="ios-page-title">
            Пошук
          </h1>
          <p className="ios-page-subtitle">
            Знайдено: {results.length}
            {q ? ` за «${query}»` : " (усі задачі з фільтрами)"}
          </p>
        </div>
      </div>

      <SearchFilterBar />

      {results.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-16 text-center text-gray-400 dark:border-gray-700">
          <SearchX className="mx-auto h-10 w-10" strokeWidth={1} />
          <p className="mt-3 ios-empty">Нічого не знайдено</p>
        </div>
      ) : (
        <SortableTaskList tasks={results} showProject selectable />
      )}
    </div>
  );
}
