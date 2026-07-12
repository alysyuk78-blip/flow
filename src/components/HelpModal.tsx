import { X, BookOpen } from "lucide-react";
import { useStore } from "../store/useStore";
import { USER_GUIDE_SECTIONS } from "../content/userGuide";

export function HelpModal() {
  const helpOpen = useStore((s) => s.helpOpen);
  const setHelpOpen = useStore((s) => s.setHelpOpen);

  if (!helpOpen) return null;

  return (
    <div
      className="safe-x fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] xs:items-center xs:p-4"
      onClick={() => setHelpOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl animate-scale-in flex-col overflow-hidden rounded-t-lg bg-white shadow-2xl xs:rounded-lg dark:bg-gray-900"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-500" />
            <h2 className="ios-page-title">
              Інструкція користування
            </h2>
          </div>
          <button
            onClick={() => setHelpOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 text-ios-body leading-relaxed text-gray-600 dark:text-gray-300">
          {USER_GUIDE_SECTIONS.map((section) => (
            <section key={section.id} id={`guide-${section.id}`}>
              <h3 className="mb-2 text-base font-semibold text-gray-800 dark:text-gray-100">
                {section.title}
              </h3>
              <div className="whitespace-pre-line rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                {section.body.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong
                      key={i}
                      className="font-semibold text-gray-800 dark:text-gray-100"
                    >
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <p className="mb-3 text-center text-ios-footnote text-gray-400">
            Повна версія також у файлі INSTRUKCIYA.md у папці проєкту
          </p>
          <button
            onClick={() => setHelpOpen(false)}
            className="w-full rounded-lg bg-brand-500 py-2.5 text-ios-body font-medium text-white hover:bg-brand-600"
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}
