import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "../store/useStore";
import { TASK_TEMPLATES } from "../store/taskTemplates";

/** Модальне вікно швидкого додавання задачі на дату. */
export function DayAddModal({
  dateIso,
  projectId,
  onClose,
}: {
  dateIso: string;
  projectId?: string;
  onClose: () => void;
}) {
  const addTask = useStore((s) => s.addTask);
  const addTaskFromTemplate = useStore((s) => s.addTaskFromTemplate);
  const [title, setTitle] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  function submit() {
    const t = title.trim();
    if (!t) return;
    addTask({
      title: t,
      dueDate: dateIso,
      projectId: projectId ?? null,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-scale-in rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            Нова задача на {dateIso}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Назва задачі…"
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 ios-form-control outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
        />
        <div className="mb-3 flex gap-2">
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="flex-1 rounded-lg bg-brand-500 py-2 text-ios-body font-medium text-white hover:bg-brand-600 disabled:opacity-40"
          >
            Додати
          </button>
          <button
            onClick={() => setShowTemplates((v) => !v)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-ios-footnote text-gray-500 dark:border-gray-700"
          >
            Шаблон
          </button>
        </div>
        {showTemplates && (
          <div className="space-y-1 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
            {TASK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  addTaskFromTemplate(tpl.id, {
                    dueDate: dateIso,
                    projectId: projectId ?? null,
                  });
                  onClose();
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-ios-footnote hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="font-medium">{tpl.name}</span>
                <span className="block text-gray-400">{tpl.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
