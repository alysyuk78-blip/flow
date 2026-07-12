import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Play, Pause, Check, Coffee } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store/useStore";

const WORK_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

/** Режим фокусу: одна задача на весь екран + Pomodoro. */
export function FocusMode() {
  const focusTaskId = useStore((s) => s.focusTaskId);
  const setFocusTaskId = useStore((s) => s.setFocusTaskId);
  const task = useStore((s) =>
    s.tasks.find((t) => t.id === s.focusTaskId)
  );
  const toggleDone = useStore((s) => s.toggleDone);
  const openTask = useStore((s) => s.openTask);

  const [seconds, setSeconds] = useState(WORK_SEC);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const onBreakRef = useRef(onBreak);
  onBreakRef.current = onBreak;

  const reset = useCallback((breakMode: boolean) => {
    setSeconds(breakMode ? BREAK_SEC : WORK_SEC);
    setOnBreak(breakMode);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (!focusTaskId) {
      reset(false);
      return;
    }
    openTask(null);
    reset(false);
    setRunning(true);
  }, [focusTaskId, reset, openTask]);

  useEffect(() => {
    if (!running || !focusTaskId) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          const wasBreak = onBreakRef.current;
          if (!wasBreak) {
            setOnBreak(true);
            return BREAK_SEC;
          }
          setOnBreak(false);
          return WORK_SEC;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, focusTaskId]);

  useEffect(() => {
    if (!focusTaskId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setFocusTaskId(null);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [focusTaskId, setFocusTaskId]);

  if (!focusTaskId || !task) return null;

  const total = onBreak ? BREAK_SEC : WORK_SEC;
  const remainingPct = (seconds / total) * 100;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - remainingPct / 100);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const ui = (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] flex-col bg-gray-950 text-white animate-fade-in safe-top safe-bottom">
      <div className="safe-x flex shrink-0 items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="text-left">
          <div className="ios-section-label">
            Режим фокусу
          </div>
          <p className="mt-0.5 text-ios-footnote text-gray-600">
            Pomodoro: 25 хв робота → 5 хв перерва · Esc — вийти
          </p>
        </div>
        <button
          onClick={() => setFocusTaskId(null)}
          className="touch-target flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Закрити (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="safe-x flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
        <h1 className="mb-2 max-w-2xl ios-page-title">
          {task.title}
        </h1>
        <p className="mb-8 ios-page-subtitle">
          {onBreak
            ? "Перерва — відпочиньте, потім знову до роботи"
            : "Зосередьтесь лише на цій задачі"}
        </p>

        <div className="relative mb-6 sm:mb-8">
          <svg className="h-36 w-36 -rotate-90 xs:h-44 xs:w-44 sm:h-48 sm:w-48" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-800"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className={clsx(
                "transition-[stroke-dashoffset] duration-1000 ease-linear",
                onBreak ? "text-emerald-400" : "text-brand-400"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold tabular-nums xs:text-4xl">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="mt-1 text-ios-footnote text-gray-400">
              {onBreak ? (
                <span className="inline-flex items-center gap-1">
                  <Coffee className="h-3.5 w-3.5" /> Перерва
                </span>
              ) : (
                "Робота"
              )}
            </span>
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-wrap items-center justify-center gap-2 px-2 sm:max-w-none sm:gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="touch-target flex min-w-[7rem] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 font-medium hover:bg-brand-600 sm:flex-none sm:px-6"
          >
            {running ? (
              <>
                <Pause className="h-5 w-5" /> Пауза
              </>
            ) : (
              <>
                <Play className="h-5 w-5" /> Старт
              </>
            )}
          </button>
          <button
            onClick={() => reset(onBreak)}
            className="rounded-lg border border-gray-700 px-4 py-3 text-ios-body text-gray-400 hover:border-gray-500 hover:text-white"
          >
            Скинути
          </button>
          {task.status !== "done" && (
            <button
              onClick={() => {
                toggleDone(task.id);
                setFocusTaskId(null);
              }}
              className="flex items-center gap-2 rounded-lg border border-emerald-600 px-4 py-3 text-ios-body text-emerald-400 hover:bg-emerald-600/10"
            >
              <Check className="h-4 w-4" /> Готово
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(ui, document.body);
}
