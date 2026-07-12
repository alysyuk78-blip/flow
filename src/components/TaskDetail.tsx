import { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Check,
  CalendarDays,
  Flag,
  FolderOpen,
  Link2,
  Focus,
  AlertTriangle,
  Sun,
  Hourglass,
  Clock,
  CalendarClock,
  LayoutGrid,
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store/useStore";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
  RECURRENCE_LABELS,
  Priority,
  Recurrence,
} from "../types";
import { RichEditor } from "./RichEditor";
import { TagPicker } from "./TagPicker";
import { computedProgress } from "../lib/filters";
import { cycleMembers } from "../lib/dependencies";
import { todayISO } from "../lib/dates";

export function TaskDetail() {
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const task = useStore((s) =>
    s.tasks.find((t) => t.id === s.selectedTaskId)
  );
  const projects = useStore((s) => s.projects);
  const sections = useStore((s) => s.sections);
  const tasks = useStore((s) => s.tasks);
  const openTask = useStore((s) => s.openTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const toggleDone = useStore((s) => s.toggleDone);
  const setStatus = useStore((s) => s.setStatus);
  const addSubtask = useStore((s) => s.addSubtask);
  const toggleSubtask = useStore((s) => s.toggleSubtask);
  const deleteSubtask = useStore((s) => s.deleteSubtask);
  const setFocusTaskId = useStore((s) => s.setFocusTaskId);
  const toggleMyDay = useStore((s) => s.toggleMyDay);
  const deferTask = useStore((s) => s.deferTask);

  const [subInput, setSubInput] = useState("");

  if (!selectedTaskId || !task) return null;

  const progress = computedProgress(task);
  const depOptions = tasks.filter(
    (t) =>
      t.id !== task.id &&
      t.projectId === task.projectId &&
      t.kind === "task"
  );
  const projectSections = sections.filter(
    (s) => s.projectId === task.projectId
  );
  const cycle = cycleMembers(tasks, task.id);
  const hasCycle = cycle.length > 1;

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:w-[380px]">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {task.kind === "milestone" ? "Віха" : "Деталі задачі"}
        </span>
        <div className="flex items-center gap-1">
          {task.status !== "done" && (
            <button
              onClick={() => setFocusTaskId(task.id)}
              title="Режим фокусу — таймер 25 хв"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
            >
              <Focus className="h-4 w-4" />
              Фокус
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Видалити задачу?")) deleteTask(task.id);
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => openTask(null)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Заголовок + чекбокс */}
        <div className="flex items-start gap-2">
          <button
            onClick={() => toggleDone(task.id)}
            className={clsx(
              "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              task.status === "done"
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-gray-300 dark:border-gray-600"
            )}
          >
            {task.status === "done" && (
              <Check className="h-3 w-3" strokeWidth={3} />
            )}
          </button>
          <textarea
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            rows={1}
            className="flex-1 resize-none bg-transparent text-lg font-semibold text-gray-800 outline-none dark:text-gray-100"
          />
        </div>

        {/* Властивості */}
        <div className="space-y-3">
          <Row icon={<FolderOpen className="h-4 w-4" />} label="Проєкт">
            <select
              value={task.projectId ?? ""}
              onChange={(e) =>
                updateTask(task.id, {
                  projectId: e.target.value || null,
                })
              }
              className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
            >
              <option value="">Вхідні</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Row>

          {task.projectId && projectSections.length > 0 && (
            <Row icon={<FolderOpen className="h-4 w-4" />} label="Розділ">
              <select
                value={task.sectionId ?? ""}
                onChange={(e) =>
                  updateTask(task.id, {
                    sectionId: e.target.value || null,
                  })
                }
                className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
              >
                <option value="">Без розділу</option>
                {projectSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </Row>
          )}

          {task.kind === "task" && (
            <Row icon={<Check className="h-4 w-4" />} label="Статус">
              <div className="flex gap-1">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(task.id, s)}
                    className={clsx(
                      "rounded-md px-2 py-1 text-xs",
                      task.status === s
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    )}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </Row>
          )}

          <Row icon={<Flag className="h-4 w-4" />} label="Пріоритет">
            <select
              value={task.priority}
              onChange={(e) =>
                updateTask(task.id, { priority: e.target.value as Priority })
              }
              className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
            >
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </Row>

          <Row icon={<CalendarDays className="h-4 w-4" />} label="Початок">
            <input
              type="date"
              value={task.startDate ?? ""}
              max={task.dueDate ?? undefined}
              onChange={(e) => {
                const v = e.target.value || null;
                // Дати завжди узгоджені: початок пізніше за дедлайн — тягнемо дедлайн за ним
                const patch: { startDate: string | null; dueDate?: string } = {
                  startDate: v,
                };
                if (v && task.dueDate && v > task.dueDate) patch.dueDate = v;
                updateTask(task.id, patch);
              }}
              className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
            />
          </Row>

          <Row icon={<CalendarDays className="h-4 w-4" />} label="Дедлайн">
            <input
              type="date"
              value={task.dueDate ?? ""}
              min={task.startDate ?? undefined}
              onChange={(e) => {
                const v = e.target.value || null;
                const patch: { dueDate: string | null; startDate?: string } = {
                  dueDate: v,
                };
                if (v && task.startDate && v < task.startDate)
                  patch.startDate = v;
                updateTask(task.id, patch);
              }}
              className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
            />
          </Row>

          {task.kind === "task" && (
            <Row icon={<CalendarClock className="h-4 w-4" />} label="Відкласти">
              <div className="flex flex-wrap gap-1">
                <input
                  type="date"
                  value={task.deferUntil ?? ""}
                  min={todayISO()}
                  onChange={(e) =>
                    updateTask(task.id, {
                      deferUntil: e.target.value || null,
                    })
                  }
                  className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
                />
                {[1, 3, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() => deferTask(task.id, d)}
                    className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  >
                    +{d} д
                  </button>
                ))}
              </div>
            </Row>
          )}

          {task.kind === "task" && (
            <Row icon={<Sun className="h-4 w-4" />} label="Мій день">
              <button
                onClick={() => {
                  if (!toggleMyDay(task.id))
                    alert("У «Мій день» можна додати лише 5 задач.");
                }}
                className={clsx(
                  "rounded-md px-2 py-1 text-xs",
                  task.isMyDay
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                )}
              >
                {task.isMyDay ? "У плані дня ☀" : "Додати до дня"}
              </button>
            </Row>
          )}

          {task.kind === "task" && (
            <Row icon={<Clock className="h-4 w-4" />} label="Час">
              <input
                type="number"
                min={5}
                step={5}
                placeholder="хвилини"
                value={task.timeEstimateMinutes ?? ""}
                onChange={(e) =>
                  updateTask(task.id, {
                    timeEstimateMinutes: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="w-24 rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
              />
            </Row>
          )}

          {task.kind === "task" && (
            <Row icon={<LayoutGrid className="h-4 w-4" />} label="Матриця">
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={task.important}
                    onChange={(e) =>
                      updateTask(task.id, { important: e.target.checked })
                    }
                    className="accent-brand-500"
                  />
                  Важливо
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={task.urgent}
                    onChange={(e) =>
                      updateTask(task.id, { urgent: e.target.checked })
                    }
                    className="accent-brand-500"
                  />
                  Терміново
                </label>
              </div>
            </Row>
          )}

          {task.kind === "task" && (
            <Row icon={<Hourglass className="h-4 w-4" />} label="Очікування">
              <input
                value={task.waitingFor ?? ""}
                onChange={(e) =>
                  updateTask(task.id, {
                    waitingFor: e.target.value || null,
                  })
                }
                placeholder="Від кого чекаємо?"
                className="w-full rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
              />
            </Row>
          )}

          {task.streakCount > 0 && (
            <Row icon={<span>🔥</span>} label="Серія">
              <span className="text-sm text-orange-500">
                {task.streakCount} виконань поспіль
              </span>
            </Row>
          )}

          {task.kind === "task" && (
            <>
              <Row icon={<span className="text-xs">↻</span>} label="Повтор">
                <select
                  value={task.recurrence}
                  onChange={(e) =>
                    updateTask(task.id, {
                      recurrence: e.target.value as Recurrence,
                    })
                  }
                  className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-gray-700"
                >
                  {(Object.keys(RECURRENCE_LABELS) as Recurrence[]).map(
                    (r) => (
                      <option key={r} value={r}>
                        {RECURRENCE_LABELS[r]}
                      </option>
                    )
                  )}
                </select>
              </Row>

              <Row icon={<CalendarDays className="h-4 w-4" />} label="Нагадування">
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={task.reminder}
                      onChange={(e) =>
                        updateTask(task.id, {
                          reminder: e.target.checked,
                          reminderTime: e.target.checked
                            ? task.reminderTime ?? "09:00"
                            : task.reminderTime,
                        })
                      }
                      className="accent-brand-500"
                    />
                    Увімкнути нагадування
                  </label>
                  {task.reminder && (
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={task.reminderDaysBefore}
                        onChange={(e) =>
                          updateTask(task.id, {
                            reminderDaysBefore: Number(e.target.value),
                          })
                        }
                        className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-xs outline-none dark:border-gray-700"
                      >
                        <option value={0}>У день дедлайну</option>
                        <option value={1}>За 1 день</option>
                        <option value={2}>За 2 дні</option>
                        <option value={7}>За тиждень</option>
                      </select>
                      <input
                        type="time"
                        value={task.reminderTime ?? "09:00"}
                        onChange={(e) =>
                          updateTask(task.id, {
                            reminderTime: e.target.value,
                          })
                        }
                        className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-xs outline-none dark:border-gray-700"
                      />
                    </div>
                  )}
                </div>
              </Row>
            </>
          )}

          {task.kind === "task" && (
            <Row icon={<span className="text-xs font-bold">%</span>} label="Прогрес">
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  disabled={task.subtasks.length > 0 || task.status === "done"}
                  onChange={(e) =>
                    updateTask(task.id, { progress: Number(e.target.value) })
                  }
                  className="flex-1 accent-brand-500"
                />
                <span className="w-9 text-right text-xs text-gray-500">
                  {progress}%
                </span>
              </div>
            </Row>
          )}
        </div>

        {/* Теги */}
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Теги
          </div>
          <TagPicker
            selected={task.tagIds}
            onChange={(ids) => updateTask(task.id, { tagIds: ids })}
          />
        </div>

        {task.kind === "task" && (
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Підзадачі
            </div>
            <div className="space-y-1">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="group flex items-center gap-2">
                  <button
                    onClick={() => toggleSubtask(task.id, sub.id)}
                    className={clsx(
                      "flex h-4 w-4 items-center justify-center rounded border-2",
                      sub.done
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    {sub.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </button>
                  <span
                    className={clsx(
                      "flex-1 text-sm",
                      sub.done
                        ? "text-gray-400 line-through"
                        : "text-gray-700 dark:text-gray-200"
                    )}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(task.id, sub.id)}
                    className="hidden text-gray-300 hover:text-red-500 group-hover:block"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-gray-400" />
              <input
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && subInput.trim()) {
                    addSubtask(task.id, subInput.trim());
                    setSubInput("");
                  }
                }}
                placeholder="Додати підзадачу…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        )}

        {/* Залежності (для Ганта) */}
        {depOptions.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Link2 className="h-3.5 w-3.5" /> Залежить від
            </div>
            {hasCycle && (
              <div className="mb-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Циклічна залежність — Гант може відображатись некоректно.
              </div>
            )}
            <div className="space-y-1">
              {depOptions.map((dep) => (
                <label
                  key={dep.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={task.dependsOn.includes(dep.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const ok = updateTask(task.id, {
                          dependsOn: [...task.dependsOn, dep.id],
                        });
                        if (!ok)
                          alert(
                            "Неможливо: ця залежність створить цикл."
                          );
                      } else {
                        updateTask(task.id, {
                          dependsOn: task.dependsOn.filter(
                            (d) => d !== dep.id
                          ),
                        });
                      }
                    }}
                    className="accent-brand-500"
                  />
                  {dep.title}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Нотатки */}
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Нотатки
          </div>
          <RichEditor
            key={task.id}
            value={task.notes}
            onChange={(html) => updateTask(task.id, { notes: html })}
            placeholder="Деталі, посилання, ідеї…"
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 xs:flex-row xs:items-center xs:gap-3">
      <div className="flex w-full shrink-0 items-center gap-1.5 text-sm text-gray-500 xs:w-24">
        <span className="text-gray-400">{icon}</span>
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
