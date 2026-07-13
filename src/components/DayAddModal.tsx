import { useEffect, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-add-heading"
        className="w-full max-w-md animate-scale-in rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="day-add-heading" className="font-semibold text-gray-800 dark:text-gray-100">
            Нова задача на {dateIso}
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрити"
            title="Закрити"
            className="touch-target -mr-2 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
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
            className="min-h-11 flex-1 rounded-lg bg-brand-500 py-2 text-ios-body font-medium text-white hover:bg-brand-600 disabled:opacity-40"
          >
            Додати
          </button>
          <button
            onClick={() => setShowTemplates((v) => !v)}
            className="min-h-11 rounded-lg border border-gray-200 px-3 py-2 text-ios-footnote text-gray-500 dark:border-gray-700"
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
                className="min-h-11 w-full rounded-lg px-2 py-1.5 text-left text-ios-footnote hover:bg-gray-100 dark:hover:bg-gray-800"
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
