import {
  Star,
  Inbox,
  CalendarRange,
  Layers,
  CircleCheckBig,
  Archive,
  GanttChartSquare,
  CalendarDays,
  Cloud,
  BarChart3,
  Sun,
  ClipboardList,
  LayoutGrid,
  Hourglass,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { SmartList, Task, MY_DAY_LIMIT } from "../types";
import {
  inboxTasks,
  todayTasks,
  upcomingTasks,
  somedayTasks,
  myDayTasks,
  waitingTasks,
  byOrder,
  byDueThenPriority,
  applyFilters,
  contextTasks,
} from "../lib/filters";
import { SortableTaskList } from "../components/SortableTaskList";
import { TaskRow } from "../components/TaskRow";
import { QuickAdd } from "../components/QuickAdd";
import { FilterBar } from "../components/FilterBar";
import { BulkActionBar } from "../components/BulkActionBar";
import { humanDate } from "../lib/dates";

const META: Record<
  SmartList,
  { title: string; icon: React.ReactNode; hint: string }
> = {
  inbox: {
    title: "Вхідні",
    icon: <Inbox className="h-6 w-6 text-brand-500" />,
    hint: "Задачі без проєкту. Розберіть їх пізніше.",
  },
  myDay: {
    title: "Мій день",
    icon: <Sun className="h-6 w-6 text-amber-500" />,
    hint: `До ${MY_DAY_LIMIT} головних задач на сьогодні. Клік ☀ на задачі.`,
  },
  today: {
    title: "Сьогодні",
    icon: <Star className="h-6 w-6 text-amber-500" />,
    hint: "Те, що заплановано або прострочено на сьогодні.",
  },
  upcoming: {
    title: "Найближчі",
    icon: <CalendarRange className="h-6 w-6 text-brand-500" />,
    hint: "Дедлайни на найближчі два тижні.",
  },
  all: {
    title: "Усі задачі",
    icon: <Layers className="h-6 w-6 text-brand-500" />,
    hint: "Активні задачі, відсортовані за дедлайном.",
  },
  someday: {
    title: "Колись",
    icon: <Cloud className="h-6 w-6 text-gray-400" />,
    hint: "Без дат у проєкті — не плутається з Вхідними.",
  },
  waiting: {
    title: "Очікування",
    icon: <Hourglass className="h-6 w-6 text-orange-400" />,
    hint: "Чекаємо відповіді або дії від когось.",
  },
  logbook: {
    title: "Журнал",
    icon: <Archive className="h-6 w-6 text-gray-400" />,
    hint: "Історія виконаних задач.",
  },
  timeline: {
    title: "Таймлайн",
    icon: <GanttChartSquare className="h-6 w-6 text-brand-500" />,
    hint: "",
  },
  calendar: {
    title: "Календар",
    icon: <CalendarDays className="h-6 w-6 text-brand-500" />,
    hint: "Задачі на сітці місяця.",
  },
  stats: {
    title: "Статистика",
    icon: <BarChart3 className="h-6 w-6 text-brand-500" />,
    hint: "",
  },
  weeklyReview: {
    title: "Огляд тижня",
    icon: <ClipboardList className="h-6 w-6 text-brand-500" />,
    hint: "",
  },
  matrix: {
    title: "Матриця",
    icon: <LayoutGrid className="h-6 w-6 text-brand-500" />,
    hint: "",
  },
};

export function SmartListView({ list }: { list: SmartList }) {
  const tasks = useStore((s) => s.tasks);
  const filters = useStore((s) => s.filters);
  const activeContextTagId = useStore((s) => s.activeContextTagId);
  const quickAddOpen = useStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useStore((s) => s.setQuickAddOpen);
  const meta = META[list];
  const showProject = list !== "inbox";

  let items: Task[] = [];
  switch (list) {
    case "inbox":
      items = inboxTasks(tasks).sort(byOrder);
      break;
    case "myDay":
      items = myDayTasks(tasks);
      break;
    case "today":
      items = todayTasks(tasks).sort(byDueThenPriority);
      break;
    case "upcoming":
      items = upcomingTasks(tasks);
      break;
    case "someday":
      items = somedayTasks(tasks).sort(byOrder);
      break;
    case "waiting":
      items = waitingTasks(tasks).sort(byOrder);
      break;
    case "all":
      items = tasks.filter((t) => t.status !== "done").sort(byDueThenPriority);
      items = applyFilters(items, filters);
      if (activeContextTagId) {
        items = contextTasks(items, activeContextTagId);
      }
      break;
    default:
      items = [];
  }

  const grouped =
    list === "upcoming"
      ? groupByDue(items)
      : [{ label: "", items }];

  const showQuickAdd = !["upcoming", "waiting"].includes(list);

  return (
    <div className="page-container">
      <div className="mb-5 flex min-w-0 items-start gap-3">
        <div className="shrink-0">{meta.icon}</div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-800 xs:text-2xl dark:text-gray-100">
            {meta.title}
          </h1>
          <p className="text-sm leading-snug text-gray-500">{meta.hint}</p>
        </div>
      </div>

      {list === "all" && <FilterBar />}
      <BulkActionBar />

      {showQuickAdd && (
        <div className="mb-4">
          <QuickAdd
            projectId={null}
            dueToday={list === "today"}
            addToMyDay={list === "myDay"}
          placeholder={
              list === "myDay"
                ? "Головна задача дня…"
                : "Додати задачу…"
            }
            autoFocus={quickAddOpen && list === "inbox"}
            showTemplates
          />
          {quickAddOpen && list === "inbox" && (
            <button
              onClick={() => setQuickAddOpen(false)}
              className="mt-1 text-xs text-gray-400 hover:text-gray-600"
            >
              Esc — закрити
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState list={list} />
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.label || "single"}>
              {group.label && (
                <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {group.label}
                </div>
              )}
              {list === "upcoming" ? (
                <div className="space-y-0.5">
                  {group.items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      showProject={showProject}
                      selectable
                    />
                  ))}
                </div>
              ) : (
                <SortableTaskList
                  tasks={group.items}
                  showProject={showProject}
                  selectable
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByDue(items: Task[]): { label: string; items: Task[] }[] {
  const map = new Map<string, Task[]>();
  for (const task of items) {
    const key = task.dueDate ?? "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }
  return Array.from(map.entries()).map(([key, groupItems]) => ({
    label: humanDate(key),
    items: groupItems,
  }));
}

function EmptyState({ list }: { list: SmartList }) {
  const hints: Partial<Record<SmartList, string>> = {
    myDay: "Натисніть ☀ біля задачі або додайте з «мій день» у тексті",
    waiting: "У деталях задачі вкажіть «Очікування від»",
  };
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400 dark:border-gray-700">
      <CircleCheckBig className="mx-auto h-10 w-10" strokeWidth={1} />
      <p className="mt-3 text-sm">
        {hints[list] ?? "Тут поки порожньо. Гарна робота!"}
      </p>
    </div>
  );
}
