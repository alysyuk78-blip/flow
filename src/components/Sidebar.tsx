import { useRef, useState } from "react";
import clsx from "clsx";
import {
  Inbox,
  Star,
  CalendarRange,
  Layers,
  Plus,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Search,
  X,
  Download,
  Upload,
  HelpCircle,
  Folder,
  Archive,
  GanttChartSquare,
  CalendarDays,
  LayoutTemplate,
  Cloud,
  BarChart3,
  ArchiveRestore,
  FileSpreadsheet,
  ClipboardList,
  LayoutGrid,
  Hourglass,
  MapPin,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { SmartList } from "../types";
import {
  inboxTasks,
  todayTasks,
  upcomingTasks,
  logbookTasks,
  somedayTasks,
  myDayTasks,
  waitingTasks,
  contextTasks,
  activeProjects,
} from "../lib/filters";
import { parseIcalToTasks } from "../lib/icalImport";
import { PROJECT_TEMPLATES } from "../store/templates";
import { tasksToCsv, tasksToIcal, downloadFile } from "../lib/export";

export function Sidebar() {
  const selection = useStore((s) => s.selection);
  const select = useStore((s) => s.select);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const sections = useStore((s) => s.sections);
  const addProject = useStore((s) => s.addProject);
  const addProjectFromTemplate = useStore((s) => s.addProjectFromTemplate);
  const deleteProject = useStore((s) => s.deleteProject);
  const archiveProject = useStore((s) => s.archiveProject);
  const unarchiveProject = useStore((s) => s.unarchiveProject);
  const showArchivedProjects = useStore((s) => s.showArchivedProjects);
  const setShowArchivedProjects = useStore((s) => s.setShowArchivedProjects);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const tags = useStore((s) => s.tags);
  const areas = useStore((s) => s.areas);
  const addArea = useStore((s) => s.addArea);
  const activeContextTagId = useStore((s) => s.activeContextTagId);
  const setActiveContextTagId = useStore((s) => s.setActiveContextTagId);
  const importIcalTasks = useStore((s) => s.importIcalTasks);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setHelpOpen = useStore((s) => s.setHelpOpen);
  const importData = useStore((s) => s.importData);

  const [adding, setAdding] = useState(false);
  const [addingArea, setAddingArea] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [name, setName] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const icalInput = useRef<HTMLInputElement>(null);

  const visibleProjects = [...(showArchivedProjects
    ? projects
    : activeProjects(projects))].sort((a, b) => {
    const areaOrder = (id: string | null) => {
      if (!id) return 9999;
      return areas.find((ar) => ar.id === id)?.order ?? 9998;
    };
    const ao = areaOrder(a.areaId) - areaOrder(b.areaId);
    if (ao !== 0) return ao;
    return a.order - b.order;
  });
  const archivedCount = projects.filter((p) => p.archived).length;

  function exportBackup() {
    const data = JSON.stringify(
      { projects, sections, tasks, tags, areas },
      null,
      2
    );
    downloadFile(
      data,
      `flow-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json"
    );
  }

  function exportCsv() {
    downloadFile(
      tasksToCsv(tasks, projects, tags),
      `flow-tasks-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv"
    );
  }

  function exportIcal() {
    downloadFile(
      tasksToIcal(tasks, projects),
      `flow-calendar-${new Date().toISOString().slice(0, 10)}.ics`,
      "text/calendar"
    );
  }

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (
          !Array.isArray(data.projects) ||
          !Array.isArray(data.tasks) ||
          !Array.isArray(data.tags)
        ) {
          alert("Файл не схожий на резервну копію Flow.");
          return;
        }
        if (
          confirm(
            "Замінити всі поточні дані вмістом файлу? Поточні задачі й проєкти буде перезаписано."
          )
        ) {
          importData(data);
        }
      } catch {
        alert("Не вдалося прочитати файл. Перевірте, що це JSON із Flow.");
      }
    };
    reader.readAsText(file);
  }

  function importIcalFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseIcalToTasks(String(reader.result));
        if (!parsed.length) {
          alert("У файлі не знайдено подій.");
          return;
        }
        if (confirm(`Імпортувати ${parsed.length} подій як задачі?`)) {
          importIcalTasks(parsed);
        }
      } catch {
        alert("Не вдалося прочитати .ics файл.");
      }
    };
    reader.readAsText(file);
  }

  const contextTags = tags.filter((t) => t.kind === "context");

  const counts: Partial<Record<SmartList, number>> = {
    inbox: inboxTasks(tasks).length,
    myDay: myDayTasks(tasks).length,
    today: todayTasks(tasks).length,
    upcoming: upcomingTasks(tasks).length,
    all: tasks.filter((t) => t.status !== "done").length,
    someday: somedayTasks(tasks).length,
    waiting: waitingTasks(tasks).length,
    logbook: logbookTasks(tasks).length,
  };

  const smartItems: {
    id: SmartList;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "inbox", label: "Вхідні", icon: <Inbox className="h-4 w-4" /> },
    { id: "myDay", label: "Мій день", icon: <Sun className="h-4 w-4" /> },
    { id: "today", label: "Сьогодні", icon: <Star className="h-4 w-4" /> },
    {
      id: "upcoming",
      label: "Найближчі",
      icon: <CalendarRange className="h-4 w-4" />,
    },
    { id: "all", label: "Усі задачі", icon: <Layers className="h-4 w-4" /> },
    { id: "someday", label: "Колись", icon: <Cloud className="h-4 w-4" /> },
    {
      id: "waiting",
      label: "Очікування",
      icon: <Hourglass className="h-4 w-4" />,
    },
    { id: "logbook", label: "Журнал", icon: <Archive className="h-4 w-4" /> },
    {
      id: "weeklyReview",
      label: "Огляд тижня",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      id: "matrix",
      label: "Матриця",
      icon: <LayoutGrid className="h-4 w-4" />,
    },
    {
      id: "timeline",
      label: "Таймлайн",
      icon: <GanttChartSquare className="h-4 w-4" />,
    },
    {
      id: "calendar",
      label: "Календар",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      id: "stats",
      label: "Статистика",
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  function createProject() {
    const trimmed = name.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    addProject(trimmed);
    setName("");
    setAdding(false);
  }

  return (
    <aside
      className={clsx(
        "safe-top safe-bottom fixed inset-y-0 left-0 z-50 flex h-full w-[min(100%,20rem)] shrink-0 flex-col border-r border-gray-200 bg-gray-50 transition-transform duration-350 ease-smooth dark:border-gray-800 dark:bg-gray-900 xs:w-72 md:relative md:z-auto md:w-64 md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
          <Layers className="h-5 w-5" />
        </div>
        <span className="text-ios-title3 font-bold text-gray-800 dark:text-gray-100">
          Flow
        </span>
        <div
          className="ml-auto flex items-center rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-800"
          title="Тема"
        >
          {(
            [
              { id: "light" as const, icon: Sun, label: "Світла" },
              { id: "dark" as const, icon: Moon, label: "Темна" },
              { id: "system" as const, icon: Monitor, label: "Системна" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              title={label}
              className={clsx(
                "rounded-md p-1.5 transition",
                theme === id
                  ? "bg-brand-500 text-white"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 focus-within:border-brand-400 dark:border-gray-700 dark:bg-gray-800">
          <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук…"
            className="min-w-0 flex-1 bg-transparent text-ios-body outline-none placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {smartItems.map((item) => {
          const active =
            selection.kind === "smart" && selection.list === item.id;
          return (
            <button
              key={item.id}
              onClick={() => select({ kind: "smart", list: item.id })}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 ios-list-row transition-all duration-200 ease-smooth",
                active
                  ? "bg-brand-500 text-white"
                  : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {counts[item.id] != null && counts[item.id]! > 0 && (
                <span
                  className={clsx(
                    "ios-list-count",
                    active && "text-white/80"
                  )}
                >
                  {counts[item.id]}
                </span>
              )}
            </button>
          );
        })}

        {contextTags.length > 0 && (
          <>
            <div className="px-2 pb-1 pt-4">
              <span className="ios-section-label">
                Контекст
              </span>
            </div>
            <div className="flex flex-wrap gap-1 px-2 pb-2">
              {contextTags.map((tag) => {
                const count = contextTasks(tasks, tag.id).length;
                const active = activeContextTagId === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setActiveContextTagId(active ? null : tag.id);
                      select({ kind: "smart", list: "all" });
                    }}
                    className={clsx(
                      "rounded-full px-2.5 py-0.5 text-ios-footnote font-medium transition",
                      active
                        ? "text-white"
                        : "hover:opacity-80"
                    )}
                    style={{
                      backgroundColor: active ? tag.color : tag.color + "33",
                      color: active ? "#fff" : tag.color,
                    }}
                  >
                    {tag.name}
                    {count > 0 && ` ${count}`}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="px-2 pb-1 pt-5">
          <div className="flex items-center justify-between">
            <span className="ios-section-label">
              Проєкти
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setAddingArea(true)}
                title="Нова область (PARA)"
                className="rounded p-0.5 text-gray-400 hover:text-brand-500"
              >
                <MapPin className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowTemplates((v) => !v)}
                title="З шаблону"
                className="rounded p-0.5 text-gray-400 hover:text-brand-500"
              >
                <LayoutTemplate className="h-4 w-4" />
              </button>
              <button
                onClick={() => setAdding(true)}
                title="Новий проєкт"
                className="rounded p-0.5 text-gray-400 hover:text-brand-500"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {addingArea && (
          <input
            autoFocus
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            onBlur={() => {
              if (areaName.trim()) addArea(areaName.trim());
              setAreaName("");
              setAddingArea(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && areaName.trim()) {
                addArea(areaName.trim());
                setAreaName("");
                setAddingArea(false);
              }
              if (e.key === "Escape") setAddingArea(false);
            }}
            placeholder="Назва області"
            className="mx-2 mb-2 w-[calc(100%-1rem)] rounded-lg border border-brand-300 px-3 py-1.5 text-sm outline-none dark:bg-gray-800"
          />
        )}

        {showTemplates && (
          <div className="mx-2 mb-2 space-y-1 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
            {PROJECT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  addProjectFromTemplate(tpl.id);
                  setShowTemplates(false);
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {tpl.name}
                </span>
                <span className="block text-gray-400">{tpl.description}</span>
              </button>
            ))}
          </div>
        )}

        {(() => {
          let lastAreaId: string | null | undefined = undefined;
          return visibleProjects.flatMap((project) => {
            const nodes: React.ReactNode[] = [];
            if (project.areaId !== lastAreaId) {
              lastAreaId = project.areaId;
              const area = areas.find((a) => a.id === project.areaId);
              nodes.push(
                <div
                  key={`area-${project.areaId ?? "none"}`}
                  className="flex items-center gap-1 px-3 py-1 text-ios-footnote font-medium text-gray-400"
                >
                  {area ? (
                    <>
                      <MapPin
                        className="h-3 w-3"
                        style={{ color: area.color }}
                      />
                      {area.name}
                    </>
                  ) : (
                    "Без області"
                  )}
                </div>
              );
            }
            const active =
              selection.kind === "project" &&
              selection.projectId === project.id;
            const open = tasks.filter(
              (t) => t.projectId === project.id && t.status !== "done"
            ).length;
            nodes.push(
              <div
                key={project.id}
                className="group flex items-center gap-0.5 px-1"
              >
                <button
                  onClick={() =>
                    select({ kind: "project", projectId: project.id })
                  }
                  className={clsx(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 ios-list-row transition-all duration-200 ease-smooth",
                    active
                      ? "bg-brand-500 text-white"
                      : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800",
                    project.archived && "opacity-60"
                  )}
                >
                  <Folder className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="min-w-0 flex-1 truncate text-left">
                    {project.name}
                  </span>
                  {open > 0 && (
                    <span
                      className={clsx(
                        "ios-list-count shrink-0",
                        active && "text-white/80"
                      )}
                    >
                      {open}
                    </span>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-0.5 max-md:hidden md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <button
                    onClick={() =>
                      project.archived
                        ? unarchiveProject(project.id)
                        : archiveProject(project.id)
                    }
                    className="rounded p-1 text-gray-300 hover:text-amber-500"
                    title={project.archived ? "Відновити" : "В архів"}
                  >
                    {project.archived ? (
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    ) : (
                      <Archive className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Видалити проєкт «${project.name}»? Задачі перейдуть у Вхідні.`
                        )
                      )
                        deleteProject(project.id);
                    }}
                    className="rounded p-1 text-gray-300 hover:text-red-500"
                    title="Видалити"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
            return nodes;
          });
        })()}

        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchivedProjects(!showArchivedProjects)}
            className="mx-2 mt-1 text-[11px] text-gray-400 hover:text-brand-500"
          >
            {showArchivedProjects
              ? "Сховати архів"
              : `Показати архів (${archivedCount})`}
          </button>
        )}

        {adding && (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={createProject}
            onKeyDown={(e) => {
              if (e.key === "Enter") createProject();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Назва проєкту"
            className="mx-2 w-[calc(100%-1rem)] rounded-lg border border-brand-300 px-3 py-2 text-sm outline-none dark:bg-gray-800"
          />
        )}
      </nav>

      <div className="border-t border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={exportBackup}
            title="JSON резервна копія"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button
            onClick={exportCsv}
            title="CSV для Excel"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={exportIcal}
            title="iCal для календаря"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <CalendarDays className="h-3.5 w-3.5" /> iCal
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            title="Імпорт JSON"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => icalInput.current?.click()}
            title="Імпорт iCal (.ics)"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <CalendarDays className="h-3.5 w-3.5" /> ICS
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importBackup(file);
              e.target.value = "";
            }}
          />
          <input
            ref={icalInput}
            type="file"
            accept=".ics,text/calendar"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importIcalFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => setHelpOpen(true)}
            title="Інструкція користування"
            className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-brand-500 dark:hover:bg-gray-800"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1 px-2 text-[11px] text-gray-400">
          Дані в браузері · автобекап раз на 7 днів
        </div>
      </div>
    </aside>
  );
}
