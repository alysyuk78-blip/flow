import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "../store/useStore";
import { Status } from "../types";
import { todayISO } from "../lib/dates";
import { TASK_TEMPLATES } from "../store/taskTemplates";

export function QuickAdd({
  projectId = null,
  dueToday = false,
  dueDate,
  status,
  placeholder = "Нова задача…",
  autoFocus = false,
  showTemplates = false,
  addToMyDay = false,
}: {
  projectId?: string | null;
  dueToday?: boolean;
  dueDate?: string;
  status?: Status;
  placeholder?: string;
  autoFocus?: boolean;
  showTemplates?: boolean;
  addToMyDay?: boolean;
}) {
  const addTaskFromText = useStore((s) => s.addTaskFromText);
  const addTaskFromTemplate = useStore((s) => s.addTaskFromTemplate);
  const [title, setTitle] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [hint, setHint] = useState("");

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTaskFromText(trimmed, {
      projectId,
      status: status ?? "todo",
      dueDate: dueDate ?? (dueToday ? todayISO() : null),
      isMyDay: addToMyDay ? true : undefined,
    });
    setTitle("");
    setHint("");
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-brand-400 dark:border-gray-700 dark:bg-gray-800">
        <Plus className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          autoFocus={autoFocus}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.includes("#") || e.target.value.includes("@")) {
              setHint("Enter — створити з тегами/датою");
            } else {
              setHint("");
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-ios-body outline-none placeholder:text-gray-400"
        />
        {showTemplates && (
          <button
            onClick={() => setTemplatesOpen((v) => !v)}
            className="shrink-0 text-ios-footnote text-gray-400 hover:text-brand-500"
          >
            Шаблон
          </button>
        )}
      </div>
      {hint && (
        <p className="mt-1 px-1 text-ios-caption text-brand-500">{hint}</p>
      )}
      <p className="mt-0.5 hidden px-1 text-ios-caption text-gray-400 sm:block">
        Приклад: Зустріч завтра !високий #робота @офіс 30хв
      </p>
      {templatesOpen && (
        <div className="mt-1 space-y-0.5 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
          {TASK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => {
                addTaskFromTemplate(tpl.id, {
                  projectId,
                  dueDate: dueDate ?? (dueToday ? todayISO() : null),
                  isMyDay: addToMyDay,
                });
                setTemplatesOpen(false);
              }}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-ios-footnote hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="font-medium text-gray-800 dark:text-gray-100">
                {tpl.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
