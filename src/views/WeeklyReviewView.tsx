import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Inbox,
  AlertTriangle,
  Clock,
  FolderOpen,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { weeklyReviewStats } from "../lib/filters";

const REVIEW_KEY = "flow-last-weekly-review";

const STEPS = [
  {
    id: "inbox",
    label: "Розібрати Вхідні",
    hint: "Усі задачі без проєкту мають отримати дім або дату",
    nav: { kind: "smart" as const, list: "inbox" as const },
    countKey: "inboxCount" as const,
  },
  {
    id: "overdue",
    label: "Переглянути прострочені",
    hint: "Перенести дедлайн, відкласти або виконати",
    nav: { kind: "smart" as const, list: "today" as const },
    countKey: "overdueCount" as const,
  },
  {
    id: "waiting",
    label: "Перевірити «Очікування»",
    hint: "Чи отримали відповідь? Оновити або закрити",
    nav: { kind: "smart" as const, list: "waiting" as const },
    countKey: "waitingCount" as const,
  },
  {
    id: "someday",
    label: "Оглянути «Колись»",
    hint: "Що варто запланувати на цей тиждень?",
    nav: { kind: "smart" as const, list: "someday" as const },
    countKey: "somedayCount" as const,
  },
  {
    id: "projects",
    label: "Оглянути проєкти без руху",
    hint: "Проєкти без активності 2 тижні — архів або план",
    countKey: "staleProjectCount" as const,
  },
  {
    id: "myday",
    label: "Спланувати «Мій день» на тиждень",
    hint: "Оберіть 3–5 головних задач на найближчі дні",
    nav: { kind: "smart" as const, list: "myDay" as const },
  },
];

export function WeeklyReviewView() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const select = useStore((s) => s.select);
  const stats = weeklyReviewStats(tasks, projects);

  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(REVIEW_KEY + "-steps") ?? "{}");
    } catch {
      return {};
    }
  });

  function toggleStep(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(REVIEW_KEY + "-steps", JSON.stringify(next));
      return next;
    });
  }

  function finishReview() {
    localStorage.setItem(REVIEW_KEY, new Date().toISOString());
    localStorage.setItem(REVIEW_KEY + "-steps", JSON.stringify({}));
    setDone({});
    alert("Щотижневий огляд завершено! До наступної неділі.");
  }

  const lastReview = localStorage.getItem(REVIEW_KEY);
  const completedSteps = STEPS.filter((s) => done[s.id]).length;

  return (
    <div className="page-container">
      <div className="mb-6 flex items-center gap-3">
        <ClipboardList className="h-7 w-7 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Щотижневий огляд
          </h1>
          <p className="text-sm text-gray-500">
            GTD-ритуал: розібрати, оновити, спланувати (15–30 хв)
          </p>
        </div>
      </div>

      {lastReview && (
        <p className="mb-4 text-xs text-gray-400">
          Останній огляд:{" "}
          {new Date(lastReview).toLocaleDateString("uk-UA", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Inbox className="h-4 w-4" />}
          label="Вхідні"
          value={stats.inboxCount}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Прострочено"
          value={stats.overdueCount}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Очікування"
          value={stats.waitingCount}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          label="За тиждень"
          value={stats.completedThisWeek}
        />
      </div>

      <div className="space-y-2">
        {STEPS.map((step) => {
          const count =
            step.countKey != null ? stats[step.countKey] : undefined;
          const checked = !!done[step.id];
          return (
            <div
              key={step.id}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60"
            >
              <button
                onClick={() => toggleStep(step.id)}
                className="mt-0.5 shrink-0 text-brand-500"
              >
                {checked ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {step.label}
                  </span>
                  {count != null && count > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      {count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{step.hint}</p>
                {step.nav && (
                  <button
                    onClick={() => select(step.nav!)}
                    className="mt-1 text-xs text-brand-500 hover:underline"
                  >
                    Перейти →
                  </button>
                )}
                {step.id === "projects" && stats.staleProjectCount > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <FolderOpen className="h-3 w-3" />
                    {stats.staleProjectCount} проєкт(ів) без руху
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={finishReview}
        disabled={completedSteps < 3}
        className="mt-6 w-full rounded-xl bg-brand-500 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40"
      >
        Завершити огляд ({completedSteps}/{STEPS.length})
      </button>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}
