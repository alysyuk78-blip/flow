import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import clsx from "clsx";
import { CalendarDays } from "lucide-react";
import { useStore } from "../store/useStore";
import { projectTasks, byOrder, computedProgress } from "../lib/filters";
import { STATUS_LABELS, STATUS_ORDER, Status, Task } from "../types";
import { QuickAdd } from "../components/QuickAdd";
import { PriorityFlag, TagChip } from "../components/badges";
import { humanDate, isOverdue } from "../lib/dates";

export function BoardView({ projectId }: { projectId: string }) {
  const tasks = useStore((s) => s.tasks);
  const setStatus = useStore((s) => s.setStatus);
  const [activeId, setActiveId] = useState<string | null>(null);

  const items = projectTasks(tasks, projectId).sort(byOrder);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeTask = items.find((t) => t.id === activeId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id;
    if (!overId) return;
    const status = String(overId) as Status;
    if (STATUS_ORDER.includes(status)) {
      setStatus(String(e.active.id), status);
    }
  }

  return (
    <div className="h-full overflow-x-auto px-4 py-5 xs:px-6 xs:py-6">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex h-full min-w-max gap-4">
          {STATUS_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              projectId={projectId}
              tasks={items.filter((t) => t.status === status)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <Card task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  projectId,
  tasks,
}: {
  status: Status;
  projectId: string;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex w-72 shrink-0 flex-col rounded-2xl bg-gray-100 p-3 dark:bg-gray-800/60",
        isOver && "ring-2 ring-brand-400"
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {STATUS_LABELS[status]}
        </span>
        <span className="rounded-full bg-gray-200 px-2 text-xs text-gray-500 dark:bg-gray-700">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} />
        ))}
      </div>
      <div className="pt-2">
        <QuickAdd
          projectId={projectId}
          status={status}
          placeholder="+ картка"
        />
      </div>
    </div>
  );
}

function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });
  const openTask = useStore((s) => s.openTask);
  const downPos = useRef<{ x: number; y: number } | null>(null);

  // Розрізняємо клік і перетягування: якщо курсор майже не рухався — відкриваємо задачу.
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY };
        listeners?.onPointerDown?.(e);
      }}
      onClick={(e) => {
        const d = downPos.current;
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) {
          openTask(task.id);
        }
      }}
      className={clsx(isDragging && "opacity-40")}
    >
      <Card task={task} />
    </div>
  );
}

function Card({ task, overlay }: { task: Task; overlay?: boolean }) {
  const tags = useStore((s) => s.tags);
  const taskTags = task.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean);
  const progress = computedProgress(task);

  return (
    <div
      className={clsx(
        "cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900",
        overlay && "rotate-3 shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-100">
          {task.title}
        </span>
        <PriorityFlag priority={task.priority} />
      </div>
      {(task.dueDate || taskTags.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {task.dueDate && (
            <span
              className={clsx(
                "inline-flex items-center gap-1",
                isOverdue(task.dueDate) &&
                  task.status !== "done" &&
                  "text-red-500"
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {humanDate(task.dueDate)}
            </span>
          )}
          {taskTags.map((t) => (
            <TagChip key={t!.id} tag={t!} />
          ))}
        </div>
      )}
      {progress > 0 && progress < 100 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-brand-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
