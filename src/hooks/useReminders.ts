import { useEffect } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useStore } from "../store/useStore";
import { todayISO } from "../lib/dates";

const SENT_KEY = "flow-reminders-sent";
const BACKUP_KEY = "flow-auto-backup-date";

function reminderDate(iso: string, daysBefore: number): string {
  return format(addDays(parseISO(iso), -daysBefore), "yyyy-MM-dd");
}

/** Нагадування браузера з часом і «за N днів». */
export function useReminders() {
  const tasks = useStore((s) => s.tasks);

  useEffect(() => {
    if (!("Notification" in window)) return;

    function check() {
      const now = new Date();
      const today = todayISO();
      const hhmm = format(now, "HH:mm");
      const sent = JSON.parse(
        localStorage.getItem(SENT_KEY) ?? "{}"
      ) as Record<string, string>;

      const due = tasks.filter((t) => {
        if (!t.reminder || t.status === "done" || !t.dueDate) return false;
        const target = reminderDate(t.dueDate, t.reminderDaysBefore);
        if (target !== today) return false;
        const time = t.reminderTime ?? "09:00";
        if (time > hhmm) return false;
        const key = `${t.id}-${target}`;
        if (sent[key]) return false;
        return true;
      });

      if (!due.length) return;

      function notify() {
        for (const t of due.slice(0, 5)) {
          const key = `${t.id}-${reminderDate(t.dueDate!, t.reminderDaysBefore)}`;
          new Notification("Flow — нагадування", {
            body: t.title,
            icon: "/flow.svg",
            tag: key,
          });
          sent[key] = new Date().toISOString();
        }
        localStorage.setItem(SENT_KEY, JSON.stringify(sent));
      }

      if (Notification.permission === "granted") {
        notify();
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((p) => {
          if (p === "granted") notify();
        });
      }

      // Нагадування про «Мій день» о 8:00
      const myDayKey = `myday-${today}`;
      if (hhmm >= "08:00" && hhmm < "08:02" && !sent[myDayKey]) {
        const myDay = tasks.filter((t) => t.isMyDay && t.status !== "done");
        if (myDay.length && Notification.permission === "granted") {
          new Notification("Flow — Мій день", {
            body: `${myDay.length} головних задач на сьогодні`,
            icon: "/flow.svg",
            tag: myDayKey,
          });
          sent[myDayKey] = new Date().toISOString();
          localStorage.setItem(SENT_KEY, JSON.stringify(sent));
        }
      }
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [tasks]);
}

/** Автобекап раз на 7 днів. */
export function useAutoBackup() {
  const projects = useStore((s) => s.projects);
  const sections = useStore((s) => s.sections);
  const tasks = useStore((s) => s.tasks);
  const tags = useStore((s) => s.tags);
  const areas = useStore((s) => s.areas);

  useEffect(() => {
    const last = localStorage.getItem(BACKUP_KEY);
    const now = Date.now();
    if (!last) {
      localStorage.setItem(BACKUP_KEY, String(now));
      return;
    }
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    if (Number(last) > weekAgo) return;

    const data = JSON.stringify(
      { projects, sections, tasks, tags, areas },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flow-auto-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem(BACKUP_KEY, String(Date.now()));
  }, [projects, sections, tasks, tags, areas]);
}
