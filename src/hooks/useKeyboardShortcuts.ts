import { useEffect } from "react";
import { useStore } from "../store/useStore";

/** Глобальні клавіатурні скорочення (Things / Linear стиль). */
export function useKeyboardShortcuts() {
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setQuickAddOpen = useStore((s) => s.setQuickAddOpen);
  const openTask = useStore((s) => s.openTask);
  const select = useStore((s) => s.select);
  const addTask = useStore((s) => s.addTask);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Escape") {
        openTask(null);
        setQuickAddOpen(false);
        return;
      }

      if (typing && !(meta && e.key === "k")) return;

      if (meta && e.key === "k") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>(
          'input[placeholder="Пошук…"]'
        );
        el?.focus();
        return;
      }

      if (meta && e.key === "n") {
        e.preventDefault();
        setQuickAddOpen(true);
        select({ kind: "smart", list: "inbox" });
        return;
      }

      if (meta && e.key === "1") {
        e.preventDefault();
        select({ kind: "smart", list: "today" });
      }
      if (meta && e.key === "2") {
        e.preventDefault();
        select({ kind: "smart", list: "upcoming" });
      }
      if (meta && e.key === "3") {
        e.preventDefault();
        select({ kind: "smart", list: "all" });
      }
      if (meta && e.key === "4") {
        e.preventDefault();
        select({ kind: "smart", list: "myDay" });
      }
      if (meta && e.key === "5") {
        e.preventDefault();
        select({ kind: "smart", list: "weeklyReview" });
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchQuery, setQuickAddOpen, openTask, select, addTask]);
}
