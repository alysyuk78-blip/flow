import { Undo2, X } from "lucide-react";
import { useStore } from "../store/useStore";

/** Тост «Скасувати» після видалення. */
export function UndoToast() {
  const undo = useStore((s) => s.undo);
  const restoreUndo = useStore((s) => s.restoreUndo);
  const dismissUndo = useStore((s) => s.dismissUndo);

  if (!undo) return null;

  const count =
    undo.tasks.length +
    (undo.projects?.length ?? 0) +
    (undo.sections?.length ?? 0);
  const label =
    undo.projects?.length
      ? `Проєкт «${undo.projects[0].name}» видалено`
      : count === 1 && undo.tasks.length === 1
        ? "Задачу видалено"
        : undo.tasks.length > 0
          ? `Видалено ${undo.tasks.length} задач`
          : "Зміни скасовано";

  return (
    <div className="safe-b-inset safe-x fixed left-1/2 z-50 flex max-w-[calc(100%-2rem)] -translate-x-1/2 animate-slide-up items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-lg xs:max-w-md xs:gap-3 xs:px-4 xs:py-3 dark:border-gray-700 dark:bg-gray-900">
      <span className="min-w-0 flex-1 truncate text-ios-body text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <button
        onClick={restoreUndo}
        className="touch-target flex shrink-0 items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-ios-body font-medium text-white hover:bg-brand-600"
      >
        <Undo2 className="h-3.5 w-3.5" />
        Скасувати
      </button>
      <button
        onClick={dismissUndo}
        className="rounded p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
