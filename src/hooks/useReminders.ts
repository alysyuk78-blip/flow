import { useEffect, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useStore } from "../store/useStore";
import { todayISO } from "../lib/dates";
import { downloadFile } from "../lib/export";

const SENT_KEY = "flow-reminders-sent";
const BACKUP_KEY = "flow-auto-backup-date";
const BACKUP_SNOOZE_KEY = "flow-backup-snoozed-at";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function reminderDate(iso: string, daysBefore: number): string {
  return format(addDays(parseISO(iso), -daysBefore), "yyyy-MM-dd");
}

function readSentReminders(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(SENT_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : {};
  } catch {
    try {
      localStorage.removeItem(SENT_KEY);
    } catch {
      // Storage can be unavailable in strict privacy modes.
    }
    return {};
  }
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
      const sent = readSentReminders();

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

      if (due.length) {
        if (Notification.permission === "granted") {
          notify();
        } else if (Notification.permission === "default") {
          Notification.requestPermission().then((p) => {
            if (p === "granted") notify();
          });
        }
      }

      // Нагадування про «Мій день» о 8:00
      const myDayKey = `myday-${today}`;
      if (hhmm >= "08:00" && !sent[myDayKey]) {
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

/** Нагадування про резервну копію раз на 7 днів. */
export function useBackupReminder() {
  const projects = useStore((s) => s.projects);
  const sections = useStore((s) => s.sections);
  const tasks = useStore((s) => s.tasks);
  const tags = useStore((s) => s.tags);
  const areas = useStore((s) => s.areas);
  const [backupDue, setBackupDue] = useState(false);

  useEffect(() => {
    function check() {
      const now = Date.now();
      const last = Number(localStorage.getItem(BACKUP_KEY));
      if (!Number.isFinite(last) || last <= 0) {
        localStorage.setItem(BACKUP_KEY, String(now));
        return;
      }
      const snoozedAt = Number(localStorage.getItem(BACKUP_SNOOZE_KEY));
      const snoozedRecently =
        Number.isFinite(snoozedAt) && now - snoozedAt < DAY_MS;
      setBackupDue(now - last >= WEEK_MS && !snoozedRecently);
    }

    check();
    const interval = window.setInterval(check, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  function downloadBackup() {
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
    localStorage.setItem(BACKUP_KEY, String(Date.now()));
    localStorage.removeItem(BACKUP_SNOOZE_KEY);
    setBackupDue(false);
  }

  function snoozeBackup() {
    localStorage.setItem(BACKUP_SNOOZE_KEY, String(Date.now()));
    setBackupDue(false);
  }

  return { backupDue, downloadBackup, snoozeBackup };
}
