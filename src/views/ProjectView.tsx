import { useState } from "react";
import clsx from "clsx";
import {
  List as ListIcon,
  KanbanSquare,
  GanttChartSquare,
  FileText,
  Folder,
  CalendarDays,
  Diamond,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { ProjectViewKind } from "../types";
import { projectTasks } from "../lib/filters";
import { todayISO } from "../lib/dates";
import { ListView } from "./ListView";
import { BoardView } from "./BoardView";
import { TimelineView } from "./TimelineView";
import { NotesView } from "./NotesView";
import { CalendarView } from "./CalendarView";

const VIEWS: { id: ProjectViewKind; label: string; icon: React.ReactNode }[] = [
  { id: "list", label: "Список", icon: <ListIcon className="h-4 w-4" /> },
  { id: "board", label: "Дошка", icon: <KanbanSquare className="h-4 w-4" /> },
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
  { id: "notes", label: "Нотатки", icon: <FileText className="h-4 w-4" /> },
];

export function ProjectView({ projectId }: { projectId: string }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const updateProject = useStore((s) => s.updateProject);
  const tasks = useStore((s) => s.tasks);
  const addMilestone = useStore((s) => s.addMilestone);
  const archiveProject = useStore((s) => s.archiveProject);
  const unarchiveProject = useStore((s) => s.unarchiveProject);
  const [view, setView] = useState<ProjectViewKind>("list");
  const [editingName, setEditingName] = useState(false);

  if (!project) return null;

  const all = projectTasks(tasks, projectId);
  const done = all.filter((t) => t.status === "done").length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 pt-4 xs:px-6 xs:pt-5 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-2 xs:gap-3">
          <Folder
            className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500 xs:h-6 xs:w-6"
            strokeWidth={1.5}
          />
          {editingName ? (
            <input
              autoFocus
              defaultValue={project.name}
              onBlur={(e) => {
                updateProject(project.id, {
                  name: e.target.value.trim() || project.name,
                });
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="min-w-0 flex-1 rounded-lg border border-brand-300 px-2 py-1 text-xl font-bold outline-none xs:text-2xl dark:bg-gray-800"
            />
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              className="min-w-0 flex-1 cursor-text truncate text-xl font-bold text-gray-800 xs:text-2xl dark:text-gray-100"
            >
              {project.name}
            </h1>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => {
                const title = prompt("Назва віхи:");
                if (title?.trim())
                  addMilestone(projectId, title.trim(), todayISO());
              }}
              title="Додати віху"
              className="touch-target flex items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
            >
              <Diamond className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                project.archived
                  ? unarchiveProject(project.id)
                  : archiveProject(project.id)
              }
              title={project.archived ? "Відновити з архіву" : "В архів"}
              className="touch-target flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-amber-600 dark:hover:bg-gray-800"
            >
              {project.archived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-gray-500">
            <span className="shrink-0">
              {done}/{all.length} готово
            </span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 xs:max-w-[6rem]">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="no-scrollbar mt-3 flex gap-1 overflow-x-auto pb-1 pr-2 xs:mt-4">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={clsx(
                "touch-target flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-2.5 py-2 text-sm transition-all duration-200 ease-smooth min-[400px]:px-3",
                view === v.id
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              )}
              title={v.label}
            >
              {v.icon}
              <span className="hidden min-[400px]:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "list" && <ListView projectId={projectId} />}
        {view === "board" && <BoardView projectId={projectId} />}
        {view === "timeline" && <TimelineView projectId={projectId} />}
        {view === "calendar" && <CalendarView projectId={projectId} />}
        {view === "notes" && <NotesView projectId={projectId} />}
      </div>
    </div>
  );
}
