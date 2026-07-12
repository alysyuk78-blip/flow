import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "../store/useStore";
import { projectTasks, byOrder } from "../lib/filters";
import { SortableTaskList } from "../components/SortableTaskList";
import { SectionBlock } from "../components/SectionBlock";
import { QuickAdd } from "../components/QuickAdd";
import { BulkActionBar } from "../components/BulkActionBar";

export function ListView({ projectId }: { projectId: string }) {
  const tasks = useStore((s) => s.tasks);
  const sections = useStore((s) =>
    s.sections
      .filter((sec) => sec.projectId === projectId)
      .sort((a, b) => a.order - b.order)
  );
  const addSection = useStore((s) => s.addSection);
  const [sectionInput, setSectionInput] = useState(false);
  const [sectionName, setSectionName] = useState("");

  const items = projectTasks(tasks, projectId).sort(byOrder);
  const unsectioned = items.filter((t) => !t.sectionId);

  function tasksInSection(sectionId: string) {
    return items.filter((t) => t.sectionId === sectionId);
  }

  function createSection() {
    const t = sectionName.trim();
    if (t) addSection(projectId, t);
    setSectionName("");
    setSectionInput(false);
  }

  return (
    <div className="page-container">
      <BulkActionBar />
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1">
          <QuickAdd projectId={projectId} placeholder="Додати задачу в проєкт…" />
        </div>
        <button
          onClick={() => setSectionInput(true)}
          className="shrink-0 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-brand-400 hover:text-brand-500 dark:border-gray-600"
          title="Додати розділ"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {sectionInput && (
        <input
          autoFocus
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          onBlur={createSection}
          onKeyDown={(e) => {
            if (e.key === "Enter") createSection();
            if (e.key === "Escape") setSectionInput(false);
          }}
          placeholder="Назва розділу…"
          className="mb-4 w-full rounded-lg border border-brand-300 px-3 py-2 text-sm outline-none dark:bg-gray-800"
        />
      )}

      {items.length === 0 && sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400 dark:border-gray-700">
          Немає задач. Додайте першу вгорі.
        </div>
      ) : (
        <div className="space-y-6">
          {sections.length > 0 && (
            <SectionBlock
              sections={sections}
              projectId={projectId}
              renderTasks={(sectionId) => {
                if (!sectionId) return null;
                const secTasks = tasksInSection(sectionId);
                return secTasks.length > 0 ? (
                  <SortableTaskList tasks={secTasks} selectable />
                ) : (
                  <p className="px-3 text-xs text-gray-400">Порожній розділ</p>
                );
              }}
            />
          )}
          {unsectioned.length > 0 && (
            <div>
              {sections.length > 0 && (
                <h3 className="mb-2 px-3 text-sm font-semibold text-gray-400">
                  Без розділу
                </h3>
              )}
              <SortableTaskList tasks={unsectioned} selectable />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
