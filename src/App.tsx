import { useEffect } from "react";
import { Menu } from "lucide-react";
import { useStore } from "./store/useStore";
import { Sidebar } from "./components/Sidebar";
import { TaskDetail } from "./components/TaskDetail";
import { HelpModal } from "./components/HelpModal";
import { UndoToast } from "./components/UndoToast";
import { FocusMode } from "./components/FocusMode";
import { BulkActionBar } from "./components/BulkActionBar";
import { SmartListView } from "./views/SmartListView";
import { ProjectView } from "./views/ProjectView";
import { SearchView } from "./views/SearchView";
import { LogbookView } from "./views/LogbookView";
import { GlobalTimelineView } from "./views/GlobalTimelineView";
import { CalendarView } from "./views/CalendarView";
import { WeeklyReviewView } from "./views/WeeklyReviewView";
import { MatrixView } from "./views/MatrixView";
import { StatsView } from "./views/StatsView";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useReminders, useAutoBackup } from "./hooks/useReminders";

export default function App() {
  const selection = useStore((s) => s.selection);
  const theme = useStore((s) => s.theme);
  const searchQuery = useStore((s) => s.searchQuery);
  const searchFilters = useStore((s) => s.searchFilters);
  const searching =
    searchQuery.trim().length > 0 ||
    searchFilters.status !== "any" ||
    searchFilters.priority !== "any" ||
    searchFilters.tagId !== "any" ||
    searchFilters.projectId !== "any";
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const openTask = useStore((s) => s.openTask);
  const selectedIds = useStore((s) => s.selectedIds);

  useEffect(() => {
    useStore.getState().ensureContextTags();
  }, []);

  useKeyboardShortcuts();
  useReminders();
  useAutoBackup();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    if (theme === "system") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  function mainContent() {
    if (searching) return <SearchView />;
    if (selection.kind === "project")
      return <ProjectView projectId={selection.projectId} />;
    switch (selection.list) {
      case "logbook":
        return <LogbookView />;
      case "timeline":
        return <GlobalTimelineView />;
      case "calendar":
        return <CalendarView />;
      case "stats":
        return <StatsView />;
      case "weeklyReview":
        return <WeeklyReviewView />;
      case "matrix":
        return <MatrixView />;
      default:
        return <SmartListView list={selection.list} />;
    }
  }

  const viewKey = searching
    ? "search"
    : selection.kind === "project"
      ? `project-${selection.projectId}`
      : selection.list;

  return (
    <div className="app-shell flex w-full overflow-hidden bg-white text-gray-900 transition-colors duration-250 dark:bg-gray-950 dark:text-gray-100">
      {/* Мобільний заголовок */}
      <div className="mobile-header safe-x fixed left-0 right-0 top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Відкрити меню"
          className="touch-target flex shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="truncate font-bold">Flow</span>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <main className="mobile-main-offset min-w-0 flex-1 overflow-hidden md:pt-0">
        {selectedIds.length > 0 && (
          <div className="safe-x animate-slide-down border-b border-gray-200 px-3 py-2 md:hidden dark:border-gray-800">
            <BulkActionBar />
          </div>
        )}
        <div key={viewKey} className="h-full overflow-y-auto overscroll-contain animate-fade-in">
          {mainContent()}
        </div>
      </main>

      {selectedTaskId && (
        <>
          <div
            className="fixed inset-0 z-40 animate-fade-in bg-black/40 md:hidden"
            onClick={() => openTask(null)}
          />
          <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col animate-slide-in-right md:static md:z-auto md:w-[380px] md:shrink-0">
            <TaskDetail />
          </div>
        </>
      )}

      <UndoToast />
      <FocusMode />
      <HelpModal />
    </div>
  );
}
